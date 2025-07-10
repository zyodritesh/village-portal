```
village-portal-vercel/
├── package.json
├── .gitignore
├── .env.local.example
├── next.config.js
├── lib/
│   └── googleSheets.js
└── pages/
    ├── index.js
    └── api/
        ├── getCoordinator.js
        ├── getSavedData.js
        ├── saveRespondent.js
        ├── deleteRespondent.js
        ├── markCompleted.js
        └── saveTraining.js
```

---

### package.json
```json
{
  "name": "village-portal-vercel",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "googleapis": "^120.0.0",
    "next": "13.x",
    "react": "18.x",
    "react-dom": "18.x",
    "swr": "^2.1.0"
  }
}
```

---

### .gitignore
```
node_modules/
.next/
.env.local
```

---

### .env.local.example
```
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SHEET_ID=1osOlr4-H-iF0obBAFbDuEXZtPge3uGH7uQe69LkL-zs
```

---

### next.config.js
```js
module.exports = {
  env: {
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    SHEET_ID: process.env.SHEET_ID,
  },
};
```

---

### lib/googleSheets.js
```js
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
```

---

### pages/index.js
```jsx
import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = url => fetch(url).then(res => res.json());

const QUESTIONS = [
  { id: 1, text: '...question text 1...' },
  { id: 2, text: '...question text 2...' },
  { id: 3, text: '...question text 3...' },
  { id: 4, text: '...question text 4...' },
  { id: 5, text: '...question text 5...' }
];

export default function Home() {
  // [Login, Dashboard, Survey, Training flows]
  // (Use the React code scaffold provided earlier)
}
```

---

### pages/api/getCoordinator.js
```js
import { getSheets } from '../../lib/googleSheets';

export default async function handler(req, res) {
  const { mobile } = req.query;
  if (!mobile) return res.status(400).json({ error: 'Missing mobile' });

  const sheets = await getSheets();
  const ssid = process.env.SHEET_ID;

  const mc = await sheets.spreadsheets.values.get({ spreadsheetId: ssid, range: 'Village Coordinator Master' });
  const [hdr, ...rows] = mc.data.values || [];
  const map = hdr.map(h => h.trim()).reduce((m, h, i) => ((m[h] = i), m), {});

  const coordRow = rows.find(r => (r[map.VC_Mobile] || '').replace(/\D/g, '') === mobile);
  if (!coordRow) return res.status(404).json(null);

  const coord = {
    mobile,
    vid: coordRow[map.VID],
    hid: coordRow[map.H_ID],
    vcid: coordRow[map.VCID],
    name: coordRow[map.VC_Name],
    age: coordRow[map.VC_Age],
  };

  const vm = await sheets.spreadsheets.values.get({ spreadsheetId: ssid, range: 'Village Master' });
  const [vhdr, ...vrows] = vm.data.values || [];
  const vmap = vhdr.map(h => h.trim()).reduce((m, h, i) => ((m[h] = i), m), {});
  const v = vrows.find(r => r[vmap.VID] === coord.vid);
  if (v) coord.villageName = v[vmap.V_Name];

  res.status(200).json(coord);
}
```

---

### pages/api/getSavedData.js
```js
import { getSheets } from '../../lib/googleSheets';

export default async function handler(req, res) {
  const { mobile } = req.query;
  const sheets = await getSheets();
  const ssid = process.env.SHEET_ID;

  const resp = await sheets.spreadsheets.values.get({ spreadsheetId: ssid, range: 'Village Survey Responses' });
  const [hdr, ...rows] = resp.data.values || [];
  const idx = {
    coord: hdr.indexOf('VC_Mobile'),
    qid:   hdr.indexOf('Question ID'),
    ridx:  hdr.indexOf('Resp Index'),
    name:  hdr.indexOf('VS_Name'),
    age:   hdr.indexOf('VS_Age'),
    mob:   hdr.indexOf('VS_Mobile'),
  };
  const responses = rows.filter(r => r[idx.coord] === mobile).map(r => ({
    questionId:       r[idx.qid],
    respIndex:        r[idx.ridx],
    respondentName:   r[idx.name],
    respondentAge:    String(r[idx.age]),
    respondentMobile: r[idx.mob]
  }));

  const done = await sheets.spreadsheets.values.get({ spreadsheetId: ssid, range: 'Survey Completed' });
  const doneRows = (done.data.values || []).slice(1);
  const completed = doneRows.some(r => r[0] === mobile);

  const meet = await sheets.spreadsheets.values.get({ spreadsheetId: ssid, range: 'Meeting Dates' });
  const [mhdr, ...mrows] = meet.data.values || [];
  const midx = {
    coord: mhdr.indexOf('VC_Mobile'),
    date:  mhdr.indexOf('Training Date'),
    ready: mhdr.indexOf('ReadyFor'),
  };
  let trainingDate = '', readyFor = '';
  mrows.forEach(r => {
    if (r[midx.coord] === mobile) {
      trainingDate = r[midx.date];
      readyFor      = r[midx.ready];
    }
  });

  res.status(200).json({ responses, completed, trainingDate, readyFor });
}
```

---

### pages/api/saveRespondent.js
```js
import { getSheets } from '../../lib/googleSheets';

export default async function handler(req, res) {
  const data = req.body;
  const sheets = await getSheets();
  const ssid = process.env.SHEET_ID;

  // TODO: implement append/update logic (mirror your Apps Script)

  res.status(200).json({ success: true });
}
```

---

### pages/api/deleteRespondent.js
```js
import { getSheets } from '../../lib/googleSheets';

export default async function handler(req, res) {
  const data = req.body;
  const sheets = await getSheets();
  const ssid = process.env.SHEET_ID;

  // TODO: implement delete logic

  res.status(200).json({ success: true });
}
```

---

### pages/api/markCompleted.js
```js
import { getSheets } from '../../lib/googleSheets';

export default async function handler(req, res) {
  const { coordMobile, vid } = req.body;
  const sheets = await getSheets();
  const ssid = process.env.SHEET_ID;

  // TODO: append to Survey Completed sheet

  res.status(200).json({ success: true });
}
```

---

### pages/api/saveTraining.js
```js
import { getSheets } from '../../lib/googleSheets';

export default async function handler(req, res) {
  const data = req.body;
  const sheets = await getSheets();
  const ssid = process.env.SHEET_ID;

  // TODO: append to Meeting Dates sheet

  res.status(200).json({ success: true });
}
```
