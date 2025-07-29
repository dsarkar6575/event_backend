// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Assuming you have a User model
const jwt = require('jsonwebtoken');

// Utility to generate JWT (same as in authController)
const generateToken = (userId) => {
  return jwt.sign(
    { user: { id: userId } },
    process.env.JWT_SECRET,
    { expiresIn: '90d' }
  );
};

module.exports = (app) => {
  // Initialize passport for express app
  app.use(passport.initialize());

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID, // From Google Cloud Console (Web application)
        clientSecret: process.env.GOOGLE_CLIENT_SECRET, // From Google Cloud Console (Web application)
        callbackURL: '/api/auth/google/callback', // Must match the Authorized redirect URI in Google Cloud Console
        proxy: true, // If you're behind a proxy (like Nginx, Heroku)
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

          if (!email) {
            return done(new Error('Google profile did not provide an email.'), null);
          }

          let user = await User.findOne({ email });

          if (user) {
            // User exists, log them in
            return done(null, user);
          } else {
            // Register new user
            user = new User({
              email: email,
              username: profile.displayName || profile.name.givenName, // Use display name or first name
              googleId: profile.id, // Store Google ID for future reference
              profileImageUrl: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
              // For password, you might want to generate a random one or leave it null if only Google sign-in is allowed for this user type.
              // If you need a password, consider how users will set/reset it.
              password: 'GOOGLE_AUTH_USER_NO_PASSWORD_SET', // Placeholder, or generate a random password
            });
            await user.save();
            return done(null, user);
          }
        } catch (err) {
          console.error('Google OAuth error:', err);
          return done(err, null);
        }
      }
    )
  );
};