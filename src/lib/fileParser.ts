import JSZip from 'jszip';

export interface ExtractedFileResult {
  text: string;
  fileName: string;
  fileSize: number;
  charCount: number;
  wordCount: number;
  estimatedTokens: number;
}

export async function parseUploadedFile(file: File): Promise<ExtractedFileResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const lowerName = fileName.toLowerCase();

  let text = '';

  if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
    text = await file.text();
  } else if (lowerName.endsWith('.docx')) {
    text = await extractDocxText(file);
  } else if (lowerName.endsWith('.pdf')) {
    text = await extractPdfText(file);
  } else {
    // Default fallback to text reading
    text = await file.text();
  }

  // Normalize text: clean excessive whitespace and weird control chars
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const words = cleanedText ? cleanedText.split(/\s+/).filter(Boolean) : [];
  const charCount = cleanedText.length;
  const wordCount = words.length;
  const estimatedTokens = Math.ceil(charCount / 4);

  return {
    text: cleanedText,
    fileName,
    fileSize,
    charCount,
    wordCount,
    estimatedTokens,
  };
}

async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXmlFile = zip.file('word/document.xml');

    if (!documentXmlFile) {
      throw new Error('document.xml not found inside docx archive');
    }

    const xmlContent = await documentXmlFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

    // Extract all paragraphs
    const paragraphs = xmlDoc.getElementsByTagName('w:p');
    const lines: string[] = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const textNodes = p.getElementsByTagName('w:t');
      let pText = '';
      for (let j = 0; j < textNodes.length; j++) {
        pText += textNodes[j].textContent || '';
      }
      if (pText.trim()) {
        lines.push(pText.trim());
      }
    }

    return lines.join('\n\n');
  } catch (err: any) {
    console.error('Error parsing docx file:', err);
    throw new Error(`Failed to extract text from DOCX: ${err.message || err}`);
  }
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Dynamic import of pdfjs-dist
    const pdfjs = await import('pdfjs-dist');
    
    // Configure worker if not already configured
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => item.str || '')
        .filter((str: string) => str.trim().length > 0);
      pageTexts.push(pageStrings.join(' '));
    }

    return pageTexts.join('\n\n');
  } catch (err: any) {
    console.warn('PDF.js worker fallback parsing:', err);
    // If pdfjs fails (e.g. strict cross-origin worker), attempt basic binary string stream scrape or rethrow
    try {
      const text = await file.text();
      // Simple stream regex fallback for uncompressed streams
      const matches = text.match(/\(([^)]+)\)\s*Tj/g);
      if (matches && matches.length > 5) {
        return matches
          .map((m) => m.replace(/^[(\s]+|[)\s]+Tj$/g, ''))
          .join(' ');
      }
    } catch {
      // Ignore
    }
    throw new Error(`Could not parse PDF text: ${err.message || 'Corrupt or protected PDF'}`);
  }
}
