import { callUcsbApi } from './_lib/ucsb.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { quarter, courseId } = req.query;
  if (!quarter || !courseId) {
    return res.status(400).json({ error: 'quarter and courseId required' });
  }

  try {
    const data = await callUcsbApi(
      `/classes/search?quarter=${quarter}&courseId=${encodeURIComponent(courseId)}`
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
