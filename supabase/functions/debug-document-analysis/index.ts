// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface DebugAnalysisRequest {
  documentId: string;
  userId: string;
  enableDebugMode?: boolean;
  compareModels?: boolean;
}

interface ParsedDataDebug {
  source: string;
  method: string;
  confidence: number;
  rawData: any;
  processedData: any;
  detectedScale: number;
  businessContext: any;
  errorMessages: string[];
}

interface ModelComparison {
  claude: any;
  openai: any;
  comparison: {
    revenueMatch: boolean;
    expenseMatch: boolean;
    confidenceDelta: number;
    recommendations: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 DEBUG DOCUMENT ANALYSIS - Starting comprehensive debug session');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { documentId, userId, enableDebugMode = true, compareModels = false }: DebugAnalysisRequest = await req.json();

    if (!documentId || !userId) {
      throw new Error('Missing required parameters: documentId and userId');
    }

    console.log(`📋 DEBUG SESSION: Document ${documentId} for User ${userId}`);
    console.log(`🔧 Debug Mode: ${enableDebugMode}, Model Comparison: ${compareModels}`);

    // Step 1: Fetch document and raw content
    const documentDebug = await debugDocumentRetrieval(supabase, documentId);
    console.log('📄 DOCUMENT DEBUG:', documentDebug);

    // Step 2: Debug parsing with multiple methods
    const parsingDebug = await debugParsingMethods(supabase, documentDebug);
    console.log('🧠 PARSING DEBUG:', parsingDebug);

    // Step 3: Cross-model comparison if requested
    let modelComparison: ModelComparison | null = null;
    if (compareModels) {
      modelComparison = await debugModelComparison(supabase, documentDebug, userId);
      console.log('🔄 MODEL COMPARISON:', modelComparison);
    }

    // Step 4: Generate comprehensive debug report
    const debugReport = generateDebugReport(documentDebug, parsingDebug, modelComparison);

    // Step 5: Store debug results
    await storeDebugResults(supabase, documentId, userId, debugReport);

    return new Response(JSON.stringify({
      success: true,
      documentId,
      userId,
      debugReport,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ DEBUG ANALYSIS ERROR:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function debugDocumentRetrieval(supabase: any, documentId: string) {
  console.log('📋 DEBUGGING DOCUMENT RETRIEVAL...');
  
  const debugInfo: any = {
    documentExists: false,
    storageAccessible: false,
    fileSize: 0,
    fileType: '',
    rawContent: '',
    contentLength: 0,
    errors: []
  };

  try {
    // Get document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError) {
      debugInfo.errors.push(`Document fetch error: ${docError.message}`);
      return debugInfo;
    }

    debugInfo.documentExists = true;
    debugInfo.fileSize = document.file_size;
    debugInfo.fileType = document.file_type;
    debugInfo.fileName = document.file_name;

    console.log(`📄 Document found: ${document.file_name} (${document.file_size} bytes)`);

    // Try to fetch file content from storage
    if (document.storage_path) {
      try {
        const { data: fileData, error: storageError } = await supabase.storage
          .from('user-documents')
          .download(document.storage_path);

        if (storageError) {
          debugInfo.errors.push(`Storage access error: ${storageError.message}`);
        } else {
          debugInfo.storageAccessible = true;
          const arrayBuffer = await fileData.arrayBuffer();
          debugInfo.contentLength = arrayBuffer.byteLength;
          
          // Convert to appropriate format for analysis
          if (document.file_name.endsWith('.csv') || document.file_name.endsWith('.txt')) {
            debugInfo.rawContent = new TextDecoder().decode(arrayBuffer);
          } else {
            // For binary files, convert to base64
            const bytes = new Uint8Array(arrayBuffer);
            let binaryString = '';
            for (let i = 0; i < bytes.length; i++) {
              binaryString += String.fromCharCode(bytes[i]);
            }
            debugInfo.rawContent = btoa(binaryString);
          }

          console.log(`✅ File content retrieved: ${debugInfo.contentLength} bytes`);
          console.log(`📝 Content preview: ${debugInfo.rawContent.substring(0, 200)}...`);
        }
      } catch (error) {
        debugInfo.errors.push(`File retrieval error: ${error.message}`);
      }
    }

    debugInfo.documentMetadata = document.metadata;
    return debugInfo;

  } catch (error) {
    debugInfo.errors.push(`General retrieval error: ${error.message}`);
    return debugInfo;
  }
}

async function debugParsingMethods(supabase: any, documentDebug: any): Promise<ParsedDataDebug[]> {
  console.log('🧠 DEBUGGING PARSING METHODS...');
  
  const parsingResults: ParsedDataDebug[] = [];

  if (!documentDebug.storageAccessible) {
    console.log('❌ Cannot debug parsing - no content available');
    return parsingResults;
  }

  const { fileName, rawContent, fileType } = documentDebug;

  // Method 1: Enhanced XLSX Processor
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    try {
      console.log('📊 Testing Enhanced XLSX Processor...');
      
      const { data: xlsxResult, error: xlsxError } = await supabase.functions.invoke('enhanced-xlsx-processor', {
        body: {
          fileContent: rawContent,
          fileName: fileName,
          userId: 'debug-user'
        }
      });

      const xlsxDebug: ParsedDataDebug = {
        source: 'enhanced-xlsx-processor',
        method: 'chatgpt-style-complete-analysis',
        confidence: xlsxResult?.success ? 0.9 : 0.1,
        rawData: xlsxResult?.detailedBreakdown || null,
        processedData: xlsxResult?.summary || null,
        detectedScale: xlsxResult?.debugInfo?.scaleFactor || 1,
        businessContext: xlsxResult?.debugInfo || {},
        errorMessages: xlsxError ? [xlsxError.message] : []
      };

      console.log('📊 XLSX Processing Result:', {
        success: xlsxResult?.success,
        revenue: xlsxResult?.summary?.totalRevenue,
        expenses: xlsxResult?.summary?.totalExpenses,
        confidence: xlsxDebug.confidence
      });

      parsingResults.push(xlsxDebug);
    } catch (error) {
      console.error('❌ Enhanced XLSX Processor failed:', error);
      parsingResults.push({
        source: 'enhanced-xlsx-processor',
        method: 'failed',
        confidence: 0,
        rawData: null,
        processedData: null,
        detectedScale: 1,
        businessContext: {},
        errorMessages: [error.message]
      });
    }
  }

  // Method 2: OpenAI File Analysis
  try {
    console.log('🤖 Testing OpenAI File Analysis...');
    
    const { data: openaiResult, error: openaiError } = await supabase.functions.invoke('openai-financial-analysis', {
      body: {
        fileContent: rawContent,
        fileName: fileName,
        fileType: fileType,
        userId: 'debug-user'
      }
    });

    const openaiDebug: ParsedDataDebug = {
      source: 'openai-financial-analysis',
      method: 'gpt-5-comprehensive',
      confidence: openaiResult?.healthScore ? (openaiResult.healthScore / 100) : 0.5,
      rawData: openaiResult || null,
      processedData: {
        revenue: openaiResult?.totalRevenue || 0,
        expenses: openaiResult?.totalExpenses || 0,
        profit: openaiResult?.netProfit || 0,
        cashFlow: openaiResult?.cashFlow || 0
      },
      detectedScale: 1, // OpenAI doesn't provide scale detection
      businessContext: openaiResult?.reasoning || {},
      errorMessages: openaiError ? [openaiError.message] : []
    };

    console.log('🤖 OpenAI Processing Result:', {
      revenue: openaiResult?.totalRevenue,
      expenses: openaiResult?.totalExpenses,
      healthScore: openaiResult?.healthScore,
      confidence: openaiDebug.confidence
    });

    parsingResults.push(openaiDebug);
  } catch (error) {
    console.error('❌ OpenAI file analysis failed:', error);
    parsingResults.push({
      source: 'openai-financial-analysis',
      method: 'failed',
      confidence: 0,
      rawData: null,
      processedData: null,
      detectedScale: 1,
      businessContext: {},
      errorMessages: [error.message]
    });
  }

  // Method 3: Simple CSV Parsing (for CSV files)
  if (fileName.endsWith('.csv')) {
    try {
      console.log('📈 Testing Simple CSV Parsing...');
      
      const csvDebug = debugCSVParsing(rawContent);
      parsingResults.push(csvDebug);
    } catch (error) {
      console.error('❌ CSV parsing failed:', error);
    }
  }

  return parsingResults;
}

function debugCSVParsing(csvContent: string): ParsedDataDebug {
  console.log('📈 DEBUGGING CSV PARSING...');
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];
  
  let totalRevenue = 0;
  let totalExpenses = 0;
  const detectedNumbers: number[] = [];
  const errorMessages: string[] = [];

  for (let i = 1; i < Math.min(lines.length, 100); i++) {
    const row = lines[i].split(',');
    const description = row[0]?.toLowerCase() || '';
    
    for (let j = 1; j < row.length; j++) {
      const cellValue = row[j]?.replace(/[^0-9.-]/g, '');
      const number = parseFloat(cellValue);
      
      if (!isNaN(number) && number > 0) {
        detectedNumbers.push(number);
        
        if (description.includes('revenue') || description.includes('sales') || description.includes('income')) {
          totalRevenue += number;
        } else if (description.includes('expense') || description.includes('cost')) {
          totalExpenses += number;
        }
      }
    }
  }

  console.log(`📈 CSV Debug: ${detectedNumbers.length} numbers found, Revenue: ${totalRevenue}, Expenses: ${totalExpenses}`);

  return {
    source: 'simple-csv-parser',
    method: 'pattern-matching',
    confidence: detectedNumbers.length > 5 ? 0.7 : 0.3,
    rawData: { headers, linesProcessed: Math.min(lines.length, 100) },
    processedData: { totalRevenue, totalExpenses, numbersFound: detectedNumbers.length },
    detectedScale: 1,
    businessContext: { fileFormat: 'csv', headers },
    errorMessages
  };
}

async function debugModelComparison(supabase: any, documentDebug: any, userId: string): Promise<ModelComparison> {
  console.log('🔄 DEBUGGING MODEL COMPARISON...');
  
  const comparison: ModelComparison = {
    claude: null,
    openai: null,
    comparison: {
      revenueMatch: false,
      expenseMatch: false,
      confidenceDelta: 0,
      recommendations: []
    }
  };

  try {
    // Test Claude Analysis
    console.log('🧠 Testing Claude analysis...');
    const { data: claudeResult, error: claudeError } = await supabase.functions.invoke('claude-financial-analysis', {
      body: {
        financialData: { revenue: 0, expenses: 0, cash_flow: 0 },
        userId: userId,
        documentId: null,
        userContext: `Debug analysis for ${documentDebug.fileName}`
      }
    });

    comparison.claude = claudeResult || { error: claudeError?.message };

    // Test OpenAI Analysis  
    console.log('🤖 Testing OpenAI analysis...');
    const { data: openaiResult, error: openaiError } = await supabase.functions.invoke('openai-financial-analysis', {
      body: {
        fileContent: documentDebug.rawContent,
        fileName: documentDebug.fileName,
        fileType: documentDebug.fileType,
        userId: userId
      }
    });

    comparison.openai = openaiResult || { error: openaiError?.message };

    // Generate comparison insights
    if (comparison.claude && comparison.openai) {
      const claudeRevenue = comparison.claude.calculationVerification?.verifiedRevenue || 0;
      const openaiRevenue = comparison.openai.totalRevenue || 0;
      const claudeExpenses = comparison.claude.calculationVerification?.verifiedExpenses || 0;
      const openaiExpenses = comparison.openai.totalExpenses || 0;

      comparison.comparison.revenueMatch = Math.abs(claudeRevenue - openaiRevenue) < (Math.max(claudeRevenue, openaiRevenue) * 0.1);
      comparison.comparison.expenseMatch = Math.abs(claudeExpenses - openaiExpenses) < (Math.max(claudeExpenses, openaiExpenses) * 0.1);
      
      const claudeConfidence = comparison.claude.analysisMetadata?.confidenceLevel === 'High' ? 0.9 : 0.6;
      const openaiConfidence = (comparison.openai.healthScore || 50) / 100;
      comparison.comparison.confidenceDelta = Math.abs(claudeConfidence - openaiConfidence);

      // Generate recommendations based on comparison
      if (!comparison.comparison.revenueMatch) {
        comparison.comparison.recommendations.push(`Revenue mismatch: Claude=${claudeRevenue.toLocaleString()}, OpenAI=${openaiRevenue.toLocaleString()}`);
      }
      if (!comparison.comparison.expenseMatch) {
        comparison.comparison.recommendations.push(`Expense mismatch: Claude=${claudeExpenses.toLocaleString()}, OpenAI=${openaiExpenses.toLocaleString()}`);
      }
      if (comparison.comparison.confidenceDelta > 0.3) {
        comparison.comparison.recommendations.push(`Significant confidence gap: ${comparison.comparison.confidenceDelta.toFixed(2)}`);
      }
    }

    console.log('🔄 Model comparison completed:', comparison.comparison);
    return comparison;

  } catch (error) {
    console.error('❌ Model comparison failed:', error);
    comparison.comparison.recommendations.push(`Comparison failed: ${error.message}`);
    return comparison;
  }
}

function generateDebugReport(documentDebug: any, parsingResults: ParsedDataDebug[], modelComparison: ModelComparison | null) {
  console.log('📋 GENERATING COMPREHENSIVE DEBUG REPORT...');
  
  const report = {
    documentAccess: {
      accessible: documentDebug.storageAccessible,
      fileSize: documentDebug.fileSize,
      contentLength: documentDebug.contentLength,
      errors: documentDebug.errors
    },
    parsingMethods: {
      totalMethods: parsingResults.length,
      successfulMethods: parsingResults.filter(r => r.confidence > 0.5).length,
      highestConfidence: Math.max(...parsingResults.map(r => r.confidence), 0),
      results: parsingResults.map(r => ({
        source: r.source,
        method: r.method,
        confidence: r.confidence,
        extractedRevenue: r.processedData?.revenue || r.processedData?.totalRevenue || 0,
        extractedExpenses: r.processedData?.expenses || r.processedData?.totalExpenses || 0,
        errors: r.errorMessages
      }))
    },
    recommendations: generateImprovementRecommendations(parsingResults, modelComparison),
    timestamp: new Date().toISOString()
  };

  if (modelComparison) {
    report.modelComparison = {
      claudeSuccess: !!modelComparison.claude && !modelComparison.claude.error,
      openaiSuccess: !!modelComparison.openai && !modelComparison.openai.error,
      agreement: modelComparison.comparison.revenueMatch && modelComparison.comparison.expenseMatch,
      recommendations: modelComparison.comparison.recommendations
    };
  }

  return report;
}

function generateImprovementRecommendations(parsingResults: ParsedDataDebug[], modelComparison: ModelComparison | null): string[] {
  const recommendations: string[] = [];

  // Check parsing success rates
  const successfulParsing = parsingResults.filter(r => r.confidence > 0.7);
  if (successfulParsing.length === 0) {
    recommendations.push('Critical: No parsing methods achieved high confidence. Check file format and content structure.');
  }

  // Check for consistent results
  const revenues = parsingResults.map(r => r.processedData?.revenue || r.processedData?.totalRevenue || 0).filter(r => r > 0);
  if (revenues.length > 1) {
    const maxRevenue = Math.max(...revenues);
    const minRevenue = Math.min(...revenues);
    if (maxRevenue > minRevenue * 2) {
      recommendations.push('Warning: Large variance in revenue detection across methods. Manual review recommended.');
    }
  }

  // Model-specific recommendations
  if (modelComparison && !modelComparison.comparison.revenueMatch) {
    recommendations.push('Action: Claude and OpenAI disagree on revenue figures. Consider prompt refinement or data preprocessing.');
  }

  // Scale detection recommendations
  const scaleFactors = parsingResults.map(r => r.detectedScale).filter(s => s > 1);
  if (scaleFactors.length > 0) {
    recommendations.push(`Info: Scale factors detected: ${scaleFactors.join(', ')}. Verify currency and unit scaling.`);
  }

  return recommendations;
}

async function storeDebugResults(supabase: any, documentId: string, userId: string, debugReport: any) {
  console.log('💾 STORING DEBUG RESULTS...');
  
  try {
    await supabase
      .from('documents')
      .update({
        metadata: {
          debug_analysis: debugReport,
          debug_timestamp: new Date().toISOString()
        }
      })
      .eq('id', documentId);

    console.log('✅ Debug results stored successfully');
  } catch (error) {
    console.warn('⚠️ Failed to store debug results:', error);
  }
}