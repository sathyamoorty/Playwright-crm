import fs from 'fs';
import path from 'path';
import { exportExecutionReportArtifacts } from '../src/utils/reporting/export-execution-report';
import type { StoredExecutionReport } from '../src/utils/reporting/execution-report-store';

const projectRoot = path.resolve(__dirname, '..');
const jsonPath =
  process.argv[2] ??
  path.join(projectRoot, 'test-results', 'flow-execution', 'latest.json');
const outputDir =
  process.argv[3] ?? path.join(projectRoot, 'playwright-report');

async function main(): Promise<void> {
  if (!fs.existsSync(jsonPath)) {
    console.error(`[export-flow-report] JSON not found: ${jsonPath}`);
    console.error('Run a capture test first, then retry this command.');
    process.exit(1);
  }

  const reports = JSON.parse(
    fs.readFileSync(jsonPath, 'utf8'),
  ) as StoredExecutionReport[];

  const { excelPath, docxPath } = await exportExecutionReportArtifacts(
    reports,
    outputDir,
  );

  console.log(`[export-flow-report] Excel: ${excelPath}`);
  console.log(`[export-flow-report] Word: ${docxPath}`);
}

main().catch((error) => {
  console.error('[export-flow-report] Failed:', error);
  process.exit(1);
});
