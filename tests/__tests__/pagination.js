const request = require('supertest');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let admin;
let server;
let channel;
let firstKey;
let secondKey;
const limit = 5;

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
  await Promise.all(arr.map(async (num) => {
    await request(app)
      .post(`/servers/${server._id}/channels/${channel._id}/messages`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: num });
  }));

  // Save pagination keys
  const keyRes = await request(app).get(
    `/servers/${server._id}/messages`,
  );
  firstKey = keyRes.body[limit - 1]._id;
  secondKey = keyRes.body[limit * 2 - 1]._id;
  done();
});

afterAll(async () => dbDisconnect());

describe('Pagination', () => {
  test('Messages are displayed according to the limit, in the sorting order', async (done) => {
    const res = await request(app).get(
      `/servers/${server._id}/messages?limit=5`,
    );
    expect(res.body.length).toBe(5);
    expect(res.body[0].text).toBe('10');
    expect(res.body[res.body.length - 1].text).toBe('6');
    [...Array(5).keys()].map((key) => {
      expect(res.body.sort((a, b) => +a.text - +b.text)[key]).toEqual(res.body[key]);
    });
    done();
  });

  test('Next page is loaded by using the last_key query', async (done) => {
    const res = await request(app).get(
      `/servers/${server._id}/messages?last_key=${firstKey}&limit=5`,
    );
    expect(res.body.length).toBe(5);
    expect(res.body[0].text).toBe('5');
    expect(res.body[res.body.length - 1].text).toBe('1');
    done();
  });

  test('Last page is loaded even if there are less messages than the limit', async (done) => {
    const nextRes = await request(app).get(
      `/servers/${server._id}/messages?last_key=${secondKey}&limit=5`,
    );
    expect(nextRes.body.length).toBe(1); // Only 1 message left
    expect(nextRes.body[0].text).toBe('0');
    done();
  });
});
