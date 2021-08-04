const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
require('./auth/passport');
require('./mongo');

const app = express();
const httpServer = require('http').createServer(app);
const changestreams = require('./realtime/changestreams/changestreams');
const io = require('./realtime/socket').init(httpServer);
const indexRouter = require('./routes/index');
const listeners = require('./realtime/listeners');

changestreams.init(io);

io.on('connection', (socket) => {
  listeners.authentication(socket);
  listeners.deauthentication(socket, io);
  listeners.join(socket);
  listeners.join_room(socket);
  listeners.disconnect(socket, io);
  listeners.typing(socket, io);

  socket.on('disconnect', () => {
    socket.removeAllListeners();
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(compression());
app.use(helmet());
app.use(cors({
  credentials: true,
  origin: true,
  exposedHeaders: ['X-Total-Count'],
}));
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

httpServer.listen(3000, () => console.log('Listening on port 3000.'));

module.exports = app;
