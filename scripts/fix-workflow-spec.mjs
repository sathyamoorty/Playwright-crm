import { execSync } from 'child_process';
import fs from 'fs';

const buffer = execSync('git show HEAD:tests/workflow/workflowMessage.spec.ts');
let content = buffer.toString('utf8');

const imports = `import {test,Page, expect} from "@playwright/test";
import { LoginPage } from '@pages/auth/login';
import { DashboardPage } from '@pages/workflows/dashboard';
import { ProfilePage } from '@pages/workflows/profile';
import { WorkflowMessagePage } from '@pages/workflows/workflowMessage';
import { leadsModule } from '@pages/workflows/leadModule';
import { leadWithNoTask } from '@pages/workflows/untillFirstConTrue';
import { everyTimeRecordSave } from '@pages/workflows/everyTimeSave';
import { everyTimeModifiedRecord } from '@pages/workflows/everyTimeModified';
import { detailView } from '@pages/workflows/detailViewSms';
import { listView } from '@pages/workflows/listViewSms';
`;

const bodyStart = content.indexOf('test.describe');
if (bodyStart === -1) {
  throw new Error('Could not find test body in workflowMessage.spec.ts');
}

fs.writeFileSync(
  'tests/workflows/workflowMessage.spec.ts',
  `${imports}\n${content.slice(bodyStart)}`,
  'utf8',
);
console.log('Rewrote workflowMessage.spec.ts as UTF-8');
