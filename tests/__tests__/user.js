const request = require('supertest');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let user;

beforeAll(async (done) => {
  await dbConnect();

  // Create an user
  const res = await request(app).post('/auth/signup').send({
    username: 'User',
    email: 'user@user.com',
    password: 'user_password',
  });
  user = res.body;
  done();
});
afterAll(async () => dbDisconnect());

test('User informations can be read', async (done) => {
  const res = await request(app).get(`/users/${user.user._id}`);
  expect(res.body.username).toBe(user.user.username);
  done();
});

describe('Username update', () => {
  test('Users cannot submit an empty username', async (done) => {
    const res = await request(app)
      .put(`/users/${user.user._id}/username`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ username: '' });
    expect(res.body.errors.filter((error) => error.msg.match(/username must be specified/i)).length).toBe(1);
    done();
  });

  test('Users can update their username', async (done) => {
    const res = await request(app)
      .put(`/users/${user.user._id}/username`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ username: 'Renamed' })
      .redirects(1);
    expect(res.body.username).toBe('Renamed');
    done();
  });
});

describe('Email update', () => {
  test('Users must submit a new email and password', async (done) => {
    const res = await request(app)
      .put(`/users/${user.user._id}/email`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ email: '', password: '' });
    expect(res.body.errors.filter((error) => error.msg.match(/email must be specified/i)).length).toBe(1);
    expect(res.body.errors.filter((error) => error.msg.match(/password must be specified/i)).length).toBe(1);
    done();
  });

  test('Users cannot submit an invalid email', async (done) => {
    const res = await request(app)
      .put(`/users/${user.user._id}/email`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ email: 'Test' });
    expect(res.body.errors.filter((error) => error.msg.match(/invalid email/i)).length).toBe(1);
    done();
  });

  test('Email cannot be updated without the proper password', async (done) => {
    const res = await request(app)
      .put(`/users/${user.user._id}/email`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ email: 'new@user.com', password: 'wrong_password' });
    expect(res.body.errors.filter((error) => error.msg.match(/incorrect password/i)).length).toBe(1);
    done();
  });

  test('Email can be updated with the proper password', async (done) => {
    const res = await request(app)
      .put(`/users/${user.user._id}/email`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ email: 'new@user.com', password: 'user_password' })
      .redirects(1);
    expect(res.body.email).toBe('new@user.com');
    done();
  });
});

describe('Password update', () => {
  test('Users must fill their current, new, confirmation password', async (done) => {
    const res = await request(app)
      .put(`/users/${user.user._id}/password`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ password: '', new_password: '', confirmation_password: '' });
    expect(res.body.errors.filter((error) => error.msg.match(/current password must be specified/i)).length).toBe(1);
    expect(res.body.errors.filter((error) => error.msg.match(/new password must be specified/i)).length).toBe(1);
    expect(res.body.errors.filter((error) => error.msg.match(/new password must be confirmed/i)).length).toBe(1);
    done();
  });

  test('Current password must be correct', async (done) => {
    const res = await request(app)
      .put(`/users/${user.user._id}/password`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ password: 'wrong_password', new_password: 'new_password', confirm_password: 'new_password' });
    expect(res.body.errors.filter((error) => error.msg.match(/incorrect password/i)).length).toBe(1);
    done();
  });

  test('New password and confirmation passwords must match', async (done) => {
    const res = await request(app)
      .put(`/users/${user.user._id}/password`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ password: 'user_password', new_password: 'new_password', confirm_password: 'new_wrong_password' });
    expect(res.body.errors.filter((error) => error.msg.match(/passwords do not match/i)).length).toBeGreaterThan(0);
    done();
  });

  test('User can update their password', async (done) => {
    const previousPassword = user.user.password;
    const res = await request(app)
      .put(`/users/${user.user._id}/password`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ password: 'user_password', new_password: 'new_password', confirm_password: 'new_password' })
      .redirects(1);
    expect(res.body.password).not.toBe(previousPassword);
    done();
  });
});

describe('Only the user can update their own informations', () => {
  let randomUser;

  beforeAll(async (done) => {
    // Create a random other user
    const res = await request(app).post('/auth/signup').send({
      username: 'Random',
      email: 'random@random.com',
      password: 'random_password',
    });
    randomUser = res.body;
    done();
  });

  test('An user cannot update another user informations', async (done) => {
    const res = await request(app)
      .put(`/users/${user.user._id}/username`)
      .set({
        Authorization: `Bearer ${randomUser.token}`,
        'Content-Type': 'application/json',
      })
      .send({ username: 'Renamed' });
    expect(res.status).toBe(403);
    done();
  });
});

describe('Account deletion', () => {
  let randomUser;

  beforeAll(async (done) => {
    // Create a random other user
    const res = await request(app).post('/auth/signup').send({
      username: 'Random1',
      email: 'random1@random.com',
      password: 'random_password',
    });
    randomUser = res.body;
    done();
  });

  test('An user cannot delete another user account', async (done) => {
    const res = await request(app)
      .delete(`/users/${user.user._id}`)
      .set({
        Authorization: `Bearer ${randomUser.token}`,
        'Content-Type': 'application/json',
      })
      .send({ password: 'wrong_password' });
    expect(res.status).toBe(403);
    done();
  });

  test('User cannot delete their account without the correct password', async (done) => {
    const res = await request(app)
      .delete(`/users/${user.user._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ password: 'wrong_password' });
    expect(res.body.errors.filter((error) => error.msg.match(/incorrect password/i)).length).toBe(1);
    done();
  });

  test('User can delete their account', async (done) => {
    const res = await request(app)
      .delete(`/users/${user.user._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      })
      .send({ password: 'user_password' });
    expect(res.body.success).toBe('Account has been deleted.');
    done();
  });
});
