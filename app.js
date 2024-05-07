const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const bodyParser = require('body-parser');

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

const otpStore = {};

app.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        await sgMail.send({
            to: email,
            from: 'chandrakanth.k@vvglobalsolutions.co',
            subject: "Verify Your Email",
            text: `Your OTP is: ${otp}`,
        });
        otpStore[email] = otp;
        res.status(200).send("OTP sent to email");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to send email");
    }
});

app.post('/verify-otp', async (req, res) => {
    const { email, otp, password } = req.body;
    
    if (otpStore[email] && otpStore[email] === parseInt(otp)) {
        // Assuming keycloak-admin-client is already setup
        const keycloakAdminClient = require('@keycloak/keycloak-admin-client');
        const kcAdminClient = new keycloakAdminClient();
        
        await kcAdminClient.auth({
            username: 'admin',
            password: 'admin',
            grantType: 'password',
            clientId: 'admin-cli'
        });

        try {
            await kcAdminClient.users.create({
                realm: process.env.KeyClockRealm,
                username: email,
                email: email,
                enabled: true,
                credentials: [{ type: 'password', value: password, temporary: false }],
                emailVerified: true,
            });
            delete otpStore[email]; // Clean up OTP
            res.status(200).send("User registered successfully");
        } catch (error) {
            console.error(error);
            res.status(500).send("Failed to create user");
        }
    } else {
        res.status(400).send("Invalid OTP");
    }
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        await sgMail.send({
            to: email,
            from: 'chandrakanth.k@vvglobalsolutions.co',
            subject: "Password Reset Request",
            text: `Your OTP for password reset is: ${otp}`,
        });
        otpStore[email] = otp;
        res.status(200).send("OTP sent for password reset");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to send reset password email");
    }
});

app.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (otpStore[email] && otpStore[email] === parseInt(otp)) {
        const keycloakAdminClient = require('@keycloak/keycloak-admin-client');
        const kcAdminClient = new keycloakAdminClient();

        await kcAdminClient.auth({
            username: 'admin',
            password: 'admin',
            grantType: 'password',
            clientId: 'admin-cli'
        });

        try {
            const users = await kcAdminClient.users.find({ realm: process.env.KeyClockRealm, email: email });
            if (users.length === 1) {
                await kcAdminClient.users.resetPassword({
                    realm: process.env.KeyClockRealm,
                    id: users[0].id,
                    credential: { type: 'password', value: newPassword, temporary: false }
                });
                delete otpStore[email]; // Clean up OTP
                res.status(200).send("Password reset successfully");
            } else {
                res.status(404).send("User not found");
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Failed to reset password");
        }
    } else {
        res.status(400).send("Invalid OTP");
    }
});

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
