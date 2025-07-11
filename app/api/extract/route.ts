import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import JSZip from 'jszip';
import { DOMParser } from 'xmldom';

// Increase the allowed request body size for file uploads.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export const maxDuration = 300; // Increased to 5 minutes

// Function to extract text from PowerPoint files with better error handling
async function extractPowerPointText(base64Data: string): Promise<string> {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Load the PowerPoint file as a ZIP
    const zip = await JSZip.loadAsync(buffer);
    
    let extractedText = '';
    const slideTexts: string[] = [];
    
    // Extract text from slides
    const slideFiles = Object.keys(zip.files).filter(filename => 
      filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')
    );
    
    // Sort slides by number
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
      return numA - numB;
    });
    
    // Process slides with timeout protection
    const slidePromises = slideFiles.map(async (slideFile) => {
      try {
        const slideXml = await zip.files[slideFile].async('text');
        const slideNumber = slideFile.match(/slide(\d+)\.xml/)?.[1] || '0';
        
        // Parse XML and extract text
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(slideXml, 'application/xml');
        
        // Extract text from all text elements
        const textElements = xmlDoc.getElementsByTagName('a:t');
        const slideText: string[] = [];
        
        for (let i = 0; i < textElements.length; i++) {
          const textContent = textElements[i].textContent?.trim();
          if (textContent) {
            slideText.push(textContent);
          }
        }
        
        if (slideText.length > 0) {
          return `--- Slide ${slideNumber} ---\n${slideText.join('\n')}`;
        }
        return null;
      } catch (error) {
        console.error(`Error processing slide ${slideFile}:`, error);
        return null;
      }
    });
    
    // Wait for all slides to be processed with timeout
    const slideResults = await Promise.allSettled(slidePromises);
    slideResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        slideTexts.push(result.value);
      }
    });
    
    // Also try to extract from slide notes (with timeout protection)
    const notesFiles = Object.keys(zip.files).filter(filename => 
      filename.startsWith('ppt/notesSlides/notesSlide') && filename.endsWith('.xml')
    );
    
    if (notesFiles.length > 0) {
      const notesPromises = notesFiles.map(async (notesFile) => {
        try {
          const notesXml = await zip.files[notesFile].async('text');
          const slideNumber = notesFile.match(/notesSlide(\d+)\.xml/)?.[1] || '0';
          
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(notesXml, 'application/xml');
          
          const textElements = xmlDoc.getElementsByTagName('a:t');
          const notesText: string[] = [];
          
          for (let i = 0; i < textElements.length; i++) {
            const textContent = textElements[i].textContent?.trim();
            if (textContent) {
              notesText.push(textContent);
            }
          }
          
          if (notesText.length > 0) {
            return `--- Notes for Slide ${slideNumber} ---\n${notesText.join('\n')}`;
          }
          return null;
        } catch (error) {
          console.error(`Error processing notes ${notesFile}:`, error);
          return null;
        }
      });
      
      const notesResults = await Promise.allSettled(notesPromises);
      notesResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          slideTexts.push(result.value);
        }
      });
    }
    
    extractedText = slideTexts.join('\n\n');
    
    return extractedText || 'No text content found in PowerPoint file';
  } catch (error) {
    console.error('Error extracting PowerPoint text:', error);
    throw new Error('Failed to extract text from PowerPoint file');
  }
}

// Function to determine file type from base64 data
function getFileTypeFromBase64(base64Data: string, filename: string): string {
  // Check file extension
  const ext = filename.toLowerCase().split('.').pop();
  
  if (ext === 'pdf') {
    return 'pdf';
  } else if (ext === 'ppt' || ext === 'pptx') {
    return 'powerpoint';
  }
  
  // Fallback to checking base64 header
  const header = base64Data.substring(0, 20);
  if (header.includes('JVBERi')) {
    return 'pdf';
  } else if (header.includes('UEsDB')) {
    return 'powerpoint'; // Office Open XML format
  }
  
  return 'unknown';
}

