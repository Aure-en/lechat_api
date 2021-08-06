const request = require('supertest');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let admin;
let user;
let stranger;
let server;
let category;
let channel;
let conversation;

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

  // Create a member who does not have any permissions
  const strangerRes = await request(app).post('/auth/signup').send({
    username: 'Stranger',
    email: 'stranger@user.com',
    password: 'stranger',
  });
  stranger = strangerRes.body;

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
  category = categoryRes.body;

  // Create a channel
  const channelRes = await request(app)
    .post(`/servers/${server._id}/categories/${category._id}/channels`)
    .set({
      Authorization: `Bearer ${admin.token}`,
      'Content-Type': 'application/json',
    })
    .send({ name: 'Channel' })
    .redirects(1);
  channel = channelRes.body;

  const conversationRes = await request(app)
    .post('/conversations')
    .set({
      Authorization: `Bearer ${admin.token}`,
      'Content-Type': 'application/json',
    })
    .send({ members: `["${admin.user._id}", "${user.user._id}"]` })
    .redirects(1);
  conversation = conversationRes.body;
  done();
});

afterAll(async () => dbDisconnect());

describe('Pin message to channel', () => {
  let message;

  // Post a message in a server channel
  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/channels/${channel._id}/messages`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Hello' })
      .redirects(1);
    message = res.body;
    done();
  });

  test('Messages cannot be pinned by anonymous users', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}/pin`);
    expect(res.status).toBe(401);
    done();
  });

  test('Messages cannot be pinned by random users', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}/pin`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403);
    done();
  });

  test('Messages can be pinned by the server admin', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}/pin`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    expect(res.body.pinned).toBe(true);
    done();
  });
});

describe('Pin message to a conversation', () => {
  let message;

  // Post a message in a conversation
  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/conversations/${conversation._id}/messages`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Hello' })
      .redirects(1);
    message = res.body;
    done();
  });

  test('Messages cannot be pinned by anonymous users', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}/pin`);
    expect(res.status).toBe(401);
    done();
  });

  test('Messages cannot be pinned by random users', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}/pin`)
      .set({
        Authorization: `Bearer ${stranger.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403);
    done();
  });

  test('Messages can be pinned by conversations members', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}/pin`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    expect(res.body.pinned).toBe(true);
    done();
  });
});

describe('Pins can be accessed in a channel', () => {
  // Post and pin a message
  let message;

  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/channels/${channel._id}/messages`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Hello' })
      .redirects(1);
    message = res.body;

    await request(app)
      .put(`/messages/${message._id}/pin`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    done();
  });

  test('Users can read the pinned messages', async (done) => {
    const res = await request(app)
      .get(`/channels/${channel._id}/messages?pinned=true`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body.findIndex((pinned) => pinned._id === message._id)).not.toBe(-1);
    done();
  });
});

describe('Pins can be accessed in a conversation', () => {
  let message;

  // Post and pin a message
  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/conversations/${conversation._id}/messages`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Hello' })
      .redirects(1);
    message = res.body;

    await request(app)
      .put(`/messages/${message._id}/pin`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    done();
  });

  test('Users can read the pinned messages', async (done) => {
    const res = await request(app)
      .get(`/conversations/${conversation._id}/messages?pinned=true`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body.findIndex((pinned) => pinned._id === message._id)).not.toBe(-1);
    done();
  });
});

describe('Messages can be unpinned in a channel', () => {
  // Post and pin a message
  let message;

  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/channels/${channel._id}/messages`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Hello' })
      .redirects(1);
    message = res.body;

    await request(app)
      .put(`/messages/${message._id}/pin`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    done();
  });

  test('Messages cannot be unpinned by anonymous users', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}/unpin`);
    expect(res.status).toBe(401);
    done();
  });

  test('Messages cannot be unpinned by random users', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}/unpin`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403);
    done();
  });

  test('Messages can be unpinned by the server admin', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}/unpin`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    expect(res.body.pinned).toBe(false);
    done();
  });
});

describe('Messages can be unpinned in a conversation', () => {
  let message;

  // Post and pin a message
  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/conversations/${conversation._id}/messages`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Hello' })
      .redirects(1);
    message = res.body;

    await request(app)
      .put(`/messages/${message._id}/pin`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    done();
  });

  test('Messages cannot be unpinned by anonymous users', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}/unpin`);
    expect(res.status).toBe(401);
    done();
  });

  test('Messages cannot be unpinned by random users', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}/unpin`)
      .set({
        Authorization: `Bearer ${stranger.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403);
    done();
  });

  test('Messages can be unpinned by conversations members', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}/unpin`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    expect(res.body.pinned).toBe(false);
    done();
  });
});
