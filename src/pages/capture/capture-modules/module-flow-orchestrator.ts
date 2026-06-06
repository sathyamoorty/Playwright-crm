import { Page, TestInfo } from '@playwright/test';
import { formatErrorMessage } from '@utils/helpers/formatError';
import {
  FlowExecutionTracker,
  type ExecutionReportSummary,
} from '@utils/reporting/execution-tracker';
import { ExecutionReportPrinter } from '@utils/reporting/execution-report';
import { navToModule } from '@pages/modules/navToMod';
import { relatedModule } from '@pages/related/relatedMod';
import { TargetPage } from '@pages/dashboard/target';
import { widgetCrt } from '@pages/dashboard/widget';
import type { dashboardModules } from '@pages/dashboard/dashboardModules';
import type { DashboardModule } from '@pages/dashboard/dashboardModules';
import { DashboardCardActions } from './actions/dashboard-card.actions';
import { DashboardStepsFlow } from './dashboard-steps-flow';
import { ListRecordFlow } from './list-record-flow';
import { QuickActionsFlow } from './quick-actions-flow';
import { logFlowStep } from './flow-logger';
import { INITIAL_FLOW_OK_STATE } from './types';

/**
 * Orchestrates the full per-module capture flow: navigation → list view →
 * quick actions → create/save → dashboard steps → next module.
 */
export class ModuleFlowOrchestrator {
  private readonly cardHelper: DashboardCardActions;
  private readonly quickActionsFlow: QuickActionsFlow;
  private readonly listRecordFlow: ListRecordFlow;
  private readonly dashboardStepsFlow: DashboardStepsFlow;
  private readonly tracker = new FlowExecutionTracker();
  private lastReport?: ExecutionReportSummary;

  constructor(
    private readonly dashboardPage: Page,
    private readonly dashModules: dashboardModules,
  ) {
    this.cardHelper = new DashboardCardActions(dashboardPage, dashModules);
    this.quickActionsFlow = new QuickActionsFlow();
    this.listRecordFlow = new ListRecordFlow();
    this.dashboardStepsFlow = new DashboardStepsFlow();
  }

  async runCreateForAllModules(
    modules?: DashboardModule[],
    testInfo?: TestInfo,
  ): Promise<void> {
    const nav = new navToModule(this.dashboardPage);
    const barModules = modules ?? (await this.dashModules.captureModules());
    const targetData = new TargetPage(this.dashboardPage);
    const dashIcon = new widgetCrt(this.dashboardPage);
    const relModDash = new relatedModule(this.dashboardPage);

    const runOne = async (
      mod: DashboardModule,
      fromKebab: boolean,
      rowIndex = 0,
    ) => {
      console.log(`\n--- Module: ${mod.label}${fromKebab ? ' (kebab)' : ''} ---`);

      if (this.dashboardPage.isClosed()) {
        return;
      }

      await this.dashboardPage.bringToFront();
      await nav.waitForDashboardReady();
      await targetData.dismissCustomizerOverlays();
      await this.cardHelper.clearfilter();

      const flowOk = INITIAL_FLOW_OK_STATE();
      this.tracker.startModule(mod.label, flowOk);

      logFlowStep(mod.label, 'navigateModule', 'start');
      this.tracker.recordStep(mod.label, 'navigateModule', 'executed', 'start', flowOk);
      try {
        if (fromKebab) {
          await this.dashModules.clickKebabModule(mod);
        } else {
          await this.dashModules.clickBarModule(mod);
        }
        flowOk.navigateModule = true;
        logFlowStep(mod.label, 'navigateModule', 'done');
        this.tracker.recordStep(mod.label, 'navigateModule', 'passed', 'done', flowOk);
      } catch (navErr) {
        const message = formatErrorMessage(navErr);
        logFlowStep(mod.label, 'navigateModule', `failed: ${message}`);
        this.tracker.recordStep(mod.label, 'navigateModule', 'failed', message, flowOk);
        return;
      }

      const hasCard = await this.cardHelper.waitForModuleDashboardCards(mod.label);

      if (!hasCard) {
        console.log(
          `[flow][${mod.label}] Skipped — no dashboard cards (quick actions + create not run).`,
        );
        const stepKeys = Object.keys(flowOk) as (keyof typeof flowOk)[];
        for (const key of stepKeys) {
          if (!flowOk[key]) {
            this.tracker.recordStep(
              mod.label,
              key,
              'skipped',
              'no dashboard cards',
              flowOk,
            );
          }
        }
        return;
      }

      let listPage: Page | undefined;
      try {
        listPage = await this.cardHelper.runOpenListViewStep(mod, flowOk);
        this.tracker.recordStep(mod.label, 'openListView', 'passed', 'done', flowOk);

        const listNav = new navToModule(listPage);
        await listNav.waitForAppReady();
        await this.quickActionsFlow.runOrderedQuickActionsBeforeAdd(
          listPage,
          mod,
          flowOk,
          this.tracker,
          rowIndex,
        );
        await listNav.waitForAppReady();

        await this.listRecordFlow.runCreateSaveAndRelatedSteps(
          listPage,
          mod,
          flowOk,
          this.tracker,
        );
      } catch (err) {
        console.log(
          `[flow][${mod.label}] Steps 2–3 interrupted after save: ${formatErrorMessage(err)}`,
        );
      } finally {
        if (
          listPage &&
          listPage !== this.dashboardPage &&
          !listPage.isClosed()
        ) {
          await listPage.close().catch(() => {});
        }

        if (this.dashboardPage.isClosed()) {
          return;
        }

        await this.dashboardPage.bringToFront();
        await nav.waitForDashboardReady();

        if (!flowOk.createSave) {
          console.log(
            `[flow][${mod.label}] Steps 4–8 skipped — create/save did not complete.`,
          );
          const dashboardStepKeys = [
            'dashboardFilter',
            'createTarget',
            'createWidget',
            'dashboardCount',
            'clearFilter',
          ] as const;
          for (const key of dashboardStepKeys) {
            if (!flowOk[key]) {
              this.tracker.recordStep(
                mod.label,
                key,
                'skipped',
                'create/save did not complete',
                flowOk,
              );
            }
          }
          return;
        }

        try {
          await this.dashboardStepsFlow.runDashboardSteps({
            dashboardPage: this.dashboardPage,
            mod,
            fromKebab,
            flowOk,
            targetData,
            dashIcon,
            relModDash,
            nav,
            cardHelper: this.cardHelper,
            testInfo,
            tracker: this.tracker,
          });
        } finally {
          if (!flowOk.clearFilter) {
            await this.cardHelper.clearfilter().catch(() => {});
          }
        }
      }
    };

    for (let i = 0; i < barModules.length; i++) {
      await runOne(barModules[i], false, i);
    }

    if (this.dashboardPage.isClosed()) {
      this.lastReport = ExecutionReportPrinter.print(this.tracker);
      return;
    }

    if (!(await this.dashModules.isKebabVisible())) {
      this.lastReport = ExecutionReportPrinter.print(this.tracker);
      return;
    }

    const overflow = await this.dashModules.readKebabMenuModules();
    for (let i = 0; i < overflow.length; i++) {
      await runOne(overflow[i], true, barModules.length + i);
    }

    this.lastReport = ExecutionReportPrinter.print(this.tracker);
  }

  getTracker(): FlowExecutionTracker {
    return this.tracker;
  }

  getLastReport(): ExecutionReportSummary | undefined {
    return this.lastReport;
  }
}
