import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  const amount = '10.50'
  const description = 'Test'
  const type = 'expense'
  const date = new Date().toISOString()
  
  const finalAmount = parseFloat(amount.replace(',', '.'))
  console.log('Inserting with amount:', finalAmount)

  const { data, error } = await supabase.from('transactions').insert({
    description: description.trim() || 'Nuova transazione',
    amount: type === 'expense' ? -Math.abs(finalAmount) : Math.abs(finalAmount),
    date: date,
    type: type,
    category_id: null,
    is_manual: true,
    is_recurring: false,
    currency: 'EUR'
  })

  console.log(error ? 'Error: ' + error.message : 'Success')
}

test()
