import { FLOW_STEP_SHORT_LABELS, type FlowStepKey } from '@pages/capture/capture-modules/types';
import {
  FlowExecutionTracker,
  type ExecutionReportSummary,
  type FunctionCategorySummary,
} from './execution-tracker';

function printCategory(title: string, items: string[]): void {
  console.log(`\n  ${title} (${items.length}):`);
  if (items.length === 0) {
    console.log('    (none)');
    return;
  }
  for (const item of items) {
    console.log(`    • ${item}`);
  }
}

function printModuleCategorySummary(
  module: string,
  summary: FunctionCategorySummary,
): void {
  const steps = Object.entries(FLOW_STEP_SHORT_LABELS) as [FlowStepKey, string][];
  const done = steps.filter(([, short]) => summary.passed.some((p) => p.startsWith(short))).map(([, short]) => short);
  const missed = steps
    .filter(([, short]) => !summary.passed.some((p) => p.startsWith(short)))
    .map(([, short]) => short);

  console.log(
    `  ${module}: OK [${done.join(', ')}]${missed.length ? ` | MISSED [${missed.join(', ')}]` : ''}`,
  );
}

/** Renders the final execution report to the console. */
export class ExecutionReportPrinter {
  static print(tracker: FlowExecutionTracker): ExecutionReportSummary {
    const report = tracker.buildReport();

    console.log('\n========== All modules flow summary ==========');
    for (const { module, flow } of report.modules) {
      if (Object.keys(flow).length === 0) {
        console.log(`  ${module}: NOT RUN (no dashboard cards)`);
        continue;
      }
      const moduleCategories = report.byModule[module];
      if (moduleCategories) {
        printModuleCategorySummary(module, moduleCategories);
      }
    }

    console.log('\n---------- Execution Summary ----------');
    printCategory('Executed Functions', report.global.executed);
    printCategory('Skipped Functions', report.global.skipped);
    printCategory('Passed Functions', report.global.passed);
    printCategory('Failed Functions', report.global.failed);
    console.log('==============================================\n');

    return report;
  }
}
