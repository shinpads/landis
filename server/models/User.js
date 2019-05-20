const debug = require('debug');
const log = debug('mjlbe:User');
const logError = debug('mjlbe:User:error');

const mongoose = require('mongoose');

const schema = {
  _id: String,
  email: { type: String, required: true},
  username: String,
  password: String,
  createdDate: Date,
  permissions: {
    EDIT_USERS: Boolean,
    EDIT_UPDATES: Boolean,
    EDIT_GAMES: Boolean,
  },
  lastOnline: Date,
};

const compiledSchema = new mongoose.Schema(this.schema, { collection: 'users', autoIndex: true, strict: false });
const User = {
  model: mongoose.model('User', compiledSchema)
};


module.exports = User;
