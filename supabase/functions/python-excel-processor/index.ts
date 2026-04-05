// @ts-nocheck
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { unzip } from "https://deno.land/x/zip@v1.2.5/mod.ts"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const requestSchema = z.object({
  fileData: z.string().min(1).max(50000000), // Max ~50MB base64
  fileName: z.string().min(1).max(255),
  userId: z.string().uuid()
})

// Get AI API keys from environment
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(sentryServe("python-excel-processor", async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json()
    const { fileData, fileName, userId } = requestSchema.parse(body)
    
    console.log(`🤖 AI EXCEL PROCESSOR: ${fileName} for user: ${userId}`)
    console.log(`🔑 API KEYS AVAILABLE: Groq=${!!GROQ_API_KEY}, OpenAI=${!!OPENAI_API_KEY}`)

    // Decode base64 file data
    const fileBytes = Uint8Array.from(atob(fileData), c => c.charCodeAt(0))
    
    console.log(`📄 FILE SIZE: ${fileBytes.length} bytes`)

    // Process with proper Excel parsing
    const processedData = await processExcelWithAI(fileBytes, fileName)
    
    console.log(`✅ PROCESSING COMPLETE: ${JSON.stringify(processedData)}`)

    return new Response(
      JSON.stringify(processedData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )

  } catch (error) {
    console.error('❌ PROCESSING ERROR:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        revenue: 0,
        expenses: 0,
        profit: 0,
        confidence: 0,
        summary: `Failed to process ${fileName || 'file'}: ${error.message}`
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
}));

// Process Excel with proper ZIP decompression and XML parsing
async function processExcelWithAI(fileBytes: Uint8Array, fileName: string) {
  console.log(`🤖 AI EXCEL PROCESSOR: Analyzing ${fileName} with proper Excel parsing`)
  
  try {
    // Extract actual Excel data using proper ZIP decompression
    const excelData = await extractExcelData(fileBytes)
    console.log(`📊 EXTRACTED EXCEL DATA: ${excelData.rows.length} rows, ${excelData.cells.length} cells`)
    
    // Create structured financial data for AI analysis
    const structuredData = {
      fileName,
      worksheetData: excelData,
      financialMetrics: identifyFinancialMetrics(excelData)
    }
    
    // Try AI analysis first if API keys are available
    if (GROQ_API_KEY || OPENAI_API_KEY) {
      console.log('🚀 TRYING AI ANALYSIS...')
      try {
        const aiResult = await analyzeWithAI(structuredData, fileName)
        console.log(`✅ AI ANALYSIS COMPLETE: ${JSON.stringify(aiResult)}`)
        return aiResult
      } catch (aiError) {
        console.error('AI Analysis failed:', aiError.message)
      }
    }
    
    // Fallback to pattern analysis on real data
    console.log('🔄 FALLING BACK TO PATTERN ANALYSIS')
    const fallbackResult = analyzeFinancialPatterns(excelData, fileName)
    console.log(`🎯 FINAL RESULT: ${JSON.stringify(fallbackResult)}`)
    return fallbackResult
    
  } catch (error) {
    console.error('Processing error:', error)
    throw new Error(`Failed to process Excel file: ${error.message}`)
  }
}

// Extract actual Excel data using proper ZIP decompression and XML parsing
async function extractExcelData(fileBytes: Uint8Array) {
  console.log('📂 EXTRACTING EXCEL DATA FROM ZIP...')
  
  try {
    // Create a temporary file for unzipping
    const tempFile = await Deno.makeTempFile({ suffix: '.xlsx' })
    await Deno.writeFile(tempFile, fileBytes)
    
    // Unzip the Excel file
    const zipContent = await unzip(tempFile)
    
    // Clean up temp file
    await Deno.remove(tempFile)
    
    // Extract worksheet XML
    const worksheetXml = zipContent['xl/worksheets/sheet1.xml']
    if (!worksheetXml) {
      throw new Error('No worksheet found in Excel file')
    }
    
    // Extract shared strings if available
    const sharedStringsXml = zipContent['xl/sharedStrings.xml'] || new Uint8Array()
    
    // Parse the XML to extract cell data
    const cellData = parseWorksheetXml(
      new TextDecoder().decode(worksheetXml), 
      new TextDecoder().decode(sharedStringsXml)
    )
    
    console.log(`📋 PARSED ${cellData.cells.length} cells from worksheet`)
    return cellData
    
  } catch (error) {
    console.error('ZIP extraction failed:', error)
    throw new Error(`Failed to extract Excel data: ${error.message}`)
  }
}

// Parse worksheet XML to extract actual cell values
function parseWorksheetXml(worksheetXml: string, sharedStringsXml: string) {
  const cells: Array<{row: number, col: string, value: string, type: string}> = []
  const rows: Array<{row: number, cells: string[]}> = []
  
  // Extract shared strings for text references
  const sharedStrings: string[] = []
  if (sharedStringsXml) {
    const stringMatches = sharedStringsXml.match(/<t[^>]*>([^<]*)<\/t>/g) || []
    sharedStrings.push(...stringMatches.map(match => match.replace(/<\/?t[^>]*>/g, '')))
  }
  
  // Extract cell data from worksheet
  const cellMatches = worksheetXml.match(/<c[^>]*>.*?<\/c>/g) || []
  
  cellMatches.forEach(cellXml => {
    const refMatch = cellXml.match(/r="([A-Z]+)(\d+)"/)
    const typeMatch = cellXml.match(/t="([^"]*)"/)
    const valueMatch = cellXml.match(/<v>([^<]*)<\/v>/)
    
    if (refMatch && valueMatch) {
      const col = refMatch[1]
      const row = parseInt(refMatch[2])
      const type = typeMatch ? typeMatch[1] : 'n'
      let value = valueMatch[1]
      
      // If it's a shared string reference, get the actual string
      if (type === 's' && sharedStrings[parseInt(value)]) {
        value = sharedStrings[parseInt(value)]
      }
      
      cells.push({ row, col, value, type })
    }
  })
  
  // Group cells by row
  const rowMap = new Map<number, string[]>()
  cells.forEach(cell => {
    if (!rowMap.has(cell.row)) {
      rowMap.set(cell.row, [])
    }
    rowMap.get(cell.row)!.push(`${cell.col}: ${cell.value}`)
  })
  
  rowMap.forEach((cellValues, rowNum) => {
    rows.push({ row: rowNum, cells: cellValues })
  })
  
  return { cells, rows: rows.sort((a, b) => a.row - b.row) }
}

