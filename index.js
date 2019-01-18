const debug = require('debug');

const log = debug('mjlbe:apiRouter');
const logError = debug('mjlbe:apiRouter:error');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const apiRouter = require('./apiRouter');

app.use(bodyParser.json());

app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.send({ ok: true });
});


app.listen(3030, () => log('MasonJar-Launcher listening on port 3030'));