import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function POST(req) {
  const body = await req.json();

  const { data, error } = await supabase
    .from('jobs')
    .insert([body]);

  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  return Response.json({ data });
}
