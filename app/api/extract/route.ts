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

export const maxDuration = 60;

// Function to extract text from PowerPoint files
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
    
    for (const slideFile of slideFiles) {
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
        slideTexts.push(`--- Slide ${slideNumber} ---\n${slideText.join('\n')}`);
      }
    }
    
    // Also try to extract from slide notes
    const notesFiles = Object.keys(zip.files).filter(filename => 
      filename.startsWith('ppt/notesSlides/notesSlide') && filename.endsWith('.xml')
    );
    
    for (const notesFile of notesFiles) {
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
        slideTexts.push(`--- Notes for Slide ${slideNumber} ---\n${notesText.join('\n')}`);
      }
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

export async function POST(req: Request) {
  try {
    const { files } = await req.json();
    
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Process each file and extract text
    const processedFiles = [];
    
    for (const file of files) {
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
        // Keep PDF files for Gemini to process
        processedFiles.push({
          name: file.name,
          type: 'file',
          data: file.data,
          mimeType: 'application/pdf'
        });
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
    
    // Create content for Gemini
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
  } catch (error) {
    console.error("Text extraction API error:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to extract text from documents",
      success: false,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}