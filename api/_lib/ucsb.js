const UCSB_API_KEY = process.env.UCSB_API_KEY;
const UCSB_BASE_URL = 'https://api.ucsb.edu/academics/curriculums/v1';

export async function callUcsbApi(endpoint) {
  const response = await fetch(`${UCSB_BASE_URL}${endpoint}`, {
    headers: {
      'ucsb-api-key': UCSB_API_KEY,
      'ucsb-api-version': '1.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`UCSB API error: ${response.status}`);
  }

  return response.json();
}
