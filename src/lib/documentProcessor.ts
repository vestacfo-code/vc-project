import { supabase } from '@/integrations/supabase/client';
import { extractTextFromPDF } from './pdfExtractor';
import { extractKeyFinancialsFromText, computeHealthScorePartial, extractKeyFinancialsFromTextAggregated, extractKeyFinancialsTripleScan } from './textFinancialExtractor';
import Tesseract from 'tesseract.js';
import { extractFinancialsFromExcel } from './excelExtractor';
import * as mammoth from 'mammoth/mammoth.browser';
import { readJSONFinancials } from './readers/jsonReader';
import { readXMLFinancials } from './readers/xmlReader';
export async function processDocumentClientSide(file: File, userId: string) {
  console.log('Processing document client-side:', file.name);
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  let financialRecords = [];
  let groqAnalysis = null;
  try {
    // First, try the dedicated per-format readers for highest accuracy
    if (fileExtension === 'json') {
      const res = await readJSONFinancials(file, userId);
      groqAnalysis = res.groqAnalysis as any;
      financialRecords = res.financialRecords as any;
    } else if (fileExtension === 'csv') {
      const text = await file.text();

      console.log('=== CSV PROCESSING (DETERMINISTIC) START ===');
      console.log('📄 Raw CSV content (first 500 chars):');
      console.log(text.substring(0, 500));

      // 1) Try structured CSV parsing to deterministic records
      const parsedRecords = parseCSVClientSide(text, userId);
      let totalRevenue: number | null = null;
      let totalExpenses: number | null = null;
      let totalCashFlow: number | null = null;
      let netProfit: number | null = null;

      if (parsedRecords.length > 0) {
        const sums = parsedRecords.reduce((s, r: any) => ({
          revenue: s.revenue + (typeof r.revenue === 'number' ? r.revenue : 0),
          expenses: s.expenses + (typeof r.expenses === 'number' ? r.expenses : 0),
          cash_flow: s.cash_flow + (typeof r.cash_flow === 'number' ? r.cash_flow : 0),
          profit: s.profit + (typeof r.profit === 'number' ? r.profit : 0),
        }), { revenue: 0, expenses: 0, cash_flow: 0, profit: 0 });

        totalRevenue = sums.revenue || null;
        totalExpenses = sums.expenses || null;
        totalCashFlow = sums.cash_flow || null;
        netProfit = (totalRevenue != null && totalExpenses != null)
          ? (totalRevenue - totalExpenses)
          : (sums.profit || null);

        financialRecords = parsedRecords;
      }

      // 2) Heuristic triple-scan on CSV text to enrich/fill gaps (COGS/OPEX, missing totals)
      const triple = await extractKeyFinancialsTripleScan(text);
      const cogsLocal = Array.isArray((triple as any)?.reasoning?.matches)
        ? (triple as any).reasoning.matches.filter((m: any) => m.key === 'cogs').reduce((s: number, m: any) => s + (m.value || 0), 0)
        : null;
      const opexLocal = Array.isArray((triple as any)?.reasoning?.matches)
        ? (triple as any).reasoning.matches.filter((m: any) => m.key === 'operating_expenses').reduce((s: number, m: any) => s + (m.value || 0), 0)
        : null;

      // Prefer structured sums; use triple-scan only for missing fields
      const useRev = totalRevenue ?? triple.totalRevenue ?? null;
      const useExp = totalExpenses ?? triple.totalExpenses ?? null;
      const useCF  = totalCashFlow ?? triple.cashFlow ?? null;
      const useProfit = (useRev != null && useExp != null)
        ? (useRev - useExp)
        : (totalRevenue == null && totalExpenses == null ? (triple.netProfit ?? null) : netProfit);

      // Compute health with partial data (will adapt to available metrics)
      const { computeAdvancedHealthScore, buildAdvancedAnalysis } = await import('./analysis/advancedAnalysis');
      const advanced = buildAdvancedAnalysis({
        totalRevenue: useRev,
        totalExpenses: useExp,
        netProfit: useProfit,
        cashFlow: useCF,
        operatingExpenses: (typeof opexLocal === 'number' && Math.abs(opexLocal) > 0) ? opexLocal : null,
        cogs: (typeof cogsLocal === 'number' && Math.abs(cogsLocal) > 0) ? cogsLocal : null,
        matches: (triple as any)?.reasoning?.matches || []
      });

      groqAnalysis = {
        totalRevenue: useRev,
        totalExpenses: useExp,
        netProfit: useProfit,
        cashFlow: useCF,
        cogs: advanced.supportingData.cogs ?? null,
        operatingExpenses: advanced.metrics.operatingExpenses ?? null,
        healthScore: advanced.metrics.businessHealthScore.value ?? 50,
        reasoning: {
          dataSource: 'Deterministic CSV parser + triple-scan enrichment',
          matches: (triple as any)?.reasoning?.matches || [],
          notes: 'No AI model used. Structured sums preferred; text scan used to fill COGS/OPEX if present.'
        }
      } as any;

      // Only persist records if we actually found some numeric data
      if (!financialRecords.length && (useRev != null || useExp != null || useCF != null || useProfit != null)) {
        financialRecords = [{
          user_id: userId,
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          revenue: useRev ?? 0,
          expenses: useExp ?? 0,
          cash_flow: useCF ?? 0,
          profit: useProfit ?? 0
        }];
      }

      console.log('✅ CSV deterministic analysis complete:', { useRev, useExp, useProfit, useCF });
      console.log('=== CSV PROCESSING (DETERMINISTIC) END ===');
    } else if (fileExtension === 'xml') {
      console.log('🗂️ XML file detected, parsing...');
      try {
        const { groqAnalysis: xmlAnalysis, financialRecords: xmlRecords } = await readXMLFinancials(file, userId);
        groqAnalysis = xmlAnalysis as any;
        financialRecords = xmlRecords;
        console.log('✅ XML analysis result:', groqAnalysis);
      } catch (xmlErr) {
        console.error('❌ XML parsing failed:', xmlErr);
        const today = new Date().toISOString().split('T')[0];
        groqAnalysis = {
          totalRevenue: null,
          totalExpenses: null,
          netProfit: null,
          cashFlow: null,
          healthScore: computeHealthScorePartial({}),
          reasoning: { dataSource: 'Client-side XML parser', notes: String(xmlErr), matches: [] }
        } as any;
        financialRecords = [{
          user_id: userId,
          period_start: today,
          period_end: today,
          revenue: 0,
          expenses: 0,
          cash_flow: 0,
          profit: 0
        }];
      }
    } else if (fileExtension === 'txt') {
      console.log('📝 Text file detected, parsing with heuristic text scanner...');
      const textContent = await file.text();
      const extracted = await extractKeyFinancialsTripleScan(textContent);
      groqAnalysis = extracted as any;
      const record = {
        user_id: userId,
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        revenue: extracted.totalRevenue ?? 0,
        expenses: extracted.totalExpenses ?? 0,
        cash_flow: extracted.cashFlow ?? 0,
        profit: extracted.netProfit ?? 0
      };
      financialRecords = [record];
    } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
      console.log('📊 Excel file detected, parsing with SheetJS...');
      try {
        const { groqAnalysis: excelAnalysis, financialRecords: excelRecords } = await extractFinancialsFromExcel(file, userId);
        groqAnalysis = excelAnalysis as any;
        financialRecords = excelRecords;
        console.log('✅ Excel analysis result:', groqAnalysis);
      } catch (xlsxErr) {
        console.error('❌ Excel parsing failed:', xlsxErr);
        const today = new Date().toISOString().split('T')[0];
        groqAnalysis = {
          totalRevenue: null,
          totalExpenses: null,
          netProfit: null,
          cashFlow: null,
          healthScore: computeHealthScorePartial({}),
          reasoning: { dataSource: 'Client-side Excel parser', notes: String(xlsxErr), matches: [] }
        } as any;
        financialRecords = [{
          user_id: userId,
          period_start: today,
          period_end: today,
          revenue: 0,
          expenses: 0,
          cash_flow: 0,
          profit: 0
        }];
      }
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      // Handle Word documents (DOCX with Mammoth; DOC not supported client-side)
      console.log('=== WORD PROCESSING (DETERMINISTIC) START ===');
      console.log('📄 Processing Word file:', file.name);
      try {
        if (fileExtension === 'docx') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await (mammoth as any).extractRawText({ arrayBuffer });
          const extractedText: string = result?.value || '';
          console.log('📝 DOCX extracted text length:', extractedText.length);
          console.log('📝 Sample text:', extractedText.substring(0, 500));

          if (extractedText.replace(/\s+/g, '').length < 20) {
            throw new Error('DOCX appears to have very little extractable text');
          }

          // Heuristic triple-scan only (no external AI)
          const triple = await extractKeyFinancialsTripleScan(extractedText);

          const cogsLocal = Array.isArray((triple as any)?.reasoning?.matches)
            ? (triple as any).reasoning.matches.filter((m: any) => m.key === 'cogs').reduce((s: number, m: any) => s + (m.value || 0), 0)
            : null;
          const opexLocal = Array.isArray((triple as any)?.reasoning?.matches)
            ? (triple as any).reasoning.matches.filter((m: any) => m.key === 'operating_expenses').reduce((s: number, m: any) => s + (m.value || 0), 0)
            : null;

          const useRev = typeof triple.totalRevenue === 'number' ? triple.totalRevenue : null;
          const useExp = typeof triple.totalExpenses === 'number' ? triple.totalExpenses : null;
          const useCF  = typeof triple.cashFlow === 'number' ? triple.cashFlow : null;
          const useProfit = (useRev != null && useExp != null) ? (useRev - useExp) : (typeof triple.netProfit === 'number' ? triple.netProfit : null);

          const { buildAdvancedAnalysis } = await import('./analysis/advancedAnalysis');
          const advanced = buildAdvancedAnalysis({
            totalRevenue: useRev,
            totalExpenses: useExp,
            netProfit: useProfit,
            cashFlow: useCF,
            operatingExpenses: (typeof opexLocal === 'number' && Math.abs(opexLocal) > 0) ? opexLocal : null,
            cogs: (typeof cogsLocal === 'number' && Math.abs(cogsLocal) > 0) ? cogsLocal : null,
            matches: (triple as any)?.reasoning?.matches || []
          });

          groqAnalysis = {
            totalRevenue: useRev,
            totalExpenses: useExp,
            netProfit: useProfit,
            cashFlow: useCF,
            cogs: advanced.supportingData.cogs ?? null,
            operatingExpenses: advanced.metrics.operatingExpenses ?? null,
            healthScore: advanced.metrics.businessHealthScore.value ?? 50,
            reasoning: {
              dataSource: 'DOCX triple-scan parser (no AI)',
              matches: (triple as any)?.reasoning?.matches || [],
              notes: 'Deterministic extraction from DOCX text.'
            }
          } as any;

          if (useRev != null || useExp != null || useCF != null || useProfit != null) {
            const record = {
              user_id: userId,
              period_start: new Date().toISOString().split('T')[0],
              period_end: new Date().toISOString().split('T')[0],
              revenue: useRev ?? 0,
              expenses: useExp ?? 0,
              cash_flow: useCF ?? 0,
              profit: useProfit ?? 0
            };
            financialRecords = [record];
          }
        } else {
          // Legacy .doc not supported client-side
          throw new Error('DOC format is not supported for client-side text extraction. Please convert to DOCX or PDF.');
        }
      } catch (docxErr) {
        console.error('❌ Word processing failed:', docxErr);
        groqAnalysis = {
          totalRevenue: null,
          totalExpenses: null,
          netProfit: null,
          cashFlow: null,
          healthScore: computeHealthScorePartial({}),
          reasoning: { dataSource: 'Client-side Word parser', notes: String(docxErr) }
        } as any;
        // Do not create placeholder financial record with invented values
        financialRecords = [];
      }
      console.log('=== WORD PROCESSING (DETERMINISTIC) END ===');
    } else if (fileExtension === 'pdf') {
      // Handle PDF files with client-side text extraction
      console.log('=== PDF PROCESSING DEBUG START ===');
      console.log('📄 Processing PDF file:', file.name);
      console.log('📊 PDF size:', file.size, 'bytes');
      
      try {
        // Extract text using PDF.js on the client side
        console.log('🔄 Extracting text from PDF using client-side PDF.js...');
        const extractedText = await extractTextFromPDF(file);
        console.log('📝 Extracted text length:', extractedText.length);
        console.log('📝 Sample text:', extractedText.substring(0, 500));
        
        if (extractedText.length < 50) {
          throw new Error('PDF appears to be empty or contains mostly images');
        }
        
        // Send clean text to Hugging Face for analysis
        console.log('🤗 Sending clean text to Hugging Face for analysis...');
        const pdfResponse = await supabase.functions.invoke('huggingface-financial-analysis', {
          body: { 
            extractedText: extractedText,
            fileName: file.name 
          }
        });
        
        console.log('📨 Raw Hugging Face PDF response received:');
        console.log('  - pdfResponse.error:', pdfResponse.error);
        console.log('  - pdfResponse.data:', JSON.stringify(pdfResponse.data, null, 2));

        if (pdfResponse.error) {
          console.error('❌ PDF analysis failed:', pdfResponse.error);
          throw new Error(`PDF analysis failed: ${pdfResponse.error.message}`);
        }

        if (pdfResponse.data) {
          // Merge AI response with triple-scan totals from client-side parsing (multi-page + categories)
          const ai = pdfResponse.data as any;
          const triple = await extractKeyFinancialsTripleScan(extractedText);

          const totalRevenue = (triple.totalRevenue ?? ai.totalRevenue) ?? 0;
          const totalExpenses = (triple.totalExpenses ?? ai.totalExpenses) ?? 0;
          const netProfit = (triple.netProfit ?? (typeof ai.netProfit === 'number' ? ai.netProfit : (typeof totalRevenue === 'number' && typeof totalExpenses === 'number' ? totalRevenue - totalExpenses : 0))) ?? 0;
          const cashFlow = (triple.cashFlow ?? ai.cashFlow) ?? 0;

          // Recompute health score from merged totals
          const healthScore = computeHealthScorePartial({ revenue: totalRevenue, expenses: totalExpenses, cashFlow, profit: netProfit });

          // Compose reasoning
          groqAnalysis = {
            totalRevenue,
            totalExpenses,
            netProfit,
            cashFlow,
            healthScore,
            reasoning: {
              dataSource: 'Merged AI + triple-scan parser',
              matches: (triple.reasoning?.matches as any) || [],
              notes: 'Reconciled Hugging Face output with category-aware, multi-page text parsing.'
            }
          } as any;

          // Create financial record from merged totals
          const financialRecord = {
            user_id: userId,
            period_start: new Date().toISOString().split('T')[0],
            period_end: new Date().toISOString().split('T')[0],
            revenue: totalRevenue || 0,
            expenses: totalExpenses || 0,
            cash_flow: cashFlow || 0,
            profit: netProfit || 0
          };
          financialRecords = [financialRecord];
          console.log('📋 Financial record from merged PDF totals:', financialRecord);
        } else {
          throw new Error('No data returned from PDF analysis');
        }
        
      } catch (pdfError) {
        console.error('❌ PDF processing failed:', pdfError);
        
        // Create a helpful error message for the user
        groqAnalysis = {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          cashFlow: 0,
          healthScore: 50,
          reasoning: {
            dataSource: "PDF processing failed",
            confidence: "none",
            notes: `PDF extraction failed: ${pdfError.message}. Please try converting your PDF to CSV format or using the manual input option.`
          }
        };
        
        financialRecords = [{
          user_id: userId,
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          revenue: 0,
          expenses: 0,
          cash_flow: 0,
          profit: 0
        }];
        
        console.log('⚠️ Using fallback analysis due to PDF processing error');
      }
      
      console.log('=== PDF PROCESSING DEBUG END ===');
    } else if (['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension)) {
      console.log('🖼️ Image file detected, running OCR to extract text...');
      try {
        // Preprocess image to improve OCR accuracy (grayscale, contrast, threshold, upscale)
        const preprocessedDataUrl = await preprocessImageForOCR(file);

        const ocrResult = await Tesseract.recognize(preprocessedDataUrl, 'eng', {
          // Improve numeric/financial extraction
          tessedit_char_whitelist: '0123456789$€£.,-%()kKmMbB',
          preserve_interword_spaces: '1',
          user_defined_dpi: '300',
          psm: 6, // Assume a single uniform block of text
        } as any);

        const extractedText = ocrResult.data?.text || '';
        console.log('📝 OCR extracted text length:', extractedText.length);
        console.log('🔎 OCR sample:', extractedText.substring(0, 400));
        
        if (extractedText.replace(/\s+/g, '').length < 10) {
          throw new Error('OCR returned very little text');
        }
        
        const extracted = await extractKeyFinancialsTripleScan(extractedText);
        groqAnalysis = extracted as any;
        
        const record = {
          user_id: userId,
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          revenue: extracted.totalRevenue ?? 0,
          expenses: extracted.totalExpenses ?? 0,
          cash_flow: extracted.cashFlow ?? 0,
          profit: extracted.netProfit ?? 0
        };
        financialRecords = [record];
        console.log('✅ Image OCR analysis succeeded:', record);
      } catch (imgErr) {
        console.warn('⚠️ Image OCR failed, creating placeholder record:', imgErr);
        financialRecords = [{
          user_id: userId,
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          revenue: 0,
          expenses: 0,
          cash_flow: 0,
          profit: 0
        }];
        groqAnalysis = {
          totalRevenue: null,
          totalExpenses: null,
          netProfit: null,
          cashFlow: null,
          healthScore: computeHealthScorePartial({}),
          reasoning: { dataSource: 'Client-side OCR failed', notes: String(imgErr) }
        } as any;
      }
    } else {
      // For other file types, create a placeholder record
      console.log('Unsupported file type detected, creating placeholder record');
      financialRecords = [{
        user_id: userId,
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        revenue: 0,
        expenses: 0,
        cash_flow: 0,
        profit: 0
      }];
    }
    
    // Create document record
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        processing_status: 'completed',
        records_extracted: financialRecords.length,
        metadata: {
          processedClientSide: true,
          originalFileName: file.name,
          fileExtension: fileExtension,
          processingCompleted: new Date().toISOString(),
          groqAnalysis: groqAnalysis, // Store the complete analysis for later use
          parsingDetails: {
            dataSource: (groqAnalysis as any)?.reasoning?.dataSource || null,
            selectedSheetName: (groqAnalysis as any)?.reasoning?.selectedSheetName || null,
            modeUsed: (groqAnalysis as any)?.reasoning?.modeUsed || null,
            selectedSheetScore: (groqAnalysis as any)?.reasoning?.selectedSheetScore ?? null
          }
        }
      })
      .select()
      .single();

    if (docError) {
      throw new Error(`Failed to create document record: ${docError.message}`);
    }

    // Insert financial data if we have any
    if (financialRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('financial_data')
        .insert(financialRecords.map(record => ({
          ...record,
          user_id: userId,
          document_id: docData.id // Link financial records to specific document
        })));

      if (insertError) {
        console.error('Failed to insert financial data:', insertError);
        // Don't throw here, document was created successfully
      }
    }

    // Calculate summary (prefer AI values; fallback to extracted records)
    const aiRev = typeof groqAnalysis?.totalRevenue === 'number' ? groqAnalysis.totalRevenue : undefined;
    const aiExp = typeof groqAnalysis?.totalExpenses === 'number' ? groqAnalysis.totalExpenses : undefined;
    const aiCF  = typeof groqAnalysis?.cashFlow === 'number' ? groqAnalysis.cashFlow : undefined;
    const aiProf= typeof groqAnalysis?.netProfit === 'number' ? groqAnalysis.netProfit : (aiRev !== undefined && aiExp !== undefined ? aiRev - aiExp : undefined);

    // Fallback from records if AI values are missing
    const recordTotals = (() => {
      if (!financialRecords || financialRecords.length === 0) return undefined;
      const acc = financialRecords.reduce((s, r: any) => ({
        revenue: s.revenue + (Number(r.revenue) || 0),
        expenses: s.expenses + (Number(r.expenses) || 0),
        cashFlow: s.cashFlow + (Number(r.cash_flow) || 0),
        profit: s.profit + (Number(r.profit) || 0),
      }), { revenue: 0, expenses: 0, cashFlow: 0, profit: 0 });
      return acc;
    })();

    const sumRev = aiRev ?? recordTotals?.revenue;
    const sumExp = aiExp ?? recordTotals?.expenses;
    const sumCF  = aiCF  ?? recordTotals?.cashFlow;
    const sumProf= aiProf ?? (sumRev !== undefined && sumExp !== undefined ? sumRev - sumExp : recordTotals?.profit);

    // If healthScore missing/zero but some metrics exist, compute partial score
    if ((!groqAnalysis?.healthScore || groqAnalysis.healthScore === 0) && (sumRev !== undefined || sumExp !== undefined || sumCF !== undefined || sumProf !== undefined)) {
      const hs = computeHealthScorePartial({ revenue: sumRev, expenses: sumExp, cashFlow: sumCF, profit: sumProf });
      if (groqAnalysis) (groqAnalysis as any).healthScore = hs;
    }

    const { buildAdvancedAnalysis } = await import('./analysis/advancedAnalysis');
    const advancedAnalysis = buildAdvancedAnalysis({
      totalRevenue: sumRev ?? null,
      totalExpenses: sumExp ?? null,
      netProfit: sumProf ?? null,
      cashFlow: sumCF ?? null,
      operatingExpenses: (typeof (groqAnalysis as any)?.operatingExpenses === 'number'
        ? (groqAnalysis as any).operatingExpenses
        : (typeof (groqAnalysis as any)?.cogs === 'number' && typeof sumExp === 'number'
            ? (sumExp as number) - (groqAnalysis as any).cogs
            : null)),
      cogs: (groqAnalysis as any)?.cogs ?? null,
      matches: (groqAnalysis as any)?.reasoning?.matches ?? []
    });

    return {
      success: true,
      documentId: docData.id,
      recordsProcessed: financialRecords.length,
      fileType: fileExtension,
      groqAnalysis: groqAnalysis, // Primary analysis payload
      summary: {
        // Prefer AI analysis; fallback to record-derived totals
        totalRevenue: sumRev ?? null,
        totalExpenses: sumExp ?? null,
        totalCashFlow: sumCF ?? null,
        profit: sumProf ?? null
      },
      advancedAnalysis,
      documentSpecificAnalysis: true // Flag to indicate this is document-specific
    };

  } catch (error) {
    console.error('Client-side processing failed:', error);
    throw error;
  }
}

