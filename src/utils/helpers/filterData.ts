import allfields from '@data/Allfields.json';
import {
  getFieldKind,
  LABEL_TO_UI_TYPE,
  normalizeFieldLabel,
  type TestdataRow,
} from './listScroll';

const ASSIGNED_LABELS = ['Rsoft IT', 'Admin'];

type AllfieldsConfig = {
  fieldNames: string[];
  values: TestdataRow[];
};

const config = allfields as AllfieldsConfig;

/** Filter value row from Allfields.json `values` array (wraps when modules > rows). */
export function loadAllfieldsRow(rowIndex = 0): TestdataRow {
  const rows = config.values;
  if (!rows.length) {
    throw new Error('Allfields.json values array is empty');
  }
  const safeIndex =
    ((rowIndex % rows.length) + rows.length) % rows.length;
  if (safeIndex !== rowIndex) {
    console.log(
      `[filterData] Allfields row ${rowIndex} missing — using row ${safeIndex}`,
    );
  }
  return rows[safeIndex]!;
}

export function pickRandomFilterFields(count: number): string[] {
  const pool = [...config.fieldNames];
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

export function uiTypeForField(fieldName: string): string {
  return LABEL_TO_UI_TYPE[normalizeFieldLabel(fieldName)] ?? '1';
}

export function operatorForField(fieldName: string): string {
  return getFieldKind(uiTypeForField(fieldName)) === 'assignedTo' ? 'Is' : 'Equals';
}

function formatFieldValue(
  kind: ReturnType<typeof getFieldKind>,
  raw: string | number | boolean | undefined,
): string {
  if (kind === 'assignedTo') {
    const idx = typeof raw === 'number' ? raw : 0;
    return ASSIGNED_LABELS[idx] ?? ASSIGNED_LABELS[0];
  }
  if (kind === 'picklist') {
    return typeof raw === 'number' ? String(raw) : raw !== undefined ? String(raw) : '1';
  }
  if (kind === 'checkbox') return raw ? 'Yes' : 'No';
  if (kind === 'date') return raw !== undefined ? String(raw) : '';
  return raw !== undefined ? String(raw) : '';
}

/** Value for a field using label → ui type mapping. */
export function valueForField(row: TestdataRow, fieldName: string): string {
  const uiType = uiTypeForField(fieldName);
  return formatFieldValue(getFieldKind(uiType), row[uiType]);
}

/** Value using list-view `data-fieldtype` (preferred when label map differs). */
export function valueForFieldType(row: TestdataRow, fieldType: string): string {
  return formatFieldValue(getFieldKind(fieldType), row[fieldType]);
}
