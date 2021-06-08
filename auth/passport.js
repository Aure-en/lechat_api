const passport = require('passport');
const passportJWT = require('passport-jwt');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/user');

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    (identity, password, done) => {
      User.findOne({ $or: [{ email: identity }, { username: identity }] }, (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: 'Incorrect username/email.' });
        }

        bcrypt.compare(password, user.password, (err, res) => {
          if (res) {
            return done(null, user, { message: 'Logged in successfully.' });
          }
          return done(null, false, { message: 'Incorrect password.' });
        });
      });
    },
  ),
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    (jwt, done) => {
      if (jwt) {
        return done(null, jwt);
      }
      return done(null, false);
    },
  ),
);
