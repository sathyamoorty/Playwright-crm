import { expect } from '@playwright/test';
import type { DashboardModule } from '@pages/dashboard/dashboardModules';
import type { ExecutionReportSummary } from '@utils/reporting/execution-tracker';

/**
 * Step 7 — Validation: assertions for capture-modules flows.
 */
export function validateModulesCaptured(modules: DashboardModule[]): void {
  expect(modules.length).toBeGreaterThan(0);
}

export function validateExecutionReport(
  report: ExecutionReportSummary | undefined,
): void {
  expect(report, 'Flow execution report should be generated').toBeDefined();
  expect(report!.modules.length).toBeGreaterThan(0);
}
