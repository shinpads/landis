require('dotenv').config({ path: '../.env.' + process.env.NODE_ENV });
const debug = require('debug');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const oldDb = require('./database');
const googledrive = require('./googledrive');
const db = require('./models');
mongoose.connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/db?authSource=admin`,
 {
   auth: { audthdb: 'admin' },
   user: process.env.MONGO_USER,
   password: process.env.MONGO_PASSWORD,
});

const log = debug('mjlbe:apiRouter');
const logError = debug('mjlbe:apiRouter:error');

function logStack(err) {
  logError(err);
  throw new Error(err.stack);
}
process.on('uncaughtException', logStack);
process.on('unhandledRejection', logStack);
process.on('rejectionHandled', logStack);

const express = require('express');

const apiRouter = express.Router();

apiRouter.post('/register', async (req, res) => {
  log('POST /api/register');
  try {
    const { email, username, password } = req.body;

    const users = await db.User.model.find({ email });

    if (users && users.length) return res.send({ success: false, reason: 'email taken' });
    const users2 = await db.User.model.find({ username });
    if (users2.length) return res.send({ success: false, reason: 'username taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new db.User.model({
      email,
      username,
      password: passwordHash
    });
    await newUser.save();
    res.send({ success: true });

  } catch (err) {
    logError(err);
    res.send({ success: false });
  }

});

apiRouter.post('/login', async (req, res) => {
  log('POST /api/login');
  try {
    const { email, password } = req.body;
    const user = await db.User.model.findOne({ email });
    if (!user) return res.send({ success: false });
    const passwordCheck = await bcrypt.compare(password, user._doc.password);
    if (!passwordCheck) return res.send({ success: false, reason: 'wrong password' });
    const sesh = await db.Session.model.findOne({ sid: req.sid });
    if (!sesh) return res.send({ success: false });
    sesh.loggedIn = true;
    sesh.userId = user._id;
    await sesh.save();
    delete user.password;
    res.send({ success: true, user: user });
  } catch (err) {
    res.send({ success: false });
  }
});

apiRouter.post('/logout', async(req, res) => {
  log('POST /api/logout');
  try {
    const sesh = oldDb.get('session', { id: req.sid });
    sesh[0].loggedIn = false;
    await oldDb.save();
    res.send({ success: true });
  } catch (err) {
    logError(err);
    res.send({ success: false });
  }
});

apiRouter.get('/games', async (req, res) => {
  log('GET /api/games');
  try {
    const games = await oldDb.get('game');
    if (games) {
      res.send({ success: true, games });
    } else {
      res.send({ success: false });
    }
  } catch (err) {
    res.send({ success: false });
  }
});

apiRouter.get('/game/download/:id', async (req, res) => {
  const { id } = req.params;
  log(`/api/game/download/${id}`);
  try {
    const game = await oldDb.get('game', { id: id });
    if (!game.length || !game[0].fileId) {
      return res.send({ success: false });
    }
    const fileId = game[0].fileId;
    googledrive.streamFile(fileId, res);
  } catch (err) {
    logError(err);
    res.send({ success: false });
  }
});

function generateID() {
  const values = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
  const length = 20;
  let sid = '';
  for (let i = 0; i < length; i++) {
      sid += values[Math.floor(Math.random() * (values.length - 1))];
  }
  return sid;
}

function copyObject (x) {
  let y = {}
  Object.keys(x).forEach(k => {
    y[k] = x[k];
  });
  return y;
}

module.exports = apiRouter;
