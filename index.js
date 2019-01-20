require('dotenv').config({ path: './.env.' + process.env.NODE_ENV });
const debug = require('debug');

const log = debug('mjlbe:apiRouter');
const logError = debug('mjlbe:apiRouter:error');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const db = require('./server/database');
const apiRouter = require('./server/apiRouter');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended:true
}));
app.set('trust proxy', 1);

app.use('/', async (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, sid, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  if (!req.headers.sid) return res.send({ success: false });
  req.sid = req.headers.sid;
  const sesh = db.get('session', { id: req.headers.sid });
  if (!sesh.length) {
    db.add('session', {
      id: req.headers.sid,
      loggedIn: false,
    });
    await db.save();
  } else {
    req.user = sesh[0].userId | null;
  }
  next();
})

app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.send({ ok: true });
});


app.listen(3030, () => log('MasonJar-Launcher listening on port 3030'));
