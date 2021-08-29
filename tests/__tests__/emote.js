const request = require('supertest');
const path = require('path');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

beforeAll(async () => dbConnect());
afterAll(async () => dbDisconnect());

describe('Creation', () => {
  test('Emotes must have a name and an image', async (done) => {
    const res = await request(app).post('/emotes');
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

  test('Emotes can be created', async (done) => {
    const res = await request(app)
      .post('/emotes')
      .field('name', 'heart')
      .field('category', 'shape')
      .attach('image', path.resolve(__dirname, '../assets/image.svg'))
      .redirects(1);
    expect(res.body.name).toBe(':heart:');
    expect(res.body.category).toBe('shape');
    expect(res.body.image.data).toBeDefined();
    done();
  });

  test('Emotes cannot have the same name', async (done) => {
    await request(app)
      .post('/emotes')
      .field('name', 'emote')
      .field('category', 'shape')
      .attach('image', path.resolve(__dirname, '../assets/image.svg'));

    const res = await request(app)
      .post('/emotes')
      .field('name', 'emote')
      .field('category', 'shape')
      .attach('image', path.resolve(__dirname, '../assets/image.svg'));
    expect(
      res.body.errors.filter((err) => err.msg.match(/name is already taken/i))
        .length,
    ).toBe(1);
    done();
  });
});

test('Users can read emotes', async (done) => {
  const res = await request(app).get('/emotes');
  expect(res.status).toBe(200);
  done();
});

describe('Update', () => {
  let emote;
  beforeAll(async (done) => {
    // Create a emote to be updated
    const res = await request(app)
      .post('/emotes')
      .field('name', 'update')
      .field('category', 'shape')
      .attach('image', path.resolve(__dirname, '../assets/image.svg'))
      .redirects(1);
    emote = res.body;
    done();
  });

  test('Emotes cannot be renamed if another emote already has this name', async (done) => {
    const res = await request(app)
      .put(`/emotes/${emote._id}`)
      .field('name', 'heart')
      .field('category', 'other')
      .attach('image', path.resolve(__dirname, '../assets/image.svg'));
    expect(
      res.body.errors.filter((err) => err.msg.match(/name is already taken/i))
        .length,
    ).toBe(1);
    done();
  });

  test('Emotes can be updated', async (done) => {
    const res = await request(app)
      .put(`/emotes/${emote._id}`)
      .field('name', 'updated')
      .field('category', 'other')
      .attach('image', path.resolve(__dirname, '../assets/image.svg'))
      .redirects(1);
    expect(res.body.name).toBe(':updated:');
    expect(res.body.category).toBe('other');
    expect(res.body.image.name).not.toBe(emote.image.name);
    done();
  });
});

test('Emotes can be deleted', async (done) => {
  // Create a emote to be deleted
  const res = await request(app)
    .post('/emotes')
    .field('name', 'delete')
    .attach('image', path.resolve(__dirname, '../assets/image.svg'))
    .redirects(1);
  const emote = res.body;

  const deleteRes = await request(app)
    .delete(`/emotes/${emote._id}`)
    .redirects(1);
  expect(deleteRes.body.filter((item) => item._id === emote._id).length).toBe(0);
  done();
});
