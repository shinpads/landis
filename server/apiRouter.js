require('dotenv').config({ path: './.env.' + process.env.NODE_ENV });
const debug = require('debug');
const bcrypt = require('bcrypt');

const log = debug('mjlbe:apiRouter');
const logError = debug('mjlbe:apiRouter:error');
const db = require('./database');
const googledrive = require('./googledrive');

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

    const users = db.get('user', { email });
    if (users.length) return res.send({ success: false, reason: 'email taken' });
    const users2 = await db.get('user', { username });
    if (users2.length) return res.send({ success: false, reason: 'username taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: generateID(),
      email,
      username,
      password: passwordHash
    };
    db.add('user', newUser);
    await db.save();
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
    const user = db.get('user', { email });
    if (!user.length) return res.send({ success: false });
    const passwordCheck = await bcrypt.compare(password, user[0].password);
    if (!passwordCheck) return res.send({ success: false, reason: 'wrong password' });
    sesh = db.get('session', { id: req.sid });
    if (!sesh.length) return res.send({ success: false });
    sesh[0].loggedIn = true;
    sesh[0].userId = user[0].id;
    await db.save();
    const userCopy = copyObject(user[0]);
    delete userCopy.password;
    res.send({ success: true, user: userCopy });
  } catch (err) {
    res.send({ success: false });
  }
});

apiRouter.post('/logout', async(req, res) => {
  log('POST /api/logout');
  try {
    const sesh = db.get('session', { id: req.sid });
    sesh[0].loggedIn = false;
    await db.save();
    res.send({ success: true });
  } catch (err) {
    logError(err);
    res.send({ success: false });
  }
});

apiRouter.get('/games', async (req, res) => {
  log('GET /api/games');
  try {
    const games = await db.get('game');
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
    const game = await db.get('game', { id: id });
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
