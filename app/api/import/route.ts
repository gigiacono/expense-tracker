import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// Client con privilegi admin per insert
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Nota: per ora l'API è aperta. In futuro aggiungere autenticazione utente.

    // Leggi le transazioni dal body
    const transactions = await request.json()

    if (!Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Body deve essere un array di transazioni' },
        { status: 400 }
      )
    }

    console.log(`📥 Ricevute ${transactions.length} transazioni da importare`)

    // Insert con upsert per evitare duplicati
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .upsert(transactions, {
        onConflict: 'revolut_id',
        ignoreDuplicates: true
      })
      .select()

    if (error) {
      console.error('❌ Errore insert:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const imported = data?.length || 0
    const skipped = transactions.length - imported

    console.log(`✅ Importate: ${imported}, Saltate (duplicati): ${skipped}`)

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: transactions.length
    })

  } catch (error: any) {
    console.error('❌ Errore API:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
