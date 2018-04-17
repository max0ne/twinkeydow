const serverless = require('serverless-http');
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

app.use(morgan('dev'));
app.use(cors());
app.use(cookieParser());

app.all('/oauth_callback', require('./routes/oauth').handleOauthCallback);
app.all('/oauth_login', require('./routes/oauth').handleOauthLogin);
app.get('/user_rcmd', require('./routes/user_rcmd'));

module.exports.app = app;
module.exports.handler = serverless(app);
