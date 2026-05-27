import allfields from '../data/Allfields.json';
import {
  getFieldKind,
  LABEL_TO_UI_TYPE,
  loadTestdataRow,
  normalizeFieldLabel,
  type TestdataRow,
} from './listScroll';

const ASSIGNED_LABELS = ['Rsoft IT', 'Admin'];

type AllfieldsConfig = {
  fieldNames: string[];
};

const config = allfields as AllfieldsConfig;

/** Filter value row from filterFieldTypeData.json. */
export function loadAllfieldsRow(rowIndex = 0): TestdataRow {
  return loadTestdataRow(rowIndex);
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

export function valueForField(row: TestdataRow, fieldName: string): string {
  const uiType = uiTypeForField(fieldName);
  const kind = getFieldKind(uiType);
  const raw = row[uiType];

  if (kind === 'assignedTo') {
    const idx = typeof raw === 'number' ? raw : 0;
    return ASSIGNED_LABELS[idx] ?? ASSIGNED_LABELS[0];
  }
  if (kind === 'picklist') {
    return typeof raw === 'number' ? String(raw) : raw !== undefined ? String(raw) : '1';
  }
  if (kind === 'checkbox') return raw ? 'Yes' : 'No';
  return raw !== undefined ? String(raw) : '';
}
