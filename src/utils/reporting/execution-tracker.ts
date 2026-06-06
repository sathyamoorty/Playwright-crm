import {
  FLOW_STEP_SHORT_LABELS,
  type FlowOkState,
  type FlowStepKey,
  type ModuleFlowSummary,
  type StepExecutionState,
  type StepOutcome,
} from '@pages/capture/capture-modules/types';

export interface FunctionCategorySummary {
  executed: string[];
  skipped: string[];
  passed: string[];
  failed: string[];
}

export interface ExecutionReportSummary {
  modules: ModuleFlowSummary[];
  global: FunctionCategorySummary;
  byModule: Record<string, FunctionCategorySummary>;
}

function createEmptyCategorySummary(): FunctionCategorySummary {
  return { executed: [], skipped: [], passed: [], failed: [] };
}

function pushUnique(list: string[], value: string): void {
  if (!list.includes(value)) {
    list.push(value);
  }
}

/**
 * Tracks per-step outcomes across all modules and produces a structured
 * execution summary (executed / skipped / passed / failed).
 */
export class FlowExecutionTracker {
  private readonly summaries: ModuleFlowSummary[] = [];

  startModule(module: string, flow: FlowOkState): ModuleFlowSummary {
    const summary: ModuleFlowSummary = {
      module,
      flow,
      steps: {},
    };
    this.summaries.push(summary);
    return summary;
  }

  get current(): ModuleFlowSummary | undefined {
    return this.summaries[this.summaries.length - 1];
  }

  recordStep(
    module: string,
    step: FlowStepKey,
    outcome: StepOutcome,
    detail?: string,
    flow?: FlowOkState,
  ): void {
    const summary =
      this.summaries.find((s) => s.module === module) ?? this.current;
    if (!summary) return;

    if (flow) {
      summary.flow = flow;
    }

    summary.steps[step] = { outcome, detail };

    if (outcome === 'passed') {
      summary.flow[step] = true;
    }
  }

  getSummaries(): ModuleFlowSummary[] {
    return this.summaries;
  }

  buildReport(): ExecutionReportSummary {
    const global = createEmptyCategorySummary();
    const byModule: Record<string, FunctionCategorySummary> = {};

    for (const { module, flow, steps } of this.summaries) {
      const moduleSummary = createEmptyCategorySummary();
      byModule[module] = moduleSummary;

      const stepKeys = Object.keys(FLOW_STEP_SHORT_LABELS) as FlowStepKey[];
      for (const step of stepKeys) {
        const label = `${FLOW_STEP_SHORT_LABELS[step]} (${step})`;
        const state: StepExecutionState = steps[step] ?? {
          outcome: flow[step] ? 'passed' : 'not_run',
        };

        switch (state.outcome) {
          case 'executed':
            pushUnique(moduleSummary.executed, label);
            pushUnique(global.executed, `${module} → ${label}`);
            break;
          case 'passed':
            pushUnique(moduleSummary.passed, label);
            pushUnique(global.passed, `${module} → ${label}`);
            break;
          case 'failed':
            pushUnique(moduleSummary.failed, label);
            pushUnique(global.failed, `${module} → ${label}`);
            break;
          case 'skipped':
            pushUnique(moduleSummary.skipped, label);
            pushUnique(global.skipped, `${module} → ${label}`);
            break;
          default:
            if (!flow[step]) {
              pushUnique(moduleSummary.skipped, label);
              pushUnique(global.skipped, `${module} → ${label}`);
            }
            break;
        }
      }
    }

    return { modules: this.summaries, global, byModule };
  }
}