// Identify financial metrics from extracted Excel data
function identifyFinancialMetrics(excelData: any) {
  const financialKeywords = {
    revenue: /\b(revenue|sales|income|earnings|turnover|receipts)\b/i,
    expenses: /\b(expense|cost|expenditure|outgoing|disbursement|spending)\b/i,
    profit: /\b(profit|net\s*income|earnings|margin|surplus)\b/i,
    loss: /\b(loss|deficit|shortfall)\b/i
  }
  
  const metrics: any = {
    revenueRows: [],
    expenseRows: [],
    profitRows: [],
    numbers: []
  }
  
  excelData.rows.forEach((row: any) => {
    const rowText = row.cells.join(' ').toLowerCase()
    
    if (financialKeywords.revenue.test(rowText)) {
      metrics.revenueRows.push(row)
    }
    if (financialKeywords.expenses.test(rowText)) {
      metrics.expenseRows.push(row)
    }
    if (financialKeywords.profit.test(rowText)) {
      metrics.profitRows.push(row)
    }
    
    // Extract numbers from row
    const numbers = rowText.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/g) || []
    metrics.numbers.push(...numbers.map((n: string) => parseFloat(n.replace(/,/g, ''))).filter((n: number) => !isNaN(n) && n > 0))
  })
  
  return metrics
}

// AI Analysis wrapper with proper Excel data
async function analyzeWithAI(structuredData: any, fileName: string) {
  const prompt = createFinancialAnalysisPrompt(structuredData, fileName)
  
  if (GROQ_API_KEY) {
    return await callGroqAPI(prompt)
  } else if (OPENAI_API_KEY) {
    return await callOpenAIAPI(prompt)
  } else {
    throw new Error('No AI API keys available')
  }
}

// Create detailed prompt for financial analysis with real Excel data
function createFinancialAnalysisPrompt(data: any, fileName: string): string {
  const { worksheetData, financialMetrics } = data
  
  return `You are a financial analyst AI. Analyze this Excel spreadsheet data and extract key financial metrics.

File: ${fileName}

Excel Worksheet Data:
Rows: ${worksheetData.rows.length}
Sample rows:
${worksheetData.rows.slice(0, 15).map((r: any) => `Row ${r.row}: ${r.cells.join(' | ')}`).join('\n')}

Financial Metrics Identified:
Revenue-related rows: ${financialMetrics.revenueRows.length}
Expense-related rows: ${financialMetrics.expenseRows.length}
Profit-related rows: ${financialMetrics.profitRows.length}
Numbers found: ${financialMetrics.numbers.slice(0, 20).join(', ')}

Task: Extract the following financial metrics from this REAL Excel data:
1. Total Revenue/Sales (annual or most recent period)
2. Total Expenses/Costs 
3. Net Profit/Loss
4. Confidence level (0-100%) in your analysis

Requirements:
- Analyze the actual cell values and row structure
- Look for clear financial statement patterns
- Identify the largest/most significant numbers as likely totals
- Be conservative with confidence if data structure is unclear
- Return actual numbers from the spreadsheet

Respond with ONLY a valid JSON object in this exact format:
{
  "revenue": <number>,
  "expenses": <number>, 
  "profit": <number>,
  "confidence": <number 0-100>,
  "summary": "<brief explanation of what you found>",
  "processing_method": "ai_analysis",
  "model": "<model_name>"
}`
}

