import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/** Scroll the advanced list grid horizontally to the start. */
export async function scrollListToStart(page: Page): Promise<void> {
  const left = page.getByRole('button', { name: /keyboard_arrow_left/i }).first();
  for (let i = 0; i < 6; i++) {
    if (!(await left.isVisible().catch(() => false))) break;
    await left.click().catch(() => {});
    await page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }
}

/** Scroll one page of columns to the right; returns false when no more pages. */
export async function scrollListColumnsNext(page: Page): Promise<boolean> {
  const right = page.getByRole('button', { name: /keyboard_arrow_right/i }).first();
  if (!(await right.isVisible().catch(() => false))) return false;
  await right.click().catch(() => {});
  await page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {});
  return true;
}






export type FieldKind =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'number'
  | 'url'
  | 'checkbox'
  | 'picklist'
  | 'assignedTo'
  | 'date'
  | 'unknown';

const TEXT = new Set(['1', '5', '10', '22', '23']);
const EMAIL = new Set(['2']);
const PHONE = new Set(['4', '21']);
const TEXTAREA = new Set(['5']);
const NUMBER = new Set(['24', '25']);
const URL = new Set(['26']);
const CHECKBOX = new Set(['6']);
const PICKLIST = new Set(['3', '9', '11', '21', '23', '29', '30', '31']);
const ASSIGNED = new Set(['15']);
const DATE = new Set(['7', '19', '20']);
const READ_ONLY = new Set(['16']);

/** UI 7 = Date, 19 = Date and Time, 20 = Time */
export const DATE_UI_TYPES = new Set(['7', '19', '20']);

/** Map normalized summary label → Testdata UI type key. */
export const LABEL_TO_UI_TYPE: Record<string, string> = {
  'lead status': '3',
  'lead type': '11',
  industry: '29',
  'lead medium': '9',
  'industry name': '1',
  email: '2',
  'mobile phone': '4',
  name: '22',
  'assigned to': '15',
  description: '5',
  address: '1',
  salutation: '23',
  sequence: '10',
  date: '7',
  'date and time': '19',
  time: '20',
  'follow up on': '19',
  'site visit date': '7',
  'site visit time': '20',
  'postal code': '1',
  'checkin status': '1',
  'lead source': '9',
  'lead sub status': '9',
  designation: '1',
};

export function normalizeFieldLabel(label: string): string {
  return label.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Resolve Testdata UI type from header attributes. */
export function resolveUiType(headerUiType: string | null, fieldLabel: string | null): string | null {
  if (fieldLabel) {
    const mapped = LABEL_TO_UI_TYPE[normalizeFieldLabel(fieldLabel)];
    if (mapped) return mapped;
  }
  if (headerUiType && /^\d+$/.test(headerUiType) && !READ_ONLY.has(headerUiType)) {
    return headerUiType;
    
  }
  return null;
}

export function getFieldKind(uiType: string): FieldKind {
  if (EMAIL.has(uiType)) return 'email';
  if (PHONE.has(uiType)) return 'phone';
  if (TEXTAREA.has(uiType)) return 'textarea';
  if (NUMBER.has(uiType)) return 'number';
  if (URL.has(uiType)) return 'url';
  if (CHECKBOX.has(uiType)) return 'checkbox';
  if (ASSIGNED.has(uiType)) return 'assignedTo';
  if (DATE.has(uiType)) return 'date';
  if (PICKLIST.has(uiType)) return 'picklist';
  if (TEXT.has(uiType)) return 'text';
  return 'unknown';
}

export function isReadOnlyUiType(uiType: string): boolean {
  return READ_ONLY.has(uiType);
}

export function isDateUiType(uiType: string): boolean {
  return DATE_UI_TYPES.has(uiType);
}



// testdataLoader.ts

export type TestdataRow = Record<string, string | number | boolean>;

const DEFAULT_PATH = path.join(__dirname, '..', 'data', 'filterFieldTypeData.json');

/** Load a row from JSON test data (default: first row). */
export function loadTestdataRow(rowIndex = 0, filePath = DEFAULT_PATH): TestdataRow {
  const rows = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TestdataRow[];
  if (!rows[rowIndex]) {
    throw new Error(`Testdata row ${rowIndex} missing in ${filePath}`);
  }
  return rows[rowIndex];
}

/** Value for a UI type key, or undefined if absent. */
export function getTestdataValue(row: TestdataRow, uiType: string): string | number | boolean | undefined {
  const v = row[uiType];
  return v === undefined || v === null ? undefined : v;
}

/** True when Testdata row has a value for this UI type key. */
export function hasTestdataUiType(row: TestdataRow, uiType: string): boolean {
  return getTestdataValue(row, uiType) !== undefined;
}

/** Picklist / multi-combo / Assigned To / City / State / Country use numeric option index in JSON. */
export function isPicklistIndexValue(value: string | number | boolean): value is number {
  return typeof value === 'number' && Number.isInteger(value) && !Number.isNaN(value);
}

/** Option index from Testdata for a UI type (e.g. `"3": 2` → index 2). */
export function getPicklistOptionIndex(row: TestdataRow, uiType: string): number | null {
  const v = getTestdataValue(row, uiType);
  if (v === undefined) return null;
  return isPicklistIndexValue(v) ? v : null;
}


// fieldTypeMapper.ts