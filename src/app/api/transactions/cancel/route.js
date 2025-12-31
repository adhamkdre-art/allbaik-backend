const { NextResponse } = require('next/server')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function POST(req) {
  const { transaction_id } = await req.json()
  if (!transaction_id) return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })

  // Only pending transactions can be cancelled
  const { data: transaction } = await supabase.from('transactions').select('job_id, status').eq('id', transaction_id).single()
  if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  if (transaction.status !== 'pending') return NextResponse.json({ error: 'Only pending transactions can be cancelled' }, { status: 400 })

  await supabase.from('transactions').update({ status: 'cancelled' }).eq('id', transaction_id)
  await supabase.from('jobs').update({ status: 'assigned' }).eq('id', transaction.job_id)

  return NextResponse.json({ success: true })
}

module.exports = { POST }
