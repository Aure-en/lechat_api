const request = require('supertest');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let admin;
let server;
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
  channel = channelRes1.body;

  // Admin posts some messages
  const arr = [...Array(11).keys()];
  await Promise.all(arr.map((num) => {
    request(app)
      .post(`/servers/${server._id}/channels/${channel._id}/messages`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: num });
  }));
  done();
});

afterAll(async () => dbDisconnect());

test('', async (done) => {
  const res = await request(app).get(
    `/servers/${server._id}/messages?limit=5`,
  );
  console.log(res.body);
  done();
});
