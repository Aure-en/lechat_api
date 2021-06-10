const request = require('supertest');
const async = require('async');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let user1;
let user2;

beforeAll(async (done) => {
  await dbConnect();
  // Create two users
  async.parallel(
    [
      async function () {
        const userRes1 = await request(app).post('/auth/signup').send({
          username: 'User1',
          email: 'user1@user.com',
          password: 'user1_password',
        });
        user1 = userRes1.body;
      },
      async function () {
        const userRes2 = await request(app).post('/auth/signup').send({
          username: 'User2',
          email: 'user2@user.com',
          password: 'user2_password',
        });
        user2 = userRes2.body;
      },
    ],
    done,
  );
});

afterAll(async () => dbDisconnect());

describe('Conversation creation', () => {
  test('There must be at least 2 distinct users in a conversation', async (done) => {
    const res = await request(app)
      .post('/conversations')
      .set({
        Authorization: `Bearer ${user1.token}`,
        'Content-Type': 'application/json',
      })
      .send({ members: `["${user1.user._id}", "${user1.user._id}"]` });
    expect(
      res.body.errors.filter((err) => err.msg.match(/there must be at least two users in the conversation/i)).length,
    ).toBe(1);
    done();
  });

  test('Two users or more can create a conversation', async (done) => {
    const res = await request(app)
      .post('/conversations')
      .set({
        Authorization: `Bearer ${user1.token}`,
        'Content-Type': 'application/json',
      })
      .send({ members: `["${user1.user._id}", "${user2.user._id}"]` })
      .redirects(1);
    expect(res.body.members).toEqual(
      expect.arrayContaining([user1.user._id, user2.user._id]),
    );
    done();
  });
});

describe('Find conversations', () => {
  let conversation;
  beforeAll(async (done) => {
    const res = await request(app)
      .post('/conversations')
      .set({
        Authorization: `Bearer ${user1.token}`,
        'Content-Type': 'application/json',
      })
      .send({ members: `["${user1.user._id}", "${user2.user._id}"]` })
      .redirects(1);
    conversation = res.body;
    done();
  });

  test.only('A conversation can be found from its members', async (done) => {
    const res = await request(app)
      .get(`/conversations?members=${user1.user._id},${user2.user._id}`)
      .set({
        Authorization: `Bearer ${user1.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body._id).toBe(conversation._id);

    // Check that the members order does not matter
    const res2 = await request(app)
      .get(`/conversations?members=${user2.user._id},${user1.user._id}`)
      .set({
        Authorization: `Bearer ${user1.token}`,
        'Content-Type': 'application/json',
      });
    expect(res2.body._id).toBe(conversation._id);
    done();
  });

  test('Users can access a list of their conversations', async (done) => {
    const res = await request(app)
      .get(`/users/${user1.user._id}/conversations`)
      .set({
        Authorization: `Bearer ${user1.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body.length).toBe(1);
    done();
  });
});

describe('Conversation messages', () => {
  let conversation;
  beforeAll(async (done) => {
    const res = await request(app)
      .post('/conversations')
      .set({
        Authorization: `Bearer ${user1.token}`,
        'Content-Type': 'application/json',
      })
      .send({ members: `["${user1.user._id}", "${user2.user._id}"]` })
      .redirects(1);
    conversation = res.body;
    done();
  });

  test('Users can send direct messages to each other through conversations', async (done) => {
    const res = await request(app)
      .post(`/conversations/${conversation._id}/messages`)
      .set({
        Authorization: `Bearer ${user1.token}`,
        'Content-Type': 'application/json',
      })
      .send({ text: 'Hello.' })
      .redirects(1);
    expect(res.body.conversation).toBe(conversation._id);
    done();
  });

  test('Users can read conversation messages', async (done) => {
    const res = await request(app)
      .get(`/conversations/${conversation._id}/messages`)
      .set({
        Authorization: `Bearer ${user1.token}`,
        'Content-Type': 'application/json',
      });
    expect(res.body[0].text).toBe('Hello.');
    done();
  });
});
