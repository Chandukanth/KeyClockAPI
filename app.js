const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const sgMail = require('@sendgrid/mail');
const bodyParser = require('body-parser');
const { default: OTPVerification } = require('./otpVerification');
const { default: ForgotPassword } = require('./forgotPassword');
const { default: ResetPassword } = require('./resetPassword');
const Register = require('./register').default

sgMail.setApiKey(process.env.SENDGRID_KEY);

const app = express();
app.use(bodyParser.json());

app.use(session({
  secret: 'some secret',
  resave: false,
  saveUninitialized: true,
  store: new session.MemoryStore() 
}));

const keycloak = new Keycloak({
  store: session
}, {
  realm: process.env.KeyClockRealm,
  'auth-server-url': process.env.AUTH_SERVER_URL,
  'ssl-required': 'external',
  resource: '9113996277',
  'public-client': false,
  'confidential-port': 0,
  credentials: {
    secret: 'VoSxXhCzHxONGBpsCXMfLDCf6n11lJp9'
  }
});

app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/'
}));

app.post('/register', Register);

app.post('/verify-otp',OTPVerification);

app.post('/forgot-password', ForgotPassword);

app.post('/reset-password', ResetPassword);

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
