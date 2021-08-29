const request = require('supertest');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let admin;
let user;
let server;
let category;

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
  done();
});

afterAll(async () => dbDisconnect());

describe('Creation', () => {
  test('Anonymous users cannot create a channel', async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/categories/${category._id}/channels`)
      .send({ name: 'Channel' });
    expect(res.status).toBe(401); // Unauthorized
    done();
  });

  test('Random server members cannot create a channel', async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/categories/${category._id}/channels`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Channel' });
    expect(res.status).toBe(403); // Forbidden
    done();
  });

  test('Users who are allowed to create a channel can make one', async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/categories/${category._id}/channels`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Channel' });
    expect(res.body.name).toBe('Channel');
    done();
  });
});

describe('Update', () => {
  // Create a channel
  let channel;

  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/categories/${category._id}/channels`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Channel' })
      .redirects(1);
    channel = res.body;
    done();
  });

  test('Anonymous user cannot update a channel', async (done) => {
    const res = await request(app)
      .put(`/channels/${channel._id}`)
      .send({ name: 'Renamed' });
    expect(res.status).toBe(401); // Unauthorized
    done();
  });

  test('Random server members cannot update a channel', async (done) => {
    const res = await request(app)
      .put(`/channels/${channel._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Renamed', category: channel.category });
    expect(res.status).toBe(403); // Unauthorized
    done();
  });

  test('Users who are allowed to can change the channel name', async (done) => {
    const res = await request(app)
      .put(`/channels/${channel._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Renamed', category: channel.category })
      .redirects(1);
    expect(res.body.name).toBe('Renamed');
    done();
  });
});

describe('Delete', () => {
  // Create a channel
  let channel;

  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/categories/${category._id}/channels`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Channel' })
      .redirects(1);
    channel = res.body;
    done();
  });

  test('Anonymous user cannot delete a channel', async (done) => {
    const res = await request(app)
      .delete(`/channels/${channel._id}`);
    expect(res.status).toBe(401); // Unauthorized
    done();
  });

  test('Random server members cannot update a channel', async (done) => {
    const res = await request(app)
      .delete(`/channels/${channel._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403); // Unauthorized
    done();
  });

  test('Users who are allowed to can change the channel name', async (done) => {
    const res = await request(app)
      .delete(`/channels/${channel._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body.success).toBeDefined();
    done();
  });
});
