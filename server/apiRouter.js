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
  let accounts = await Account.model.findOne({email:req.body.email});
  res.send({ success: false });

});

apiRouter.post('/login', async (req, res) => {
  log('calling POST login', req.body);
  res.send({ success: false });
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

module.exports = apiRouter;
