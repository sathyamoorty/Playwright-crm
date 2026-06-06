import type { TestInfo } from '@playwright/test';
import type { CaptureModulesPage } from '@pages/capture/capture-modules';
import { attachFlowExecutionReport } from './attach-execution-report';
import type { ExecutionReportSummary } from './execution-tracker';

/**
 * Step 8 — Report: attach results to the test and register for HTML summary.
 */
export async function publishFlowExecutionReport(
  testInfo: TestInfo,
  capture: CaptureModulesPage,
): Promise<ExecutionReportSummary | undefined> {
  return attachFlowExecutionReport(testInfo, capture);
}
