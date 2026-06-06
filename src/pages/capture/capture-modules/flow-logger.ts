import type { FlowStep } from './types';

const FLOW_STEP_DISPLAY_NAMES: Record<FlowStep, string> = {
  navigateModule: 'Dashboard → select module tab',
  openListView: 'Open module list view (dashboard card)',
  listViewFilter: 'List view filter',
  listViewQA: 'List view quick action',
  detailViewQA: 'Detail view quick action',
  submoduleQA: 'Submodule quick action',
  globalSearchQA: 'Global search quick action',
  clickXClose: 'Close quick-action modal (clickX)',
  createSave: 'Add data — create/save record',
  singleEdit: 'Single edit',
  relatedActions: 'runRelatedActions',
  dashboardFilter: 'Apply dashboard filter',
  createTarget: 'Create target',
  createWidget: 'Create widget',
  dashboardCount: 'Dashboard count',
  clearFilter: 'Clear filter (before next module)',
  nextModule: '→ Continue to next module',
};

/** Structured console logging for module flow steps. */
export function logFlowStep(
  moduleLabel: string,
  step: FlowStep,
  detail?: string,
): void {
  const label = FLOW_STEP_DISPLAY_NAMES[step];
  console.log(
    `[flow][${moduleLabel}] ${label}${detail ? ` — ${detail}` : ''}`,
  );
}
