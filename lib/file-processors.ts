export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  try {
    switch (file.type) {
      case 'application/pdf':
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(Buffer.from(uint8Array));
        return pdfData.text;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const mammoth = (await import('mammoth')).default;
        const docxResult = await mammoth.extractRawText({ buffer: Buffer.from(uint8Array) });
        return docxResult.value;

      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return await extractTextFromPowerPoint(uint8Array);
        
      case 'text/plain':
      case 'text/markdown':
        return new TextDecoder().decode(uint8Array);
        
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }
  } catch (error) {
    throw new Error(`Failed to extract text from ${file.name}. Please ensure the file is not corrupted.`);
  }
}

async function extractTextFromPowerPoint(buffer: Uint8Array): Promise<string> {
  try {
    const PizZip = (await import('pizzip')).default;
    const zip = new PizZip(buffer);
    const slideTexts: string[] = [];
    
    // Extract text from slides
    const slideFiles = Object.keys(zip.files).filter(filename => 
      filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')
    );
    
    for (const slideFile of slideFiles) {
      const slideContent = zip.files[slideFile].asText();
      
      // Extract text content from XML using regex
      const textMatches = slideContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
      if (textMatches) {
        const slideText = textMatches
          .map(match => match.replace(/<[^>]*>/g, ''))
          .join(' ')
          .trim();
        
        if (slideText) {
          slideTexts.push(slideText);
        }
      }
    }
    
    return slideTexts.join('\n\n');
  } catch (error) {
    throw new Error('Failed to extract text from PowerPoint file');
  }
}

export async function extractTextFromMultipleFiles(files: File[]): Promise<string> {
  const textContents: string[] = [];
  
  for (const file of files) {
    try {
      const text = await extractTextFromFile(file);
      if (text.trim()) {
        textContents.push(`--- Content from ${file.name} ---\n${text}\n`);
      }
    } catch (error) {
      // Continue processing other files even if one fails
      const errorMessage = error instanceof Error ? error.message : String(error);
      textContents.push(`--- Error processing ${file.name}: ${errorMessage} ---\n`);
    }
  }
  
  return textContents.join('\n');
}

export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown'
  ];
  
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

export function validateTotalFileSize(files: File[], maxTotalSizeMB: number = 50): boolean {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const maxTotalSizeBytes = maxTotalSizeMB * 1024 * 1024;
  return totalSize <= maxTotalSizeBytes;
}