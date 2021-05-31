const request = require('supertest');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const Friend = require('../../models/friend');
const app = require('../app');

let sender;
let recipient;
let user;

beforeAll(async (done) => {
  await dbConnect();

  // Create two users
  const recipientRes = await request(app).post('/auth/signup').send({
    username: 'Recipient',
    email: 'recipient@user.com',
    password: 'recipient_password',
  });
  recipient = recipientRes.body;

  const senderRes = await request(app).post('/auth/signup').send({
    username: 'Sender',
    email: 'sender@user.com',
    password: 'sender_password',
  });
  sender = senderRes.body;

  const userRes = await request(app).post('/auth/signup').send({
    username: 'User',
    email: 'user@user.com',
    password: 'user_password',
  });
  user = userRes.body;
  done();
});
afterAll(async () => dbDisconnect());

describe('Sending a friend request', () => {
  test('An anonymous user cannot send a friend request', async (done) => {
    const res = await request(app).post(`/users/${recipient.user._id}/friends`);
    expect(res.status).toBe(401);
    done();
  });

  test('A registered user can send a friend request to another user', async (done) => {
    // Send friend request
    const res = await request(app)
      .post(`/users/${recipient.user._id}/friends`)
      .set({
        Authorization: `Bearer ${sender.token}`,
      })
      .redirects(1);
    expect(
      res.body.filter((pending) => pending.sender === sender.user._id).length
    ).toBeGreaterThan(0);
    done();
  });

  afterAll(async (done) => {
    // Delete the request
    Friend.deleteMany({ sender: sender.user._id }).exec(done);
  });
});

describe('Accepting a friend request', () => {
  let friendRequest;

  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/users/${recipient.user._id}/friends`)
      .set({
        Authorization: `Bearer ${sender.token}`,
      })
      .redirects(1);
    [friendRequest] = res.body.filter(
      (request) =>
        request.sender === sender.user._id &&
        request.recipient === recipient.user._id
    );
    done();
  });

  test('Only the user who received the request can accept it', async (done) => {
    const res = await request(app)
      .put(`/friends/${friendRequest._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
      });
    expect(res.status).toBe(403);
    done();
  });

  test('Users become friends after the request is accepted', async (done) => {
    const res = await request(app)
      .put(`/friends/${friendRequest._id}`)
      .set({
        Authorization: `Bearer ${recipient.token}`,
      })
      .redirects(1);
    expect(
      res.body.filter((friend) => friend.sender === sender.user._id).length
    ).toBeGreaterThan(0);
    done();
  });

  afterAll(async (done) => {
    // Delete the request
    Friend.deleteMany({ sender: sender.user._id }).exec(done);
  });
});

describe('Refusing or deleting a request', () => {
  let friendRequest;

  beforeAll(async (done) => {
    const res = await request(app)
      .post(`/users/${recipient.user._id}/friends`)
      .set({
        Authorization: `Bearer ${sender.token}`,
      })
      .redirects(1);
    [friendRequest] = res.body.filter(
      (request) =>
        request.sender === sender.user._id &&
        request.recipient === recipient.user._id
    );
    done();
  });

  test('Only the two users concerned can delete their friendship', async (done) => {
    const res = await request(app)
      .delete(`/friends/${friendRequest._id}`)
      .set({
        Authorization: `Bearer ${user.token}`,
      });
    expect(res.status).toBe(403);
    done();
  });

  test('Users can delete their friendship or refuse a request', async (done) => {
    const res = await request(app)
      .delete(`/friends/${friendRequest._id}`)
      .set({
        Authorization: `Bearer ${recipient.token}`,
      })
      .redirects(1);
    expect(
      res.body.filter(
        (friend) =>
          friend.sender === sender.user._id &&
          friend.recipient === recipient.user._id
      ).length
    ).toBe(0);
    done();
  });
});
