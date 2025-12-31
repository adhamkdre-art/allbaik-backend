const { NextResponse } = require('next/server')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
if (!supabaseUrl || !supabaseKey) throw new Error("Supabase env variables missing")

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to get logged-in user
async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user
}

// GET /api/transactions?job_id=XXX
async function GET(req) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const job_id = searchParams.get('job_id')

  const query = supabase.from('transactions').select('*')
  if (job_id) query.eq('job_id', job_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST /api/transactions
// Create a transaction for a job (bid accepted)
async function POST(req) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { job_id, amount, commission } = await req.json()
  if (!job_id || !amount || !commission) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data, error } = await supabase.from('transactions').insert([{ job_id, amount, commission, status: 'pending' }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update job status to payment_pending
  await supabase.from('jobs').update({ status: 'payment_pending' }).eq('id', job_id)

  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/transactions?id=XXX
async function DELETE(req) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })

  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

module.exports = { GET, POST, DELETE }
