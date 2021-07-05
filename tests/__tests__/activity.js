const request = require('supertest');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let user;
let server;
let channel;
let channel2;
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

  // Create another channel
  const channel2Res = await request(app)
    .post(`/servers/${server._id}/categories/${category._id}/channels`)
    .set({
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    })
    .send({ name: 'Channel' })
    .redirects(1);
  channel2 = channel2Res.body;
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
    .send({ user: user.user._id })
    .redirects(1);
  expect(res.body._id).toBe(user.user._id);
  expect(Array.isArray(res.body.servers)).toBe(true);
  expect(Array.isArray(res.body.conversations)).toBe(true);
  done();
});

describe('User activity is tracked when an user visits a channel', () => {
  test('Server and channel are saved when the user visits a channel', async (done) => {
    // User visits the channel
    const res = await request(app)
      .put(`/activity/${user.user._id}/servers`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ server: server._id, channel: channel._id })
      .redirects(1);

    // Check that the server and channel were saved.
    const { servers } = res.body;

    const visitedServer = servers.find((serv) => serv._id === server._id);
    expect(visitedServer).toBeDefined();

    const visitedChannel = visitedServer.channels.find((chan) => chan._id === channel._id);
    expect(visitedChannel).toBeDefined();
    done();
  });

  test('Activity from several channels from the same servers can be saved', async (done) => {
    // User visits a channel from the server
    await request(app)
      .put(`/activity/${user.user._id}/servers`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ server: server._id, channel: channel._id })
      .redirects(1);

    // User visits another channel from the server
    const res = await request(app)
      .put(`/activity/${user.user._id}/servers`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ server: server._id, channel: channel2._id })
      .redirects(1);

    const { servers } = res.body;
    const visitedServer = servers.find((serv) => serv._id === server._id);
    expect(visitedServer.channels.length).toBe(2);
    done();
  });
});

describe('User activity is updated when an user visits a channel again', () => {
  let previousTime;

  beforeAll(async (done) => {
    // User visits the channel
    const res = await request(app)
      .put(`/activity/${user.user._id}/servers`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ server: server._id, channel: channel._id })
      .redirects(1);

    // Save the visit time to check if it is updated when they visit again.
    const visitedServer = res.body.servers.find((serv) => serv._id === server._id);
    const visitedChannel = visitedServer.channels.find((chan) => chan._id === channel._id);
    previousTime = visitedChannel.timestamp;
    done();
  });

  test('Timestamp is updated when the user visits a channel again', async (done) => {
    // User visits the channel again
    const res = await request(app)
      .put(`/activity/${user.user._id}/servers`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ server: server._id, channel: channel._id })
      .redirects(1);
    const visitedServer = res.body.servers.find((serv) => serv._id === server._id);
    const visitedChannel = visitedServer.channels.find((chan) => chan._id === channel._id);
    expect(visitedChannel.timestamp).not.toBe(previousTime);
    done();
  });
});

test('User activity is tracked when an user visits a conversation', async (done) => {
  // User visits the conversation
  const res = await request(app)
    .put(`/activity/${user.user._id}/conversations`)
    .set({
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    })
    .send({ conversation: conversation._id })
    .redirects(1);
  expect(res.body.conversations.find((conv) => conv._id === conversation._id)).toBeDefined();
  done();
});

describe('User activity is updated when an user visits a conversation again', () => {
  let previousTime;

  beforeAll(async (done) => {
    // User visits the channel
    const res = await request(app)
      .put(`/activity/${user.user._id}/conversations`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ conversation: conversation._id })
      .redirects(1);

    // Save the visit time to check if it is updated when they visit again.
    const conv = res.body.conversations.find((conv) => conv._id === conversation._id);
    previousTime = conv.timestamp;
    done();
  });

  test('Timestamp is updated when the user visits a conversation again', async (done) => {
    // User visits the channel again
    const res = await request(app)
      .put(`/activity/${user.user._id}/conversations`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ conversation: conversation._id })
      .redirects(1);

    const conv = res.body.conversations.find((conv) => conv._id === conversation._id);
    expect(conv.timestamp).not.toBe(previousTime);
    done();
  });
});

test("Receive an user's activity", async (done) => {
  const res = await request(app)
    .get(`/activity/${user.user._id}`)
    .set({
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    });
  expect(res.body._id).toBe(user.user._id);
  done();
});
