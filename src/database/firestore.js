const fs = require('firebase-admin');

const serviceAccount = require('../../app-key.json');

fs.initializeApp({
  credential: fs.credential.cert(serviceAccount)
});

const db = fs.firestore(); // firestore instance

module.exports = db;