// New function to process manual financial data
export async function processManualFinancialData(data: any, userId: string) {
  console.log('📊 Processing manual financial data...');
  
  try {
    // Send manual data to Hugging Face for analysis
    const { data: hfResult, error: hfError } = await supabase.functions.invoke('huggingface-financial-analysis', {
      body: { 
        manualData: data,
        fileName: 'Manual Input'
      }
    });

    if (hfError) {
      console.error('❌ Manual data analysis error:', hfError);
      throw new Error(`Analysis failed: ${hfError.message}`);
    }

    console.log('✅ Manual data analysis successful:', hfResult);

    // Store document record
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        file_name: 'Manual Financial Data',
        file_type: 'manual',
        file_size: 0,
        processing_status: 'completed',
        records_extracted: 1,
        metadata: {
          processedClientSide: true,
          manualInput: true,
          processingCompleted: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (documentError) {
      console.error('❌ Document storage error:', documentError);
      throw new Error(`Failed to store document: ${documentError.message}`);
    }

    // Store financial data
    const financialRecord = {
      user_id: userId,
      document_id: documentData.id,
      period_start: new Date().toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.profit,
      cash_flow: data.cashFlow
    };

    const { error: financialError } = await supabase
      .from('financial_data')
      .insert(financialRecord);

    if (financialError) {
      console.error('❌ Financial data storage error:', financialError);
    }

    return {
      success: true,
      documentId: documentData.id,
      recordsProcessed: 1,
      fileType: 'manual',
      groqAnalysis: hfResult,
      summary: {
        totalRevenue: data.revenue,
        totalExpenses: data.expenses,
        totalCashFlow: data.cashFlow,
        profit: data.profit
      },
      documentSpecificAnalysis: true
    };

  } catch (error) {
    console.error('❌ Manual data processing error:', error);
    throw error;
  }
}

function parseCSVClientSide(csvData: string, userId: string) {
  const lines = csvData.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    console.warn('CSV file appears to be empty or invalid');
    return [];
  }
  
  const financialRecords = [];
  
  // Try different separators (comma, semicolon, tab)
  const separators = [',', ';', '\t'];
  let bestSeparator = ',';
  let maxColumns = 0;
  
  for (const sep of separators) {
    const testColumns = lines[0].split(sep).length;
    if (testColumns > maxColumns) {
      maxColumns = testColumns;
      bestSeparator = sep;
    }
  }
  
  console.log(`Using separator: "${bestSeparator}", ${maxColumns} columns detected`);
  
  const headers = lines[0].split(bestSeparator).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  
  console.log('CSV headers detected:', headers);
  
  // More comprehensive column detection with multiple keywords
  const revenueCol = headers.findIndex(h => 
    h.includes('revenue') || h.includes('sales') || h.includes('income') || 
    h.includes('total') || h.includes('earning') || h.includes('turnover') ||
    h.includes('gross') || h.includes('receipts') || h.includes('inflow')
  );
  
  const expenseCol = headers.findIndex(h => 
    h.includes('expense') || h.includes('cost') || h.includes('expenditure') || 
    h.includes('spend') || h.includes('outgoing') || h.includes('outflow') ||
    h.includes('payment') || h.includes('disbursement') || h.includes('charge')
  );
  
  const dateCol = headers.findIndex(h => 
    h.includes('date') || h.includes('period') || h.includes('time') || 
    h.includes('month') || h.includes('year') || h.includes('day')
  );
  
  const cashFlowCol = headers.findIndex(h => 
    (h.includes('cash') && h.includes('flow')) || h.includes('cashflow')
  );
  
  const profitCol = headers.findIndex(h => 
    h.includes('profit') || h.includes('net') || h.includes('margin') ||
    h.includes('surplus') || h.includes('gain') || h.includes('loss')
  );

  console.log('CSV column mapping:', { revenueCol, expenseCol, dateCol, cashFlowCol, profitCol });
  console.log('Sample data row:', lines[1]?.split(bestSeparator));

  // If no specific columns found, try to identify numeric columns
  let numericColumns = [];
  if (revenueCol === -1 && expenseCol === -1 && profitCol === -1) {
    console.log('No labeled columns found, scanning for numeric data...');
    
    // Check multiple rows to find consistently numeric columns
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      let numericCount = 0;
      const sampleSize = Math.min(5, lines.length - 1);
      
      for (let rowIndex = 1; rowIndex <= sampleSize; rowIndex++) {
        const cells = lines[rowIndex]?.split(bestSeparator);
        if (cells && cells[colIndex]) {
          const cleanValue = cells[colIndex].trim().replace(/['"$,\s]/g, '');
          if (!isNaN(parseFloat(cleanValue)) && cleanValue !== '') {
            numericCount++;
          }
        }
      }
      
      if (numericCount >= Math.ceil(sampleSize * 0.7)) { // 70% numeric
        numericColumns.push(colIndex);
      }
    }
    
    console.log('Numeric columns found:', numericColumns);
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(bestSeparator).map(cell => cell.trim().replace(/['"]/g, ''));
    if (row.length < 2 || row.every(cell => !cell.trim())) continue;

    console.log(`Processing row ${i}:`, row);

    const date = dateCol >= 0 ? formatDate(row[dateCol]) : new Date().toISOString().split('T')[0];
    
    let revenue = 0;
    let expenses = 0;
    let profit = 0;
    let cashFlow = 0;
    
    // Extract values with better number parsing
    const parseNumber = (str) => {
      if (!str) return 0;
      const cleaned = str.replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };
    
    if (revenueCol >= 0) {
      revenue = parseNumber(row[revenueCol]);
    } else if (numericColumns.length > 0) {
      revenue = parseNumber(row[numericColumns[0]]);
    }
    
    if (expenseCol >= 0) {
      expenses = parseNumber(row[expenseCol]);
    } else if (numericColumns.length > 1) {
      expenses = parseNumber(row[numericColumns[1]]);
    }
    
    if (profitCol >= 0) {
      profit = parseNumber(row[profitCol]);
    } else {
      profit = revenue - expenses;
    }
    
    if (cashFlowCol >= 0) {
      cashFlow = parseNumber(row[cashFlowCol]);
    } else {
      cashFlow = profit;
    }

    console.log(`Parsed values - Revenue: ${revenue}, Expenses: ${expenses}, Profit: ${profit}, Cash Flow: ${cashFlow}`);

    // Create record if we have meaningful data
    if (revenue > 0 || expenses > 0 || Math.abs(profit) > 0 || Math.abs(cashFlow) > 0) {
      financialRecords.push({
        user_id: userId,
        period_start: date,
        period_end: date,
        revenue: Math.max(0, revenue),
        expenses: Math.max(0, expenses),
        cash_flow: cashFlow,
        profit: profit
      });
    }
  }

  console.log(`Successfully parsed ${financialRecords.length} financial records from CSV`);
  
  // Only create sample data if absolutely no data was found
  if (financialRecords.length === 0) {
    console.warn('No financial data could be parsed from CSV - this might indicate a parsing issue');
    // Don't create sample data anymore, return empty array
    return [];
  }

  return financialRecords;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Preprocess images to improve OCR: resize, grayscale, enhance contrast, and binarize
async function preprocessImageForOCR(file: File): Promise<string> {
  const img = await loadImageFromFile(file);

  // Determine target dimensions
  const MAX_DIM = 1600;
  const MIN_WIDTH = 900;
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  // Scale down if too large
  if (width > MAX_DIM || height > MAX_DIM) {
    if (width > height) {
      height = Math.round((height * MAX_DIM) / width);
      width = MAX_DIM;
    } else {
      width = Math.round((width * MAX_DIM) / height);
      height = MAX_DIM;
    }
  }
  // Scale up small images a bit to help OCR
  if (width < MIN_WIDTH) {
    const scale = MIN_WIDTH / width;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Compute average luminance for adaptive threshold
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    sum += y;
  }
  const avg = sum / (data.length / 4);

  // Enhance: grayscale + contrast + adaptive threshold
  const contrast = 1.25; // 25% more contrast
  const brightness = 5; // slight boost
  const thresh = Math.max(120, Math.min(200, avg + 10));

  for (let i = 0; i < data.length; i += 4) {
    // Grayscale
    let y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // Apply brightness/contrast
    y = (y - 128) * contrast + 128 + brightness;
    // Threshold to binarize
    const v = y > thresh ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = v;
    // Keep alpha
  }

  ctx.putImageData(imgData, 0, 0);
  // Return as high-quality PNG data URL
  return canvas.toDataURL('image/png', 1.0);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image for OCR'));
    img.src = URL.createObjectURL(file);
  });
}
