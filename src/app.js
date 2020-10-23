'use strict';

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const  errorHandler  = require('./errorHandler/errorHandler');
const  authValidation = require('./authValidation/authValidation');
const bookmarksRouter = require('./bookmarks/bookmarksRouter')

const app = express();

const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello, world!');
});
//console.log(errorHandler)
app.use(errorHandler);
app.use(authValidation);

app.use(bookmarksRouter);


module.exports = app;
