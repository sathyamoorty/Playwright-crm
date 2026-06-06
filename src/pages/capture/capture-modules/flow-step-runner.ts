import { formatErrorMessage } from '@utils/helpers/formatError';
import type { FlowExecutionTracker } from '@utils/reporting/execution-tracker';
import { logFlowStep } from './flow-logger';
import type { FlowOkState, FlowStep, FlowStepKey } from './types';

export interface FlowStepRunnerOptions {
  moduleLabel: string;
  flowOk: FlowOkState;
  tracker?: FlowExecutionTracker;
}

/**
 * Runs a single flow step with consistent logging, error handling, and
 * execution tracking — preserves continue-on-failure behavior.
 */
export async function runFlowStep(
  step: FlowStep,
  flowKey: FlowStepKey,
  action: () => Promise<boolean | void>,
  options: FlowStepRunnerOptions,
): Promise<void> {
  const { moduleLabel, flowOk, tracker } = options;

  logFlowStep(moduleLabel, step, 'start');
  tracker?.recordStep(moduleLabel, flowKey, 'executed', 'start', flowOk);

  try {
    const completed = await action();
    if (completed === false) {
      return;
    }
    flowOk[flowKey] = true;
    logFlowStep(moduleLabel, step, 'done');
    tracker?.recordStep(moduleLabel, flowKey, 'passed', 'done', flowOk);
  } catch (err) {
    const message = formatErrorMessage(err);
    const isSkipped = message.toLowerCase().includes('skip');
    logFlowStep(
      moduleLabel,
      step,
      `${isSkipped ? 'skipped' : 'failed'}: ${message}`,
    );
    tracker?.recordStep(
      moduleLabel,
      flowKey,
      isSkipped ? 'skipped' : 'failed',
      message,
      flowOk,
    );
  }
}

/** Variant used for quick-action steps that always continue on failure. */
export async function runFlowStepContinueOnError(
  step: FlowStep,
  flowKey: FlowStepKey,
  action: () => Promise<void>,
  options: FlowStepRunnerOptions,
): Promise<void> {
  const { moduleLabel, flowOk, tracker } = options;

  logFlowStep(moduleLabel, step, 'start');
  tracker?.recordStep(moduleLabel, flowKey, 'executed', 'start', flowOk);

  try {
    await action();
    flowOk[flowKey] = true;
    logFlowStep(moduleLabel, step, 'done');
    tracker?.recordStep(moduleLabel, flowKey, 'passed', 'done', flowOk);
  } catch (err) {
    const message = formatErrorMessage(err);
    logFlowStep(moduleLabel, step, `failed: ${message}`);
    tracker?.recordStep(moduleLabel, flowKey, 'failed', message, flowOk);
  }
}
