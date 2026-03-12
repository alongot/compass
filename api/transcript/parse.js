export default function handler(req, res) {
  res.status(501).json({
    error: 'Transcript parsing is not available in the deployed version. Use the local development server instead.',
  });
}
