import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DataConnection, FinancialInsight } from './types';
import * as XLSX from 'xlsx';

// Utility function to convert CSV to markdown table
const convertCsvToMarkdown = (csvContent: string): string => {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return csvContent;

  // Parse CSV rows
  const rows = lines.map(line => {
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
  });

  if (rows.length === 0) return csvContent;

  // Create markdown table
  let markdown = '# Financial Data\n\n';
  
  // Find the maximum number of columns
  const maxCols = Math.max(...rows.map(row => row.length));
  
  // Create header row (use first non-empty row or generate generic headers)
  const headerRow = rows[0].some(cell => cell.trim()) ? rows[0] : 
    Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
  
  // Pad header row to maxCols
  while (headerRow.length < maxCols) {
    headerRow.push('');
  }
  
  markdown += '| ' + headerRow.map(cell => cell || ' ').join(' | ') + ' |\n';
  markdown += '| ' + Array(maxCols).fill('---').join(' | ') + ' |\n';
  
  // Add data rows (skip first row if it was used as header)
  const dataRows = rows[0].some(cell => cell.trim()) ? rows.slice(1) : rows;
  
  dataRows.forEach(row => {
    // Pad row to maxCols
    while (row.length < maxCols) {
      row.push('');
    }
    markdown += '| ' + row.map(cell => cell || ' ').join(' | ') + ' |\n';
  });
  
  return markdown;
};

// Utility function to convert Excel to markdown table
const convertExcelToMarkdown = (arrayBuffer: ArrayBuffer): string => {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let markdown = '# Financial Data\n\n';
    
    // Process each worksheet
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      
      if (index > 0) {
        markdown += `\n## Sheet: ${sheetName}\n\n`;
      } else {
        markdown += `## ${sheetName}\n\n`;
      }
      
      // Convert worksheet to array of arrays
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      if (data.length === 0) {
        markdown += 'No data available\n\n';
        return;
      }
      
      // Find the maximum number of columns
      const maxCols = Math.max(...(data as any[][]).map(row => row.length));
      
      if (maxCols === 0) {
        markdown += 'No data available\n\n';
        return;
      }
      
      // Use first row as headers or create generic headers
      const firstRow = data[0] as any[];
      const hasHeaders = firstRow.some(cell => cell && typeof cell === 'string' && isNaN(Number(cell)));
      
      let headers: string[];
      let dataRows: any[][];
      
      if (hasHeaders) {
        headers = firstRow.map((cell, i) => cell ? String(cell).trim() : `Column ${i + 1}`);
        dataRows = data.slice(1) as any[][];
      } else {
        headers = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
        dataRows = data as any[][];
      }
      
      // Ensure headers array has the right length
      while (headers.length < maxCols) {
        headers.push(`Column ${headers.length + 1}`);
      }
      
      // Create markdown table
      markdown += '| ' + headers.join(' | ') + ' |\n';
      markdown += '| ' + Array(maxCols).fill('---').join(' | ') + ' |\n';
      
      // Add data rows
      dataRows.forEach((row: any[]) => {
        const paddedRow = [...row];
        while (paddedRow.length < maxCols) {
          paddedRow.push('');
        }
        const formattedRow = paddedRow.map(cell => {
          if (cell === null || cell === undefined) return '';
          return String(cell).trim();
        });
        markdown += '| ' + formattedRow.join(' | ') + ' |\n';
      });
      
      markdown += '\n';
    });
    
    return markdown;
  } catch (error) {
    console.error('Error converting Excel to markdown:', error);
    return '# Excel File\n\nError: Could not process Excel file\n';
  }
};

interface FileUploadHandlerProps {
  connections: DataConnection[];
  setConnections: React.Dispatch<React.SetStateAction<DataConnection[]>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  setInsights: React.Dispatch<React.SetStateAction<FinancialInsight | null>>;
  setPersonalizedContext: React.Dispatch<React.SetStateAction<string>>;
  setUploadSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  requireTermsAcceptance: () => boolean;
}