// Call Groq API for AI analysis
async function callGroqAPI(prompt: string) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst AI. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    })

    if (!response.ok) {
      console.error(`Groq API error: ${response.status}`)
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) throw new Error('No response from Groq')
    
    // Parse AI response
    const aiResult = JSON.parse(content)
    return {
      ...aiResult,
      processing_method: "groq_ai_analysis",
      model: "llama-3.1-70b-versatile"
    }
    
  } catch (error) {
    console.error('Groq API call failed:', error)
    throw error
  }
}

// Call OpenAI API for AI analysis
async function callOpenAIAPI(prompt: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst AI. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    })

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status}`)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) throw new Error('No response from OpenAI')
    
    // Parse AI response
    const aiResult = JSON.parse(content)
    return {
      ...aiResult,
      processing_method: "openai_gpt_analysis",
      model: "gpt-4o-mini"
    }
    
  } catch (error) {
    console.error('OpenAI API call failed:', error)
    throw error
  }
}

// Analyze financial patterns from properly extracted Excel data
function analyzeFinancialPatterns(excelData: any, fileName: string) {
  console.log(`🔍 PATTERN ANALYSIS: ${fileName}`)
  
  const { cells, rows } = excelData
  const numbers: number[] = []
  const financialData: any = {
    revenues: [],
    expenses: [],
    profits: [],
    totals: []
  }
  
  // Extract all numeric values from cells
  cells.forEach((cell: any) => {
    if (cell.type === 'n' || (!isNaN(parseFloat(cell.value)) && isFinite(parseFloat(cell.value)))) {
      const num = parseFloat(cell.value)
      if (num > 0) {
        numbers.push(num)
        console.log(`💰 FOUND NUMBER: ${num} in ${cell.col}${cell.row}`)
      }
    }
  })
  
  // Analyze rows for financial keywords and associated numbers
  rows.forEach((row: any) => {
    const rowText = row.cells.join(' ').toLowerCase()
    const rowNumbers = rowText.match(/\b\d+(?:\.\d{2})?\b/g) || []
    const nums = rowNumbers.map((n: string) => parseFloat(n)).filter((n: number) => !isNaN(n) && n > 0)
    
    if (nums.length > 0) {
      const maxNum = Math.max(...nums)
      
      if (/\b(revenue|sales|income|earnings|turnover)\b/i.test(rowText)) {
        financialData.revenues.push(maxNum)
        console.log(`💚 REVENUE FOUND: ${maxNum} in row ${row.row}`)
      } else if (/\b(expense|cost|expenditure|outgoing|spending)\b/i.test(rowText)) {
        financialData.expenses.push(maxNum)
        console.log(`💸 EXPENSE FOUND: ${maxNum} in row ${row.row}`)
      } else if (/\b(profit|net\s*income|earnings|margin)\b/i.test(rowText)) {
        financialData.profits.push(maxNum)
        console.log(`💎 PROFIT FOUND: ${maxNum} in row ${row.row}`)
      } else if (/\b(total|sum|subtotal)\b/i.test(rowText)) {
        financialData.totals.push(maxNum)
        console.log(`🎯 TOTAL FOUND: ${maxNum} in row ${row.row}`)
      }
    }
  })
  
  // Determine final values
  let revenue = 0
  let expenses = 0
  let profit = 0
  let confidence = 60
  
  // Use explicitly identified financial data
  if (financialData.revenues.length > 0) {
    revenue = Math.max(...financialData.revenues)
    confidence += 20
  } else if (financialData.totals.length > 0) {
    revenue = Math.max(...financialData.totals)
  } else if (numbers.length > 0) {
    revenue = Math.max(...numbers)
  }
  
  if (financialData.expenses.length > 0) {
    expenses = Math.max(...financialData.expenses)
    confidence += 20
  } else if (numbers.length > 1) {
    // Find second largest number as expenses
    const sortedNumbers = [...numbers].sort((a, b) => b - a)
    expenses = sortedNumbers[1] || 0
  }
  
  if (financialData.profits.length > 0) {
    profit = Math.max(...financialData.profits)
    confidence += 20
  } else {
    profit = revenue - expenses
  }
  
  const result = {
    revenue,
    expenses,
    profit,
    confidence: Math.min(confidence, 95),
    summary: `Analyzed ${fileName}: Found ${numbers.length} numbers, ${financialData.revenues.length} revenue entries, ${financialData.expenses.length} expense entries. Revenue: ${revenue}, Expenses: ${expenses}, Profit: ${profit}.`,
    processing_method: "pattern_analysis",
    numbers_found: numbers.length,
    revenue_entries: financialData.revenues.length,
    expense_entries: financialData.expenses.length,
    cells_processed: cells.length
  }
  
  console.log(`✅ PATTERN ANALYSIS COMPLETE: ${JSON.stringify(result)}`)
  return result
}