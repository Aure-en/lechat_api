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

// -- Pin board creation --
describe('Pin board creation in a server channel', () => {
  test('Pin board cannot be created by users without the permission', async (done) => {
    const res = await request(app)
      .post(`/channels/${channel._id}/pins`)
      .set({
        Authorization: `Bearer ${stranger.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403);
    done();
  });

  test('Pin board can be created by users with the permission', async (done) => {
    const res = await request(app)
      .post(`/channels/${channel._id}/pins`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body.success).toBeDefined();
    done();
  });
});

describe('Pin board creation in a conversation', () => {
  test('Pin board cannot be created by users who are not in the conversations', async (done) => {
    const res = await request(app)
      .post(`/conversations/${conversation._id}/pins`)
      .set({
        Authorization: `Bearer ${stranger.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403);
    done();
  });

  test('Pin board can be created by conversations members', async (done) => {
    const res = await request(app)
      .post(`/conversations/${conversation._id}/pins`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body.success).toBeDefined();
    done();
  });
});

// -- Pin board deletion --
describe('Pin board deletion in a server channel', () => {
  // Create a pin document for the channel
  beforeAll(async (done) => {
    await request(app)
      .post(`/channels/${channel._id}/pins`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    done();
  });

  test('Pin board cannot be deleted by users without the permission', async (done) => {
    const res = await request(app)
      .delete(`/channels/${channel._id}/pins`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403);
    done();
  });

  test('Pin board can be deleted by users with the permission', async (done) => {
    const res = await request(app)
      .delete(`/channels/${channel._id}/pins`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body.success).toBeDefined();
    done();
  });
});

describe('Pin board deletion in a conversation', () => {
  // Create a pin document for the conversation
  beforeAll(async (done) => {
    await request(app)
      .post(`/conversations/${conversation._id}/pins`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    done();
  });

  test('Pin board cannot be deleted by users who are not in the conversations', async (done) => {
    const res = await request(app)
      .delete(`/conversations/${conversation._id}/pins`)
      .set({
        Authorization: `Bearer ${stranger.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403);
    done();
  });

  test('Pin board can be deleted by conversations members', async (done) => {
    const res = await request(app)
      .delete(`/conversations/${conversation._id}/pins`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body.success).toBeDefined();
    done();
  });
});

// -- Add pins to board --
describe('Pins can be added to a server channel\'s pin board', () => {
  let message;

  beforeAll(async (done) => {
    // Create a pin document for the channel
    await request(app)
      .post(`/channels/${channel._id}/pins`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });

    // Create a message that will be pinned
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

  test('A random user cannot add a pin to the pin document', async (done) => {
    const res = await request(app)
      .post(`/channels/${channel._id}/pins/${message._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403);
    done();
  });

  test('A user with special permissions can add a pin to the pin document', async (done) => {
    const res = await request(app)
      .post(`/channels/${channel._id}/pins/${message._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body.success).toBeDefined();
    done();
  });
});

describe('Pins can be added to a conversation\'s pin board', () => {
  let message;

  beforeAll(async (done) => {
    // Create a pin document for the conversation
    await request(app)
      .post(`/conversations/${conversation._id}/pins`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });

    // Create a message that will be pinned
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

  test('A random user cannot add a pin to the pin document', async (done) => {
    const res = await request(app)
      .post(`/conversations/${conversation._id}/pins/${message._id}`)
      .set({
        Authorization: `Bearer ${stranger.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403);
    done();
  });

  test('A conversation member can add a pin to the pin document', async (done) => {
    const res = await request(app)
      .post(`/conversations/${conversation._id}/pins/${message._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body.success).toBeDefined();
    done();
  });
});

// -- Remove pins to board --
describe('Pins can be removed from a server channel\'s pin board', () => {
  let message;

  beforeAll(async (done) => {
    // Create a pin document for the channel
    await request(app)
      .post(`/channels/${channel._id}/pins`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });

    // Create a message that will be pinned
    const res = await request(app)
      .post(`/servers/${server._id}/channels/${channel._id}/messages`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Hello' })
      .redirects(1);
    message = res.body;

    // Pin the message
    await request(app)
      .post(`/channels/${channel._id}/pins/${message._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    done();
  });

  test('A random user cannot remove a pin from the pin document', async (done) => {
    const res = await request(app)
      .delete(`/channels/${channel._id}/pins/${message._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403);
    done();
  });

  test('A user with special permissions can remove a pin from the pin document', async (done) => {
    const res = await request(app)
      .delete(`/channels/${channel._id}/pins/${message._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body.success).toBeDefined();
    done();
  });
});

describe('Pins can be removed from a conversation\'s pin board', () => {
  let message;

  beforeAll(async (done) => {
    // Create a pin document for the conversation
    await request(app)
      .post(`/conversations/${conversation._id}/pins`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });

    // Create a message that will be pinned
    const res = await request(app)
      .post(`/conversations/${conversation._id}/messages`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Hello' })
      .redirects(1);
    message = res.body;

    // Add the message to the conversation pins
    await request(app)
      .post(`/conversations/${conversation._id}/pins/${message._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    done();
  });

  test('A random user cannot remove a pin from the conversation\'s pins', async (done) => {
    const res = await request(app)
      .delete(`/conversations/${conversation._id}/pins/${message._id}`)
      .set({
        Authorization: `Bearer ${stranger.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403);
    done();
  });

  test('A conversation member can remove the pin from the conversation\'s pins', async (done) => {
    const res = await request(app)
      .delete(`/conversations/${conversation._id}/pins/${message._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body.success).toBeDefined();
    done();
  });
});
