import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('demo_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data.map(row => ({ id: row.id, ...row.data })));
  }

  if (req.method === 'POST') {
    const {
      firstName, lastName, school, major, transcript,
      student_type, source_institution_id, target_major_id,
      majorId, currentQuarter,
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'firstName and lastName are required' });
    }

    const isTransfer = student_type === 'transfer';
    if (!isTransfer && (!school || !major)) {
      return res.status(400).json({ error: 'school and major are required for UCSB students' });
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const userData = {
      firstName,
      lastName,
      school: school || 'Transfer Student',
      major: major || '',
      ...(majorId ? { majorId } : {}),
      ...(currentQuarter ? { currentQuarter } : {}),
      ...(isTransfer ? { student_type, source_institution_id, target_major_id } : {}),
      createdAt: new Date().toISOString(),
      transcript: transcript || { completed: [], failed: [], withdrawn: [], in_progress: [] },
    };

    const { error } = await supabase
      .from('demo_users')
      .insert({ id, data: userData });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ id, ...userData });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
