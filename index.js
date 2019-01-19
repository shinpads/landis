require('dotenv').config({ path: './.env.' + process.env.NODE_ENV });
const debug = require('debug');

const log = debug('mjlbe:apiRouter');
const logError = debug('mjlbe:apiRouter:error');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const apiRouter = require('./server/apiRouter');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended:true
}));
app.set('trust proxy', 1);

app.use('/', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
})

app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.send({ ok: true });
});


app.listen(3030, () => log('MasonJar-Launcher listening on port 3030'));
