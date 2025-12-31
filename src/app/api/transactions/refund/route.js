const { NextResponse } = require('next/server')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function POST(req) {
  const { transaction_id } = await req.json()
  if (!transaction_id) return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })

  // Mark transaction as refunded
  await supabase.from('transactions').update({ status: 'refunded' }).eq('id', transaction_id)

  // Optionally revert job status to assigned
  const { data: transaction } = await supabase.from('transactions').select('job_id').eq('id', transaction_id).single()
  if (transaction) {
    await supabase.from('jobs').update({ status: 'assigned' }).eq('id', transaction.job_id)
  }

  return NextResponse.json({ success: true })
}

module.exports = { POST }
