/**
 * PLAYWRIGHT TEST FLOW
 * ─────────────────────────────────────────────────────────
 * 1. User Action     → npm run test:captureModules
 * 2. Test Spec       → this file (scenario only)
 * 3. Page Object     → CaptureModulesPage (via fixture)
 * 4. Locator+Action  → locators/ + actions/ under capture-modules
 * 5. Fixtures        → fixtures/ (auth + dashboard setup)
 * 6. UI Interaction  → captureModulesPage.* methods
 * 7. Validation      → validators/capture-modules.validator
 * 8. Report          → publishFlowExecutionReport
 */
import { test } from '@fixtures';
import {
  validateExecutionReport,
  validateModulesCaptured,
} from '@validators/capture-modules.validator';
import { publishFlowExecutionReport } from '@utils/reporting/publish-execution-report';

test.describe('capture dashboard modules', () => {
  test.describe.configure({ timeout: 60 * 60 * 1000 });

  test('create record for each dashboard module', async ({
    captureModulesPage,
  }, testInfo) => {
    const modules = await captureModulesPage.captureModules();
    validateModulesCaptured(modules);

    await captureModulesPage.runCreateForAllModules(modules, testInfo);

    const report = await publishFlowExecutionReport(testInfo, captureModulesPage);
    validateExecutionReport(report);
  });
});
