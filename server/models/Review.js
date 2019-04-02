const debug = require('debug');
const log = debug('mjlbe:Review');
const logError = debug('mjlbe:Review:error');

const mongoose = require('mongoose');

const schema = {
  _id: String,
  title: String,
  description: String,
  userId: mongoose.Schema.Types.ObjectId,
  gameId: mongoose.Schema.Types.ObjectId,
  username: String,
  lastUpdated: Date,
};

const compiledSchema = new mongoose.Schema(this.schema, { collection: 'reviews', autoIndex: true, strict: false });
const Review = {
  model: mongoose.model('Review', compiledSchema)
};


module.exports = Review;
