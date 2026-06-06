import type { ExecutionReportSummary } from './execution-tracker';

function formatList(title: string, items: string[]): string {
  const lines = items.length === 0 ? ['  (none)'] : items.map((item) => `  • ${item}`);
  return `${title} (${items.length}):\n${lines.join('\n')}`;
}

/** Plain-text execution summary for test attachments and logs. */
export function formatReportAsText(report: ExecutionReportSummary): string {
  const lines: string[] = [
    '========== Flow Execution Summary ==========',
    '',
    formatList('Executed Functions', report.global.executed),
    '',
    formatList('Skipped Functions', report.global.skipped),
    '',
    formatList('Passed Functions', report.global.passed),
    '',
    formatList('Failed Functions', report.global.failed),
    '',
    '---------- Per Module ----------',
  ];

  for (const { module, flow } of report.modules) {
    const categories = report.byModule[module];
    if (!categories) continue;
    const passed = categories.passed.map((p) => p.split(' ')[0]).join(', ');
    const missed = Object.keys(flow).filter(
      (key) => !flow[key as keyof typeof flow],
    );
    lines.push(
      `${module}: OK [${passed || 'none'}]${missed.length ? ` | MISSED [${missed.join(', ')}]` : ''}`,
    );
  }

  lines.push('============================================');
  return lines.join('\n');
}
