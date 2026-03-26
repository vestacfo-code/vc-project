// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Multi-format document processor using OpenAI GPT-5
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== OPENAI UNIFIED DOCUMENT ANALYSIS START ===');
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY not found');
      return new Response(JSON.stringify({ 
        error: 'OPENAI_API_KEY not configured',
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        cashFlow: 0,
        healthScore: 0
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { fileContent, fileName, fileType, userId, documentId } = await req.json();
    console.log('📄 Processing:', fileName, 'Type:', fileType, 'User:', userId);
    console.log("fileContent", fileContent)
    if (!fileContent || !fileName) {
      return new Response(JSON.stringify({ 
        error: 'Missing required data',
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        cashFlow: 0,
        healthScore: 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Detect file type and extract structured data
    const fileExtension = '.' + fileName.split('.').pop()?.toLowerCase();
    console.log('🔍 File extension detected:', fileExtension);
    
    let extractedData: string;
    let processingMethod: string;
    
    try {
      switch (fileExtension) {
        case '.xlsx':
        case '.xls':
          console.log('📊 Processing Excel file...');
          const result = await processExcelFile(fileContent, fileName);
          extractedData = result.data;
          processingMethod = result.method;
          break;
          
        case '.pdf':
          console.log('📄 Processing PDF file...');
          extractedData = extractTextFromPDF(fileContent);
          processingMethod = 'PDF text extraction';
          break;
          
        case '.csv':
          console.log('📈 Processing CSV file...');
          extractedData = await processCSVFile(fileContent);
          processingMethod = 'CSV parsing';
          break;
          
        case '.json':
          console.log('🔗 Processing JSON file...');
          extractedData = await processJSONFile(fileContent);
          processingMethod = 'JSON parsing';
          break;
          
        case '.xml':
          console.log('📋 Processing XML file...');
          extractedData = await processXMLFile(fileContent);
          processingMethod = 'XML parsing';
          break;
          
        case '.txt':
          console.log('📝 Processing text file...');
          extractedData = fileContent;
          processingMethod = 'Plain text';
          break;
          
        case '.png':
        case '.jpg':
        case '.jpeg':
          console.log('🖼️ Processing image file with OCR...');
          extractedData = await processImageWithOCR(fileContent, fileName);
          processingMethod = 'OCR extraction';
          break;
          
        default:
          console.log('📄 Unknown file type, treating as text...');
          extractedData = fileContent;
          processingMethod = 'Raw content';
          break;
      }
      
      console.log('📝 Extracted data length:', extractedData.length);
      console.log('📝 Processing method:', processingMethod);
      
      if (extractedData.length < 10) {
        console.log('⚠️ Insufficient data extracted');
        return new Response(JSON.stringify({
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          cashFlow: 0,
          healthScore: 15,
          reasoning: {
            dataSource: processingMethod,
            confidence: "very low",
            notes: `Could not extract meaningful data from "${fileName}". Please check file format or try a different file type.`
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Get user context for better analysis
      let userContext = '';
      if (userId) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_name, industry, business_type')
            .eq('user_id', userId)
            .single();
          
          if (profile) {
            userContext = `Company: ${profile.company_name || 'Unknown'}, Industry: ${profile.industry || 'Unknown'}, Type: ${profile.business_type || 'Unknown'}`;
          }
        } catch (err) {
          console.log('⚠️ Could not fetch user profile:', err);
        }
      }
      
      // Call OpenAI GPT-5 for financial analysis
      console.log('🤖 Calling OpenAI GPT-5 for comprehensive financial analysis...');
      
      const analysis = await callOpenAIForAnalysis(extractedData, fileName, processingMethod, userContext);
      
      // Store the analysis if documentId is provided
      if (documentId && analysis) {
        try {
          console.log('💾 Storing analysis results in database...');
          const updateData: any = {
            metadata: {
              ...((await supabase.from('documents').select('metadata').eq('id', documentId).single()).data?.metadata || {}),
              openai_analysis: analysis,
              processing_method: processingMethod,
              analyzed_at: new Date().toISOString()
            }
          };
          
          // Save markdown content for CSV and Excel files
          if ((fileExtension === '.csv' || fileExtension === '.xlsx' || fileExtension === '.xls') && extractedData) {
            console.log(`💾 Saving ${fileExtension.toUpperCase()} markdown content to database...`);
            updateData.markdown_content = extractedData;
          }
          
          await supabase
            .from('documents')
            .update(updateData)
            .eq('id', documentId);
            
          // Store business health score
          if (analysis.healthScore && userId) {
            await supabase
              .from('business_health_scores')
              .insert({
                user_id: userId,
                score: analysis.healthScore,
                factors: {
                  revenue: analysis.totalRevenue,
                  expenses: analysis.totalExpenses,
                  profit: analysis.netProfit,
                  cashFlow: analysis.cashFlow,
                  source: 'openai-analysis'
                },
                ai_explanation: analysis.reasoning?.notes || 'OpenAI financial analysis'
              });
          }

          // CRITICAL: Store financial data in the financial_data table
          if (userId && (analysis.totalRevenue > 0 || analysis.totalExpenses > 0 || analysis.netProfit > 0)) {
            console.log('💰 Inserting financial data into financial_data table...');
            
            // Calculate period dates (use current month as default)
            const today = new Date();
            const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            
            await supabase
              .from('financial_data')
              .insert({
                user_id: userId,
                document_id: documentId,
                revenue: analysis.totalRevenue || 0,
                expenses: analysis.totalExpenses || 0,
                profit: analysis.netProfit || 0,
                cash_flow: analysis.cashFlow || 0,
                period_start: periodStart.toISOString().split('T')[0],
                period_end: periodEnd.toISOString().split('T')[0]
              });
              
            console.log('✅ Financial data inserted successfully');
          }
        } catch (dbError) {
          console.warn('⚠️ Failed to store analysis results:', dbError);
        }
      }
      
      console.log('✅ Analysis completed successfully');
      return new Response(JSON.stringify({
        ...analysis,
        processingMethod,
        source: 'openai-gpt5'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (processingError) {
      console.error('❌ Document processing error:', processingError);
      throw processingError;
    }

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      cashFlow: 0,
      healthScore: 0,
      source: 'openai-error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Enhanced PDF text extraction
function extractTextFromPDF(pdfBase64: string): string {
  try {
    const pdfBytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
    const decoder = new TextDecoder('latin1');
    const pdfStr = decoder.decode(pdfBytes);
    
    let text = '';
    
    // Method 1: Extract text from parentheses (PDF text objects)
    const textRegex = /\(((?:[^()\\]|\\.|\\[0-7]{1,3})*)\)/g;
    let match;
    while ((match = textRegex.exec(pdfStr)) !== null) {
      const textContent = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\(.)/g, '$1');
      
      if (textContent.trim().length > 0) {
        text += textContent + ' ';
      }
    }
    
    // Method 2: Extract from stream objects
    const streamRegex = /stream\s*(.*?)\s*endstream/gs;
    const streamMatches = pdfStr.match(streamRegex);
    
    if (streamMatches) {
      for (const match of streamMatches) {
        const streamContent = match.replace(/^stream\s*/, '').replace(/\s*endstream$/, '');
        const readableChunks = streamContent.match(/[A-Za-z]{2,}[\s\w$,.%-]*[\d$,.%]*/g);
        if (readableChunks) {
          readableChunks.forEach(chunk => {
            if (chunk.length > 3 && !chunk.match(/^[A-Z]{5,}$/)) {
              text += chunk + ' ';
            }
          });
        }
      }
    }
    
    // Method 3: Financial pattern extraction
    const financialPatterns = [
      /(?:revenue|sales|income|gross|total)[\s:]*\$?[\d,.]+[kmb]?/gi,
      /(?:expenses?|costs?|expense|spending)[\s:]*\$?[\d,.]+[kmb]?/gi,
      /(?:profit|loss|margin|earnings|net)[\s:]*\$?[\d,.]+[kmb]?/gi,
      /(?:cash\s*flow|cashflow)[\s:]*\$?[\d,.]+[kmb]?/gi,
      /\$[\s]*[\d,.]+[kmb]?/gi,
    ];
    
    financialPatterns.forEach(pattern => {
      const matches = pdfStr.match(pattern);
      if (matches) {
        text += ' ' + matches.join(' ') + ' ';
      }
    });
    
    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    return '';
  }
}

// Excel file processor with markdown conversion
async function processExcelFile(base64Content: string, fileName: string): Promise<{data: string, method: string}> {
  try {
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const workbook = XLSX.read(bytes, { type: 'array' });
    console.log('📊 Excel workbook loaded:', workbook.SheetNames);
    
    const markdownContent = convertExcelToMarkdown(workbook);
    console.log(`✅ Excel converted to markdown, length: ${markdownContent.length}`);
    
    return {
      data: markdownContent,
      method: `Excel XLSX to markdown (${workbook.SheetNames.length} sheets)`
    };
  } catch (error) {
    console.error('❌ Excel processing error:', error);
    return {
      data: base64Content.substring(0, 1000), // Fallback to raw content
      method: 'Excel processing failed - raw content'
    };
  }
}

// CSV file processor with markdown conversion
async function processCSVFile(csvContent: string): Promise<string> {
  try {
    console.log('🔄 Processing CSV file to markdown...');
    
    // First, decode the base64 content to get actual CSV text
    let decodedCSV = csvContent;
    try {
      decodedCSV = atob(csvContent);
      console.log('✅ Successfully decoded base64 CSV content');
    } catch (decodeError) {
      console.log('⚠️ Content is not base64, treating as plain text');
    }
    
    console.log('📝 Extracted data length:', decodedCSV.length);
    
    const markdownContent = convertCsvToMarkdown(decodedCSV);
    console.log('✅ CSV converted to markdown, length:', markdownContent.length);
    return markdownContent;
  } catch (error) {
    console.error('❌ CSV processing error:', error);
    // Fallback to basic processing
    let fallbackContent = csvContent;
    try {
      fallbackContent = atob(csvContent);
    } catch {}
    
    const lines = fallbackContent.split('\n').filter(line => line.trim());
    let processedData = 'CSV Financial Data:\n';
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        processedData += `Row ${index + 1}: ${line}\n`;
      }
    });
    
    return processedData;
  }
}

// JSON file processor
async function processJSONFile(jsonBase64: string): Promise<string> {
  try {
    const jsonContent = atob(jsonBase64);
    const parsedData = JSON.parse(jsonContent);
    
    return `JSON Financial Data:\n${JSON.stringify(parsedData, null, 2)}`;
  } catch (error) {
    console.error('❌ JSON processing error:', error);
    return jsonBase64.substring(0, 1000);
  }
}

// XML file processor
async function processXMLFile(xmlBase64: string): Promise<string> {
  try {
    const xmlContent = atob(xmlBase64);
    
    // Extract text content from XML
    const textContent = xmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    return `XML Financial Data:\n${textContent}`;
  } catch (error) {
    console.error('❌ XML processing error:', error);
    return xmlBase64.substring(0, 1000);
  }
}

// Image OCR processor (placeholder - could be enhanced with actual OCR service)
async function processImageWithOCR(imageBase64: string, fileName: string): Promise<string> {
  console.log('📸 Image OCR processing not yet implemented, using filename analysis');
  
  // For now, return a placeholder that includes the filename for context
  return `Image file: ${fileName}\nNote: OCR processing would extract text from this image. Consider converting to PDF or uploading a text-based document for better analysis.`;
}

// Call OpenAI GPT-5 for comprehensive financial analysis
async function callOpenAIForAnalysis(
  extractedData: string, 
  fileName: string, 
  processingMethod: string,
  userContext: string
): Promise<any> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const systemPrompt = `You are an expert financial analyst with deep expertise in business financial analysis. Analyze the provided document data and extract comprehensive financial metrics.

CRITICAL: You must respond with ONLY a valid JSON object with this EXACT structure:
{
  "totalRevenue": number,
  "totalExpenses": number,
  "netProfit": number,
  "cashFlow": number,
  "healthScore": number (0-100),
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "riskFactors": ["risk1", "risk2"],
  "reasoning": {
    "dataSource": "string describing what data was found",
    "confidence": "high|medium|low",
    "notes": "detailed explanation of analysis"
  }
}

CRITICAL EXCEL/TABLE ANALYSIS RULES:
1. **ROW-WISE SUMMATION**: When you see financial data in table format (like Excel converted to markdown), each financial category is represented as a ROW with values across multiple columns (typically months/periods).
   - For "Monthly Revenue" row: SUM ALL VALUES across all columns in that row
   - For "Total Expenses" row: SUM ALL VALUES across all columns in that row  
   - For "Net Profit" row: SUM ALL VALUES across all columns in that row
   - DO NOT just take the last value - sum the entire row!

2. **Table Structure Recognition**: 
   - First row often contains period headers (dates, months, etc.)
   - Subsequent rows contain financial categories with values for each period
   - Example: | Monthly Revenue | 8171.57 | 9175.75 | 10179.78 | 16124.13 | ... |
   - This means: totalRevenue = 8171.57 + 9175.75 + 10179.78 + 16124.13 + (all other values)

3. **Financial Category Identification**:
   - Revenue indicators: "Monthly Revenue", "Total Revenue", "Sales", "Income", "Gross Revenue"
   - Expense indicators: "Total Expenses", "Total Cost", "Operating Expenses", "Total Fixed Cost", "Total Variable Costs"
   - Profit indicators: "Net Income", "Net Profit", "Profit/Loss", "Earnings"
   - Cash Flow indicators: "Cash Flow", "Operating Cash Flow", "Free Cash Flow"

4. **Calculation Process**:
   - Identify each financial category row
   - Sum ALL numeric values in that row (skip text/header columns)
   - Remove commas, quotes, and currency symbols before summing
   - Handle negative values correctly

Analysis Guidelines:
- Handle quoted monetary values like " $750,000.00 " by removing quotes and spaces
- Calculate netProfit as revenue minus expenses if not explicitly stated
- Estimate cashFlow from available data (consider depreciation, working capital changes)
- Calculate healthScore 0-100 based on profitability, liquidity, efficiency ratios
- Provide 3 actionable insights about the business performance  
- Give 3 specific recommendations for improvement
- Identify 2 key risk factors
- Be conservative with estimates - use 0 if you can't find reliable data
- Consider industry context and business size in your analysis
- Pay special attention to CSV format with quoted values and markdown table format`;

    const userPrompt = `Analyze this financial document:

File: ${fileName}
Processing Method: ${processingMethod}
${userContext ? `Business Context: ${userContext}` : ''}

Document Content:
${extractedData.substring(0, 8000)}

Extract all financial metrics, calculate ratios, and provide comprehensive business analysis. Focus on:
- Revenue streams and growth trends
- Cost structure and expense categories  
- Profitability margins and efficiency
- Cash flow patterns and liquidity
- Financial health indicators
- Business performance benchmarks

Return only the JSON object with numerical values and analysis.`;

    console.log(`🤖 SENDING TO OPENAI - Data Length: ${extractedData.length}, Truncated to: 8000`);
    console.log(`📄 FIRST 500 CHARS OF MARKDOWN SENT TO AI: "${extractedData.substring(0, 500)}"`);
    console.log(`📄 LAST 500 CHARS OF DATA: "${extractedData.substring(Math.max(0, extractedData.length - 500))}"`);
    console.log('🤖 Calling OpenAI GPT-5 for comprehensive financial analysis...');
    
    console.log('🤖 COMPLETE OPENAI REQUEST PAYLOAD:');
    console.log('🤖 System Prompt:', systemPrompt.substring(0, 200) + '...');
    console.log('🤖 User Prompt:', userPrompt.substring(0, 1000) + (userPrompt.length > 1000 ? '...' : ''));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07', // Use GPT-5 for maximum accuracy
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 2000,
        response_format: { type: "json_object" } // Ensure JSON response
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('🤖 OpenAI GPT-5 response received');
    
    if (content) {
      try {
        const analysis = JSON.parse(content);
        
        // Validate required fields
        if (typeof analysis.totalRevenue === 'number' && 
            typeof analysis.healthScore === 'number') {
          console.log('✅ Valid analysis received from GPT-5');
          return analysis;
        } else {
          console.warn('⚠️ Invalid analysis structure from GPT-5');
        }
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.log('Raw response:', content);
      }
    }
    
    // Fallback response with smart extraction
    return generateFallbackAnalysis(fileName, processingMethod, extractedData);
    
  } catch (error) {
    console.error('❌ OpenAI analysis error:', error);
    return generateFallbackAnalysis(fileName, processingMethod, extractedData);
  }
}

// Convert Excel workbook to markdown format
function convertExcelToMarkdown(workbook: any): string {
  try {
    console.log('📊 Converting Excel to markdown format...');
    
    let markdownContent = '# Financial Data\n\n';
    let totalTables = 0;
    
    workbook.SheetNames.forEach((sheetName: string) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      console.log(`📄 Processing sheet "${sheetName}" with ${jsonData.length} rows`);
      
      if (jsonData.length === 0) {
        markdownContent += `## Sheet: ${sheetName}\n\nNo data found in this sheet.\n\n`;
        return;
      }
      
      // Filter out completely empty rows
      const filteredRows = jsonData.filter((row: any[]) => 
        Array.isArray(row) && row.some(cell => cell !== '' && cell != null)
      );
      
      if (filteredRows.length === 0) {
        markdownContent += `## Sheet: ${sheetName}\n\nNo data found in this sheet.\n\n`;
        return;
      }
      
      markdownContent += `## Sheet: ${sheetName}\n\n`;
      
      // Find the maximum number of columns
      const maxCols = Math.max(...filteredRows.map((row: any[]) => row.length));
      
      // Pad all rows to have the same number of columns
      const paddedRows = filteredRows.map((row: any[]) => {
        const paddedRow = [...row];
        while (paddedRow.length < maxCols) {
          paddedRow.push('');
        }
        return paddedRow.map(cell => String(cell || '').trim());
      });
      
      if (paddedRows.length > 0) {
        // Create table headers (use first row or generate generic headers)
        const headers = paddedRows[0].some(cell => cell !== '') 
          ? paddedRows[0] 
          : Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
        
        markdownContent += '| ' + headers.join(' | ') + ' |\n';
        
        // Create separator row
        markdownContent += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
        
        // Add data rows (skip header row if it contained actual headers)
        const dataStartIndex = paddedRows[0].some(cell => cell !== '') ? 1 : 0;
        for (let i = dataStartIndex; i < paddedRows.length; i++) {
          const row = paddedRows[i];
          if (row.some(cell => cell.trim())) { // Only add non-empty rows
            markdownContent += '| ' + row.join(' | ') + ' |\n';
          }
        }
        
        markdownContent += '\n';
        totalTables++;
      }
    });
    
    if (totalTables === 0) {
      markdownContent += 'No data tables found in the Excel file.\n';
    }
    
    console.log(`✅ Excel successfully converted to markdown with ${totalTables} tables`);
    return markdownContent;
    
  } catch (error) {
    console.error('❌ Excel to markdown conversion error:', error);
    return `# Excel Processing Error\n\nError converting Excel to markdown: ${error.message}`;
  }
}

// Convert CSV content to markdown table format
function convertCsvToMarkdown(csvContent: string): string {
  try {
    console.log('📊 Converting CSV to markdown table...');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return '# Empty CSV File\n\nNo data found in the CSV file.';
    }
    
    // Parse CSV rows (handle quoted fields)
    const parseCSVRow = (line: string): string[] => {
      const cells = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim());
      return cells;
    };
    
    const rows = lines.map(parseCSVRow);
    
    if (rows.length === 0) {
      return '# Invalid CSV Format\n\nCould not parse CSV data.';
    }
    
    // Find the maximum number of columns
    const maxCols = Math.max(...rows.map(row => row.length));
    
    // Pad all rows to have the same number of columns
    const paddedRows = rows.map(row => {
      while (row.length < maxCols) {
        row.push('');
      }
      return row;
    });
    
    // Create markdown table
    let markdown = '# Financial Data\n\n';
    
    if (paddedRows.length > 0) {
      // Create table headers
      const headers = paddedRows[0];
      markdown += '| ' + headers.join(' | ') + ' |\n';
      
      // Create separator row
      markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
      
      // Add data rows (skip header row)
      for (let i = 1; i < paddedRows.length; i++) {
        const row = paddedRows[i];
        if (row.some(cell => cell.trim())) { // Only add non-empty rows
          markdown += '| ' + row.join(' | ') + ' |\n';
        }
      }
    }
    
    console.log('✅ CSV successfully converted to markdown');
    return markdown;
    
  } catch (error) {
    console.error('❌ CSV to markdown conversion error:', error);
    return `# CSV Processing Error\n\nError converting CSV to markdown: ${error.message}\n\nRaw content:\n\`\`\`\n${csvContent}\n\`\`\``;
  }
}

// Generate fallback analysis when OpenAI fails - with smart extraction
function generateFallbackAnalysis(fileName: string, processingMethod: string, extractedData?: string) {
  console.log('🔄 Generating fallback analysis with smart extraction...');
  
  // Try to extract financial numbers from the content
  let totalRevenue = 0;
  let totalExpenses = 0;
  let netProfit = 0;
  let cashFlow = 0;
  
  if (extractedData) {
    console.log('🔍 Attempting to extract financial values from markdown content...');
    
    console.log(`📄 Processing text content (length: ${extractedData.length})`);
    console.log(`📝 First 2000 chars: "${extractedData.substring(0, 2000)}"`);
    console.log(`📝 EXPENSE SEARCH - Looking for lines with: expense, cost, salaries, payroll, cogs`);
    
    // Show all lines that contain expense-related keywords
    const expenseLines = extractedData.split('\n').filter(line => 
      /expense|cost|salaries|payroll|cogs|operating|admin|marketing|rent|utilities/i.test(line)
    );
    console.log(`📝 FOUND ${expenseLines.length} EXPENSE-RELATED LINES:`);
    expenseLines.forEach((line, idx) => {
      console.log(`📝 Expense Line ${idx + 1}: "${line}"`);
    });
    // Process line by line to find exact matches for both CSV and Excel table formats
    const lines = extractedData.split('\n');
    console.log(`📄 Total lines to process: ${lines.length}`);
    
    // First, detect document layout: horizontal (revenue across columns) vs vertical (revenue down columns)
    let layoutType = 'unknown';
    let revenueColumnIndex = -1;
    let expenseColumnIndex = -1;
    
    // Scan for table headers to determine orientation
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const line = lines[i];
      if (line.includes('|') && (/revenue|income/i.test(line) || /expense|cost/i.test(line))) {
        const cells = line.split('|').map(cell => cell.trim().toLowerCase());
        
        // Check if this looks like a header row (vertical layout)
        for (let j = 0; j < cells.length; j++) {
          if (/^(total\s+)?revenue$/i.test(cells[j]) || /^(net\s+)?income$/i.test(cells[j])) {
            layoutType = 'vertical';
            revenueColumnIndex = j;
            console.log(`📐 DETECTED VERTICAL LAYOUT: Revenue in column ${j} ("${cells[j]}")`);
          }
          if (/^(total\s+)?expense/i.test(cells[j]) || /^(operating\s+)?cost/i.test(cells[j])) {
            layoutType = 'vertical';
            expenseColumnIndex = j;
            console.log(`📐 DETECTED VERTICAL LAYOUT: Expenses in column ${j} ("${cells[j]}")`);
          }
        }
        
        // Check if this looks like a data row (horizontal layout)
        if (layoutType === 'unknown' && (/monthly\s+revenue/i.test(line) || /monthly\s+expenses/i.test(line))) {
          layoutType = 'horizontal';
          console.log(`📐 DETECTED HORIZONTAL LAYOUT: Monthly data across row`);
          break;
        }
      }
    }
    
    console.log(`📐 FINAL LAYOUT DETECTION: ${layoutType}`);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      console.log(`🔍 Line ${i}: "${line}"`);
      
       // HORIZONTAL LAYOUT: Handle Excel markdown table format with revenue across columns
       if (layoutType === 'horizontal' && /monthly\s+revenue/i.test(line) && line.includes('|') && !/% of Revenue/i.test(line)) {
        console.log(`💰 FOUND MONTHLY REVENUE ROW: "${line}"`);
        
        // Split by | and extract ALL numeric values, then SUM them (row-wise summation)
        const cells = line.split('|').map(cell => cell.trim());
        console.log(`💰 Processing ${cells.length} cells from Monthly Revenue row`);
        let rowSum = 0;
        let validValues = 0;
        let allValues = [];
        
        for (let j = 0; j < cells.length; j++) {
          const originalCell = cells[j];
          const cellValue = originalCell.replace(/[,$\s"]/g, '');
          const num = parseFloat(cellValue);
          
          if (!isNaN(num) && num > 0) {
            allValues.push(num);
            // Accept reasonable monthly revenue values (wider range)
            if (num >= 500 && num <= 200000) { 
              rowSum += num;
              validValues++;
              console.log(`💰 Month ${validValues}: $${num.toLocaleString()} (total: $${rowSum.toLocaleString()})`);
            }
          }
        }
        
        console.log(`💰 MONTHLY REVENUE SUMMARY:`);
        console.log(`💰 - Valid monthly values: ${validValues}`);
        console.log(`💰 - All numeric values found: [${allValues.slice(0, 10).join(', ')}${allValues.length > 10 ? '...' : ''}]`);
        console.log(`💰 - Total annual revenue: $${rowSum.toLocaleString()}`);
        
        if (validValues >= 3) { // Need at least 3 months of data
          totalRevenue = rowSum;
          console.log(`💰✅ SET FINAL REVENUE: $${totalRevenue.toLocaleString()} from ${validValues} months`);
        } else {
          console.log(`💰❌ Insufficient monthly data: only ${validValues} valid months found`);
        }
       }
       
       // VERTICAL LAYOUT: Handle column-wise data where revenue is down a column
       if (layoutType === 'vertical' && revenueColumnIndex >= 0 && line.includes('|')) {
         const cells = line.split('|').map(cell => cell.trim());
         
         // Skip header rows and percentage rows
         if (!/revenue|income|header|%/i.test(cells[revenueColumnIndex]) && cells[revenueColumnIndex]) {
           const cellValue = cells[revenueColumnIndex].replace(/[,$\s"]/g, '');
           const num = parseFloat(cellValue);
           
           if (!isNaN(num) && num > 0 && num >= 500 && num <= 200000) {
             totalRevenue += num;
             console.log(`💰 VERTICAL: Found revenue value $${num.toLocaleString()} (running total: $${totalRevenue.toLocaleString()})`);
           }
         }
       }
       
       // Handle CSV format for revenue
       else if (/revenue|income/i.test(line) && !line.includes('|')) {
        console.log(`💰 Found potential CSV revenue line: "${line}"`);
        
        const patterns = [
          /net\s+revenue[^,]*,\s*["\s]*\$?\s*([\d,]+\.?\d*)\s*["\s]*/i,
          /total\s+revenue[^,]*,\s*["\s]*\$?\s*([\d,]+\.?\d*)\s*["\s]*/i,
          /revenue[^,]*,\s*["\s]*\$?\s*([\d,]+\.?\d*)\s*["\s]*/i,
        ];
        
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match) {
            const value = parseFloat(match[1].replace(/,/g, ''));
            console.log(`💰 MATCHED CSV Revenue pattern: "${pattern}" -> Value: ${value}`);
            if (value > 0 && value > totalRevenue) {
              totalRevenue = value;
              console.log(`💰✅ Updated Net Revenue: $${totalRevenue.toLocaleString()}`);
              break;
            }
          }
        }
      }
      
      // Debug: Log ALL lines to see what expense patterns we're missing
      if (line.includes('|') && line.toLowerCase().includes('expense') || 
          line.includes('|') && line.toLowerCase().includes('cost') || 
          line.includes('|') && line.toLowerCase().includes('salaries') ||
          line.includes('|') && line.toLowerCase().includes('payroll') ||
          line.includes('|') && line.toLowerCase().includes('cogs')) {
        console.log(`🔍 EXPENSE DEBUG - Found line with expense keywords: "${line}"`);
      }
       
       // VERTICAL LAYOUT: Handle expenses column-wise
       if (layoutType === 'vertical' && expenseColumnIndex >= 0 && line.includes('|')) {
         const cells = line.split('|').map(cell => cell.trim());
         
         // Skip header rows and percentage rows
         if (!/expense|cost|header|%/i.test(cells[expenseColumnIndex]) && cells[expenseColumnIndex]) {
           const cellValue = cells[expenseColumnIndex].replace(/[,$\s"]/g, '');
           const num = parseFloat(cellValue);
           
           if (!isNaN(num) && num > 0 && num >= 100 && num <= 150000) {
             totalExpenses += num;
             console.log(`💸 VERTICAL: Found expense value $${num.toLocaleString()} (running total: $${totalExpenses.toLocaleString()})`);
           }
         }
       }
       
       // HORIZONTAL LAYOUT: Handle Excel expense patterns - look for monthly expenses first, then totals
       if (layoutType === 'horizontal' && /monthly\s+expenses|monthly\s+costs|cost\s+of\s+goods|operating\s+costs|total\s+monthly|total\s+expenses|cogs|salaries|payroll|admin|marketing|rent|utilities|overhead/i.test(line) && line.includes('|') && !/% of Revenue/i.test(line)) {
         console.log(`💸 FOUND MONTHLY EXPENSES ROW: "${line}"`);
         
         // Split by | and extract ALL numeric values, then SUM them (similar to revenue)
         const cells = line.split('|').map(cell => cell.trim());
         console.log(`💸 Processing ${cells.length} cells from Monthly Expenses row`);
         let rowSum = 0;
         let validValues = 0;
         let allValues = [];
         
         for (let j = 0; j < cells.length; j++) {
           const originalCell = cells[j];
           const cellValue = originalCell.replace(/[,$\s"]/g, '');
           const num = parseFloat(cellValue);
           
           if (!isNaN(num) && num > 0) {
             allValues.push(num);
             // MUCH wider range for monthly expense values - should catch most business expenses
             if (num >= 10 && num <= 500000) { 
               rowSum += num;
               validValues++;
               console.log(`💸 Month ${validValues}: $${num.toLocaleString()} (total: $${rowSum.toLocaleString()})`);
             }
           }
         }
         
         console.log(`💸 MONTHLY EXPENSES SUMMARY:`);
         console.log(`💸 - Valid monthly values: ${validValues}`);
         console.log(`💸 - All numeric values found: [${allValues.slice(0, 10).join(', ')}${allValues.length > 10 ? '...' : ''}]`);
         console.log(`💸 - Total annual expenses: $${rowSum.toLocaleString()}`);
         
         if (validValues >= 3) { // Need at least 3 months of data
           totalExpenses = Math.max(totalExpenses, rowSum); // Take highest
           console.log(`💸✅ SET FINAL EXPENSES: $${totalExpenses.toLocaleString()} from ${validValues} months`);
         } else {
           console.log(`💸❌ Insufficient monthly expense data: only ${validValues} valid months found`);
         }
       }
       
       // CATCH-ALL: Look for ANY row with expense-related terms and sum ALL numeric values
       else if (line.includes('|') && /expense|cost|salaries|payroll|admin|marketing|rent|utilities|overhead|cogs|operating/i.test(line) && !/revenue|income|profit|% of/i.test(line)) {
         console.log(`💸 CATCH-ALL EXPENSE ROW: "${line}"`);
         
         const cells = line.split('|').map(cell => cell.trim());
         let rowSum = 0;
         let validValues = 0;
         
         for (let j = 0; j < cells.length; j++) {
           const cellValue = cells[j].replace(/[,$\s"()]/g, '');
           const num = parseFloat(cellValue);
           
           if (!isNaN(num) && num > 0 && num >= 10 && num <= 500000) {
             rowSum += num;
             validValues++;
             console.log(`💸 CATCH-ALL: $${num.toLocaleString()} (running total: $${rowSum.toLocaleString()})`);
           }
         }
         
         if (validValues >= 3 && rowSum > totalExpenses) {
           totalExpenses = rowSum;
           console.log(`💸✅ CATCH-ALL SET EXPENSES: $${totalExpenses.toLocaleString()} from ${validValues} values`);
         }
       }
      // Handle total expense patterns as fallback
      else if (/total\s+cost|total\s+expenses|total\s+variable|total\s+fixed|operating\s+expenses/i.test(line) && line.includes('|')) {
        console.log(`💸 Found potential total expense line: "${line}"`);
        
        const cells = line.split('|').map(cell => cell.trim());
        for (let j = cells.length - 1; j >= 0; j--) {
          const cellValue = cells[j].replace(/[,$\s]/g, '');
          const num = parseFloat(cellValue);
          if (!isNaN(num) && num > 10 && num < 1000000 && num > totalExpenses) {
            totalExpenses = num; // Only update if higher
            console.log(`💸✅ Updated Total Expenses from Excel table: $${totalExpenses.toLocaleString()}`);
            break;
          }
        }
      }
      // Handle CSV expense patterns
      else if (/expense|cost/i.test(line) && !line.includes('|')) {
        console.log(`💸 Found potential CSV expense line: "${line}"`);
        
        const patterns = [
          /total\s+expenses[^,]*,\s*["\s]*\$?\s*([\d,]+\.?\d*)\s*["\s]*/i,
          /operating\s+expenses[^,]*,\s*["\s]*\$?\s*([\d,]+\.?\d*)\s*["\s]*/i,
          /cost\s+of\s+services[^,]*,\s*["\s]*\$?\s*([\d,]+\.?\d*)\s*["\s]*/i,
        ];
        
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match) {
            const value = parseFloat(match[1].replace(/,/g, ''));
            console.log(`💸 MATCHED CSV Expense pattern: "${pattern}" -> Value: ${value}`);
            if (value > 0) {
              totalExpenses += value;
              console.log(`💸✅ Updated Total Expenses: $${totalExpenses.toLocaleString()}`);
              break;
            }
          }
        }
      }
      
      // Handle Excel profit patterns - look for Net Income, Net Profit, Profit/Loss
      if (/net\s+income|net\s+profit|profit\/loss/i.test(line) && line.includes('|')) {
        console.log(`📈 Found potential profit line: "${line}"`);
        
        // Split by | and extract ALL numeric values, then SUM them (row-wise summation)
        const cells = line.split('|').map(cell => cell.trim());
        let rowSum = 0;
        let validValues = 0;
        
        for (const cell of cells) {
          const cellValue = cell.replace(/[,$\s"]/g, '');
          const num = parseFloat(cellValue);
          if (!isNaN(num) && Math.abs(num) < 10000000) { // Can be negative, skip headers
            rowSum += num;
            validValues++;
            console.log(`📈 Adding profit value: ${num} (running sum: ${rowSum})`);
          }
        }
        
        if (validValues > 0) {
          netProfit = rowSum;
          console.log(`📈✅ Updated Net Profit from Excel table (${validValues} values summed): $${netProfit.toLocaleString()}`);
        }
      }
      // Handle CSV profit patterns
      else if (/profit/i.test(line) && !line.includes('|')) {
        console.log(`📈 Found potential CSV profit line: "${line}"`);
        
        const patterns = [
          /net\s+profit[^,]*,\s*["\s]*\$?\s*([\d,]+\.?\d*)\s*["\s]*/i,
          /profit[^,]*,\s*["\s]*\$?\s*([\d,]+\.?\d*)\s*["\s]*/i,
        ];
        
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match) {
            const value = parseFloat(match[1].replace(/,/g, ''));
            console.log(`📈 MATCHED CSV Profit pattern: "${pattern}" -> Value: ${value}`);
            if (value > 0 && value > netProfit) {
              netProfit = value;
              console.log(`📈✅ Updated Net Profit: $${netProfit.toLocaleString()}`);
              break;
            }
          }
        }
      }
    }
    
    console.log(`📊 Final extracted values - Revenue: $${totalRevenue.toLocaleString()}, Expenses: $${totalExpenses.toLocaleString()}, Profit: $${netProfit.toLocaleString()}`);
  }
  
  const healthScore = totalRevenue > 0 ? Math.min(95, Math.max(25, (netProfit / totalRevenue) * 100 + 50)) : 25;
  
  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    cashFlow,
    healthScore: Math.round(healthScore),
    insights: [
      totalRevenue > 0 ? `Revenue of $${totalRevenue.toLocaleString()} extracted from document` : "Document processed but revenue data not clearly identified",
      totalExpenses > 0 ? `Operating expenses of $${totalExpenses.toLocaleString()} identified` : "Expense data requires manual verification",
      netProfit > 0 ? `Net profit margin of ${((netProfit/totalRevenue)*100).toFixed(1)}%` : "Profitability analysis needs additional data"
    ],
    recommendations: [
      totalRevenue > 0 ? "Consider uploading more recent financial statements for trend analysis" : "Upload financial data in CSV or Excel format for better extraction",
      "Verify extracted amounts match your actual financial records",
      "Use the AI chat feature to discuss specific financial metrics"
    ],
    riskFactors: [
      totalRevenue === 0 ? "No revenue data extracted - manual review required" : "Analysis based on extracted data - verify accuracy",
      "Limited financial context from single document"
    ],
    reasoning: {
      dataSource: `${processingMethod} with smart extraction`,
      confidence: totalRevenue > 0 ? "medium" : "low",
      notes: totalRevenue > 0 
        ? `Successfully extracted financial data from "${fileName}". Revenue: $${totalRevenue.toLocaleString()}, Expenses: $${totalExpenses.toLocaleString()}, Profit: $${netProfit.toLocaleString()}.`
        : `Document "${fileName}" was processed using ${processingMethod} but comprehensive financial metrics could not be extracted. Please try uploading the data in CSV or Excel format for better results.`
    }
  };
}