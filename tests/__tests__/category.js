const request = require('supertest');
const async = require('async');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let admin;
let user;
let server;

beforeAll(async (done) => {
  await dbConnect();

  async.parallel(
    [
      // Create server admin and get its details + JWT
      async function () {
        const adminRes = await request(app).post('/auth/signup').send({
          username: 'Admin',
          email: 'admin@user.com',
          password: 'admin_password',
        });
        admin = adminRes.body;
      },

      // Create a random user and get its details + JWT
      async function () {
        const userRes = await request(app).post('/auth/signup').send({
          username: 'User',
          email: 'user@user.com',
          password: 'user_password',
        });
        user = userRes.body;
      },
    ],
    async () => {
      // Create a server
      const serverRes = await request(app)
        .post('/servers')
        .set({
          Authorization: `Bearer ${admin.token}`,
          'Content-Type': 'application/json',
        })
        .send({ name: 'Server ' })
        .redirects(1);
      server = serverRes.body;
      done();
    },
  );
});

afterAll(async () => dbDisconnect());

describe('Creation', () => {
  test('Anonymous users cannot create a category', async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/categories`)
      .send({ name: 'Category' });
    expect(res.status).toBe(401); // Unauthorized
    done();
  });

  test('Random server members cannot create a category', async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/categories`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Category' });
    expect(res.status).toBe(403); // Forbidden
    done();
  });

  test('Users who are allowed to create a category can make one', async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/categories`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Category' })
      .redirects(1);
    expect(res.body.name).toBe('Category');
    done();
  });
});

describe('Update', () => {
  // Create a category
  let category;

  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/categories`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Category' })
      .redirects(1);
    category = res.body;
    done();
  });

  test('Anonymous users cannot update a category', async (done) => {
    const res = await request(app)
      .put(`/categories/${category._id}`)
      .send({ name: 'Renamed' });
    expect(res.status).toBe(401); // Unauthorized
    done();
  });

  test('Random server members cannot update a category', async (done) => {
    const res = await request(app)
      .put(`/categories/${category._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Renamed' });
    expect(res.status).toBe(403); // Unauthorized
    done();
  });

  test('Users who are allowed to can change the category name', async (done) => {
    const res = await request(app)
      .put(`/categories/${category._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Renamed' })
      .redirects(1);
    expect(res.body.name).toBe('Renamed');
    done();
  });
});

describe('Delete', () => {
  // Create a category
  let category;

  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/servers/${server._id}/categories`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .send({ name: 'Delete' })
      .redirects(1);
    category = res.body;
    done();
  });

  test('Anonymous users cannot delete a category', async (done) => {
    const res = await request(app)
      .delete(`/categories/${category._id}`);
    expect(res.status).toBe(401); // Unauthorized
    done();
  });

  test('Random server members cannot delete a category', async (done) => {
    const res = await request(app)
      .delete(`/categories/${category._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.status).toBe(403); // Unauthorized
    done();
  });

  test('Users who are allowed to can delete the category', async (done) => {
    const res = await request(app)
      .delete(`/categories/${category._id}`)
      .set({
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      })
      .redirects(1);
    expect(res.body.success).toBeDefined();
    done();
  });
});
