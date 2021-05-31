const request = require('supertest');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let admin;
let user;
let server;
let category;
let channel;

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
  done();
});

afterAll(async () => dbDisconnect());

describe('Creation', () => {
  test('Anonymous users cannot post a message', async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/channels/${channel._id}/messages`)
      .send({ text: 'Hello' });
    expect(res.status).toBe(401);
    done();
  });

  test('A registered user can post a message', async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/channels/${channel._id}/messages`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Hello' })
      .redirects(1);
    expect(res.body.text).toBe('Hello');
    done();
  });
});

describe('Update', () => {
  // Create a message
  let message;

  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/channels/${channel._id}/messages`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Message' })
      .redirects(1);
    message = res.body;
    done();
  });

  test('Anonymous users cannot update a message', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}`)
      .send({ text: 'Edited' });
    expect(res.status).toBe(401);
    done();
  });

  test("Other users cannot update an user's message", async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Edited' });
    expect(res.status).toBe(403);
    done();
  });

  test('Message author can edit their message', async (done) => {
    const res = await request(app)
      .put(`/messages/${message._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Edited' })
      .redirects(1);
    expect(res.body.edited).toBe(true);
    expect(res.body.text).toBe('Edited');
    done();
  });
});

describe('Delete', () => {
  // Create an author and a message
  let message;
  let author;

  beforeAll(async (done) => {
    const authorRes = await request(app).post('/auth/signup').send({
      username: 'Author',
      email: 'author@user.com',
      password: 'author_password',
    });
    author = authorRes.body;

    const messageRes = await request(app)
      .post(`/servers/${server._id}/channels/${channel._id}/messages`)
      .set({
        Authorization: `Bearer ${author.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Message' })
      .redirects(1);
    message = messageRes.body;
    done();
  });

  test('Anonymous users cannot delete messages', async (done) => {
    const res = await request(app)
      .delete(`/messages/${message._id}`);
    expect(res.status).toBe(401);
    done();
  });

  test('Random users cannot delete messages', async (done) => {
    const res = await request(app)
      .delete(`/messages/${message._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403); // Unauthorized
    done();
  });

  test('Messages authors can delete messages', async (done) => {
    const res = await request(app)
      .delete(`/messages/${message._id}`)
      .set({
        Authorization: `Bearer ${author.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    expect(res.body.filter((existing) => existing._id === message._id).length).toBe(0);
    done();
  });

  test('Users having special permissions can delete other users messages', async (done) => {
    const messageRes = await request(app)
      .post(`/servers/${server._id}/channels/${channel._id}/messages`)
      .set({
        Authorization: `Bearer ${author.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Message' })
      .redirects(1);
    message = messageRes.body;

    const res = await request(app)
      .delete(`/messages/${message._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    expect(res.body.filter((existing) => existing._id === message._id).length).toBe(0);
    done();
  });
});
