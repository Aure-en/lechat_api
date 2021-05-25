const request = require('supertest');
const {
  dbConnect,
  dbDisconnect,
} = require('../mongoTesting');
const app = require('../app');

beforeAll(async () => dbConnect());
afterAll(async () => dbDisconnect());

const user = {
  username: 'User',
  email: 'user@user.com',
  password: 'user_password',
};

describe('Sign up', () => {
  test('Sign up validation sends back errors if not all fields are filled', async (done) => {
    const res = await request(app)
      .post('/auth/signup')
      .send({});
    expect(res.body.errors.filter((error) => error.msg.match(/username must be specified/i)).length).toBe(1);
    expect(res.body.errors.filter((error) => error.msg.match(/email must be specified/i)).length).toBe(1);
    expect(res.body.errors.filter((error) => error.msg.match(/password must be specified/i)).length).toBe(1);
    done();
  });

  test('User can sign up if all required fields are filled', async (done) => {
    const res = await request(app)
      .post('/auth/signup')
      .send(user);

    expect(res.body.user.username).toBe(user.username);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.password).not.toBe(user.password); // PW is hashed.
    expect(typeof res.body.token).toBe('string');
    done();
  });
});

describe('Log in', () => {
  test('Login validation sends back errors if not all fields are filled', async (done) => {
    const res = await request(app)
      .post('/auth/login')
      .send({});
    expect(res.body.errors.filter((error) => error.msg.match(/email must be specified/i)).length).toBe(1);
    expect(res.body.errors.filter((error) => error.msg.match(/password must be specified/i)).length).toBe(1);
    done();
  });

  test('Error is sent if user does not exist', async (done) => {
    const res = await request(app).post('/auth/login').send({ email: 'Unknown@user.com', password: 'Unknown' });
    expect(res.body.errors.filter((error) => error.msg.match(/incorrect email/i)).length).toBe(1);
    done();
  });

  test('User can login if all required fields are filled', async (done) => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password,
      });

    expect(res.body.user.username).toBe(user.username);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.password).not.toBe(user.password); // PW is hashed.
    expect(typeof res.body.token).toBe('string');
    done();
  });
});
