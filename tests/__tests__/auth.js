const request = require('supertest');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

beforeAll(async () => dbConnect());
afterAll(async () => dbDisconnect());

const user = {
  username: 'User',
  email: 'user@user.com',
  password: 'user_password',
};

describe('Sign up', () => {
  beforeAll(async (done) => {
    // Create a user so its username and email are already taken.
    await request(app).post('/auth/signup').send({
      username: 'Taken',
      email: 'taken@taken.com',
      password: 'taken_password',
    });
    done();
  });

  test('Sign up validation sends back errors if not all fields are filled', async (done) => {
    const res = await request(app).post('/auth/signup').send({});
    expect(
      res.body.errors.filter((error) => error.msg.match(/username must be specified/i)).length,
    ).toBe(1);
    expect(
      res.body.errors.filter((error) => error.msg.match(/email must be specified/i)).length,
    ).toBe(1);
    expect(
      res.body.errors.filter((error) => error.msg.match(/password must be specified/i)).length,
    ).toBe(1);
    done();
  });

  test('User can sign up if all required fields are filled', async (done) => {
    const res = await request(app).post('/auth/signup').send(user);

    expect(res.body.user.username).toBe(user.username);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.password).not.toBe(user.password); // PW is hashed.
    expect(typeof res.body.token).toBe('string');
    done();
  });

  test('Two users cannot have the same email', async (done) => {
    const res = await request(app).post('/auth/signup').send({
      username: 'Random',
      email: 'taken@taken.com', // This email is taken
      password: 'random_password',
    });
    expect(res.body.errors.filter((err) => err.msg.match(/email is already taken/i)).length).toBe(1);
    done();
  });

  test('Two users cannot have the same username', async (done) => {
    const res = await request(app).post('/auth/signup').send({
      username: 'Taken', // This username is taken
      email: 'randomuser@gmail.com',
      password: 'random_password',
    });
    expect(res.body.errors.filter((err) => err.msg.match(/username is already taken/i)).length).toBe(1);
    done();
  });
});

describe('Log in', () => {
  test('Login validation sends back errors if not all fields are filled', async (done) => {
    const res = await request(app).post('/auth/login').send({});
    expect(
      res.body.errors.filter((error) => error.msg.match(/email \/ username must be specified/i)).length,
    ).toBe(1);
    expect(
      res.body.errors.filter((error) => error.msg.match(/password must be specified/i)).length,
    ).toBe(1);
    done();
  });

  test('Error is sent if user does not exist', async (done) => {
    const res = await request(app)
      .post('/auth/login')
      .send({ identifier: 'Unknown@user.com', password: 'Unknown' });
    expect(
      res.body.errors.filter((error) => error.msg.match(/incorrect username\/email/i))
        .length,
    ).toBe(1);
    done();
  });

  test('User can login if all required fields are filled', async (done) => {
    const res = await request(app).post('/auth/login').send({
      identifier: user.email,
      password: user.password,
    });

    expect(res.body.user.username).toBe(user.username);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.password).not.toBe(user.password); // PW is hashed.
    expect(typeof res.body.token).toBe('string');
    done();
  });
});
