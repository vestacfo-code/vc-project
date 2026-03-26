import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configure worker - use a stable approach that works in Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Starting PDF extraction for file:', file.name);

    const arrayBuffer = await file.arrayBuffer();
    console.log('File loaded, size:', arrayBuffer.byteLength);

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('PDF loaded, pages:', pdf.numPages);

    let fullText = '';

    // Extract text from all pages with OCR fallback for image-only pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processing page ${pageNum}/${pdf.numPages}`);
      const page = await pdf.getPage(pageNum);

      // 1) Try native text extraction
      let pageText = '';
      try {
        const textContent = await page.getTextContent();
        pageText = (textContent.items as any[])
          .map((item: any) => item.str)
          .join(' ');
      } catch (e) {
        console.warn(`Text extraction failed on page ${pageNum}, will try OCR`, e);
      }

      // 2) If no/low text, render page to canvas and OCR it
      if (!pageText || pageText.replace(/\s+/g, '').length < 30) {
        try {
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');
          canvas.width = viewport.width as number;
          canvas.height = viewport.height as number;
          await page.render({ canvasContext: ctx as any, viewport }).promise;

          const dataUrl = canvas.toDataURL('image/png', 1.0);
          const ocrResult = await Tesseract.recognize(dataUrl, 'eng', {
            tessedit_char_whitelist: '0123456789$€£.,-%()kKmMbB',
            preserve_interword_spaces: '1',
            user_defined_dpi: '300',
            psm: 6,
          } as any);
          const ocrText = ocrResult.data?.text || '';
          console.log(`OCR text length for page ${pageNum}:`, ocrText.length);
          pageText = `${pageText} ${ocrText}`.trim();
        } catch (ocrErr) {
          console.warn(`OCR fallback failed on page ${pageNum}`, ocrErr);
        }
      }

      fullText += pageText + '\n';
      console.log(`Page ${pageNum} final text length:`, pageText.length);
    }

    console.log('Total extracted text length:', fullText.length);
    console.log('First 200 chars:', fullText.substring(0, 200));

    return fullText.trim();
  } catch (error: any) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}