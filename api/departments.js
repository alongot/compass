import { callUcsbApi } from './_lib/ucsb.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = await callUcsbApi('/subjectAreas');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
