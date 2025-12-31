const { NextResponse } = require('next/server')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) throw new Error("Supabase env variables missing")

const supabase = createClient(supabaseUrl, supabaseKey)

async function POST(req) {
  const { bid_id } = await req.json()
  if (!bid_id) return NextResponse.json({ error: 'Bid ID required' }, { status: 400 })

  await supabase.from('bids').update({ status: 'rejected' }).eq('id', bid_id)

  return NextResponse.json({ success: true })
}

module.exports = { POST }

