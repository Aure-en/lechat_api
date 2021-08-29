const request = require('supertest');
const async = require('async');
const path = require('path');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let admin;
let user;

beforeAll(async (done) => {
  await dbConnect();

  async.parallel(
    [
      // Create server admin and get its JWT
      async function () {
        const adminRes = await request(app).post('/auth/signup').send({
          username: 'Admin',
          email: 'admin@user.com',
          password: 'admin_password',
        });
        admin = adminRes.body;
      },

      // Create a random user and get its JWT
      async function () {
        const userRes = await request(app).post('/auth/signup').send({
          username: 'User',
          email: 'user@user.com',
          password: 'user_password',
        });
        user = userRes.body;
      },
    ],
    done,
  );
});

afterAll(async () => dbDisconnect());

describe('Creation', () => {
  const server = {
    name: 'Server',
  };

  test('Anonymous users cannot create a server.', async (done) => {
    const res = await request(app).post('/servers').send(server);
    expect(res.status).toBe(401); // Unauthorized
    done();
  });

  test('Registered users can create a server.', async (done) => {
    const res = await request(app)
      .post('/servers')
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send(server)
      .redirects(1); // Redirect to the GET server detail.
    expect(res.body.name).toBe(server.name);
    expect(res.body.admin).toBe(admin.user._id);
    done();
  });
});

describe('Update', () => {
  // Create a server
  let server;

  beforeAll(async (done) => {
    const res = await request(app)
      .post('/servers')
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Server' })
      .redirects(1);
    server = res.body;
    done();
  });

  test('Anonymous users cannot edit a server', async (done) => {
    const res = await request(app)
      .put(`/servers/${server._id}`)
      .send({ name: 'Renamed' });
    expect(res.status).toBe(401); // Unauthorized
    done();
  });

  test('Users that do not have permissions cannot edit the server', async (done) => {
    const res = await request(app)
      .put(`/servers/${server._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Renamed' });
    expect(res.status).toBe(403); // Forbidden
    done();
  });

  test('Users with permission can edit the server', async (done) => {
    const res = await request(app)
      .put(`/servers/${server._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Renamed' })
      .redirects(1);
    expect(res.body.name).toBe('Renamed');
    done();
  });

  test('The server icon can be edited', async (done) => {
    const res = await request(app)
      .put(`/servers/${server._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
      })
      .field('name', 'Name')
      .attach('image', path.resolve(__dirname, '../assets/image.svg'))
      .redirects(1);
    expect(res.body.icon).toBeDefined();
    done();
  });

  test('The server icon can be removed', async (done) => {
    const res = await request(app)
      .put(`/servers/${server._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
      })
      .redirects(1);
    expect(res.body.icon).not.toBeDefined();
    done();
  });
});

describe('Delete', () => {
  // Create a server
  let server;

  beforeAll(async (done) => {
    const res = await request(app)
      .post('/servers')
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'To be deleted' })
      .redirects(1);
    server = res.body;
    done();
  });

  test('Anonymous users cannot delete a server', async (done) => {
    const res = await request(app).delete(`/servers/${server._id}`);
    expect(res.status).toBe(401); // Unauthorized
    done();
  });

  test('Users that are not the admin cannot delete the server', async (done) => {
    const res = await request(app)
      .delete(`/servers/${server._id}`)
      .set({ Authorization: `Bearer ${user.token}` });
    expect(res.status).toBe(403); // Forbidden
    done();
  });

  test('Admin can delete their server', async (done) => {
    const res = await request(app)
      .delete(`/servers/${server._id}`)
      .set({ Authorization: `Bearer ${admin.token}` })
      .redirects(1); // Send servers list.
    expect(res.body.success).toBeDefined();
    done();
  });
});

describe('Members', () => {
  // Create a server
  let server;

  beforeAll(async (done) => {
    const res = await request(app)
      .post('/servers')
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Server' })
      .redirects(1);
    server = res.body;
    done();
  });

  test('The members count increments when an user joins the server', async (done) => {
    const res = await request(app)
      .post(`/users/${user.user._id}/servers/${server._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    expect(res.body.server).toEqual(expect.arrayContaining([{ ...server, members: 2 }]));
    done();
  });

  test('The members count decrements when an user leaves the server', async (done) => {
    const res = await request(app)
      .delete(`/users/${user.user._id}/servers/${server._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    expect(res.body.server).not.toEqual(expect.arrayContaining([server]));
    done();
  });
});
