'use strict';

const express = require('express');
const jsonParser = express.json();
const logger = require('../logger');
const { v4: uuid } = require('uuid');

const bookmarksRouter = express.Router();
const bodyParser = express.json();
const BookmarksService = require('../bookmarks-service');

bookmarksRouter

  .route('/api/bookmarks')
  .get((req, res, next) => {
    const db = req.app.get('db');
    BookmarksService.getAllBookmarks(db)
      .then((bookmarks) => {
        res.json(bookmarks);
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
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

    //const id = uuid();

    const newBookmark = { title, url, description, rating };
    console.log('bookmark from add', newBookmark);
    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    ).then((bookmark) => {
      logger.info(`bookmark created`);
      console.log('bookmark res', bookmark);
      res
        .status(201)
        .location(`/api/bookmarks/${bookmark.id}`)
        .json(bookmark);
    });
  });

bookmarksRouter
  .route('/api/bookmarks/:id')
  .get((req, res, next) => {
    const db = req.app.get('db');
    const { id } = req.params;
    BookmarksService.getById(db, id)
      .then((bookmark) => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `Bookmark does not exist` },
          });
        }
        res.json(bookmark);
      })
      .catch(next);
  })

  .delete((req, res, next) => {
    console.log(req.params);
    BookmarksService.deleteBookmark(req.app.get('db'), req.params.id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const bookmarkToUpdate = { title, url, description, rating };
    const numberOfVals = Object.values(bookmarkToUpdate).filter(
      Boolean
    ).length;
    if (numberOfVals === 0) {
      return res.status(400).json({
        error: {
          message: 'Request body must contain at least one edit',
        },
      });
    }
    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.id,
      bookmarkToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRouter;
