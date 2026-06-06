import type { ExecutionReportSummary } from './execution-tracker';

export interface StoredExecutionReport {
  testTitle: string;
  projectName: string;
  timestamp: string;
  report: ExecutionReportSummary;
}

/** In-memory store shared between tests and the custom Playwright reporter. */
class ExecutionReportStoreImpl {
  private readonly reports: StoredExecutionReport[] = [];

  store(
    testTitle: string,
    projectName: string,
    report: ExecutionReportSummary,
  ): void {
    this.reports.push({
      testTitle,
      projectName,
      timestamp: new Date().toISOString(),
      report,
    });
  }

  getAll(): StoredExecutionReport[] {
    return [...this.reports];
  }

  clear(): void {
    this.reports.length = 0;
  }
}

export const ExecutionReportStore = new ExecutionReportStoreImpl();
