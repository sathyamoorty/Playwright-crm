import { Page, TestInfo } from '@playwright/test';
import type { ExecutionReportSummary } from '@utils/reporting/execution-tracker';
import { dashboardModules, type DashboardModule } from '@pages/dashboard/dashboardModules';
import { DashboardCardActions } from './actions/dashboard-card.actions';
import { ModuleFlowOrchestrator } from './module-flow-orchestrator';

/**
 * Page Object for dashboard module capture and full per-module automation flow.
 * Delegates orchestration to focused collaborators while preserving the
 * original public API (`captureModules` alias exported for backward compatibility).
 */
export class CaptureModulesPage {
  private readonly dashModules: dashboardModules;
  private readonly cardHelper: DashboardCardActions;
  private readonly orchestrator: ModuleFlowOrchestrator;

  constructor(private readonly dashboardPage: Page) {
    this.dashModules = new dashboardModules(dashboardPage);
    this.cardHelper = new DashboardCardActions(dashboardPage, this.dashModules);
    this.orchestrator = new ModuleFlowOrchestrator(
      dashboardPage,
      this.dashModules,
    );
  }

  /** Bar modules only — kebab is not opened. */
  async captureModules(): Promise<DashboardModule[]> {
    return this.dashModules.captureModules();
  }

  async clickModuleTab(modulename: string): Promise<void> {
    return this.dashModules.clickModuleTab(modulename);
  }

  async clearfilter(): Promise<void> {
    return this.cardHelper.clearfilter();
  }

  /**
   * Per module: quick actions → create/save → related → dashboard steps.
   */
  async runCreateForAllModules(
    modules?: DashboardModule[],
    testInfo?: TestInfo,
  ): Promise<void> {
    return this.orchestrator.runCreateForAllModules(modules, testInfo);
  }

  async openFirstDashboardCard(page: Page = this.dashboardPage): Promise<Page> {
    return this.cardHelper.openFirstDashboardCard(page);
  }

  /** Structured report from the most recent `runCreateForAllModules` call. */
  getLastExecutionReport(): ExecutionReportSummary | undefined {
    return this.orchestrator.getLastReport();
  }
}

/** @deprecated Use `CaptureModulesPage` — kept for backward compatibility. */
export const captureModules = CaptureModulesPage;
