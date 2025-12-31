const { NextResponse } = require('next/server')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function GET(req) {
  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'json' // json or csv

  const { data, error } = await supabase.from('transactions').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (format === 'csv') {
    const csv = [
      Object.keys(data[0] || {}).join(','), // headers
      ...data.map(row => Object.values(row).join(',')) // rows
    ].join('\n')
    return new Response(csv, { headers: { 'Content-Type': 'text/csv' } })
  }

  return NextResponse.json(data)
}

module.exports = { GET }
