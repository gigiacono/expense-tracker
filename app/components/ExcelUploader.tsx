'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { Category, RevolutTransaction } from '@/lib/types'

type ParsedTransaction = {
    date: string
    description: string
    amount: number
    currency: string
    type: 'expense' | 'income'
    revolut_id: string
}

type ExcelUploaderProps = {
    categories: Category[]
    onImportComplete: () => void
}

export default function ExcelUploader({ categories, onImportComplete }: ExcelUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [parsedData, setParsedData] = useState<ParsedTransaction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [importResult, setImportResult] = useState<{ imported: number, skipped: number } | null>(null)

    const parseExcelFile = useCallback((file: File) => {
        setIsLoading(true)
        setError(null)
        setParsedData([])
        setImportResult(null)

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })

                // Prendi il primo foglio
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]

                // Converti in JSON
                const jsonData = XLSX.utils.sheet_to_json<RevolutTransaction>(worksheet)

                console.log('📊 Righe trovate nel file:', jsonData.length)
                console.log('📄 Prima riga:', jsonData[0])
                console.log('🔑 Colonne trovate:', jsonData.length > 0 ? Object.keys(jsonData[0]) : 'nessuna')

                if (jsonData.length === 0) {
                    setError('Il file sembra vuoto o non contiene dati validi.')
                    setIsLoading(false)
                    return
                }

                // Mappa al nostro formato - supporta sia colonne in italiano che inglese
                const transactions: ParsedTransaction[] = jsonData
                    .filter(row => {
                        // Controlla State in inglese o italiano (COMPLETED/COMPLETATO)
                        const state = (row.State || '').toString().toUpperCase()
                        const hasAmount = row.Amount !== undefined || row.Importo !== undefined
                        const isCompleted = state === 'COMPLETED' || state === 'COMPLETATO'
                        console.log(`🔍 Riga: state="${state}", hasAmount=${hasAmount}, isCompleted=${isCompleted}`)
                        return isCompleted && hasAmount
                    })
                    .map((row) => {
                        // Supporta sia nomi inglesi che italiani
                        const amount = Number(row.Amount ?? row.Importo ?? 0)
                        const date = row['Completed Date'] || row['Data di completamento'] ||
                            row['Started Date'] || row['Data di inizio'] || ''
                        const description = row.Description || row.Descrizione || 'Nessuna descrizione'
                        const currency = row.Currency || row.Valuta || 'EUR'

                        // Crea un ID deterministico BASATO SUL TIMESTAMP COMPLETO (Data + Ora)
                        // L'orario è cruciale per distinguere transazioni identiche nello stesso giorno
                        const timestamp = new Date(date).getTime()
                        const dateStr = new Date(date).toISOString().split('T')[0]
                        const amountStr = Math.abs(amount * 100).toFixed(0)
                        const balanceStr = (row.Balance || row.Saldo) ? Math.abs(Number(row.Balance || row.Saldo) * 100).toFixed(0) : '0'
                        const descHash = description.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()

                        // ID univoco: stamp + importo + saldo + descrizione
                        const revolutId = `rev_${timestamp}_${amountStr}_${balanceStr}_${descHash}`

                        return {
                            date: dateStr,
                            description: description,
                            amount: Math.abs(amount),
                            currency: currency,
                            type: amount < 0 ? 'expense' : 'income' as 'expense' | 'income',
                            revolut_id: revolutId
                        }
                    })

                console.log('✅ Transazioni valide:', transactions.length)

                if (transactions.length === 0) {
                    setError(`Nessuna transazione valida trovata. Verifica che il file contenga transazioni con stato COMPLETATO. Righe totali nel file: ${jsonData.length}`)
                }

                setParsedData(transactions)
            } catch (err: any) {
                console.error('❌ Errore parsing:', err)
                setError(`Errore nel parsing del file: ${err.message}`)
            } finally {
                setIsLoading(false)
            }
        }
        reader.onerror = () => {
            setError('Errore nella lettura del file')
            setIsLoading(false)
        }
        reader.readAsArrayBuffer(file)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
            parseExcelFile(file)
        } else {
            setError('Per favore carica un file Excel (.xlsx, .xls) o CSV')
        }
    }, [parseExcelFile])

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            parseExcelFile(file)
        }
    }, [parseExcelFile])

    const handleImport = async () => {
        if (parsedData.length === 0) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'test-key-123'
                },
                body: JSON.stringify(parsedData)
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Errore durante l\'import')
            }

            setImportResult({ imported: result.imported, skipped: result.skipped })
            setParsedData([])
            onImportComplete()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                📤 Import Excel Revolut
            </h2>

            {/* Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
          ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
            >
                <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileInput}
                    className="hidden"
                    id="excel-input"
                />
                <label htmlFor="excel-input" className="cursor-pointer">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="text-gray-600">
                        Trascina qui il tuo file Excel Revolut
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        oppure clicca per selezionare (.xlsx, .xls, .csv)
                    </p>
                </label>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="mt-4 text-center text-gray-600">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="ml-2">Elaborazione in corso...</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    ❌ {error}
                </div>
            )}

            {/* Import Result */}
            {importResult && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                    ✅ Import completato! {importResult.imported} transazioni importate, {importResult.skipped} duplicate saltate.
                </div>
            )}

            {/* Preview */}
            {parsedData.length > 0 && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-900">
                            Anteprima ({parsedData.length} transazioni)
                        </h3>
                        <button
                            onClick={handleImport}
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            Importa Transazioni
                        </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left">Data</th>
                                    <th className="px-3 py-2 text-left">Descrizione</th>
                                    <th className="px-3 py-2 text-right">Importo</th>
                                    <th className="px-3 py-2 text-center">Tipo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {parsedData.slice(0, 20).map((t, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-3 py-2">{new Date(t.date).toLocaleDateString('it-IT')}</td>
                                        <td className="px-3 py-2 truncate max-w-[200px]">{t.description}</td>
                                        <td className={`px-3 py-2 text-right font-medium ${t.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                                            {t.type === 'expense' ? '-' : '+'}€{t.amount.toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs ${t.type === 'expense' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {t.type === 'expense' ? 'Spesa' : 'Entrata'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {parsedData.length > 20 && (
                            <div className="text-center py-2 text-gray-500 text-sm bg-gray-50">
                                ... e altre {parsedData.length - 20} transazioni
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
