import { callUcsbApi } from './_lib/ucsb.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { quarter, subjectCode } = req.query;
  if (!quarter || !subjectCode) {
    return res.status(400).json({ error: 'quarter and subjectCode required' });
  }

  try {
    const data = await callUcsbApi(
      `/classes/search?quarter=${quarter}&subjectCode=${subjectCode}&pageSize=100`
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
