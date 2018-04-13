const serverless = require('serverless-http');
const express = require('express');
const app = express();

app.all('/oauth', require('./routes/oauth'));
app.get('/user_rcmd', require('./routes/user_rcmd'));

module.exports.app = app;
module.exports.handler = serverless(app);
