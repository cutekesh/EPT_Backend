require("dotenv").config();
const admin = require("firebase-admin");

// // --- START DEBUGGING LOGS ---
// console.log("--- Firebase ENV Var Check ---");
// // ... (keep previous checks for other variables if you want)

// // Specifically for the private key:
// const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
// console.log(
//   "Raw FIREBASE_PRIVATE_KEY (first 50 chars):",
//   rawPrivateKey ? rawPrivateKey.substring(0, 50) + "..." : "UNDEFINED"
// );
// console.log(
//   "Raw FIREBASE_PRIVATE_KEY (last 50 chars):",
//   rawPrivateKey ? "..." + rawPrivateKey.slice(-50) : "UNDEFINED"
// );
// console.log(
//   "Raw FIREBASE_PRIVATE_KEY contains \\n:",
//   rawPrivateKey ? rawPrivateKey.includes("\\n") : "N/A"
// );

// let processedPrivateKey;
// if (rawPrivateKey) {
//   processedPrivateKey = rawPrivateKey.replace(/\\n/g, "\n");
//   console.log(
//     "Processed FIREBASE_PRIVATE_KEY (first 50 chars after replace):",
//     processedPrivateKey.substring(0, 50) + "..."
//   );
//   console.log(
//     "Processed FIREBASE_PRIVATE_KEY (last 50 chars after replace):",
//     "..." + processedPrivateKey.slice(-50)
//   );
//   console.log(
//     "Processed FIREBASE_PRIVATE_KEY contains actual newlines (\\n):",
//     processedPrivateKey.includes("\n")
//   ); // Should be true
// } else {
//   console.error("FIREBASE_PRIVATE_KEY is undefined before processing.");
//   // process.exit(1); // Could exit here if it's undefined
// }
// console.log("--- End Firebase ENV Var Check ---");

const sa = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

module.exports = admin;
