import dotenv from 'dotenv';
import express from 'express';
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  await readFile(new URL(process.env.FIREBASE_ADMIN_SDK_PATH, import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware to verify Firebase ID token
const authenticate = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).send('Unauthorized');
  }
};

// Public endpoint
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Protected endpoint
app.get('/ping-secured', authenticate, (req, res) => {
  res.send(`pong secured for user: ${req.user.uid}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});