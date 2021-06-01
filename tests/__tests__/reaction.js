const request = require('supertest');
const path = require('path');
const { dbConnect, dbDisconnect } = require('../mongoTesting');
const app = require('../app');

let admin;
let user;
let message;
let emote1;
let emote2;

beforeAll(async (done) => {
  await dbConnect();

  // Create a server admin
  const adminRes = await request(app).post('/auth/signup').send({
    username: 'Admin',
    email: 'admin@user.com',
    password: 'admin_password',
  });
  admin = adminRes.body;

  // Create a server random member
  const userRes = await request(app).post('/auth/signup').send({
    username: 'User',
    email: 'user@user.com',
    password: 'user_password',
  });
  user = userRes.body;

  // Create a server
  const serverRes = await request(app)
    .post('/servers')
    .set({
      Authorization: `Bearer ${admin.token}`,
      'Content-Type': 'application/json',
    })
    .send({ name: 'Server' })
    .redirects(1);
  const server = serverRes.body;

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

  // Create a channel
  const channelRes = await request(app)
    .post(`/servers/${server._id}/categories/${category._id}/channels`)
    .set({
      Authorization: `Bearer ${admin.token}`,
      'Content-Type': 'application/json',
    })
    .send({ name: 'Channel' })
    .redirects(1);
  const channel = channelRes.body;

  // Create a message
  const messageRes = await request(app)
    .post(`/servers/${server._id}/channels/${channel._id}/messages`)
    .set({
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    })
    .send({ text: 'Hello' })
    .redirects(1);
  message = messageRes.body;

  // Create two different emotes
  const emoteRes1 = await request(app)
    .post('/emotes')
    .field('name', 'emote1')
    .attach('image', path.resolve(__dirname, '../assets/emote.svg'))
    .redirects(1);
  emote1 = emoteRes1.body;

  const emoteRes2 = await request(app)
    .post('/emotes')
    .field('name', 'emote2')
    .attach('image', path.resolve(__dirname, '../assets/emote.svg'))
    .redirects(1);
  emote2 = emoteRes2.body;
  done();
});

afterAll(async () => dbDisconnect());

describe('Add reactions', () => {
  test('Users can add a reaction to a message', async (done) => {
    // First user adds emote 1
    const res = await request(app)
      .post(`/messages/${message._id}/reactions/${emote1._id}`)
      .set({ Authorization: `Bearer ${user.token}` })
      .redirects(1);
    const [reaction] = res.body.reaction.filter((reaction) => reaction.emote._id === emote1._id);
    expect(reaction.emote._id).toBe(emote1._id);
    expect(reaction.users).toEqual(expect.arrayContaining([user.user._id]));
    done();
  });

  test('Users can add the same reaction to a message', async (done) => {
    // Second user adds emote 1
    const res = await request(app)
      .post(`/messages/${message._id}/reactions/${emote1._id}`)
      .set({ Authorization: `Bearer ${admin.token}` })
      .redirects(1);
    const [reaction] = res.body.reaction.filter((reaction) => reaction.emote._id === emote1._id);
    expect(reaction.emote._id).toBe(emote1._id);
    expect(reaction.users).toEqual(expect.arrayContaining([user.user._id, admin.user._id]));
    done();
  });

  test('One user can add several different reactions to a message', async (done) => {
    // First user adds emote 2.
    const res = await request(app)
      .post(`/messages/${message._id}/reactions/${emote2._id}`)
      .set({ Authorization: `Bearer ${user.token}` })
      .redirects(1);
    const [reaction1, reaction2] = res.body.reaction;
    expect(reaction1.emote._id).toBe(emote1._id);
    expect(reaction1.users).toEqual(expect.arrayContaining([user.user._id]));
    expect(reaction2.emote._id).toBe(emote2._id);
    expect(reaction2.users).toEqual(expect.arrayContaining([user.user._id]));
    done();
  });

  test('One user cannot add the same reaction twice', async (done) => {
    done();
  });
});

describe('Remove reactions', () => {
  test('If the user was the only one using a reaction, the field disappears', async (done) => {
    const res = await request(app)
      .delete(`/messages/${message._id}/reactions/${emote2._id}`)
      .set({ Authorization: `Bearer ${user.token}` })
      .redirects(1);
    expect(res.body.reaction.length).toBe(1);
    done();
  });

  test('If another user was using this reaction, the remover only is pulled of the reaction users list', async (done) => {
    const res = await request(app)
      .delete(`/messages/${message._id}/reactions/${emote1._id}`)
      .set({ Authorization: `Bearer ${user.token}` })
      .redirects(1);
    const [reaction] = res.body.reaction.filter((reaction) => reaction.emote._id === emote1._id);
    expect(reaction.users.length).toBe(1);
    done();
  });
});
