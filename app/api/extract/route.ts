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

// Function to validate PDF base64 data
function validatePdfData(base64Data: string): boolean {
  try {
    console.log('=== VALIDATING PDF DATA ===');
    console.log('Base64 data length:', base64Data.length);
    console.log('First 100 chars of base64:', base64Data.substring(0, 100));
    
    // Clean base64 data (remove data URL prefix if present)
    let cleanBase64Data = base64Data;
    if (cleanBase64Data.startsWith('data:')) {
      const commaIndex = cleanBase64Data.indexOf(',');
      if (commaIndex !== -1) {
        cleanBase64Data = cleanBase64Data.substring(commaIndex + 1);
        console.log('Removed data URL prefix, new length:', cleanBase64Data.length);
      }
    }
    
    // Check if it's valid base64
    const buffer = Buffer.from(cleanBase64Data, 'base64');
    console.log('Buffer length:', buffer.length);
    
    // Check minimum size (PDF files are typically at least 1KB)
    if (buffer.length < 1024) {
      console.log('PDF validation failed: File too small');
      return false;
    }
    
    // Check for PDF header in the actual binary data
    const header = buffer.toString('ascii', 0, 8);
    console.log('PDF header:', header);
    console.log('Header bytes:', Array.from(buffer.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '));
    
    const isValid = header.startsWith('%PDF');
    console.log('PDF validation result:', isValid);
    return isValid;
  } catch (error) {
    console.log('PDF validation error:', error);
    return false;
  }
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
        // Validate PDF data before processing
        if (!validatePdfData(file.data)) {
          processedFiles.push({
            name: file.name,
            type: 'error',
            content: `Invalid or corrupted PDF file: ${file.name}`
          });
          continue;
        }
        
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
    
    // Combine all extracted text
    let finalExtractedText = '';
    
    // Add PowerPoint text directly (no AI processing needed)
    if (textContent) {
      finalExtractedText += textContent + '\n\n';
    }
    
    // Only use Gemini for PDF processing if there are PDF files
    if (geminiFiles.length > 0) {
      // Process each PDF file separately for better performance
      for (const pdfFile of geminiFiles) {
        try {
          console.log(`Processing PDF: ${pdfFile.name}, base64 length: ${pdfFile.data.length}`);
          
          // Validate base64 data is clean (no data URL prefix)
          let cleanBase64Data = pdfFile.data;
          if (cleanBase64Data.startsWith('data:')) {
            const commaIndex = cleanBase64Data.indexOf(',');
            if (commaIndex !== -1) {
              cleanBase64Data = cleanBase64Data.substring(commaIndex + 1);
            }
          }
          
          console.log(`Clean base64 length: ${cleanBase64Data.length}`);
          
          const pdfResult = await Promise.race([
            generateText({
              model: google("gemini-2.0-flash-exp"),
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Extract all text content from this PDF document. Return only the text content without any additional formatting or explanations. Include headings, paragraphs, lists, and any readable text."
                    },
                    {
                      type: "file",
                      data: cleanBase64Data,
                      mimeType: 'application/pdf'
                    }
                  ]
                }
              ],
              maxTokens: 8000,
              temperature: 0
            }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('PDF processing timeout')), 120000) // 2 minute timeout per PDF
            )
          ]);

          console.log(`PDF processing result for ${pdfFile.name}:`, pdfResult?.text ? `Success - ${pdfResult.text.length} characters` : 'No text returned');
          
          if (pdfResult && pdfResult.text && pdfResult.text.trim()) {
            const extractedText = pdfResult.text.trim();
            console.log(`Extracted text from ${pdfFile.name}:`, extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''));
            finalExtractedText += `\n=== ${pdfFile.name} ===\n${extractedText}\n\n`;
          } else {
            console.warn(`No text extracted from ${pdfFile.name}`);
            console.log(`Full PDF result for ${pdfFile.name}:`, pdfResult);
            errorMessages.push(`No text content found in PDF: ${pdfFile.name}`);
          }
        } catch (error) {
          console.error(`PDF processing error for ${pdfFile.name}:`, error);
          
          // Handle specific error cases
          let errorMessage = `Failed to process PDF ${pdfFile.name}`;
          if (error instanceof Error) {
            if (error.message.includes('no pages') || error.message.includes('document has no pages')) {
              errorMessage += ': PDF appears to be empty or corrupted';
            } else if (error.message.includes('timeout')) {
              errorMessage += ': Processing timed out';
            } else if (error.message.includes('AI_APICallError')) {
              errorMessage += ': API call failed - ' + error.message;
            } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
              errorMessage += ': Invalid PDF format or corrupted file';
            } else {
              errorMessage += `: ${error.message}`;
            }
          }
          
          errorMessages.push(errorMessage);
        }
      }
    }
    
    // Log final results
    console.log('=== FINAL EXTRACTION RESULTS ===');
    console.log('Total extracted text length:', finalExtractedText.length);
    console.log('PDFs processed:', geminiFiles.length);
    console.log('Errors:', errorMessages);
    console.log('Final text preview:', finalExtractedText.substring(0, 1000) + (finalExtractedText.length > 1000 ? '...' : ''));
    
    // Return the combined extracted text
    return new Response(JSON.stringify({ 
      extractedText: finalExtractedText || 'No text content extracted',
      success: true,
      processedFiles: processedFiles.length,
      errors: errorMessages,
      pdfProcessed: geminiFiles.length > 0,
      fastMode: true, // Indicates we used fast processing
      debugInfo: {
        totalExtractedLength: finalExtractedText.length,
        pdfsProcessed: geminiFiles.length,
        textPreview: finalExtractedText.substring(0, 500)
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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