// lib/googleSheets.js
import { google } from 'googleapis';

let jwtClient;

export async function getSheets() {
  if (!jwtClient) {
    jwtClient = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    await jwtClient.authorize();
  }
  return google.sheets({ version: 'v4', auth: jwtClient });
}
