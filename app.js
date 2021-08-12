const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
const compression = require('compression');
const helmet = require('helmet');
require('./auth/passport');
require('./mongo');

const indexRouter = require('./routes/index');

const app = express();

app.use(compression());
app.use(helmet());
app.use(cors({
  credentials: true,
  origin: true,
  exposedHeaders: ['X-Total-Count'],
}));

const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, { cors: { origin: '*' } });
const changestreams = require('./realtime/changestreams/changestreams');
const listeners = require('./realtime/listeners');

changestreams.init(io);

io.on('connection', (socket) => {
  console.log('connection', socket.id);
  listeners.authentication(socket);
  listeners.deauthentication(socket, io);
  listeners.join(socket);
  listeners.join_room(socket);
  listeners.disconnect(socket, io);
  listeners.typing(socket, io);

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    socket.removeAllListeners();
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const PORT = process.env.PORT || '3000';
httpServer.listen(PORT, () => console.log(`Listening on port ${PORT}.`));

module.exports = app;
