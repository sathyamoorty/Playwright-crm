import type { DashboardModule } from '@pages/dashboard/dashboardModules';

/** Ordered steps executed per dashboard module during capture flow. */
export type FlowStep =
  | 'navigateModule'
  | 'openListView'
  | 'listViewFilter'
  | 'listViewQA'
  | 'detailViewQA'
  | 'submoduleQA'
  | 'globalSearchQA'
  | 'clickXClose'
  | 'createSave'
  | 'singleEdit'
  | 'relatedActions'
  | 'dashboardFilter'
  | 'createTarget'
  | 'createWidget'
  | 'dashboardCount'
  | 'clearFilter'
  | 'nextModule';

export type FlowStepKey = Exclude<FlowStep, 'nextModule'>;

export type StepOutcome = 'not_run' | 'executed' | 'passed' | 'failed' | 'skipped';

export interface StepExecutionState {
  outcome: StepOutcome;
  detail?: string;
}

/** Boolean map preserved for backward-compatible per-module flow tracking. */
export type FlowOkState = Record<FlowStepKey, boolean>;

export interface ModuleFlowSummary {
  module: string;
  flow: FlowOkState;
  steps: Partial<Record<FlowStepKey, StepExecutionState>>;
}

export interface RunModuleFlowContext {
  mod: DashboardModule;
  fromKebab: boolean;
  rowIndex: number;
}

export const INITIAL_FLOW_OK_STATE = (): FlowOkState => ({
  navigateModule: false,
  openListView: false,
  listViewFilter: false,
  listViewQA: false,
  detailViewQA: false,
  submoduleQA: false,
  globalSearchQA: false,
  clickXClose: false,
  createSave: false,
  singleEdit: false,
  relatedActions: false,
  dashboardFilter: false,
  createTarget: false,
  createWidget: false,
  dashboardCount: false,
  clearFilter: false,
});

export const FLOW_STEP_SHORT_LABELS: Record<FlowStepKey, string> = {
  navigateModule: 'nav mod',
  openListView: 'list view',
  listViewFilter: 'list filter',
  listViewQA: 'QA list',
  detailViewQA: 'QA detail',
  submoduleQA: 'QA sub',
  globalSearchQA: 'QA search',
  clickXClose: 'clickX',
  createSave: 'create/save',
  singleEdit: 'singleEdit',
  relatedActions: 'related',
  dashboardFilter: 'filter',
  createTarget: 'target',
  createWidget: 'widget',
  dashboardCount: 'dashCount',
  clearFilter: 'clearFilter',
};
