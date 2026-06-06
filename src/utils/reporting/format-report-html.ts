import type { StoredExecutionReport } from './execution-report-store';
import { buildReportTableRows } from './format-report-table';

function renderList(title: string, items: string[], cssClass: string): string {
  const listItems =
    items.length === 0
      ? '<li class="empty">(none)</li>'
      : items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  return `
    <section class="category ${cssClass}">
      <h3>${escapeHtml(title)} <span class="count">(${items.length})</span></h3>
      <ul>${listItems}</ul>
    </section>`;
}

function statusClass(status: string): string {
  switch (status) {
    case 'Passed':
      return 'status-passed';
    case 'Failed':
      return 'status-failed';
    case 'Skipped':
      return 'status-skipped';
    case 'Executed':
      return 'status-executed';
    default:
      return 'status-not-run';
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Standalone HTML page merged alongside the Playwright HTML report. */
export function buildFlowExecutionHtml(reports: StoredExecutionReport[]): string {
  const body = reports.length
    ? reports
        .map((stored) => {
          const global = stored.report.global;
          const moduleRows = stored.report.modules
            .map(({ module, flow }) => {
              const passed = stored.report.byModule[module]?.passed ?? [];
              const missed = Object.entries(flow)
                .filter(([, ok]) => !ok)
                .map(([key]) => key);
              return `<tr>
                <td>${escapeHtml(module)}</td>
                <td class="ok">${escapeHtml(passed.map((p) => p.split(' ')[0]).join(', ') || 'none')}</td>
                <td class="miss">${escapeHtml(missed.join(', ') || 'none')}</td>
              </tr>`;
            })
            .join('');

          const tableRows = buildReportTableRows(stored.report)
            .map(
              ({ module, status, description }) => `
              <tr>
                <td>${escapeHtml(module)}</td>
                <td class="${statusClass(status)}">${escapeHtml(status)}</td>
                <td>${escapeHtml(description)}</td>
              </tr>`,
            )
            .join('');

          return `
            <article class="test-report">
              <header>
                <h2>${escapeHtml(stored.testTitle)}</h2>
                <p class="meta">${escapeHtml(stored.projectName)} · ${escapeHtml(stored.timestamp)}</p>
                <p class="downloads">
                  <a href="flow-execution-summary.xlsx">Download Excel (.xlsx)</a>
                  ·
                  <a href="flow-execution-summary.docx">Download Word (.docx)</a>
                </p>
              </header>
              <div class="categories">
                ${renderList('Executed Functions', global.executed, 'executed')}
                ${renderList('Skipped Functions', global.skipped, 'skipped')}
                ${renderList('Passed Functions', global.passed, 'passed')}
                ${renderList('Failed Functions', global.failed, 'failed')}
              </div>
              <h3>Execution Table</h3>
              <table class="execution-table">
                <thead>
                  <tr><th>Module</th><th>Status</th><th>Description</th></tr>
                </thead>
                <tbody>${tableRows}</tbody>
              </table>
              <h3>Per Module Summary</h3>
              <table>
                <thead>
                  <tr><th>Module</th><th>Passed Steps</th><th>Missed Steps</th></tr>
                </thead>
                <tbody>${moduleRows}</tbody>
              </table>
            </article>`;
        })
        .join('')
    : '<p class="empty-report">No flow execution reports were captured in this run.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Flow Execution Summary</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --executed: #38bdf8;
      --skipped: #fbbf24;
      --passed: #4ade80;
      --failed: #f87171;
      --border: #334155;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 2rem;
    }
    h1 { margin-top: 0; }
    .test-report {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .meta { color: var(--muted); margin-top: 0; }
    .categories {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin: 1rem 0 1.5rem;
    }
    .category {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
    }
    .category h3 { margin: 0 0 0.75rem; font-size: 0.95rem; }
    .count { color: var(--muted); font-weight: normal; }
    .executed h3 { color: var(--executed); }
    .skipped h3 { color: var(--skipped); }
    .passed h3 { color: var(--passed); }
    .failed h3 { color: var(--failed); }
    ul { margin: 0; padding-left: 1.2rem; }
    li.empty, .empty-report { color: var(--muted); }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 0.6rem 0.75rem;
      text-align: left;
      vertical-align: top;
    }
    th { background: #111827; }
    .ok { color: var(--passed); }
    .miss { color: var(--skipped); }
    .downloads a { color: var(--executed); }
    .execution-table { margin-bottom: 1.5rem; }
    .status-passed { color: var(--passed); font-weight: 600; }
    .status-failed { color: var(--failed); font-weight: 600; }
    .status-skipped { color: var(--skipped); font-weight: 600; }
    .status-executed { color: var(--executed); font-weight: 600; }
    .status-not-run { color: var(--muted); }
  </style>
</head>
<body>
  <h1>Flow Execution Summary</h1>
  <p class="meta">Captured module-flow outcomes: executed, skipped, passed, and failed functions.</p>
  ${body}
</body>
</html>`;
}
