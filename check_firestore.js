const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: 'c:/Users/husso/Desktop/7esen/.env.local' });

// Initialize Firebase Admin
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({
    credential: cert(serviceAccount)
  });
} catch (e) {
  console.log("Already initialized");
}

const db = getFirestore();

async function checkUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.orderBy('lastPaymentTime', 'desc').limit(5).get();
  if (snapshot.empty) {
    console.log('No matching documents.');
    return;
  }  

  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

checkUsers();
