import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('demo_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'User not found' });
    return res.json({ id: data.id, ...data.data });
  }

  if (req.method === 'PUT') {
    // First check user exists
    const { data: existing, error: fetchError } = await supabase
      .from('demo_users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'User not found' });

    const updatedData = { ...existing.data, ...req.body };
    delete updatedData.id; // keep id in the column, not in data

    const { error } = await supabase
      .from('demo_users')
      .update({ data: updatedData })
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ id, ...updatedData });
  }

  if (req.method === 'DELETE') {
    const { error, count } = await supabase
      .from('demo_users')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
