// const passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const User = require('../models/User');

//
// passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
//   try {
//     const user = await User.findOne({ email });
//     if (!user || !user.password) return done(null, false, { message: 'Invalid credentials' });
//     const match = await user.comparePassword(password);
//     if (!match) return done(null, false, { message: 'Invalid credentials' });
//     return done(null, user);
//   } catch (err) {
//     return done(err);
//   }
// }));

// // Google OAuth 策略
// passport.use(new GoogleStrategy({
//   clientID:     process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL:  process.env.GOOGLE_CALLBACK_URL,
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     let user = await User.findOne({ googleId: profile.id });
//     if (!user) {
//       user = await User.create({
//         googleId:  profile.id,
//         email:     profile.emails[0].value,
//         firstName: profile.name.givenName,
//         lastName:  profile.name.familyName,
//       });
//     }
//     return done(null, user);
//   } catch (err) {
//     return done(err);
//   }
// }));

// passport.serializeUser((user, done) => done(null, user.id));

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await User.findById(id);
//     done(null, user);
//   } catch (err) {
//     done(err);
//   }
// });



const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) return done(null, false, { message: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return done(null, false, { message: 'Invalid credentials' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});