export const useFileUploadHandler = ({
  connections,
  setConnections,
  setIsUploading,
  setInsights,
  setPersonalizedContext,
  setUploadSuccess,
  requireTermsAcceptance
}: FileUploadHandlerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files",
        variant: "destructive",
      });
      return;
    }

    // Check if user has accepted terms before proceeding
    if (!requireTermsAcceptance()) {
      return;
    }


    const allowedTypes = ['.csv', '.xlsx', '.xls', '.pdf', '.docx', '.doc', '.txt', '.json', '.xml', '.ofx', '.qfx', '.qif', '.png', '.jpg', '.jpeg', '.zip'];

    setIsUploading(true);
    setUploadSuccess(false);

    let success = 0;
    let failed = 0;

    try {
      for (const file of files) {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedTypes.includes(fileExtension)) {
          failed++;
          continue;
        }

        try {
          let fileContent: string;

          if (fileExtension === '.csv') {
        const rawContent = await file.text();
        
        
        // Convert CSV to markdown first
        fileContent = convertCsvToMarkdown(rawContent);
        // Use the new CSV financial parser with markdown content
        try {
          const { data: csvAnalysis, error: csvError } = await supabase.functions.invoke('csv-financial-parser', {
            body: {
              csvContent: fileContent,
              fileName: file.name,
              userId: user.id
            }
          });
console.log("fileContent", fileContent)
console.log("csvAnalysis", csvAnalysis)
          if (!csvError && csvAnalysis?.success) {
            // Store the parsed financial data for later use
            (file as any).csvAnalysis = csvAnalysis;
            
            // Still convert to markdown for AI context
            fileContent = convertCsvToMarkdown(rawContent);
          } else {
            fileContent = convertCsvToMarkdown(rawContent);
          }
        } catch (error) {
          console.error('CSV parser error, using fallback:', error);
          fileContent = convertCsvToMarkdown(rawContent);
        }
          } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
            const arrayBuffer = await file.arrayBuffer();
            
            
            // Convert Excel to markdown
            fileContent = convertExcelToMarkdown(arrayBuffer);
          } else if (fileExtension === '.txt') {
            fileContent = await file.text();
          } else {
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binaryString = '';
            const chunkSize = 8192;
            for (let i = 0; i < bytes.length; i += chunkSize) {
              const chunk = bytes.slice(i, i + chunkSize);
              binaryString += String.fromCharCode.apply(null, Array.from(chunk));
            }
            fileContent = btoa(binaryString);
          }
          try {
            const { data: openaiData, error: openaiError } = await supabase.functions.invoke('openai-financial-analysis', {
              body: {
                fileContent,
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                userId: user.id,
                debugMode: true // Enable debug mode
              },
            });

            if (openaiError) throw openaiError;

            // Create document record with OpenAI analysis
            const insertData: any = {
              user_id: user.id,
              file_name: file.name,
              file_type: file.type || 'application/octet-stream',
              file_size: file.size,
              processing_status: 'completed',
              records_extracted: 1,
              metadata: {
                source: 'openai-gpt5-analysis',
                summary: openaiData,
                processed_at: new Date().toISOString()
              }
            };

            // Save markdown content for CSV and Excel files
            if ((file.name.toLowerCase().endsWith('.csv') || 
                 file.name.toLowerCase().endsWith('.xlsx') || 
                 file.name.toLowerCase().endsWith('.xls')) && fileContent) {
              insertData.markdown_content = fileContent; // fileContent is already the markdown content
            }

            const { data: docData, error: docError } = await supabase
              .from('documents')
              .insert(insertData)
              .select()
              .single();

            if (docError) {
              console.warn('Failed to create document record:', docError);
            } else {
              
              // Set insights directly from OpenAI
              if (openaiData) {
                setInsights(openaiData);
                setPersonalizedContext(`Comprehensive OpenAI GPT-5 analysis for ${file.name}`);
              }
            }

            success++;
            continue; // Successfully processed with OpenAI, move to next file
            
            } catch (openaiError) {
            console.warn('⚠️ OpenAI processing failed, using client-side fallback:', {
              error: (openaiError as Error).message,
              fileName: file.name,
              fileSize: file.size,
            });

            try {
              const { processDocumentClientSide } = await import('@/lib/documentProcessor');
              const processResult = await processDocumentClientSide(file, user.id);

              if (processResult && processResult.success) {
                success++;
              } else {
                failed++;
              }
            } catch (clientError) {
              console.error('❌ All processing methods failed for file:', file.name, clientError);
              failed++;
            }
          }

          success++;
        } catch (fileErr) {
          console.error('Error uploading file:', fileErr);
          failed++;
        }
      }

      if (success > 0) {
        setUploadSuccess(true);
        setConnections(prev => prev.map(conn =>
          conn.name === 'Financial Data CSV'
            ? { ...conn, status: 'connected' as const, lastSync: new Date().toISOString().split('T')[0] }
            : conn
        ));

        toast({
          title: `Uploaded ${success} file${success>1?'s':''}`,
          description: failed > 0 ? `${failed} file${failed>1?'s':''} failed.` : 'All files processed successfully.',
        });

        // Auto-generate strategic alerts after processing
        try {
          const { generateStrategicAlerts } = await import('@/lib/strategicAlertsHelper');
          const alertResult = await generateStrategicAlerts(user.id, true);
        } catch (alertError) {
          console.warn('⚠️ Failed to generate strategic alerts (bulk path):', alertError);
        }

        // Single event dispatch to prevent UI glitching
        setTimeout(() => {
          window.dispatchEvent(new Event('dashboardUpdate'));
        }, 100);
        
        // Reset upload success after a delay to allow UI updates
        setTimeout(() => {
          setUploadSuccess(false);
        }, 1500);
      } else {
        toast({
          title: 'No files processed',
          description: 'Please check file types and try again.',
          variant: 'destructive',
        });
      }
    } catch (uploadError) {
      console.error('❌ Upload process error:', uploadError);
      toast({
        title: 'Upload failed',
        description: 'An unexpected error occurred during upload.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return { handleFileUpload };
};