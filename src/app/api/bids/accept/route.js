const { NextResponse } = require('next/server')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) throw new Error("Supabase env variables missing")

const supabase = createClient(supabaseUrl, supabaseKey)

async function POST(req) {
  const { bid_id } = await req.json()
  if (!bid_id) return NextResponse.json({ error: 'Bid ID required' }, { status: 400 })

  const { data: bid } = await supabase.from('bids').select('job_id').eq('id', bid_id).single()
  if (!bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 })

  await supabase.from('bids').update({ status: 'accepted' }).eq('id', bid_id)
  await supabase.from('bids').update({ status: 'rejected' }).eq('job_id', bid.job_id).neq('id', bid_id)
  await supabase.from('jobs').update({ status: 'assigned' }).eq('id', bid.job_id)

  return NextResponse.json({ success: true })
}

module.exports = { POST }

