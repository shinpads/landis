const debug = require('debug');
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
  log('calling POST register', req.body);
  let accounts = await Account.model.findOne({email:req.body.email});
  res.send({ success: false });

});

apiRouter.post('/login', async (req, res) => {
  log('calling POST login', req.body);
  res.send({ success: false });
});

module.exports = apiRouter;
