const request = require('supertest');
const {
  dbConnect,
  dbDisconnect,
} = require('../mongoTesting');
const app = require('../app');

beforeAll(async () => dbConnect());
afterAll(async () => dbDisconnect());

const server = {
  name: 'Server',

};

describe('Creation', () => {
  test('Anonymous users cannot create a server.', async (done) => {

  });
  test('Registered users can create a server.', async (done) => {

  });
});

describe('Update', () => {
  test('Users that do not have permissions cannot edit the server', async (done) => {

  });
  test('Users with permission can edit the server', async (done) => {

  });
});

describe('Delete', () => {
  test('Users that are not the admin cannot delete the server', async (done) => {

  });
  test('Admin can delete their server', async (done) => {

  });
});
