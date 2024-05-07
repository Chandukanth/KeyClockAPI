const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const axios = require('axios');

async function getAdminToken() {
    const params = new URLSearchParams();
    params.append('client_id', '9113996277'); 
    params.append('client_secret', 'VoSxXhCzHxONGBpsCXMfLDCf6n11lJp9');
    params.append('grant_type', 'client_credentials');

    try {
        const response = await axios.post('http://localhost:8080/auth/realms/master/protocol/openid-connect/token', params);
        return response.data.access_token;
    } catch (error) {
        console.error('Failed to obtain token:', error);
        return null;
    }
}

const app = express();

app.use(session({
  secret: 'some secret',
  resave: false,
  saveUninitialized: true,
  store: new session.MemoryStore() 
}));

const keycloak = new Keycloak({
  store: session
}, {
  realm: 'ChanduYadav',
  'auth-server-url': 'http://localhost:8080/auth',
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

// Protected route
app.get('/protected', keycloak.protect(), (req, res) => {
  res.send("You have accessed a protected route!");
});

// Unprotected route
app.get('/', (req, res) => {
  res.send("Anyone can view this!");
});
async function fetchUsers() {
    const token = await getAdminToken();
    if (!token) {
        return;
    }

    try {
        const response = await axios.get('http://localhost:8080/admin/master/console/#/ChanduYadav/users', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data; // This is your users list
    } catch (error) {
        console.error('Failed to fetch users:', error);
    }
}
fetchUsers().then(users => {
    console.log(users); // Log or process the list of users
});

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
