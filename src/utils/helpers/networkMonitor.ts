import { BrowserContext, Page } from '@playwright/test';

export type NetworkError = {
  status: number;
  url: string;
  method: string;
  pageLabel: string;
  timestamp: string;
};

function logNetworkError(error: NetworkError): void {
  console.error(
    `[HTTP ${error.status}] ${error.method} ${error.url} (${error.pageLabel}) @ ${error.timestamp}`,
  );
}

export function attachNetworkErrorLogger(
  page: Page,
  errors: NetworkError[],
  pageLabel = 'page',
): void {
  page.on('response', (response) => {
    const status = response.status();
    if (status < 500) return;

    const error: NetworkError = {
      status,
      url: response.url(),
      method: response.request().method(),
      pageLabel,
      timestamp: new Date().toISOString(),
    };

    errors.push(error);
    logNetworkError(error);
  });
}

export function monitorContextForNetworkErrors(
  context: BrowserContext,
  errors: NetworkError[],
): void {
  for (const page of context.pages()) {
    attachNetworkErrorLogger(page, errors, 'existing-page');
  }

  context.on('page', (page) => {
    attachNetworkErrorLogger(page, errors, 'new-page');
  });
}

export function logNetworkErrorSummary(errors: NetworkError[], label: string): void {
  if (errors.length === 0) {
    console.log(`[${label}] No HTTP 5xx errors detected.`);
    return;
  }

  console.error(`[${label}] ${errors.length} HTTP 5xx error(s) detected:`);
  errors.forEach((error, index) => {
    console.error(
      `  ${index + 1}. [${error.status}] ${error.method} ${error.url} (${error.pageLabel}) @ ${error.timestamp}`,
    );
  });
}
