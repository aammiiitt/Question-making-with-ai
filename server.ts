import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import * as pdfParseModule from 'pdf-parse';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

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

    // Hard Constraint Validation: Marking scheme marks sum must strictly equal question.marks
    const targetMarks = Number(marks) || 1;
    parsedJson.marks = targetMarks;

    if (Array.isArray(parsedJson.marking_scheme) && parsedJson.marking_scheme.length > 0) {
      let schemeSum = parsedJson.marking_scheme.reduce(
        (sum: number, item: any) => sum + (Number(item.marks) || 0),
        0
      );
      if (schemeSum !== targetMarks) {
        // Attempt focused 1-step correction: adjust the last criterion
        const diff = targetMarks - schemeSum;
        const lastIdx = parsedJson.marking_scheme.length - 1;
        if (parsedJson.marking_scheme[lastIdx].marks + diff > 0) {
          parsedJson.marking_scheme[lastIdx].marks += diff;
        } else {
          // Fallback to single proportional criterion
          parsedJson.marking_scheme = [
            { criterion: 'Complete accurate solution with correct working steps', marks: targetMarks },
          ];
        }
      }
    } else {
      parsedJson.marking_scheme = [
        { criterion: 'Complete accurate solution with correct working steps', marks: targetMarks },
      ];
    }

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
 * Extracts text and pages from uploaded PDF using REAL per-page physical extraction.
 * Never estimates page text by character position.
 * Rejects scanned / image-only PDFs with OCR requirement message.
 */
app.post('/api/extract-pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file was provided.' });
    }

    // Real per-page extraction via pdfjs-dist
    const uint8Array = new Uint8Array(req.file.buffer);
    const loadingTask = (pdfjsLib as any).getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages || 1;

    const pageChunks: { pageNumber: number; text: string }[] = [];
    let totalExtractedChars = 0;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      let pageText = '';
      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string') {
          pageText += item.str + ' ';
        }
      }
      const cleanText = pageText.replace(/\s+/g, ' ').trim();
      totalExtractedChars += cleanText.length;
      pageChunks.push({
        pageNumber: i,
        text: cleanText,
      });
    }

    // Scanned / Image-Based PDF Detection:
    // If total text across all pages is negligible (< 50 chars) or average per page < 15 chars
    if (totalExtractedChars < 50 || totalExtractedChars / Math.max(1, numPages) < 15) {
      return res.status(422).json({
        success: false,
        error:
          'We could not reliably extract text from this PDF. It may be scanned or image-based. OCR is required.',
      });
    }

    return res.json({
      success: true,
      pageCount: numPages,
      pages: pageChunks,
      totalExtractedChars,
    });
  } catch (error: any) {
    console.error('Error parsing PDF with pdfjs-dist:', error);
    return res.status(500).json({
      error:
        'We could not reliably extract text from this PDF. It may be scanned or image-based. OCR is required.',
      details: error.message,
    });
  }
});

/**
 * Endpoint: POST /api/detect-chapters
 * Uses Gemini to parse Table of Contents / intro pages to detect chapters,
 * and builds REAL knowledge chunks containing actual extracted PDF text across allPages.
 */
