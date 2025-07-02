const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const serviceAccount = require('../../credentials/service-account-key.json'); // adjust path

export const getDirectoryClient = () => {
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/admin.directory.user'],
    subject: process.env.GOOGLE_ADMIN_EMAIL, // admin to impersonate
  });

  return google.admin({ version: 'directory_v1', auth });
};
