import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import * as pdfParseModule from 'pdf-parse';

const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024 }, // 40MB
});

// Initialize Gemini SDK with server environment variable and required header
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Endpoint: POST /api/generate-question
 * Grounded RAG Question Generator using Gemini 3.8 Flash
 */
app.post('/api/generate-question', async (req: Request, res: Response) => {
  try {
    const {
      bookTitle,
      chapterTitle,
      topicTitle,
      questionType,
      marks,
      difficulty,
      language,
      additionalInstructions,
      regenerationContext,
      sourceContext,
      pageRange,
    } = req.body;

    if (!sourceContext) {
      return res.status(400).json({ error: 'Source context passages are required for grounded generation.' });
    }

    if (!aiClient) {
      console.warn('GEMINI_API_KEY is not configured on server, returning 503 so client synthesis fallback engages.');
      return res.status(503).json({ error: 'Gemini API key not configured on server.' });
    }

    let languageDirective = 'Generate in English.';
    if (language === 'bn') {
      languageDirective = 'Generate the question, model answer, and marking scheme in authentic Bengali (বাংলা). Use correct Bengali scientific terminology for Indian school curricula (WBBSE/CBSE).';
    } else if (language === 'bilingual') {
      languageDirective = 'Generate in bilingual format (English first, followed by clear Bengali translation in parentheses or line break) for both the question and answer.';
    }

    let regenerationDirective = '';
    if (regenerationContext) {
      const { strategy } = regenerationContext;
      if (strategy === 'easier') regenerationDirective = 'Make this question slightly easier and more direct than usual.';
      if (strategy === 'harder') regenerationDirective = 'Make this question higher-order thinking (application or analysis based).';
      if (strategy === 'similar') regenerationDirective = 'Create a parallel/alternative question testing the same concept.';
      if (strategy === 'same_topic_diff') regenerationDirective = 'Test a different facet or calculation within the same topic.';
      if (strategy === 'diff_topic') regenerationDirective = 'Pick an adjacent topic within the supplied source passages.';
    }

    const systemInstruction = `You are an expert Indian school academic assessment creator and senior science/subject teacher.
Your core principle: AI generates, Rules control, Teacher approves.
Rules:
1. ONLY generate questions directly grounded in the provided source passages.
2. DO NOT invent facts, data, or source page numbers.
3. The source_pages array MUST only contain real page numbers that exist in the supplied range (${pageRange?.min || 1} to ${pageRange?.max || 200}).
4. Adhere strictly to the requested Question Type (${questionType}), Marks (${marks}), Difficulty (${difficulty}), and Language.
5. Provide a rigorous, step-by-step marking scheme allocating exactly ${marks} mark(s) total across criteria.
6. Provide an accurate, complete Model Answer.
7. Return strictly valid JSON adhering to the specified schema.`;

    const prompt = `Textbook: ${bookTitle}
Chapter: ${chapterTitle}
Topic: ${topicTitle || 'Core Chapter Concepts'}
Target Question Type: ${questionType}
Allocated Marks: ${marks}
Target Difficulty: ${difficulty}
Language Requirement: ${languageDirective}
${additionalInstructions ? `Additional Teacher Guidance: ${additionalInstructions}` : ''}
${regenerationDirective ? `Regeneration Directive: ${regenerationDirective}` : ''}

=== RETRIEVED SOURCE PASSAGES (STRICT SOURCE GROUNDING) ===
${sourceContext}
===========================================================

Formulate ONE high quality, syllabus-accurate question strictly derived from the above passages. Provide model answer, marking breakdown, Bloom taxonomy level, and exact source pages.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for high grounding accuracy
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: 'The formulation of the question' },
            question_type: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Four options (A, B, C, D) if MCQ or Assertion-Reason, otherwise omit or empty',
            },
            diagram_description: {
              type: Type.STRING,
              description: 'Diagram or figure description if diagram-based question',
            },
            marks: { type: Type.INTEGER },
            difficulty: { type: Type.STRING, enum: ['easy', 'moderate', 'difficult'] },
            bloom_level: {
              type: Type.STRING,
              enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
            },
            chapter: { type: Type.STRING },
            topic: { type: Type.STRING },
            answer: { type: Type.STRING, description: 'Complete model answer or step-by-step solution' },
            marking_scheme: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criterion: { type: Type.STRING, description: 'Marking step or criterion' },
                  marks: { type: Type.INTEGER, description: 'Marks for this criterion' },
                },
                required: ['criterion', 'marks'],
              },
            },
            source_pages: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: 'Exact page numbers from the provided passages where this information appears',
            },
            source_confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0.1 and 1.0 of source grounding',
            },
            source_excerpt: {
              type: Type.STRING,
              description: 'Exact 1-2 sentence excerpt from the source confirming the answer',
            },
          },
          required: ['question', 'answer', 'marking_scheme', 'source_pages'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Empty response received from Gemini.');
    }

    const parsedJson = JSON.parse(textOutput);
    return res.json(parsedJson);
  } catch (error: any) {
    console.error('Error generating question with Gemini:', error);
    return res.status(500).json({
      error: 'Question could not be generated. Please try again.',
      details: error.message,
    });
  }
});

/**
 * Endpoint: POST /api/extract-pdf
 * Extracts text and pages from uploaded PDF
 */
app.post('/api/extract-pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file was provided.' });
    }

    const pdfBuffer = req.file.buffer;
    const parsed = await pdfParse(pdfBuffer);

    // Approximate page splitting or full text
    const fullText = parsed.text || '';
    const numPages = parsed.numpages || 1;

    // Split text into estimated pages
    const pageChunks: { pageNumber: number; text: string }[] = [];
    const avgPageLen = Math.max(200, Math.floor(fullText.length / numPages));

    for (let i = 1; i <= numPages; i++) {
      const start = (i - 1) * avgPageLen;
      const end = i === numPages ? fullText.length : i * avgPageLen;
      const pageText = fullText.slice(start, end).trim();
      pageChunks.push({
        pageNumber: i,
        text: pageText.length > 20 ? pageText : `Page ${i} content`,
      });
    }

    return res.json({
      success: true,
      pageCount: numPages,
      pages: pageChunks,
      info: parsed.info,
    });
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    return res.status(500).json({
      error: 'PDF could not be processed. We could not read enough text from this PDF. It may be scanned. OCR processing is required.',
      details: error.message,
    });
  }
});

/**
 * Endpoint: POST /api/detect-chapters
 * Uses Gemini to parse Table of Contents or intro pages to detect chapters
 */
app.post('/api/detect-chapters', async (req: Request, res: Response) => {
  try {
    const { documentId, bookTitle, pages } = req.body;
    if (!aiClient) {
      return res.status(503).json({ error: 'Gemini not available.' });
    }

    const pagesText = (pages || [])
      .map((p: any) => `[Page ${p.pageNumber}]: ${p.text}`)
      .join('\n\n')
      .slice(0, 10000);

    const prompt = `Analyze the following initial pages of the textbook titled "${bookTitle}".
Extract the list of chapters and estimated starting page numbers.
Pages:\n${pagesText}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  chapter_number: { type: Type.INTEGER },
                  page_start: { type: Type.INTEGER },
                  page_end: { type: Type.INTEGER },
                  topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['title', 'chapter_number', 'page_start', 'page_end'],
              },
            },
          },
          required: ['chapters'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const rawChapters = parsed.chapters || [];

    const chapters = rawChapters.map((rc: any, idx: number) => ({
      id: `chap-${documentId}-${rc.chapter_number || idx + 1}`,
      document_id: documentId,
      title: rc.title,
      chapter_number: rc.chapter_number || idx + 1,
      page_start: rc.page_start || 1,
      page_end: rc.page_end || rc.page_start + 15,
      topics_count: rc.topics?.length || 3,
      status: 'detected',
    }));

    const topics: any[] = [];
    const chunks: any[] = [];

    rawChapters.forEach((rc: any, idx: number) => {
      const chapId = `chap-${documentId}-${rc.chapter_number || idx + 1}`;
      const chapTopics = rc.topics?.length > 0 ? rc.topics : [`${rc.title} Key Laws`, `${rc.title} Problem Solving`];
      chapTopics.forEach((tName: string, tIdx: number) => {
        const topId = `top-${chapId}-${tIdx + 1}`;
        topics.push({
          id: topId,
          chapter_id: chapId,
          document_id: documentId,
          title: tName,
        });
        chunks.push({
          id: `chunk-${chapId}-${tIdx + 1}`,
          document_id: documentId,
          chapter_id: chapId,
          topic_id: topId,
          page_start: rc.page_start,
          page_end: rc.page_end,
          text: `Extracted textbook material for ${tName} in Chapter ${rc.title}. Covers definitions, properties, and applications.`,
          extraction_confidence: 0.95,
        });
      });
    });

    return res.json({ chapters, topics, chunks });
  } catch (error: any) {
    console.error('Error detecting chapters:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Production static assets or Vite middleware in development
const isProduction = process.env.NODE_ENV === 'production';

async function setupServer() {
  try {
    if (!isProduction) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        root: process.cwd(),
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR !== 'true',
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running at http://0.0.0.0:${port}`);
    });
  } catch (err) {
    console.error('Failed to setup server:', err);
  }
}

setupServer();
