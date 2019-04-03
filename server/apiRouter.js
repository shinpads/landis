require('dotenv').config({ path: '../.env.' + process.env.NODE_ENV });
const debug = require('debug');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const googledrive = require('./googledrive');
const db = require('./models');
const permissionsList = require('./permissions');

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

// user routes
apiRouter.get('/user/from-session', getUser);
apiRouter.post('/user/login', login);
apiRouter.post('/user/register', register);
apiRouter.post('/user/logout', logout);
apiRouter.get('/user/all', permissions('EDIT_USERS'), getUsers);

// game routes
apiRouter.get('/game/all', getGames);
apiRouter.get('/game/download/:id', assertLoggedIn, downloadGame);

// review routes
apiRouter.get('/review/:gameId/:userId', getReviewGameUser);
apiRouter.get('/review/:gameId', getReviewsGame);
apiRouter.post('/review/:gameId/:userId', postReviewUserGame);

// other
apiRouter.get('/permissions-list', getPermissionsList);

async function login(req, res) {
  log('POST /api/login');
  try {
    const { email, password } = req.body;
    const user = await db.User.model.findOne({ email });
    if (!user) return res.send({ success: false });
    const passwordCheck = await bcrypt.compare(password, user._doc.password);
    if (!passwordCheck) return res.send({ success: false, reason: 'wrong password' });
    const sesh = await db.Session.model.findOneAndUpdate(
      { sid: req.sid },
      {
        loggedIn: true,
        userId: user._id,
      }, { new: true });
    if (!sesh) return res.send({ success: false });
    delete user._doc.password;
    res.send({ success: true, user: user });
  } catch (err) {
    res.send({ success: false });
  }
}

async function register(req, res) {
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

}

async function logout(req, res) {
  log('POST /api/logout');
  try {
    const sesh = await db.Session.model.findOneAndUpdate({ sid: req.sid }, { loggedIn: false }, { upsert: false, new: true });
    if (!sesh) return res.send({ success: false });
    res.send({ success: true });
  } catch (err) {
    logError(err);
    res.send({ success: false });
  }
}

async function getGames(req, res) {
  log('GET /api/games');
  try {
    const games = await db.Game.model.find();
    if (games) {
      res.send({ success: true, games });
    } else {
      res.send({ success: false });
    }
  } catch (err) {
    res.send({ success: false });
  }
}

async function downloadGame(req, res) {
  const { id } = req.params;
  log(`/api/game/download/${id}`);
  try {
    const game = await db.Game.model.findOne({ _id: id });
    if (!game || !game._doc.fileId) {
      return res.send({ success: false });
    }
    const fileId = game._doc.fileId;
    googledrive.streamFile(fileId, res);
  } catch (err) {
    logError(err);
    res.send({ success: false });
  }
}

async function getUsers(req, res) {
  log('GET /api/users/all');
  try {
    const users = await db.User.model.find();
    if (users) {
      return res.send({ sucess: true, users });
    } else {
      return res.send({ success: false });
    }
  } catch(err) {
    res.send({ success: false });
  }
}

async function getUser(req, res) {
  log('/api/user/from-session');
  try {
    const userId = req.user;
    const user = await db.User.model.findOne({ _id: userId });
    if (user) {
      delete user._doc.password;
      res.send({ success: true, user });
    } else {
      res.send({ success: false });
    }
  } catch(err) {
    logError(err);
    res.send({ success: false });
  }
}

async function getPermissionsList(req, res) {
  log('/api/permissions-list');
  try {
    res.send({ success: true, permissionsList: permissionsList });
  } catch (err) {
    logError(err);
    res.send({ sucess: false });
  }
}

async function getReviewGameUser(req, res) {
  const { gameId, userId } = req.params;
  log(`GET review/${gameId}/${userId}`);
  try {
    const review = await db.Review.model.findOne({
      gameId,
      userId,
    });
    res.send({ success: true, review });
  } catch (err) {
    logError(err);
    res.send({ success: false });
  }
}

async function getReviewsGame(req, res) {
  const { gameId } = req.params;
  log(`GET review/${gameId}`);
  try {
    const reviews = await db.Review.model.find({
      gameId,
    });
    res.send({ success: true, reviews });
  } catch (err) {
    logError(err);
    res.send({ success: false });
  }
}

async function postReviewUserGame(req, res) {
  const { gameId, userId } = req.params;
  log(`POST review/${gameId}/${userId}`);
  try {
    const { title, description } = req.body;
    if (!title || !description) return res.send({ success: false });
    if (String(req.user) !== String(userId)) return res.send({ success: false });
    const user = await db.User.model.findOne({ _id: userId });
    if (!user) return res.send({ success: false });
    const query = { gameId, userId };
    const update = {
      lastUpdated: Date.now(),
      title,
      description,
      gameId,
      userId,
      username: user._doc.username,
    }
    const options = {
      upsert: true,
      new: true,
    };
    const review = await db.Review.model.findOneAndUpdate(query, update, options);
    if (review) return res.send({ success: true });
    res.send({ success: false });
  } catch (err) {
    logError(err);
    res.send({ success: false });
  }
}

function permissions(perm) {
  return async (req, res, next) => {
    try {
      const user = await db.User.model.findOne({ _id: req.user });
      if (req.loggedIn && user && user._doc.permissions && user._doc.permissions[perm]) {
        return next();
      } else {
        return res.send({ success: false });
      }
    } catch (err) {
      logError(err);
      res.send({ sucess: false });
    }
  };
}

async function assertLoggedIn(req, res, next) {
  try {
    if (!req.loggedIn) {
      res.send({ success: false });
    } else {
      next();
    }
  } catch (err) {
    res.send({ success: false });
  }
}
module.exports = apiRouter;