app.post('/api/detect-chapters', async (req: Request, res: Response) => {
  try {
    const { documentId, bookTitle, tocPages, allPages, pages, isDemo } = req.body;
    if (!aiClient) {
      return res.status(503).json({ error: 'Gemini not available.' });
    }

    // Requirement 1: Separate tocPages (for Gemini detection) and allPages (for chunk building)
    const fullPages = Array.isArray(allPages) && allPages.length > 0
      ? allPages
      : (Array.isArray(pages) ? pages : []);

    const sampleTocPages = Array.isArray(tocPages) && tocPages.length > 0
      ? tocPages
      : fullPages.slice(0, 25);

    const pagesText = sampleTocPages
      .map((p: any) => `[Page ${p.pageNumber}]: ${p.text}`)
      .join('\n\n')
      .slice(0, 24000);

    const prompt = `Analyze the following Table of Contents / initial pages of the textbook titled "${bookTitle}".
Extract the exact list of chapters, their estimated physical start and end page numbers, and core topics.
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

    // Requirement 2: Never invent chapters for real books
    if (rawChapters.length === 0) {
      if (!isDemo) {
        return res.status(422).json({
          success: false,
          status: 'needs_review',
          error: 'CHAPTER DETECTION NEEDS REVIEW: Could not reliably detect chapters from table of contents. Please map chapter page ranges manually.',
          chapters: [],
          topics: [],
          chunks: [],
        });
      }
    }

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

    // Requirement 1: Build knowledge chunks from ALL extracted physical pages (fullPages), NOT truncated pages!
    rawChapters.forEach((rc: any, idx: number) => {
      const chapId = `chap-${documentId}-${rc.chapter_number || idx + 1}`;
      const chapTopics =
        rc.topics?.length > 0 ? rc.topics : [`${rc.title} Concepts`, `${rc.title} Practice`];

      chapTopics.forEach((tName: string, tIdx: number) => {
        const topId = `top-${chapId}-${tIdx + 1}`;
        topics.push({
          id: topId,
          chapter_id: chapId,
          document_id: documentId,
          title: tName,
        });
      });

      // Gather ACTUAL text from physical pages within [page_start, page_end] across the ENTIRE document
      const chapterPages = fullPages.filter(
        (p: any) =>
          p.pageNumber >= rc.page_start &&
          p.pageNumber <= rc.page_end &&
          p.text &&
          p.text.trim().length > 0
      );

      if (chapterPages.length > 0) {
        // Group into real chunks of 2 physical pages
        const pageSize = 2;
        for (let cIdx = 0; cIdx < chapterPages.length; cIdx += pageSize) {
          const group = chapterPages.slice(cIdx, cIdx + pageSize);
          const startP = group[0].pageNumber;
          const endP = group[group.length - 1].pageNumber;
          const actualText = group
            .map((gp: any) => `[Page ${gp.pageNumber}]\n${gp.text}`)
            .join('\n\n');

          chunks.push({
            id: `chunk-${chapId}-${Math.floor(cIdx / pageSize) + 1}`,
            document_id: documentId,
            chapter_id: chapId,
            page_start: startP,
            page_end: endP,
            text: actualText,
            extraction_confidence: 0.98,
          });
        }
      }
    });

    return res.json({ success: true, status: 'detected', chapters, topics, chunks });
  } catch (error: any) {
    console.error('Error detecting chapters:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: POST /api/rebuild-chapter-chunks
 * Rebuilds knowledge chunks after teacher verifies or edits physical PDF chapter ranges
 */
app.post('/api/rebuild-chapter-chunks', async (req: Request, res: Response) => {
  try {
    const { documentId, chapters, allPages } = req.body;
    if (!Array.isArray(chapters) || !Array.isArray(allPages)) {
      return res.status(400).json({ error: 'chapters and allPages arrays are required.' });
    }

    const chunks: any[] = [];
    chapters.forEach((chap: any) => {
      const chapterPages = allPages.filter(
        (p: any) =>
          p.pageNumber >= Number(chap.page_start) &&
          p.pageNumber <= Number(chap.page_end) &&
          p.text &&
          p.text.trim().length > 0
      );

      const pageSize = 2;
      for (let cIdx = 0; cIdx < chapterPages.length; cIdx += pageSize) {
        const group = chapterPages.slice(cIdx, cIdx + pageSize);
        const startP = group[0].pageNumber;
        const endP = group[group.length - 1].pageNumber;
        const actualText = group
          .map((gp: any) => `[Page ${gp.pageNumber}]\n${gp.text}`)
          .join('\n\n');

        chunks.push({
          id: `chunk-${chap.id}-${Math.floor(cIdx / pageSize) + 1}`,
          document_id: documentId,
          chapter_id: chap.id,
          page_start: startP,
          page_end: endP,
          text: actualText,
          extraction_confidence: 0.98,
        });
      }
    });

    return res.json({ success: true, chunks });
  } catch (error: any) {
    console.error('Error rebuilding chapter chunks:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: POST /api/analyze-chapter-weightage
 * AI Intelligent Chapter Weightage Analysis for Class VI Mathematics
 * Evaluates the 5 Factors with representative multi-sample chapter context & deterministic text statistics.
 */
app.post('/api/analyze-chapter-weightage', async (req: Request, res: Response) => {
  try {
    const { documentTitle, selectedChapters } = req.body;
    if (!aiClient) {
      return res.status(503).json({ error: 'Gemini client not initialized.' });
    }

    if (!Array.isArray(selectedChapters) || selectedChapters.length === 0) {
      return res.status(400).json({ error: 'Please select at least one chapter for analysis.' });
    }

    // Requirement 5: Analyze more of each chapter with representative 3-sample context + statistics
    const chaptersSummary = selectedChapters
      .map((c: any, idx: number) => {
        const pagesCount = Math.max(1, (c.page_end - c.page_start) + 1);
        return `Chapter ${idx + 1}:
ID: ${c.chapter_id}
Title: ${c.chapter_title}
Number: ${c.chapter_number || idx + 1}
Physical Page Range: ${c.page_start} to ${c.page_end} (${pagesCount} physical pages)
Effective Instructional/Exercise Pages: ${c.effective_pages_count || pagesCount}
Text Volume Statistics: ~${c.total_words || Math.round(pagesCount * 220)} words, ~${c.total_chars || Math.round(pagesCount * 1400)} characters
Approximate Worked Examples Detected: ${c.worked_examples_count ?? 'Multiple worked-out examples'}
Approximate Exercises & Questions: ${c.exercises_count ?? 'Standard chapter exercise sets'}
Presence of Geometric/Diagram Materials: ${c.has_diagrams ? 'Yes (Diagrams, constructions or geometrical figures detected)' : 'Standard numerical/algebraic topics'}
Detected Subtopics: ${(c.topics && c.topics.length > 0) ? c.topics.join(', ') : 'Key chapter concepts'}

Beginning Representative Sample (~1500 chars):
${(c.beginning_sample || c.sample_text || '').slice(0, 1600)}

Middle Representative Sample (~1500 chars):
${(c.middle_sample || '').slice(0, 1600)}

Ending Representative Sample (~1500 chars):
${(c.ending_sample || '').slice(0, 1600)}`;
      })
      .join('\n\n========================================\n\n');

    const prompt = `You are a senior Class VI Mathematics academic supervisor preparing a 70-mark school examination question paper.
Textbook: "${documentTitle || 'Class VI Mathematics'}"

You must evaluate ONLY the following TEACHER-SELECTED chapters:

${chaptersSummary}

Analyze each chapter according to these 5 distinct factors:
1. Effective Content Volume / Page Coverage (30% weightage):
   Examine explanations, examples, exercises, worked problems, activities, and diagrams. Do not use page count blindly.
2. Mathematical / Foundational Importance (30% weightage):
   Evaluate fundamental conceptual significance for Class VI numeracy, integers, fractions, algebra, or geometry.
3. Relationship to Other Chapters (20% weightage):
   Assess whether this chapter is a prerequisite for others or has strong conceptual links.
4. Skill & Problem-Solving Breadth (15% weightage):
   Assess calculation, conceptual understanding, multi-step word problems, and construction.
5. Assessment Richness (5% weightage):
   Evaluate variety of assessable questions (1M, 2M, 3M, 4M).

For each chapter, provide:
- chapter_id (exact match from input)
- chapter_title
- effective_pages (estimated instructional/exercise page count)
- page_volume_score (0-100)
- importance_score (0-100)
- chapter_relationship_score (0-100)
- skill_breadth_score (0-100)
- assessment_richness_score (0-100)
- overall_score (formula: 0.30*page_volume_score + 0.30*importance_score + 0.20*chapter_relationship_score + 0.15*skill_breadth_score + 0.05*assessment_richness_score, rounded to 1 decimal place)
- importance_label ("Essential Foundation", "High", "Moderate", "Supplementary")
- short_reason (concise 1-2 sentence academic reason for the teacher)
- factor_notes:
  - content_volume: note on volume & worked examples
  - foundational_importance: note on conceptual importance
  - inter_chapter_relevance: note on prerequisites & connections
  - problem_solving_breadth: note on problem types supported
  - assessment_richness: note on question variety

DO NOT generate final integer marks (the deterministic largest-remainder solver assigns marks). Return only scores and reasons.`;

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
                  chapter_id: { type: Type.STRING },
                  chapter_title: { type: Type.STRING },
                  effective_pages: { type: Type.NUMBER },
                  page_volume_score: { type: Type.NUMBER },
                  importance_score: { type: Type.NUMBER },
                  chapter_relationship_score: { type: Type.NUMBER },
                  skill_breadth_score: { type: Type.NUMBER },
                  assessment_richness_score: { type: Type.NUMBER },
                  overall_score: { type: Type.NUMBER },
                  importance_label: {
                    type: Type.STRING,
                    enum: ['Essential Foundation', 'High', 'Moderate', 'Supplementary'],
                  },
                  short_reason: { type: Type.STRING },
                  factor_notes: {
                    type: Type.OBJECT,
                    properties: {
                      content_volume: { type: Type.STRING },
                      foundational_importance: { type: Type.STRING },
                      inter_chapter_relevance: { type: Type.STRING },
                      problem_solving_breadth: { type: Type.STRING },
                      assessment_richness: { type: Type.STRING },
                    },
                    required: [
                      'content_volume',
                      'foundational_importance',
                      'inter_chapter_relevance',
                      'problem_solving_breadth',
                      'assessment_richness',
                    ],
                  },
                },
                required: [
                  'chapter_id',
                  'chapter_title',
                  'effective_pages',
                  'page_volume_score',
                  'importance_score',
                  'chapter_relationship_score',
                  'skill_breadth_score',
                  'assessment_richness_score',
                  'overall_score',
                  'importance_label',
                  'short_reason',
                  'factor_notes',
                ],
              },
            },
          },
          required: ['chapters'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing chapter weightage:', error);
    return res.status(500).json({
      error: 'Chapter weightage analysis failed.',
      details: error.message,
    });
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
