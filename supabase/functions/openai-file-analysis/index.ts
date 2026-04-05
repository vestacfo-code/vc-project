// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sentryServe } from "../_shared/sentry-edge.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to process Excel files using native parsing
const processExcelFile = (base64Content: string, fileName: string): string => {
  try {
    console.log('📊 Processing Excel file...');
    
    // For now, return a message indicating Excel support
    // We'll implement proper Excel parsing later if needed
    return `Excel File: ${fileName}

I can see you've uploaded an Excel file. While I can't parse the spreadsheet data directly at this time, I can help you with:

1. Financial analysis if you describe the data structure
2. Creating templates or formulas
3. General business intelligence questions
4. Data interpretation guidance

Please let me know what specific insights you're looking for from this Excel file, or consider uploading the data as a CSV file for direct analysis.`;
    
  } catch (error) {
    console.error('❌ Excel processing error:', error);
    return `Excel File: ${fileName}\n\nI encountered an issue processing this Excel file. Please try uploading it as a CSV file instead, or describe what data it contains so I can help you analyze it.`;
  }
};

serve(sentryServe("openai-file-analysis", async (req) => {
  console.log(`🔍 Request method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log('🔑 Checking OpenAI API key...');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY is not configured');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        details: 'Please configure OPENAI_API_KEY in Supabase secrets' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('✅ OpenAI API key found');

    console.log('📥 Parsing request body...');
    const requestData = await req.json();
    const { fileContent, fileName, fileType } = requestData;
    
    if (!fileContent || !fileName) {
      console.error('❌ Missing required fields');
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        details: 'fileContent and fileName are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📄 Analyzing file: ${fileName} (${fileType})`);

    // Determine if it's an image or document
    const isImage = fileType?.startsWith('image/');
    
    let messages;

    if (isImage) {
      // Handle image files with vision
      messages = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that can analyze images and documents. Provide detailed, useful insights about what you see.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please analyze this image file "${fileName}" and provide insights about what you see. Be detailed but concise.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${fileType};base64,${fileContent}`
              }
            }
          ]
        }
      ];
    } else {
      // Handle documents - try to read content directly
      let fileText = '';
      let canReadDirectly = false;
      
      try {
        // For text-based files, decode base64
        if (fileType?.includes('text') || fileType?.includes('csv') || fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
          fileText = atob(fileContent);
          canReadDirectly = true;
          console.log('📄 Successfully decoded text file');
        } 
        // For Excel files, use our simple Excel handler
        else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileType?.includes('spreadsheet')) {
          console.log('🔄 Processing Excel file...');
          fileText = processExcelFile(fileContent, fileName);
          canReadDirectly = true;
        }
        else {
          fileText = `File: ${fileName} (${fileType})\n\nI can see you've uploaded a file. Please tell me what specific analysis or insights you're looking for from this document.`;
        }
      } catch (error) {
        console.error('❌ File processing error:', error);
        fileText = `File: ${fileName} (${fileType})\n\nI received this file but encountered an issue reading its contents. Could you describe what's in the file so I can help you better?`;
      }

      // Create messages with simplified prompt structure  
      messages = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant specializing in document analysis and business insights. When provided with file content, analyze it thoroughly and provide actionable insights.'
        },
        {
          role: 'user',
          content: canReadDirectly && (fileName.endsWith('.txt') || fileName.endsWith('.csv')) ? 
            `I have a ${fileName.endsWith('.csv') ? 'CSV' : 'text'} file "${fileName}" with the following content. Please analyze it and provide insights:

${fileText}

Please provide relevant analysis based on the content.` : 
            `Please help me with this file "${fileName}". ${fileText}`
        }
      ];
    }

    console.log('🤖 Calling OpenAI for file analysis...');
    console.log('📝 Model being used:', isImage ? 'gpt-4o' : 'gpt-5-2025-08-07');
    
    // Use appropriate model with correct parameters
    const requestBody = {
      model: isImage ? 'gpt-4o' : 'gpt-5-2025-08-07',
      messages: messages,
      max_completion_tokens: 1500,
      // Note: temperature is not supported for GPT-5 models
    };

    console.log('📤 Making OpenAI API request...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OpenAI API error:', response.status, errorData);
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${response.status}`,
        details: errorData 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('✅ OpenAI file analysis completed');

    return new Response(JSON.stringify({ 
      response: data.choices[0]?.message?.content || 'I was unable to analyze this file. Please try again or contact support.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ File analysis error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze file',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});