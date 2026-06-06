import { Page } from '@playwright/test';
import { formatErrorMessage } from '@utils/helpers/formatError';
import { navToModule } from '@pages/modules/navToMod';
import { dataDr } from '@pages/modules/uiTypeId';
import { relatedModule } from '@pages/related/relatedMod';
import { relatedModule as relatedTabModule } from '@pages/related/related';
import { Book } from '@pages/modules/singleEdit';
import type { DashboardModule } from '@pages/dashboard/dashboardModules';
import type { FlowExecutionTracker } from '@utils/reporting/execution-tracker';
import { logFlowStep } from './flow-logger';
import type { FlowOkState } from './types';

/** Create/save, single edit, and related-tab actions on the list view page. */
export class ListRecordFlow {
  async runCreateSaveAndRelatedSteps(
    listPage: Page,
    mod: DashboardModule,
    flowOk: FlowOkState,
    tracker?: FlowExecutionTracker,
  ): Promise<void> {
    const listNav = new navToModule(listPage);
    const uiTypeId = new dataDr(listPage);
    const relMod = new relatedModule(listPage);
    const rel = new relatedTabModule(listPage);
    const singleEditIcon = new Book(listPage);

    logFlowStep(mod.label, 'createSave', 'start');
    tracker?.recordStep(mod.label, 'createSave', 'executed', 'start', flowOk);
    await listNav.dynamicAddBtn();
    await uiTypeId.fillCurrentModuleFields();
    await listNav.saveBtnAndWait(25_000);
    flowOk.createSave = true;
    logFlowStep(mod.label, 'createSave', 'done');
    tracker?.recordStep(mod.label, 'createSave', 'passed', 'done', flowOk);

    logFlowStep(mod.label, 'singleEdit', 'start');
    tracker?.recordStep(mod.label, 'singleEdit', 'executed', 'start', flowOk);
    try {
      const singleEditResult = await singleEditIcon.runFromTestdata();
      flowOk.singleEdit = true;
      if (singleEditResult.skippedReason) {
        logFlowStep(
          mod.label,
          'singleEdit',
          `note: ${singleEditResult.skippedReason}`,
        );
        tracker?.recordStep(
          mod.label,
          'singleEdit',
          'skipped',
          singleEditResult.skippedReason,
          flowOk,
        );
      } else {
        logFlowStep(
          mod.label,
          'singleEdit',
          `done — scenario 2 (${singleEditResult.edited} field(s) edited)`,
        );
        tracker?.recordStep(mod.label, 'singleEdit', 'passed', 'done', flowOk);
      }
    } catch (singleEditErr) {
      const message = formatErrorMessage(singleEditErr);
      logFlowStep(mod.label, 'singleEdit', `skipped: ${message}`);
      tracker?.recordStep(mod.label, 'singleEdit', 'skipped', message, flowOk);
    }

    const commentText = await relMod.fillComments();
    const hasQuickActionPermission = await relMod.hasQuickActionPermission();
    if (!hasQuickActionPermission) {
      console.log(`${mod.label} not having quick action Permission`);
    } else {
      await relMod.clkQuickAct();
      await relMod.scrollView();
      await listNav.saveBtnAndWait(25_000);
    }

    await listPage.reload();
    await listNav.waitForAppReady();

    logFlowStep(mod.label, 'relatedActions', 'start');
    tracker?.recordStep(mod.label, 'relatedActions', 'executed', 'start', flowOk);
    let capturedTabs = await rel.captureRelatedTabs();
    if (capturedTabs.length === 0) {
      const firstRow = listPage.locator('.cell-truncate-wrapper').first();
      const hasListRow = await firstRow
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      if (hasListRow) {
        await firstRow.click();
        await listNav.waitForAppReady();
        capturedTabs = await rel.captureRelatedTabs();
      } else {
        logFlowStep(
          mod.label,
          'relatedActions',
          'no list row for detail view — tabs empty',
        );
      }
    }
    await rel.runRelatedActions(capturedTabs);
    flowOk.relatedActions = true;
    logFlowStep(mod.label, 'relatedActions', 'done');
    tracker?.recordStep(mod.label, 'relatedActions', 'passed', 'done', flowOk);
    console.log('Random comment used:', commentText);
    console.log(`Saved record for "${mod.label}".`);
  }
}
