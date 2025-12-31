const { NextResponse } = require('next/server')
const { createClient } = require('@supabase/supabase-js')

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) throw new Error("Supabase env variables missing")

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper: get logged user
async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user
}

// GET /api/bids?job_id=
async function GET(req) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const job_id = searchParams.get('job_id')
  if (!job_id) return NextResponse.json({ error: 'Job ID required' }, { status: 400 })

  const { data, error } = await supabase.from('bids').select('*').eq('job_id', job_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST /api/bids
async function POST(req) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { job_id, price } = body
  if (!job_id || !price) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (dbUser?.role !== 'provider') return NextResponse.json({ error: 'Only providers can bid' }, { status: 403 })

  const { data, error } = await supabase.from('bids').insert([{ job_id, provider_id: user.id, price, status: 'pending' }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// PUT /api/bids
async function PUT(req) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, price } = body
  if (!id || !price) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data, error } = await supabase.from('bids').update({ price }).eq('id', id).eq('provider_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// DELETE /api/bids?id=
async function DELETE(req) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Bid ID required' }, { status: 400 })

  const { error } = await supabase.from('bids').delete().eq('id', id).eq('provider_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

module.exports = { GET, POST, PUT, DELETE }
