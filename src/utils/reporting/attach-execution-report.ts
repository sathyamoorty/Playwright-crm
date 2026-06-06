import type { TestInfo } from '@playwright/test';
import type { CaptureModulesPage } from '@pages/capture/capture-modules';
import fs from 'fs';
import path from 'path';
import { formatReportAsText } from './format-report-text';
import type { ExecutionReportSummary } from './execution-tracker';
import type { StoredExecutionReport } from './execution-report-store';

/**
 * Attaches the latest flow execution report to the current test and registers
 * it for the custom Playwright reporter HTML summary.
 */
export async function attachFlowExecutionReport(
  testInfo: TestInfo,
  capture: CaptureModulesPage,
): Promise<ExecutionReportSummary | undefined> {
  const report = capture.getLastExecutionReport();
  if (!report) {
    return undefined;
  }

  // NOTE: Playwright tests run in worker processes; custom reporters run in the
  // main process. So we persist the report to disk for the reporter to aggregate.
  const stored: StoredExecutionReport = {
    testTitle: testInfo.title,
    projectName: testInfo.project.name,
    timestamp: new Date().toISOString(),
    report,
  };

  const outDir = path.join('test-results', 'flow-execution', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const safeId =
    (testInfo as unknown as { testId?: string }).testId ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const outPath = path.join(outDir, `${safeId}.json`);
  fs.writeFileSync(outPath, JSON.stringify(stored, null, 2), 'utf8');

  await testInfo.attach('flow-execution-report.json', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });

  await testInfo.attach('flow-execution-summary.txt', {
    body: formatReportAsText(report),
    contentType: 'text/plain',
  });

  return report;
}
