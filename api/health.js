export default function handler(req, res) {
  res.json({ status: 'ok', apiKeyConfigured: !!process.env.UCSB_API_KEY });
}
