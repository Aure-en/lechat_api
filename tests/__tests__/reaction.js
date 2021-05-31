const request = require('supertest');
const path = require('path');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

beforeAll(async () => dbConnect());
afterAll(async () => dbDisconnect());

describe('Creation', () => {
  test('Reactions must have a name and an image', async (done) => {
    const res = await request(app).post('/reactions');
    expect(
      res.body.errors.filter((err) => err.msg.match(/name must be specified/i))
        .length,
    ).toBe(1);
    expect(
      res.body.errors.filter((err) => err.msg.match(/image must be specified/i))
        .length,
    ).toBe(1);
    done();
  });

  test('Reactions can be created', async (done) => {
    const res = await request(app)
      .post('/reactions')
      .field('name', 'heart')
      .field('category', 'shape')
      .attach('image', path.resolve(__dirname, '../assets/reaction.svg'))
      .redirects(1);
    expect(res.body.name).toBe(':heart:');
    expect(res.body.category).toBe('shape');
    expect(res.body.image.data).toBeDefined();
    done();
  });

  test('Reactions cannot have the same name', async (done) => {
    await request(app)
      .post('/reactions')
      .field('name', 'reaction')
      .field('category', 'shape')
      .attach('image', path.resolve(__dirname, '../assets/reaction.svg'));

    const res = await request(app)
      .post('/reactions')
      .field('name', 'reaction')
      .field('category', 'shape')
      .attach('image', path.resolve(__dirname, '../assets/reaction.svg'));
    expect(
      res.body.errors.filter((err) => err.msg.match(/name is already taken/i))
        .length,
    ).toBe(1);
    done();
  });
});

test('Users can read reactions', async (done) => {
  const res = await request(app).get('/reactions');
  expect(res.status).toBe(200);
  done();
});

describe('Update', () => {
  let reaction;
  beforeAll(async (done) => {
    // Create a reaction to be updated
    const res = await request(app)
      .post('/reactions')
      .field('name', 'update')
      .field('category', 'shape')
      .attach('image', path.resolve(__dirname, '../assets/reaction.svg'))
      .redirects(1);
    reaction = res.body;
    done();
  });

  test('Reactions cannot be renamed if another reaction already has this name', async (done) => {
    const res = await request(app)
      .put(`/reactions/${reaction._id}`)
      .field('name', 'heart')
      .field('category', 'other')
      .attach('image', path.resolve(__dirname, '../assets/reaction.svg'));
    expect(
      res.body.errors.filter((err) => err.msg.match(/name is already taken/i))
        .length,
    ).toBe(1);
    done();
  });

  test('Reactions can be updated', async (done) => {
    const res = await request(app)
      .put(`/reactions/${reaction._id}`)
      .field('name', 'updated')
      .field('category', 'other')
      .attach('image', path.resolve(__dirname, '../assets/reaction.svg'))
      .redirects(1);
    expect(res.body.name).toBe(':updated:');
    expect(res.body.category).toBe('other');
    expect(res.body.image.name).not.toBe(reaction.image.name);
    done();
  });
});

test('Reactions can be deleted', async (done) => {
  // Create a reaction to be deleted
  const res = await request(app)
    .post('/reactions')
    .field('name', 'delete')
    .attach('image', path.resolve(__dirname, '../assets/reaction.svg'))
    .redirects(1);
  const reaction = res.body;

  const deleteRes = await request(app)
    .delete(`/reactions/${reaction._id}`)
    .redirects(1);
  expect(deleteRes.body.filter((item) => item._id === reaction._id).length).toBe(0);
  done();
});
