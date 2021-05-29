const mongoose = require('mongoose');

const mongoDb = `mongodb+srv://Aurelie:${process.env.MONGODB_PASSWORD}@lechat.6r12k.mongodb.net/Lechat?retryWrites=true&w=majority`;
mongoose.connect(mongoDb, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongo connection error'));
mongoose.set('useFindAndModify', false);
