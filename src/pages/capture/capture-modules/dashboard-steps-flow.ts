import { Page, TestInfo } from '@playwright/test';
import { filterDash } from '@pages/dashboard/filter';
import { relatedModule } from '@pages/related/relatedMod';
import { TargetPage } from '@pages/dashboard/target';
import { widgetCrt } from '@pages/dashboard/widget';
import { runDashboardcountForModule } from '@pages/dashboard/Dashboardcount';
import { navToModule } from '@pages/modules/navToMod';
import { takeScreenshot } from '@utils/helpers/screenshot';
import type { DashboardModule } from '@pages/dashboard/dashboardModules';
import type { FlowExecutionTracker } from '@utils/reporting/execution-tracker';
import { logFlowStep } from './flow-logger';
import { runFlowStep } from './flow-step-runner';
import type { DashboardCardActions } from './actions/dashboard-card.actions';
import type { FlowOkState } from './types';

export interface DashboardStepsContext {
  dashboardPage: Page;
  mod: DashboardModule;
  fromKebab: boolean;
  flowOk: FlowOkState;
  targetData: TargetPage;
  dashIcon: widgetCrt;
  relModDash: relatedModule;
  nav: navToModule;
  cardHelper: DashboardCardActions;
  testInfo?: TestInfo;
  tracker?: FlowExecutionTracker;
}

/** Dashboard filter, target, widget, and count steps (steps 4–8). */
export class DashboardStepsFlow {
  async runDashboardSteps(ctx: DashboardStepsContext): Promise<void> {
    const {
      dashboardPage,
      mod,
      fromKebab,
      flowOk,
      targetData,
      dashIcon,
      relModDash,
      nav,
      cardHelper,
      testInfo,
      tracker,
    } = ctx;

    const sShot = { takeScreenshot };
    const runnerOpts = { moduleLabel: mod.label, flowOk, tracker };

    await runFlowStep(
      'dashboardFilter',
      'dashboardFilter',
      async () => {
        const dashboardFilter = new filterDash(dashboardPage);
        await dashboardFilter.filterateBtn();
        await dashboardFilter.filterBox();
        await targetData.dismissCustomizerOverlays();
        await cardHelper.safeClickModuleTab(mod, targetData);
      },
      runnerOpts,
    );

    await runFlowStep(
      'createTarget',
      'createTarget',
      async () => {
        await targetData.dismissCustomizerOverlays();
        const hasTargetPermission = await targetData.hasTargetPermission();
        if (!hasTargetPermission) {
          logFlowStep(mod.label, 'createTarget', 'skipped — add button not visible');
          tracker?.recordStep(
            mod.label,
            'createTarget',
            'skipped',
            'add button not visible',
            flowOk,
          );
          return false;
        }
        const targetTitle = `Target_${Date.now()}`;
        const targetValue = `${Math.floor(Math.random() * 100)}`;
        await targetData.clickTarget();
        await targetData.addtarget();
        await targetData.Title(targetTitle);
        await targetData.format();
        await targetData.targetvalue(targetValue);
        await targetData.Next();
        await targetData.addcondition(mod.label);
        await targetData.selectOperator();
        await targetData.Next();
        await targetData.Accesswith();
        await targetData.clicksubmit();
        await targetData.maximizeTargetCard(targetTitle);
        await dashIcon.closeMaximizedWidget();
      },
      runnerOpts,
    );

    await cardHelper.safeClickModuleTab(mod, targetData);

    await runFlowStep(
      'createWidget',
      'createWidget',
      async () => {
        const hasWidgetPermission = await dashIcon.hasWidgetPermission();
        if (!hasWidgetPermission) {
          logFlowStep(mod.label, 'createWidget', 'skipped — add button not visible');
          tracker?.recordStep(
            mod.label,
            'createWidget',
            'skipped',
            'add button not visible',
            flowOk,
          );
          return false;
        }
        const widgetName = `TestMessage-${Date.now().toString().slice(-6)}`;
        await dashIcon.openCreateWidget(mod.modulename || mod.label);
        await dashIcon.tempField(widgetName);
        await relModDash.selectDropdownByLabel('Chart Size', 'col-6');
        await relModDash.selectDropdownByLabel(
          'Select X-axis column',
          'Created By',
        );
        await relModDash.selectDropdownByLabel('Chart Type', 'Bar Chart');
        if (testInfo) {
          await sShot.takeScreenshot(
            dashboardPage,
            testInfo,
            'Widget creation in the first step',
          );
        }
        await dashIcon.nextBtn();
        await dashIcon.step2(1, 1);
        if (testInfo) {
          await sShot.takeScreenshot(
            dashboardPage,
            testInfo,
            'Widget creation in the Second step',
          );
        }
        await dashIcon.subBtn();
        await dashboardPage
          .locator('#livewireOverly')
          .waitFor({ state: 'hidden', timeout: 30_000 })
          .catch(() => {});
        await dashIcon.maximizeLastWidget(widgetName);
        if (testInfo) {
          await sShot.takeScreenshot(
            dashboardPage,
            testInfo,
            'Widget maximized',
          );
        }
        await dashIcon.closeMaximizedWidget();
      },
      runnerOpts,
    );

    await runFlowStep(
      'dashboardCount',
      'dashboardCount',
      async () => {
        await dashIcon.closeMaximizedWidget();
        await dashboardPage.bringToFront();
        await dashboardPage.waitForLoadState('networkidle').catch(() => {});
        await dashIcon.dashIcon();
        await nav.waitForDashboardReady();
        await targetData.dismissCustomizerOverlays();
        await cardHelper.clearfilter();
        await cardHelper.safeClickModuleTab(mod, targetData);
        await cardHelper.waitForModuleDashboardCards(mod.label);
        await runDashboardcountForModule(dashboardPage, mod, fromKebab, {
          skipOpenDashboard: true,
        });
      },
      runnerOpts,
    );

    await runFlowStep(
      'clearFilter',
      'clearFilter',
      async () => {
        await cardHelper.clearfilter();
      },
      runnerOpts,
    );

    logFlowStep(mod.label, 'nextModule');
    console.log(`[flow][${mod.label}] summary: ${JSON.stringify(flowOk)}`);
  }
}
