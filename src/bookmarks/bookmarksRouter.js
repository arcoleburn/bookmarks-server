'use strict';

const express = require('express');
const logger = require('../logger');
const { v4: uuid } = require('uuid');

const bookmarksRouter = express.Router();
const bodyParser = express.json();
const { bookmarks } = require('../store');

bookmarksRouter
  .route('/bookmarks')
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    let { title, url, description, rating } = req.body;
    rating = parseInt(rating);
    if (!title) {
      logger.error('title is required');
      return res.status(400).send('title is required field');
    }
    if (!url) {
      logger.error('url required');
      return res.status(400).send('url is required');
    }
    if (rating > 5 || rating < 1) {
      logger.error('rating must be between 1 and 5');
      return res
        .status(400)
        .send('rating needs to be between 1 and 5');
    }

    const id = uuid();

    const bookmark = { id, title, url, description, rating };
    bookmarks.push(bookmark);

    logger.info(`card with id ${id} created`);
    res
      .status(201)
      .location(`https://localhost:8080/card/${id}`)
      .json(bookmark);
  });

bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find((c) => c.id === id);

    if (!bookmark) {
      logger.error(`bookmark with id ${id} not found`);
      return res.status(404).send('bookmark not found');
    }
    return res.json(bookmark);
  })

  .delete((req, res) => {
    const { id } = req.params;
    const bookmarkIndex = bookmarks.findIndex((c) => c.id === id);

    if (bookmarkIndex === -1) {
      logger.error(`bookmark with id ${id} not found`);
      return res.status(404).send('bookmark not found');
    }
    bookmarks.splice(bookmarkIndex, 1);
    logger.info(`bookmark with id ${id} deleted`);
    res.status(204).end();
  });

module.exports =  bookmarksRouter ;
