declare module "pdf-parse" {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  interface PDFOptions {
    max?: number;
    version?: string;
  }

  function pdfParse(buffer: Buffer, options?: PDFOptions): Promise<PDFData>;
  export = pdfParse;
}

declare module "mammoth" {
  interface ExtractRawTextResult {
    value: string;
    messages: any[];
  }

  interface ExtractRawTextOptions {
    buffer: Buffer;
  }

  export function extractRawText(
    options: ExtractRawTextOptions
  ): Promise<ExtractRawTextResult>;
}
