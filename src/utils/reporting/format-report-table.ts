import {
  FLOW_STEP_SHORT_LABELS,
  type FlowStepKey,
} from '../../pages/capture/capture-modules/types';
import type { ExecutionReportSummary } from './execution-tracker';

export interface ReportTableRow {
  module: string;
  status: string;
  description: string;
}

const STEP_KEYS = Object.keys(FLOW_STEP_SHORT_LABELS) as FlowStepKey[];

function formatStatus(outcome: string, flowPassed: boolean): string {
  switch (outcome) {
    case 'passed':
      return 'Passed';
    case 'failed':
      return 'Failed';
    case 'skipped':
      return 'Skipped';
    case 'executed':
      return 'Executed';
    case 'not_run':
      return flowPassed ? 'Passed' : 'Not Run';
    default:
      return flowPassed ? 'Passed' : 'Not Run';
  }
}

function formatDescription(step: FlowStepKey, detail?: string): string {
  const label = `${FLOW_STEP_SHORT_LABELS[step]} (${step})`;
  return detail ? `${label} — ${detail}` : label;
}

/** Flatten execution report into table rows: Module | Status | Description. */
export function buildReportTableRows(
  report: ExecutionReportSummary,
): ReportTableRow[] {
  const rows: ReportTableRow[] = [];

  for (const { module, flow, steps } of report.modules) {
    for (const step of STEP_KEYS) {
      const state = steps[step];
      const outcome = state?.outcome ?? (flow[step] ? 'passed' : 'not_run');

      rows.push({
        module,
        status: formatStatus(outcome, flow[step]),
        description: formatDescription(step, state?.detail),
      });
    }
  }

  return rows;
}
