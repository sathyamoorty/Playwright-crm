import { Page } from '@playwright/test';
import { formatErrorMessage } from '@utils/helpers/formatError';
import {
  runQuickActionsFromListView,
  detailView,
  submodule,
  globalSearch,
  SMSModalPage,
  dismissGlobalSearchIfOpen,
  type QuickActionFlowOptions,
} from '@pages/quick-actions/ActionPage';
import { runListViewFilter } from '@pages/modules/listViewFilter';
import type { DashboardModule } from '@pages/dashboard/dashboardModules';
import type { FlowExecutionTracker } from '@utils/reporting/execution-tracker';
import { logFlowStep } from './flow-logger';
import { runFlowStepContinueOnError } from './flow-step-runner';
import type { FlowOkState } from './types';

/** List-view quick actions executed before record creation. */
export class QuickActionsFlow {
  private quickActionOptions(mod: DashboardModule): QuickActionFlowOptions {
    return {
      navigateToLeads: false,
      moduleLabel: mod.label,
      moduleName: mod.modulename,
    };
  }

  /**
   * moduleNav.spec.ts 162–166 order, on the list tab from the dashboard card.
   * Each step runs in sequence for every module; a failure logs and the next step still runs.
   */
  async runOrderedQuickActionsBeforeAdd(
    listPage: Page,
    mod: DashboardModule,
    flowOk: FlowOkState,
    tracker?: FlowExecutionTracker,
    rowIndex = 0,
  ): Promise<void> {
    const sms = new SMSModalPage(listPage);
    const options = this.quickActionOptions(mod);
    const runnerOpts = { moduleLabel: mod.label, flowOk, tracker };

    await dismissGlobalSearchIfOpen(listPage);

    logFlowStep(mod.label, 'listViewFilter', `start (row ${rowIndex})`);
    tracker?.recordStep(mod.label, 'listViewFilter', 'executed', `row ${rowIndex}`, flowOk);
    try {
      await runListViewFilter(listPage, rowIndex);
      flowOk.listViewFilter = true;
      logFlowStep(mod.label, 'listViewFilter', 'done');
      tracker?.recordStep(mod.label, 'listViewFilter', 'passed', 'done', flowOk);
    } catch (listFilterErr) {
      const message = formatErrorMessage(listFilterErr);
      logFlowStep(mod.label, 'listViewFilter', `skipped: ${message}`);
      tracker?.recordStep(mod.label, 'listViewFilter', 'skipped', message, flowOk);
    }

    await runFlowStepContinueOnError(
      'listViewQA',
      'listViewQA',
      () => runQuickActionsFromListView(listPage, options),
      runnerOpts,
    );
    await runFlowStepContinueOnError(
      'detailViewQA',
      'detailViewQA',
      () => detailView(listPage),
      runnerOpts,
    );
    await runFlowStepContinueOnError(
      'submoduleQA',
      'submoduleQA',
      () => submodule(listPage),
      runnerOpts,
    );
    await runFlowStepContinueOnError(
      'globalSearchQA',
      'globalSearchQA',
      () => globalSearch(listPage, options),
      runnerOpts,
    );
    await runFlowStepContinueOnError(
      'clickXClose',
      'clickXClose',
      async () => {
        const closeBtn = listPage.getByRole('button', { name: 'Close' });
        if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await sms.clickX();
        }
      },
      runnerOpts,
    );

    await dismissGlobalSearchIfOpen(listPage);
  }
}
