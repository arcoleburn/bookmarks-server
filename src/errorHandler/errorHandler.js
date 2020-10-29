/* eslint-disable no-console */
'use strict';

function errorHandler(error, req, res, next) {
  let response;
  if (process.env.NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    response = { message: error.messager, error };
  }
  res.status(500).json(response);
}

module.exports = errorHandler;
