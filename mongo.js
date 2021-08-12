const mongoose = require('mongoose');

const dev_db_url = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@lechat.6r12k.mongodb.net/Lechat?retryWrites=true&w=majority`;
const mongoDB = process.env.MONGODB_URI || dev_db_url;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true, poolSize: 50 });
const db = mongoose.connection;
db.on('open', () => console.log('mongo connection'));
db.on('error', console.error.bind(console, 'mongo connection error'));
mongoose.set('useFindAndModify', false);
