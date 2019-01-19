require('dotenv').config({ path: './.env.' + process.env.NODE_ENV });
const debug = require('debug');
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
  log('calling POST register', req.body);
  res.send({ success: false });

});

apiRouter.post('/login', async (req, res) => {
  log('calling POST login', req.body);
  res.send({ success: false });
});

apiRouter.get('/games', async (req, res) => {
  log('GET /api/games', req.sessionID, req.cookies);
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
