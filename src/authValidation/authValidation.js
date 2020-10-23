/* eslint-disable no-console */
'use strict';
const logger = require('../logger');

function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  console.log(apiToken)
  const authToken = req.get('Authorization');

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  // move to the next middleware
  next();
}

module.exports =  validateBearerToken 
