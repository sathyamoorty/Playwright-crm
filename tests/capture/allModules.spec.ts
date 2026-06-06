/**
 * PLAYWRIGHT TEST FLOW — see captureModules.spec.ts for the 8-step diagram.
 */
import { test } from '@fixtures';
import {
  validateExecutionReport,
  validateModulesCaptured,
} from '@validators/capture-modules.validator';
import { publishFlowExecutionReport } from '@utils/reporting/publish-execution-report';

test.describe('module', () => {
  test.describe.configure({ timeout: 60 * 60 * 1000 });

  test('login', async ({ captureModulesPage }, testInfo) => {
    const modules = await captureModulesPage.captureModules();
    validateModulesCaptured(modules);

    await captureModulesPage.runCreateForAllModules(modules, testInfo);

    const report = await publishFlowExecutionReport(testInfo, captureModulesPage);
    validateExecutionReport(report);
  });
});
