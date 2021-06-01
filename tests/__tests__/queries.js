const request = require('supertest');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let admin;
let user;
let server;
let channel1;
let channel2;
let afterFirstMessage;
let beforeLastMessage;
let firstMessage;
let lastMessage;

beforeAll(async (done) => {
  await dbConnect();

  // Create a server admin
  const adminRes = await request(app).post('/auth/signup').send({
    username: 'Admin',
    email: 'admin@user.com',
    password: 'admin_password',
  });
  admin = adminRes.body;

  // Create a server random member
  const userRes = await request(app).post('/auth/signup').send({
    username: 'User',
    email: 'user@user.com',
    password: 'user_password',
  });
  user = userRes.body;

  // Create a server
  const serverRes = await request(app)
    .post('/servers')
    .set({
      Authorization: `Bearer ${admin.token}`,
      'Content-Type': 'application/json',
    })
    .send({ name: 'Server' })
    .redirects(1);
  server = serverRes.body;

  // Create a category
  const categoryRes = await request(app)
    .post(`/servers/${server._id}/categories`)
    .set({
      Authorization: `Bearer ${admin.token}`,
      'Content-Type': 'application/json',
    })
    .send({ name: 'Category' })
    .redirects(1);
  const category = categoryRes.body;

  // Create two channels
  const channelRes1 = await request(app)
    .post(`/servers/${server._id}/categories/${category._id}/channels`)
    .set({
      Authorization: `Bearer ${admin.token}`,
      'Content-Type': 'application/json',
    })
    .send({ name: 'Channel 1' })
    .redirects(1);
  channel1 = channelRes1.body;

  const channelRes2 = await request(app)
    .post(`/servers/${server._id}/categories/${category._id}/channels`)
    .set({
      Authorization: `Bearer ${admin.token}`,
      'Content-Type': 'application/json',
    })
    .send({ name: 'Channel 2' })
    .redirects(1);
  channel2 = channelRes2.body;

  // Admin posts the first message in channel 1
  const firstMessageRes = await request(app)
    .post(`/servers/${server._id}/channels/${channel1._id}/messages`)
    .set({
      Authorization: `Bearer ${admin.token}`,
      'Content-Type': 'application/json',
    })
    .send({ text: 'First message' })
    .redirects(1);
  firstMessage = firstMessageRes.body;
  afterFirstMessage = Date.now();

  // User posts a message in channel 1
  await request(app)
    .post(`/servers/${server._id}/channels/${channel1._id}/messages`)
    .set({
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    })
    .send({ text: 'Random' });

  // Admin posts the last message in channel 2
  beforeLastMessage = Date.now();
  const lastMessageRes = await request(app)
    .post(`/servers/${server._id}/channels/${channel2._id}/messages`)
    .set({
      Authorization: `Bearer ${admin.token}`,
      'Content-Type': 'application/json',
    })
    .send({ text: 'Last message' })
    .redirects(1);
  lastMessage = lastMessageRes.body;
  done();
});

afterAll(async () => dbDisconnect());

test('Query for messages containing a specific string', async (done) => {
  const res = await request(app).get(
    `/servers/${server._id}/messages?search=message`,
  );
  expect(res.body.length).toBe(2);
  done();
});

test('Query for messages written by a specific user', async (done) => {
  const adminRes = await request(app).get(
    `/servers/${server._id}/messages?author=${admin.user._id}`,
  );
  expect(adminRes.body.length).toBe(2);
  const userRes = await request(app).get(
    `/servers/${server._id}/messages?author=${user.user._id}`,
  );
  expect(userRes.body.length).toBe(1);
  done();
});

test('Query for messages written in a specific channel', async (done) => {
  const res = await request(app).get(
    `/servers/${server._id}/messages?channel=${channel2._id}`,
  );
  expect(res.body.length).toBe(1);
  done();
});

test('Query for messages written before a certain date', async (done) => {
  const res = await request(app).get(
    `/servers/${server._id}/messages?before=${beforeLastMessage}`,
  );
  expect(res.body.length).toBe(2);
  done();
});

test('Query for messages written after a certain date', async (done) => {
  const res = await request(app).get(
    `/servers/${server._id}/messages?after=${afterFirstMessage}`,
  );
  expect(res.body.length).toBe(2);
  done();
});

test('Query for messages containing a file', async (done) => {
  // TO-DO //
  done();
});
