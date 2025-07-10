// pages/api/getCoordinator.js
import { getSheets } from '../../lib/googleSheets';

export default async function handler(req, res) {
  const { mobile } = req.query;
  if (!mobile) return res.status(400).json({ error: 'Missing mobile' });

  const sheets = await getSheets();
  const ssid = process.env.SHEET_ID;

  // Master sheet
  const mc = await sheets.spreadsheets.values.get({
    spreadsheetId: ssid,
    range: 'Village Coordinator Master',
  });
  const [hdr, ...rows] = mc.data.values || [];
  const map = hdr.map((h) => h.trim()).reduce((m, h, i) => ((m[h] = i), m), {});

  const coordRow = rows.find((r) =>
    (r[map.VC_Mobile] || '').replace(/\D/g, '') === mobile
  );
  if (!coordRow) return res.status(404).json(null);

  const coord = {
    mobile,
    vid: coordRow[map.VID],
    hid: coordRow[map.H_ID],
    vcid: coordRow[map.VCID],
    name: coordRow[map.VC_Name],
    age: coordRow[map.VC_Age],
  };

  // Fetch village name
  const vm = await sheets.spreadsheets.values.get({
    spreadsheetId: ssid,
    range: 'Village Master',
  });
  const [vhdr, ...vrows] = vm.data.values || [];
  const vmap = vhdr.map((h) => h.trim()).reduce((m, h, i) => ((m[h] = i), m), {});
  const v = vrows.find((r) => r[vmap.VID] === coord.vid);
  if (v) coord.villageName = v[vmap.V_Name];

  res.status(200).json(coord);
}
