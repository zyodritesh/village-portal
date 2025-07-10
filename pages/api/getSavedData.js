// pages/api/getSavedData.js
import { getSheets } from '../../lib/googleSheets';

export default async function handler(req, res) {
  const { mobile } = req.query;
  const sheets = await getSheets();
  const ssid = process.env.SHEET_ID;

  // Survey responses
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: ssid,
    range: 'Village Survey Responses',
  });
  const [hdr, ...rows] = resp.data.values || [];
  const idx = {
    coord: hdr.indexOf('VC_Mobile'),
    qid:   hdr.indexOf('Question ID'),
    ridx:  hdr.indexOf('Resp Index'),
    name:  hdr.indexOf('VS_Name'),
    age:   hdr.indexOf('VS_Age'),
    mob:   hdr.indexOf('VS_Mobile'),
  };
  const responses = rows
    .filter((r) => r[idx.coord] === mobile)
    .map((r) => ({
      questionId:       r[idx.qid],
      respIndex:        r[idx.ridx],
      respondentName:   r[idx.name],
      respondentAge:    String(r[idx.age]),
      respondentMobile: r[idx.mob],
    }));

  // Completed flag
  const done = await sheets.spreadsheets.values.get({
    spreadsheetId: ssid,
    range: 'Survey Completed',
  });
  const doneRows = (done.data.values || []).slice(1);
  const completed = doneRows.some((r) => r[0] === mobile);

  // Meeting info
  const meet = await sheets.spreadsheets.values.get({
    spreadsheetId: ssid,
    range: 'Meeting Dates',
  });
  const [mhdr, ...mrows] = meet.data.values || [];
  const midx = {
    coord: mhdr.indexOf('VC_Mobile'),
    date:  mhdr.indexOf('Training Date'),
    ready: mhdr.indexOf('ReadyFor'),
  };
  let trainingDate = '', readyFor = '';
  mrows.forEach((r) => {
    if (r[midx.coord] === mobile) {
      trainingDate = r[midx.date];
      readyFor      = r[midx.ready];
    }
  });

  res.status(200).json({ responses, completed, trainingDate, readyFor });
}
