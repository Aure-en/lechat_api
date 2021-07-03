const request = require('supertest');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let user;
let server;
let channel;
let conversation;

beforeAll(async (done) => {
  await dbConnect();

  // Create an user
  const userRes = await request(app).post('/auth/signup').send({
    username: 'User',
    email: 'user@user.com',
    password: 'user_password',
  });
  user = userRes.body;

  // Create another user
  const user2Res = await request(app).post('/auth/signup').send({
    username: 'User2',
    email: 'user2@user.com',
    password: 'user2_password',
  });
  const user2 = user2Res.body;

  // Create a conversation
  const conversationRes = await request(app)
    .post('/conversations')
    .set({
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    })
    .send({ members: `["${user.user._id}", "${user2.user._id}"]` })
    .redirects(1);
  conversation = conversationRes.body;

  // Create a server
  const serverRes = await request(app)
    .post('/servers')
    .set({
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    })
    .send({ name: 'Server' })
    .redirects(1);
  server = serverRes.body;

  // Create a category
  const categoryRes = await request(app)
    .post(`/servers/${server._id}/categories`)
    .set({
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    })
    .send({ name: 'Category' })
    .redirects(1);
  const category = categoryRes.body;

  // Create a channel
  const channelRes = await request(app)
    .post(`/servers/${server._id}/categories/${category._id}/channels`)
    .set({
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    })
    .send({ name: 'Channel' })
    .redirects(1);
  channel = channelRes.body;
  done();
});

afterAll(async () => dbDisconnect());

test('Create an activity for an user', async (done) => {
  const res = await request(app)
    .post('/activity')
    .set({
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    })
    .send({ userId: user.user._id })
    .redirects(1);
  expect(res.body._id).toBe(user.user._id);
  expect(Array.isArray(res.body.activity)).toBe(true);
  done();
});

describe('User activity is tracked when an user visits a room for the first time', () => {
  test('It works when the room is a server', async (done) => {
    const res = await request(app)
      .put(`/activity/${user.user._id}/rooms/${server._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    expect(
      res.body.activity.findIndex((activity) => activity.room === server._id),
    ).not.toBe(-1);
    done();
  });

  test('It works when the room is a channel', async (done) => {
    const res = await request(app)
      .put(`/activity/${user.user._id}/rooms/${channel._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    expect(
      res.body.activity.findIndex((activity) => activity.room === channel._id),
    ).not.toBe(-1);
    done();
  });

  test('It works when the room is a private group chat', async (done) => {
    const res = await request(app)
      .put(`/activity/${user.user._id}/rooms/${conversation._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    expect(
      res.body.activity.findIndex(
        (activity) => activity.room === conversation._id,
      ),
    ).not.toBe(-1);
    done();
  });
});

describe('User activity is updated when an user visits a room again', () => {
  let previousTime;

  beforeAll(async (done) => {
    // User visits a room
    const res = await request(app)
      .put(`/activity/${user.user._id}/rooms/${server._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);

    // Save the visit time to check if it is updated when they visit again.
    previousTime = res.body.activity.find(
      (activity) => activity.room === server._id,
    ).timestamp;
    done();
  });

  test('Timestamp is updated when the user visits a room again', async (done) => {
    // User visits the room again
    const res = await request(app)
      .put(`/activity/${user.user._id}/rooms/${server._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    const { timestamp } = res.body.activity.find(
      (activity) => activity.room === server._id,
    );
    expect(timestamp).not.toBe(previousTime);
    done();
  });
});

describe('User activity can be received', () => {
  beforeAll(async (done) => {
    // User visits a room
    await request(app)
      .put(`/activity/${user.user._id}/rooms/${conversation._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      });
    done();
  });

  test("Receive an user's activity", async (done) => {
    const res = await request(app)
      .get(`/activity/${user.user._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body._id).toBe(user.user._id);
    expect(
      res.body.activity.findIndex(
        (activity) => activity.room === conversation._id,
      ),
    ).not.toBe(-1);
    done();
  });
});
