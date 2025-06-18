// Utility to extract text from a PDF using pdf.js, with fallback to Tesseract.js OCR for scanned/image PDFs
// Usage: extractPdfText(file: File | ArrayBuffer): Promise<string>

import { createWorker } from 'tesseract.js';

// Dynamically import pdfjs-dist only when needed (for browser/webpack compatibility)
const getPdfjs = async () => {
  // @ts-ignore
  return await import('pdfjs-dist/build/pdf');
};

export async function extractPdfText(file: File | ArrayBuffer): Promise<string> {
  let arrayBuffer: ArrayBuffer;
  if (file instanceof File) {
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file;
  }

  // Try pdf.js text extraction first
  try {
    const pdfjsLib = await getPdfjs();
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      // @ts-ignore
      pdfjsLib.GlobalWorkerOptions.workerSrc ||
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ');
    }
    if (text.trim().length > 0) {
      return text;
    }
  } catch (err) {
    // Ignore and fallback to OCR
  }

  // Fallback: OCR with Tesseract.js (first page only for speed)
  try {
    // Convert PDF first page to image using pdf.js
    const pdfjsLib = await getPdfjs();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/png');

    // OCR with Tesseract.js
    const worker = await createWorker('eng');
    const {
      data: { text },
    } = await worker.recognize(dataUrl);
    await worker.terminate();
    return text;
  } catch (err) {
    // OCR failed
    return '';
  }
}
