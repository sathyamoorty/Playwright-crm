/**
 * Backward-compatible barrel — existing imports from `../pages/captureModules`
 * continue to work without modification.
 */
export {
  CaptureModulesPage,
  captureModules,
  type DashboardModule,
  type ExecutionReportSummary,
  type FlowStep,
  type FlowStepKey,
  type FlowOkState,
  type ModuleFlowSummary,
  type StepOutcome,
} from '@pages/capture/capture-modules';

export {
  NavToModulePage,
  DashboardModulesPage,
  DashboardNavPage,
  FilterDashboardPage,
  WidgetPage,
  UiTypeIdPage,
  RelatedModulePage,
  DashboardCountPage,
} from '@pages/aliases';
