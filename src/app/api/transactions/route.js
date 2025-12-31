const { NextResponse } = require('next/server')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) throw new Error("Supabase env variables missing")

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to get logged user
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
  if (!job_id) return NextResponse.json({ error: 'Job ID required' }, { status: 400 })

  const { data, error } = await supabase.from('transactions').select('*').eq('job_id', job_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST /api/transactions
// Create a transaction when a bid is accepted
async function POST(req) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bid_id } = await req.json()
  if (!bid_id) return NextResponse.json({ error: 'Bid ID required' }, { status: 400 })

  // Fetch bid details
  const { data: bid, error: bidError } = await supabase.from('bids').select('job_id, price').eq('id', bid_id).single()
  if (bidError || !bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 })

  // Optional: verify user owns the job
  const { data: job } = await supabase.from('jobs').select('customer_id').eq('id', bid.job_id).single()
  if (!job || job.customer_id !== user.id) return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 })

  // Calculate commission (example 10%)
  const commission = bid.price * 0.1
  const amount = bid.price - commission

  // Insert transaction
  const { data, error } = await supabase.from('transactions').insert([{
    job_id: bid.job_id,
    amount,
    commission,
    status: 'pending'
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update job status to 'payment_pending'
  await supabase.from('jobs').update({ status: 'payment_pending' }).eq('id', bid.job_id)

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
