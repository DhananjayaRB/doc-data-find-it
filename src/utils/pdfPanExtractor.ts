// Utility to extract PAN from the first page of a PDF using pdf.js (browser-compatible, no Buffer)
// Usage: extractPanFromPdf(file: File | ArrayBuffer): Promise<string | null>

import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import 'pdfjs-dist/build/pdf.worker.entry';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

export async function extractPanFromPdf(file: File | ArrayBuffer): Promise<string | null> {
  let arrayBuffer: ArrayBuffer;
  if (file instanceof File) {
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file;
  }
  // Always use Uint8Array for browser compatibility
  const typedArray = new Uint8Array(arrayBuffer);

  try {
    const pdf = await pdfjsLib.getDocument(typedArray).promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    let text = '';
    textContent.items.forEach((item: any) => {
      text += item.str + ' ';
    });
    // Log the raw text for debugging
    console.log('Extracted PDF text (first page):', text);
    // PAN regex (no spaces)
    const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
    if (panMatch) {
      return panMatch[0];
    }
    return null;
  } catch (err) {
    console.error('PDF PAN extraction error:', err);
    return null;
  }
}
