/**
 * PascalCase + Page aliases for gradual migration to enterprise naming conventions.
 * Existing imports continue to work; prefer these names in new code.
 */
export { LoginPage } from '@pages/auth/login';
export { CaptureModulesPage, captureModules } from '@pages/capture/capture-modules';
export { navToModule as NavToModulePage } from '@pages/modules/navToMod';
export { dashboardModules as DashboardModulesPage } from '@pages/dashboard/dashboardModules';
export { dashBoardNav as DashboardNavPage } from '@pages/dashboard/dashNav';
export { filterDash as FilterDashboardPage } from '@pages/dashboard/filter';
export { widgetCrt as WidgetPage } from '@pages/dashboard/widget';
export { dataDr as UiTypeIdPage } from '@pages/modules/uiTypeId';
export { relatedModule as RelatedModulePage } from '@pages/related/relatedMod';
export { relatedModule as RelatedTabModulePage } from '@pages/related/related';
export { Dashboardcount as DashboardCountPage } from '@pages/dashboard/Dashboardcount';
export { TargetPage } from '@pages/dashboard/target';
export { Book as SingleEditPage } from '@pages/modules/singleEdit';
export { Listviewfilter as ListViewFilterPage } from '@pages/modules/listViewFilter';
export { Dependency as DependencyPage } from '@pages/modules/Dependency';
export { ListSingleEdit as ListSingleEditPage } from '@pages/modules/listsingleedit';
