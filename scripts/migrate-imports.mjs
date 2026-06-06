import fs from 'fs';
import path from 'path';

const root = process.cwd();

const replacements = [
  // Tests & fixtures — project root aliases
  ["from '../fixtures'", "from '@fixtures'"],
  ["from '../../fixtures'", "from '@fixtures'"],
  ["from '../../../fixtures'", "from '@fixtures'"],
  ["from '../validators/", "from '@validators/"],
  ["from '../../validators/", "from '@validators/"],
  ["from '../utils/reporting/", "from '@utils/reporting/"],
  ["from '../../utils/reporting/", "from '@utils/reporting/"],
  ["from '../../../utils/reporting/", "from '@utils/reporting/"],
  ["from '../utils/formatError'", "from '@utils/helpers/formatError'"],
  ["from '../utils/screenshot'", "from '@utils/helpers/screenshot'"],
  ["from '../utils/listScroll'", "from '@utils/helpers/listScroll'"],
  ["from '../utils/networkMonitor'", "from '@utils/helpers/networkMonitor'"],
  ["from '../utils/captureUpdates'", "from '@utils/helpers/captureUpdates'"],
  ["from '../utils/filterData'", "from '@utils/helpers/filterData'"],
  ["from '../../utils/formatError'", "from '@utils/helpers/formatError'"],
  ["from '../../../utils/formatError'", "from '@utils/helpers/formatError'"],
  ["from '../pages/login'", "from '@pages/auth/login'"],
  ["from '../pages/navToMod'", "from '@pages/modules/navToMod'"],
  ["from '../pages/uiTypeId'", "from '@pages/modules/uiTypeId'"],
  ["from '../pages/relatedMod'", "from '@pages/related/relatedMod'"],
  ["from '../pages/related'", "from '@pages/related/related'"],
  ["from '../pages/captureModules'", "from '@pages/capture'"],
  ["from '../pages/capture-modules'", "from '@pages/capture/capture-modules'"],
  ["from '../pages/page-object-aliases'", "from '@pages/aliases'"],
  ["from '../pages/dashboardModules'", "from '@pages/dashboard/dashboardModules'"],
  ["from '../pages/dashNav'", "from '@pages/dashboard/dashNav'"],
  ["from '../pages/Dashboardcount'", "from '@pages/dashboard/Dashboardcount'"],
  ["from '../pages/filter'", "from '@pages/dashboard/filter'"],
  ["from '../pages/target'", "from '@pages/dashboard/target'"],
  ["from '../pages/widget'", "from '@pages/dashboard/widget'"],
  ["from '../pages/listViewFilter'", "from '@pages/modules/listViewFilter'"],
  ["from '../pages/singleEdit'", "from '@pages/modules/singleEdit'"],
  ["from '../pages/listsingleedit'", "from '@pages/modules/listsingleedit'"],
  ["from '../pages/Dependency'", "from '@pages/modules/Dependency'"],
  ["from '../pages/createEntity'", "from '@pages/modules/createEntity'"],
  ["from '../pages/flows'", "from '@pages/modules/flows'"],
  ["from '../pages/ans'", "from '@pages/modules/ans'"],
  ["from '../pages/quickact/ActionPage'", "from '@pages/quick-actions/ActionPage'"],
  ["from '../../pages/capture-modules'", "from '@pages/capture/capture-modules'"],
  ["from '../../pages/capture-modules/types'", "from '@pages/capture/capture-modules/types'"],
  ["from '../data/", "from '@data/"],
  ["from '../../data/", "from '@data/"],
  ["from '../../../data/", "from '@data/"],
  ['from "../data/', 'from "@data/'],
  ['from "../../data/', 'from "@data/'],
  ['from "../../../data/', 'from "@data/'],
  // Internal page cross-imports
  ["from './widget'", "from '@pages/dashboard/widget'"],
  ["from './dashboardModules'", "from '@pages/dashboard/dashboardModules'"],
  ["from './navToMod'", "from '@pages/modules/navToMod'"],
  ["from './uiTypeId'", "from '@pages/modules/uiTypeId'"],
  ["from './filter'", "from '@pages/dashboard/filter'"],
  ["from './target'", "from '@pages/dashboard/target'"],
  ["from './relatedMod'", "from '@pages/related/relatedMod'"],
  ["from './related'", "from '@pages/related/related'"],
  ["from './singleEdit'", "from '@pages/modules/singleEdit'"],
  ["from './listViewFilter'", "from '@pages/modules/listViewFilter'"],
  ["from './Dashboardcount'", "from '@pages/dashboard/Dashboardcount'"],
  ["from './dashNav'", "from '@pages/dashboard/dashNav'"],
  ["from './login'", "from '@pages/auth/login'"],
  ["from './capture-modules'", "from '@pages/capture/capture-modules'"],
  ["from '../login'", "from '@pages/auth/login'"],
  ["from '../navToMod'", "from '@pages/modules/navToMod'"],
  ["from '../uiTypeId'", "from '@pages/modules/uiTypeId'"],
  ["from '../relatedMod'", "from '@pages/related/relatedMod'"],
  ["from '../related'", "from '@pages/related/related'"],
  ["from '../dashboardModules'", "from '@pages/dashboard/dashboardModules'"],
  ["from '../Dashboardcount'", "from '@pages/dashboard/Dashboardcount'"],
  ["from '../filter'", "from '@pages/dashboard/filter'"],
  ["from '../target'", "from '@pages/dashboard/target'"],
  ["from '../widget'", "from '@pages/dashboard/widget'"],
  ["from '../singleEdit'", "from '@pages/modules/singleEdit'"],
  ["from '../listViewFilter'", "from '@pages/modules/listViewFilter'"],
  ["from '../quickact/ActionPage'", "from '@pages/quick-actions/ActionPage'"],
  ["from '../quick-actions/ActionPage'", "from '@pages/quick-actions/ActionPage'"],
  ["from '../../utils/reporting/", "from '@utils/reporting/"],
  ["from '../../../utils/helpers/", "from '@utils/helpers/"],
  ["from '../../utils/helpers/", "from '@utils/helpers/"],
  ["from '../utils/helpers/", "from '@utils/helpers/"],
  ["from './capture-modules'", "from './capture-modules'"],
  ["from '../dashboardModules'", "from '@pages/dashboard/dashboardModules'"],
  ["from '../../pages/dashboard/", "from '@pages/dashboard/"],
  ["from '../../pages/modules/", "from '@pages/modules/"],
  ["from '../workflows/", "from '@pages/workflows/"],
  ["from '../../pages/workflows/", "from '@pages/workflows/"],
  ["from '../pages/workflows/", "from '@pages/workflows/"],
  ["from '../../pages/uiTypeId'", "from '@pages/modules/uiTypeId'"],
  ["from '../pages/uiTypeId'", "from '@pages/modules/uiTypeId'"],
  ["from '../../utils/listScroll'", "from '@utils/helpers/listScroll'"],
  ["from '../utils/listScroll'", "from '@utils/helpers/listScroll'"],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

const targets = ['src', 'tests', 'playwright.config.ts'];
let updated = 0;

for (const target of targets) {
  const full = path.join(root, target);
  const files = fs.statSync(full).isDirectory() ? walk(full) : [full];
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    for (const [from, to] of replacements) {
      content = content.split(from).join(to);
    }
    if (content !== original) {
      fs.writeFileSync(file, content);
      updated++;
      console.log('Updated:', path.relative(root, file));
    }
  }
}

console.log(`\nDone. ${updated} file(s) updated.`);
