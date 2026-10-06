import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { storageService } from './storageService';
import { classifyPageCoverage, computePageCoverageSummary } from '../utils/pageClassification';
import { PageCoverageRecord, DocumentItem } from '../types';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export interface OcrProgressCallback {
  (current: number, total: number, message: string): void;
}

export class OcrService {
  /**
   * Renders a single physical PDF page to a high-resolution JPEG base64 string.
   * Cleans up canvas immediately after rendering to prevent memory bloat on large PDFs.
   */
  public async renderPageToJpeg(
    pdfDoc: any,
    pageNumber: number,
    scale: number = 1.6
  ): Promise<string> {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Could not create 2D canvas context for page rendering.');
    }

    // Fill white background for clean text vision
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    // Clean up DOM canvas immediately to prevent memory leak
    canvas.width = 0;
    canvas.height = 0;

    return dataUrl;
  }

  /**
   * Loads a PDF Document from File, ArrayBuffer, or server cache URL
   */
  public async loadPdfDocument(source: File | ArrayBuffer | string): Promise<any> {
    if (typeof source === 'string') {
      const loadingTask = pdfjsLib.getDocument({
        url: source,
        useSystemFonts: true,
      });
      return loadingTask.promise;
    } else if (source instanceof File) {
      const buffer = await source.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: buffer,
        useSystemFonts: true,
      });
      return loadingTask.promise;
    } else {
      const loadingTask = pdfjsLib.getDocument({
        data: source,
        useSystemFonts: true,
      });
      return loadingTask.promise;
    }
  }

  /**
   * Runs batched multimodal OCR on specified physical page numbers.
   * - Only processes un-transcribed or failed pages (never duplicates already successful pages).
   * - Saves progress after every batch to allow retry / resume.
   * - Updates stored page coverage and document pages with authoritative finalText.
   */
  public async processOcr(
    document: DocumentItem,
    pdfSource: File | ArrayBuffer | string,
    targetPageNumbers?: number[],
    onProgress?: OcrProgressCallback
  ): Promise<{
    successfulPages: number;
    failedPages: number;
    updatedRecords: PageCoverageRecord[];
  }> {
    const docId = document.id;
    const existingRecords = storageService.getPageCoverage(docId);

    // Determine target pages needing OCR
    let pagesToProcess: number[] = [];
    if (targetPageNumbers && targetPageNumbers.length > 0) {
      // Filter out pages that already have ocrStatus === 'success'
      pagesToProcess = targetPageNumbers.filter((num) => {
        const found = existingRecords.find((r) => r.pageNumber === num);
        return !(found && found.ocrStatus === 'success');
      });
    } else {
      // All pages requiring OCR (garbled, empty, low_text, or not yet ocr_success)
      pagesToProcess = existingRecords
        .filter((r) => r.requiresOcr && r.ocrStatus !== 'success')
        .map((r) => r.pageNumber);
    }

    if (pagesToProcess.length === 0) {
      if (onProgress) onProgress(0, 0, 'All requested pages are already transcribed.');
      return {
        successfulPages: 0,
        failedPages: 0,
        updatedRecords: existingRecords,
      };
    }

    if (onProgress) {
      onProgress(0, pagesToProcess.length, `Initializing OCR engine for ${pagesToProcess.length} pages...`);
    }

    const pdfDoc = await this.loadPdfDocument(pdfSource);
    const BATCH_SIZE = 2; // Keep small to prevent browser freeze and handle 59MB / 158-page books smoothly
    let completedCount = 0;
    let successfulCount = 0;
    let failedCount = 0;

    const currentRecordsMap = new Map<number, PageCoverageRecord>(
      existingRecords.map((r) => [r.pageNumber, { ...r }])
    );

    for (let i = 0; i < pagesToProcess.length; i += BATCH_SIZE) {
      const batchPageNums = pagesToProcess.slice(i, i + BATCH_SIZE);
      const batchImages: { pageNumber: number; imageBase64: string }[] = [];

      // Render physical pages sequentially to keep RAM minimal
      for (const pNum of batchPageNums) {
        if (onProgress) {
          onProgress(
            completedCount,
            pagesToProcess.length,
            `Rendering PDF Page ${pNum} / ${document.page_count}...`
          );
        }
        try {
          const imgBase64 = await this.renderPageToJpeg(pdfDoc, pNum);
          batchImages.push({ pageNumber: pNum, imageBase64: imgBase64 });
        } catch (renderErr: any) {
          console.error(`Failed to render page ${pNum}:`, renderErr);
          failedCount++;
          completedCount++;
        }
      }

      if (batchImages.length > 0) {
        if (onProgress) {
          onProgress(
            completedCount,
            pagesToProcess.length,
            `Transcribing pages ${batchPageNums.join(', ')} with Gemini Vision...`
          );
        }

        try {
          const res = await fetch('/api/ocr-pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentId: docId,
              language: document.language || 'Bengali',
              pages: batchImages,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Server OCR request failed');
          }

          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            for (const ocrResult of data.results) {
              completedCount++;
              const prevRecord = currentRecordsMap.get(ocrResult.pageNumber);
              const nativeText = prevRecord ? prevRecord.rawExtractedText || prevRecord.nativeText || '' : '';

              const updatedRecord = classifyPageCoverage(
                ocrResult.pageNumber,
                nativeText,
                false,
                {
                  text: ocrResult.text,
                  status: ocrResult.status,
                  errorReason: ocrResult.errorReason,
                },
                prevRecord?.printedPageNumber
              );

              // Maintain chapterId if previously assigned
              if (prevRecord?.chapterId) {
                updatedRecord.chapterId = prevRecord.chapterId;
              }

              currentRecordsMap.set(ocrResult.pageNumber, updatedRecord);

              if (updatedRecord.extractionStatus === 'vision_recovered' && updatedRecord.isTrustworthy) {
                successfulCount++;
              } else {
                failedCount++;
              }
            }
          }
        } catch (batchErr: any) {
          console.error('Batch OCR error:', batchErr);
          for (const item of batchImages) {
            completedCount++;
            failedCount++;
            const prevRecord = currentRecordsMap.get(item.pageNumber);
            const nativeText = prevRecord ? prevRecord.rawExtractedText || prevRecord.nativeText || '' : '';
            const failedRecord = classifyPageCoverage(item.pageNumber, nativeText, false, {
              text: '',
              status: 'ocr_failed',
              errorReason: batchErr.message,
            });
            if (prevRecord?.chapterId) {
              failedRecord.chapterId = prevRecord.chapterId;
            }
            currentRecordsMap.set(item.pageNumber, failedRecord);
          }
        }

        // Persist records after each batch so progress is never lost
        const updatedList = Array.from(currentRecordsMap.values()).sort(
          (a, b) => a.pageNumber - b.pageNumber
        );
        storageService.savePageCoverage(docId, updatedList);

        // Update stored document pages with the authoritative finalText
        const pagesForStorage = updatedList.map((r) => ({
          pageNumber: r.pageNumber,
          text: r.finalText || r.rawExtractedText || r.nativeText || '',
          rawExtractedText: r.rawExtractedText || r.nativeText || '',
          normalizedText: r.normalizedText,
          nativeText: r.nativeText,
          visionText: r.visionText,
          nativeConfidence: r.nativeConfidence,
          visionConfidence: r.visionConfidence,
          extractionMethod: r.extractionMethod,
          extractionStatus: r.extractionStatus,
          extractionConfidence: r.extractionConfidence,
          validationFlags: r.validationFlags,
          textQualityStatus: r.textQualityStatus,
          physicalPdfPage: r.physicalPdfPage || r.pageNumber,
          printedPageNumber: r.printedPageNumber,
          chapterId: r.chapterId,
        }));
        storageService.saveDocumentPages(docId, pagesForStorage);

        // Update document statistics
        const summary = computePageCoverageSummary(updatedList, document.page_count);
        const updatedDoc: DocumentItem = {
          ...document,
          usable_pages_count: summary.usablePagesCount,
          attention_pages_count: summary.attentionPagesCount,
          coverage_percentage: summary.coveragePercentage,
          total_extracted_chars: summary.totalExtractedChars,
          total_words: summary.approxTotalWords,
          native_good_pages_count: summary.nativeGoodCount,
          native_garbled_pages_count: summary.nativeGarbledCount,
          native_low_text_pages_count: summary.nativeLowTextCount,
          image_only_pages_count: summary.imageOnlyCount,
          ocr_processed_pages_count: summary.ocrProcessedCount,
          ocr_successful_pages_count: summary.ocrSuccessfulCount,
          ocr_fallback_mode: summary.ocrFallbackMode,
        };
        storageService.saveDocument(updatedDoc);
      }

      // Small async yield to prevent blocking UI thread
      await new Promise((r) => setTimeout(r, 60));
    }

    if (onProgress) {
      onProgress(
        pagesToProcess.length,
        pagesToProcess.length,
        `OCR complete: ${successfulCount} succeeded, ${failedCount} failed.`
      );
    }

    const finalRecords = Array.from(currentRecordsMap.values()).sort(
      (a, b) => a.pageNumber - b.pageNumber
    );

    return {
      successfulPages: successfulCount,
      failedPages: failedCount,
      updatedRecords: finalRecords,
    };
  }
}

export const ocrService = new OcrService();
