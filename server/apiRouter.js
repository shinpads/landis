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
  log('POST /api/register', req.body);
  try {
    const { firstName, lastName, email, username, password } = req.body;

    const users = db.get('user', { email });
    if (users.length) return res.send({ success: false, reason: 'email taken' });
    const users2 = await db.get('user', { username });
    if (users2.length) return res.send({ success: false, reason: 'username taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      firstName,
      lastName,
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
    if (passwordCheck) return res.send({ success: true });
    else res.send({ success: false, reason: 'wrong password' });
  } catch (err) {
    res.send({ success: false });
  }
});

apiRouter.get('/games', async (req, res) => {
  log('GET /api/games', req.headers.sid);
  try {
    const games = await db.get('game');
    games.forEach(game => delete game.fileId);
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
      log(game);
      log('nah');
      return res.send({ success: false });
    }
    const fileId = game[0].fileId;
    googledrive.streamFile(fileId, res);
  } catch (err) {
    logError(err);
    res.send({ success: false });
  }
});

module.exports = apiRouter;
