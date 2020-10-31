'use strict';

const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const { disabled } = require('../src/app');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarksFixtures');

describe('bookmarks Endpoints', function () {
  let db;
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });
  after('disconnet from db', () => db.destroy());
  before('clean table', () => db('bookmarks').truncate());
  afterEach('cleanup', () => db('bookmarks').truncate());

  describe('GET /api/bookmarks', () => {
    context('given no bookmarks', () => {
      it('response with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, []);
      });
    }); //end of no bookmarks context

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });
      it('GET/api/bookmarks responds with 200 and all of the artilces', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, testBookmarks);
      });
    }); //end of bookmarks in db context
  }); //end of get bookmarks endpt block

  describe('GET /bookmarks/:bookmark_id', () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(404, {
            error: { message: `Bookmark does not exist` },
          });
      });
    }); //end of no bookmarks context

    context('given bookmarks in db', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });

      it('GET /api/bookmarks/:bookmark_id responds with 200 and the specified Bookmark', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, expectedBookmark);
      });
    }); //end of bookmarks in db context
  }); //end of get Bookmark by id endpt block
  describe('post /api/bookmarks', () => {
    it('creates a bookmark. responding with 201 and the new bookmark', function () {
      const newBookmark = {
        title: 'new test bookmark',
        url: 'https://newURL.test',
        description: 'test description',
        rating: 5,
      };
      return supertest(app)
        .post('/api/bookmarks')
        .set('Authorization', 'bearer ' + process.env.API_TOKEN)
        .send(newBookmark)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(
            newBookmark.description
          );
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('rating');
          expect(res.headers.location).to.eql(
            `/api/bookmarks/${res.body.id}`
          );
        })
        .then((postRes) => {
          console.log('postres body id', postRes.body.id);
          supertest(app)
            .get(`/bookmarks/${postRes.body.id}`)
            .set('Authorization', 'bearer ' + process.env.API_TOKEN)
            .expect(postRes.body);
        });
    });
  }); //end of post block
  describe(`delete /api/bookmarks/:bookmarkid`, () => {
    context('given there are bookmarks in db', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });
      it('responds with 204 and removes bookmark', () => {
        const idtoDel = 2;
        const expectedBookmarks = testBookmarks.filter(
          (bookmark) => bookmark.id !== idtoDel
        );
        return supertest(app)
          .delete(`/api/bookmarks/${idtoDel}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(204)
          .then((res) =>
            supertest(app)
              .get('/api/bookmarks')
              .set('Authorization', 'bearer ' + process.env.API_TOKEN)
              .expect(expectedBookmarks)
          );
      });
    });
  });
  describe('PATCH /api/bookmarks/:bookmarkid', () => {
    context('given no bookmarks', () => {
      it('responds with 404', () => {
        console.log(process.env.API_TOKEN);
        const bookmarkId = 12345;
        return supertest(app)
          .patch(`api/bookmarks/${bookmarkId}`).send({title: 'book'})
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(404, {
            error: { message: `Bookmark does not exist` },
          });
      });
    });
    context('given bookmarks in db', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });
      it.only('responds with 404 if specific bookmark doesnt exist', () => {
        const bookmarkId = 12345;
        const updateBookmark = {
          title: 'updated bookmark title',
        };
        return supertest(app)
          .patch(`api/bookmarks/${bookmarkId}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .send(updateBookmark)
          .expect(404, {
            error: { message: `Bookmark does not exist` },
          });
      });
      it('responds with 204 and updates the bookmark', () => {
        const idToUpdate = 2;
        const updateBookmark = {
          title: 'updated bookmark title',
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark,
        };
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .send(updateBookmark)
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', 'bearer ' + process.env.API_TOKEN)
              .expect(expectedBookmark)
          );
      });
      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain at least one edit`,
            },
          });
      });
      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateBookmark = {
          title: 'updated bookmark title',
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark,
        };

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .send({
            ...updateBookmark,
            fieldToIgnore: 'should not be in GET response',
          })
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', 'bearer ' + process.env.API_TOKEN)
              .expect(expectedBookmark)
          );
      });
    });
  });
});
//end of bookmarks block
