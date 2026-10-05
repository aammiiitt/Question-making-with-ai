import { universalAssessmentEngine } from './universalEngine';
import { class6MathProfile, CLASS_VI_MATH_BENCHMARK_PRESET } from './profiles/class6MathProfile';
import {
  AssessmentValidationReport,
  UniversalAssessmentAudit,
  SubjectProfileAudit,
} from './types';
import { ClassVIExamPaper } from '../../types';

export * from './types';
export { universalAssessmentEngine } from './universalEngine';
export { class6MathProfile, CLASS_VI_MATH_BENCHMARK_PRESET } from './profiles/class6MathProfile';

/**
 * High-level Assessment Service combining Universal Rules Engine + Subject Profiles
 */
export class AssessmentService {
  /**
   * Generates a complete assessment validation report for the examination paper
   */
  public generateFullReport(paper: ClassVIExamPaper): AssessmentValidationReport {
    // 1. Universal Rules Audit
    const universalAudit: UniversalAssessmentAudit = universalAssessmentEngine.evaluate(paper);

    // 2. Subject Profile Audit (Class VI Mathematics Profile by default)
    const profile = class6MathProfile;
    const subjectProfileAudit: SubjectProfileAudit = profile.evaluateSubjectRules(
      paper,
      paper.slots || []
    );

    const criticalErrors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Tally issues
    for (const rule of universalAudit.results) {
      if (rule.status === 'failed') {
        criticalErrors.push(`[Universal] ${rule.name}: ${rule.summary}`);
      } else if (rule.status === 'warning') {
        warnings.push(`[Universal] ${rule.name}: ${rule.summary}`);
      }
      if (rule.recommendation) {
        suggestions.push(rule.recommendation);
      }
    }

    for (const rule of subjectProfileAudit.results) {
      if (rule.status === 'failed') {
        criticalErrors.push(`[${profile.name}] ${rule.name}: ${rule.summary}`);
      } else if (rule.status === 'warning') {
        warnings.push(`[${profile.name}] ${rule.name}: ${rule.summary}`);
      }
      if (rule.recommendation) {
        suggestions.push(rule.recommendation);
      }
    }

    const totalScore = Math.round(
      (universalAudit.overallScore * 0.65) + (subjectProfileAudit.overallScore * 0.35)
    );

    const isReady =
      universalAudit.passed &&
      subjectProfileAudit.passed &&
      criticalErrors.length === 0 &&
      paper.slots.length > 0 &&
      paper.slots.every((s) => s.status === 'generated' && s.questionItem);

    return {
      timestamp: new Date().toISOString(),
      isReady,
      totalScore,
      universalAudit,
      subjectProfileAudit,
      criticalErrors,
      warnings,
      suggestions: Array.from(new Set(suggestions)),
    };
  }
}

export const assessmentService = new AssessmentService();
