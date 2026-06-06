import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

async function loadExportModule() {
  try {
    return require(path.join(projectRoot, 'src/utils/reporting/export-execution-report.ts'));
  } catch {
    return require(path.join(projectRoot, 'dist/utils/reporting/export-execution-report.js'));
  }
}

async function main() {
  const jsonPath =
    process.argv[2] ??
    path.join(projectRoot, 'test-results', 'flow-execution', 'latest.json');
  const outputDir =
    process.argv[3] ?? path.join(projectRoot, 'playwright-report');

  if (!fs.existsSync(jsonPath)) {
    console.error(`[export-flow-report] JSON not found: ${jsonPath}`);
    console.error('Run a capture test first, then retry this command.');
    process.exit(1);
  }

  const reports = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const { exportExecutionReportArtifacts } = await loadExportModule();
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
