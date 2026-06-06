import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as readline from 'readline';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
} from '@playwright/test/reporter';
import { buildFlowExecutionHtml } from './format-report-html';
import type { StoredExecutionReport } from './execution-report-store';
import { exportExecutionReportArtifacts } from './export-execution-report';

/**
 * Playwright custom reporter — writes a flow-execution HTML summary alongside
 * the default HTML report and persists JSON for CI artifacts.
 */
class FlowExecutionReporter implements Reporter {
  private outputDir = 'playwright-report';

  onBegin(config: FullConfig, _suite: Suite): void {
    const htmlReporter = config.reporter.find((entry) => {
      if (typeof entry === 'string') return entry === 'html';
      return Array.isArray(entry) && entry[0] === 'html';
    });

    if (Array.isArray(htmlReporter) && htmlReporter[1]?.outputFolder) {
      this.outputDir = htmlReporter[1].outputFolder;
    }
  }

  async onEnd(_result: FullResult): Promise<void> {
    const reportsDir = path.join('test-results', 'flow-execution', 'reports');
    const reports: StoredExecutionReport[] = [];

    if (fs.existsSync(reportsDir)) {
      const files = fs
        .readdirSync(reportsDir)
        .filter((f) => f.toLowerCase().endsWith('.json'));
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(reportsDir, file), 'utf8');
          reports.push(JSON.parse(raw) as StoredExecutionReport);
        } catch {
          // ignore corrupted report files
        }
      }
    }

    if (reports.length === 0) {
      return;
    }

    const html = buildFlowExecutionHtml(reports);
    const htmlPath = path.join(this.outputDir, 'flow-execution-summary.html');
    const jsonPath = path.join('test-results', 'flow-execution', 'latest.json');

    fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(htmlPath, html, 'utf8');
    fs.writeFileSync(jsonPath, JSON.stringify(reports, null, 2), 'utf8');

    const { excelPath, docxPath } = await exportExecutionReportArtifacts(
      reports,
      this.outputDir,
    );

    const absHtml = path.resolve(htmlPath);
    const absExcel = path.resolve(excelPath);
    const absDocx = path.resolve(docxPath);

    const openWindowsFile = (filePath: string) => {
      try {
        execSync(`cmd /c start "" "${filePath}"`, { stdio: 'ignore' });
      } catch {
        // Ignore open failures (non-fatal for the test run).
      }
    };

    // Always print the options (Cursor terminal is non-interactive / not a TTY).
    console.log('\nFlow report options:');
    console.log('  1) Open HTML summary');
    console.log('  2) Open Excel (.xlsx)');
    console.log('  3) Open Word (.docx)');
    console.log('  Set PW_FLOW_OPEN=html|excel|docx to auto-open after run.');

    // Auto-open for non-interactive terminals.
    const autoOpen = (process.env.PW_FLOW_OPEN ?? '').toLowerCase().trim();
    if (!process.env.CI) {
      if (autoOpen === 'html') openWindowsFile(absHtml);
      if (autoOpen === 'excel' || autoOpen === 'xlsx') openWindowsFile(absExcel);
      if (autoOpen === 'docx' || autoOpen === 'word') openWindowsFile(absDocx);
    }

    // Interactive prompt only when a TTY is available.
    const canPrompt =
      !process.env.CI &&
      process.stdout.isTTY &&
      process.stdin.isTTY &&
      process.env.PW_FLOW_MENU !== '0';

    if (canPrompt) {
      const choice = await new Promise<string>((resolve) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        rl.question('Choose (1-3, other to skip): ', (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });

      if (choice === '1') openWindowsFile(absHtml);
      if (choice === '2') openWindowsFile(absExcel);
      if (choice === '3') openWindowsFile(absDocx);
    }

    console.log(`\n[flow-report] HTML summary: ${htmlPath}`);
    console.log(`[flow-report] Excel report: ${excelPath}`);
    console.log(`[flow-report] Word report: ${docxPath}`);
    console.log(`[flow-report] JSON artifact: ${jsonPath}`);

    // Clean up per-test report fragments after aggregating.
    try {
      if (fs.existsSync(reportsDir)) {
        for (const file of fs.readdirSync(reportsDir)) {
          if (file.toLowerCase().endsWith('.json')) {
            fs.unlinkSync(path.join(reportsDir, file));
          }
        }
      }
    } catch {
      // ignore cleanup failures
    }
  }
}

export default FlowExecutionReporter;