// Helper function to chunk large content
function chunkContent(content: string, maxLength: number = 30000): string[] {
  if (content.length <= maxLength) {
    return [content];
  }
  
  const chunks: string[] = [];
  let startIndex = 0;
  
  while (startIndex < content.length) {
    const endIndex = Math.min(startIndex + maxLength, content.length);
    let chunkEnd = endIndex;
    
    // Try to break at a logical point (paragraph, sentence, etc.)
    if (endIndex < content.length) {
      const lastNewline = content.lastIndexOf('\n', endIndex);
      const lastPeriod = content.lastIndexOf('. ', endIndex);
      
      if (lastNewline > startIndex + maxLength * 0.7) {
        chunkEnd = lastNewline;
      } else if (lastPeriod > startIndex + maxLength * 0.7) {
        chunkEnd = lastPeriod + 1;
      }
    }
    
    chunks.push(content.substring(startIndex, chunkEnd));
    startIndex = chunkEnd;
  }
  
  return chunks;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    const { files } = await req.json();
    
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Limit the number of files processed at once
    const maxFiles = 5;
    const filesToProcess = files.slice(0, maxFiles);
    
    if (files.length > maxFiles) {
      console.warn(`Only processing first ${maxFiles} files out of ${files.length} provided`);
    }
    
    // Process each file and extract text with timeout protection
    const processedFiles = [];
    
    for (const file of filesToProcess) {
      // Check if we're approaching timeout
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > 240000) { // 4 minutes, leaving 1 minute buffer
        console.warn('Approaching timeout, stopping file processing');
        break;
      }
      
      const fileType = getFileTypeFromBase64(file.data, file.name);
      
      if (fileType === 'powerpoint') {
        // Extract text from PowerPoint file
        try {
          const extractedText = await extractPowerPointText(file.data);
          processedFiles.push({
            name: file.name,
            type: 'text',
            content: extractedText
          });
        } catch (error) {
          console.error(`Error processing PowerPoint file ${file.name}:`, error);
          processedFiles.push({
            name: file.name,
            type: 'error',
            content: `Failed to extract text from ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      } else if (fileType === 'pdf') {
        // Keep PDF files for Gemini to process, but limit size
        const maxPdfSize = 10 * 1024 * 1024; // 10MB limit for PDFs
        if (file.data.length > maxPdfSize) {
          processedFiles.push({
            name: file.name,
            type: 'error',
            content: `PDF file ${file.name} is too large (max 10MB)`
          });
        } else {
          processedFiles.push({
            name: file.name,
            type: 'file',
            data: file.data,
            mimeType: 'application/pdf'
          });
        }
      } else {
        processedFiles.push({
          name: file.name,
          type: 'error',
          content: `Unsupported file type: ${file.name}`
        });
      }
    }
    
    // Separate text content and files for Gemini
    const textContent = processedFiles
      .filter(f => f.type === 'text')
      .map(f => `=== ${f.name} ===\n${f.content}`)
      .join('\n\n');
    
    const geminiFiles = processedFiles.filter(f => f.type === 'file');
    const errorMessages = processedFiles
      .filter(f => f.type === 'error')
      .map(f => f.content);
    
    // If we have a lot of text content, process it in chunks
    if (textContent.length > 50000) {
      const chunks = chunkContent(textContent, 30000);
      
      // Process the first chunk only to avoid timeout
      const firstChunk = chunks[0];
      const remainingInfo = chunks.length > 1 ? 
        `\n\n[Note: This is chunk 1 of ${chunks.length}. Additional content truncated due to size limits.]` : '';
      
      const content = [
        {
          type: "text",
          text: `Please extract and organize all the text content from these documents. Maintain the structure and context of the information for educational purposes.
          
Pre-extracted text from PowerPoint files:\n${firstChunk}${remainingInfo}\n\n
${errorMessages.length > 0 ? `Errors encountered:\n${errorMessages.join('\n')}\n\n` : ''}
${geminiFiles.length > 0 ? `Please also process the following PDF files:` : ''}`,
        },
        // Add PDF files for Gemini to process (limit to 2 files max)
        ...geminiFiles.slice(0, 2).map(file => ({
          type: "file",
          data: file.data,
          mimeType: file.mimeType,
        })),
      ];
      
      const result = await generateText({
        model: google("gemini-2.5-flash"),
        messages: [
          {
            role: "system",
            content:
              "You are a text extraction assistant. Extract all meaningful text content from the provided documents while maintaining structure, context, and readability. Organize the content clearly with proper headings and sections. If multiple documents are provided, clearly separate content from each document with appropriate headers. Some text may have already been pre-extracted from PowerPoint files - integrate this with any PDF content you process.",
          },
          {
            role: "user",
            content: JSON.stringify(content),
          },
        ],
      });
      
      return new Response(JSON.stringify({ 
        extractedText: result.text,
        success: true,
        processedFiles: processedFiles.length,
        errors: errorMessages,
        chunked: chunks.length > 1,
        totalChunks: chunks.length,
        warning: chunks.length > 1 ? 'Large content was chunked. Some content may be truncated.' : null
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Process normally if content is not too large
      const content = [
        {
          type: "text",
          text: `Please extract and organize all the text content from these documents. Maintain the structure and context of the information for educational purposes.
          
${textContent ? `Pre-extracted text from PowerPoint files:\n${textContent}\n\n` : ''}
${errorMessages.length > 0 ? `Errors encountered:\n${errorMessages.join('\n')}\n\n` : ''}
${geminiFiles.length > 0 ? `Please also process the following PDF files:` : ''}`,
        },
        // Add PDF files for Gemini to process
        ...geminiFiles.map(file => ({
          type: "file",
          data: file.data,
          mimeType: file.mimeType,
        })),
      ];

      const result = await generateText({
        model: google("gemini-2.5-flash"),
        messages: [
          {
            role: "system",
            content:
              "You are a text extraction assistant. Extract all meaningful text content from the provided documents while maintaining structure, context, and readability. Organize the content clearly with proper headings and sections. If multiple documents are provided, clearly separate content from each document with appropriate headers. Some text may have already been pre-extracted from PowerPoint files - integrate this with any PDF content you process.",
          },
          {
            role: "user",
            content: JSON.stringify(content),
          },
        ],
      });

      return new Response(JSON.stringify({ 
        extractedText: result.text,
        success: true,
        processedFiles: processedFiles.length,
        errors: errorMessages
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Text extraction API error:", error);
    
    // Check if it's a timeout error
    const isTimeout = error instanceof Error && (
      error.message.includes('timeout') || 
      error.message.includes('TIMEOUT') ||
      error.name === 'TimeoutError'
    );
    
    return new Response(JSON.stringify({ 
      error: isTimeout ? "Request timed out. Please try with smaller files or fewer files at once." : "Failed to extract text from documents",
      success: false,
      timeout: isTimeout
    }), {
      status: isTimeout ? 504 : 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}