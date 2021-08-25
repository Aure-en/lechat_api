# Lechat (API)

* [View Live](https://lechat.vercel.app)
* [View Front Repository](https://github.com/Aure-en/lechat)

API used to create a chat website where users can hang out in servers or privately. Made with Node.js, Express, MongoDB and Socket.io.

## Features

* Authentification (with Passport, and password hashed with bcryptjs)
* Authorization with JWT
* Servers can be created and divided in categories / channels
* Private messages between users
* Pagination for messages
* Real time messages and information updates with socket.io

## Installation

### Requirements
* Node
* MongoDB database

### Installation
```
$ git clone git@github.com:Aure-en/lechat_api.git
$ cd lechat_api
$ npm install
```

### Set up environment variables
Create a .env file in the root directory and set the following variables
```
MONGODB_URI=yourdb
JWT_SECRET=yourJWTsecret
```

### Start
```
$ npm run start
```
