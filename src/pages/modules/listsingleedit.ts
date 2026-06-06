import { expect, Locator, Page } from '@playwright/test';
import {
  getFieldKind,
  getPicklistOptionIndex,
  getTestdataValue,
  hasTestdataUiType,
  isPicklistIndexValue,
  isReadOnlyUiType,
  loadTestdataRow,
  normalizeFieldLabel,
  resolveUiType,
  scrollListColumnsNext,
  scrollListToStart,
  type FieldKind,
  type TestdataRow,
} from '@utils/helpers/listScroll';
import { LoginPage } from '@pages/auth/login';
import { navToModule } from '@pages/modules/navToMod';

export type { TestdataRow } from '@utils/helpers/listScroll';

export type ListRowField = {
  uiType: string;
  label: string;
  col: number;
  scrollIndex: number;
  hasEdit: boolean;
  fieldKind: FieldKind;
};

export type ListEditResult = {
  captured: number;
  attempted: number;
  succeeded: number;
  skipped: { uiType: string; label: string; reason: string }[];
};

export class ListSingleEdit {
  private fields: ListRowField[] = [];
  private currentScrollIndex = 0;
  private lastEditedCol = -1;

  constructor(private page: Page) {}

  private listTable(): Locator {
    return this.page
      .locator('table')
      .filter({ has: this.page.locator('tbody tr input[type="checkbox"]') })
      .first();
  }

  private headerRow(): Locator {
    return this.listTable()
      .locator('tr')
      .filter({ has: this.page.getByRole('columnheader') })
      .first();
  }

  firstDataRow(): Locator {
    return this.listTable()
      .locator('tbody tr')
      .filter({ has: this.page.locator('input[type="checkbox"]') })
      .filter({ visible: true })
      .first();
  }

  async waitForListReady() {
    await expect(this.page.locator('#livewireOverly')).toBeHidden({ timeout: 60_000 });
    await expect(this.page).toHaveURL(/AdvancedListView/i, { timeout: 30_000 });
    await expect(this.firstDataRow()).toBeVisible({ timeout: 20_000 });
    await expect(this.headerRow()).toBeVisible({ timeout: 10_000 });
  }

  private async goToScrollIndex(scrollIndex: number) {
    if (scrollIndex < this.currentScrollIndex) {
      await scrollListToStart(this.page);
      this.currentScrollIndex = 0;
    }
    while (this.currentScrollIndex < scrollIndex) {
      await scrollListColumnsNext(this.page);
      this.currentScrollIndex++;
    }
  }
  async clickBreadCrumb(breadcrumb: string) {
    await this.page.locator(".breadcrumb-item").click();
  }

  async captureFirstRowFields(): Promise<ListRowField[]> {
    this.fields = [];
    const seen = new Set<string>();
    this.currentScrollIndex = 0;
    await scrollListToStart(this.page);

    for (let scrollIndex = 0; scrollIndex < 8; scrollIndex++) {
      const snapshot = await this.page.evaluate(() => {
        const table = document.querySelectorAll('table');
        let target: HTMLTableElement | null = null;
        for (const t of table) {
          if (t.querySelector('tbody tr input[type="checkbox"]')) {
            target = t as HTMLTableElement;
            break;
          }
        }
        if (!target) return { headers: [] as { col: number; uiType: string | null; label: string | null; text: string }[], edits: [] as boolean[] };

        const headerTr = Array.from(target.querySelectorAll('tr')).find((tr) =>
          tr.querySelector('[role="columnheader"], th')
        );
        const dataTr = Array.from(target.querySelectorAll('tbody tr')).find((tr) =>
          tr.querySelector('input[type="checkbox"]')
        );

        const headers: { col: number; uiType: string | null; label: string | null; text: string }[] = [];
        if (headerTr) {
          headerTr.querySelectorAll('th, td, [role="columnheader"]').forEach((cell, col) => {
            const marker = cell.querySelector('[data-fieldtype]') ?? cell.closest('[data-fieldtype]');
            const el = (marker ?? cell) as HTMLElement;
            headers.push({
              col,
              uiType: el.getAttribute('data-fieldtype'),
              label: el.getAttribute('data-fieldlabel'),
              text: (cell.textContent ?? '').replace(/\s+/g, ' ').trim(),
            });
          });
        }

        const edits: boolean[] = [];
        if (dataTr) {
          dataTr.querySelectorAll('td').forEach((td) => {
            edits.push(!!td.querySelector('.fa-edit, .fa-pencil, .editIcon, .single-edit'));
          });
        }

        return { headers, edits };
      });

      for (const h of snapshot.headers) {
        if (/^add column$/i.test(h.text) || h.text.length < 2) continue;

        const uiType = resolveUiType(h.uiType, h.label);
        if (!uiType || isReadOnlyUiType(uiType)) continue;

        const label = (h.label ?? h.text).replace(/\s+(Asc|Desc|filter_list).*$/i, '').trim();
        const key = `${uiType}|${normalizeFieldLabel(label)}`;
        if (seen.has(key)) continue;

        const hasEdit = snapshot.edits[h.col] ?? false;
        if (!hasEdit) continue;

        seen.add(key);
        this.fields.push({
          uiType,
          label,
          col: h.col,
          scrollIndex,
          hasEdit,
          fieldKind: getFieldKind(uiType),
        });
      }

      const before = seen.size;
      if (!(await scrollListColumnsNext(this.page))) break;
      if (seen.size === before && scrollIndex > 0) break;
    }

    this.fields.sort((a, b) => a.scrollIndex - b.scrollIndex || a.col - b.col);
    await scrollListToStart(this.page);
    this.currentScrollIndex = 0;

    console.log(`[ListEdit] Captured ${this.fields.length} editable field(s) in first row:`);
    for (const f of this.fields) {
      console.log(`  - UI ${f.uiType} | ${f.label} | kind=${f.fieldKind} | col=${f.col} | scroll=${f.scrollIndex}`);
    }
    return this.fields;
  }

  getCapturedFields(): ListRowField[] {
    return this.fields;
  }

  private cellForField(field: ListRowField): Locator {
    return this.firstDataRow().locator('td').nth(field.col);
  }

  private async resetListFocus() {
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  }

  private async dismissInlineEditor(cell: Locator) {
    const cancel = cell.locator('.fa-times, .fa-close, .fa-remove, .cancelIcon, .closeIcon').first();
    if ((await cancel.count()) > 0) {
      await cancel.click({ force: true }).catch(() => {});
    }
    await this.resetListFocus();
  }

  private async recoverListState() {
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await scrollListToStart(this.page);
    this.currentScrollIndex = 0;
    await expect(this.firstDataRow()).toBeVisible({ timeout: 20_000 }).catch(() => {});
  }

  private async scrollToColumn(col: number) {
    await scrollListToStart(this.page);
    this.currentScrollIndex = 0;
    const clicks = col > 8 ? Math.min(Math.ceil((col - 6) / 2), 10) : 0;
    for (let i = 0; i < clicks; i++) {
      await scrollListColumnsNext(this.page);
      this.currentScrollIndex++;
    }
  }

  private async scrollFieldIntoView(field: ListRowField) {
    await this.goToScrollIndex(field.scrollIndex);
    await this.scrollToColumn(field.col);
    const row = this.firstDataRow();
    let cell = this.cellForField(field);
    const tdCount = await row.locator('td').count().catch(() => 0);
    if (field.col >= tdCount) {
      await this.recoverListState();
      cell = this.cellForField(field);
    }

    if (field.col < this.lastEditedCol || !(await cell.isVisible().catch(() => false))) {
      await scrollListToStart(this.page);
      this.currentScrollIndex = 0;
      await this.goToScrollIndex(field.scrollIndex);
      cell = this.cellForField(field);
    }

    for (let i = 0; i < 12 && !(await cell.isVisible().catch(() => false)); i++) {
      await scrollListColumnsNext(this.page);
      this.currentScrollIndex++;
    }

    await cell.evaluate((el) => el.scrollIntoView({ inline: 'center', block: 'nearest' })).catch(() => {});
    try {
      await expect(cell).toBeAttached({ timeout: 8000 });
    } catch {
      await this.recoverListState();
      cell = this.cellForField(field);
      await expect(cell).toBeAttached({ timeout: 12_000 });
    }
  }

  private async waitCellEditable(cell: Locator): Promise<boolean> {
    await cell.hover({ force: true });
    const editIcon = cell.locator('.single-edit, .fa-edit, .fa-pencil, .editIcon').first();
    try {
      await expect(editIcon).toBeAttached({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  private async openEdit(cell: Locator, fieldKind: FieldKind): Promise<boolean> {
    await cell.hover({ force: true });
    await this.page.waitForTimeout(250);
    const editIcon = cell.locator('.single-edit, .fa-edit, .fa-pencil, .editIcon').first();
    if ((await editIcon.count()) > 0) {
      try {
        await editIcon.click({ force: true, timeout: 6000 });
      } catch {
        await editIcon.evaluate((el) => (el as HTMLElement).click());
      }
      await this.page.waitForTimeout(300);
    }

    if (fieldKind === 'assignedTo') {
      return (await cell.locator('.select2-selection, .fa-check, .submiticonSummary').count()) > 0;
    }

    if (fieldKind === 'picklist') {
      const row = cell.locator('xpath=ancestor::tr[1]');
      const hasControl =
        (await cell.locator('.select2-selection, .select2-container, select').count()) > 0 ||
        (await row.locator('.select2-selection, select').count()) > 0;
      if (hasControl) return true;
      await this.page.waitForTimeout(500);
      return (await cell.locator('.select2-selection, select, input:visible').count()) > 0;
    }

    const input = cell.locator(
      'input:visible:not([type="hidden"]):not([readonly]), textarea:visible, select:visible'
    ).first();
    const select2Open = this.page.locator('.select2-container--open');
    try {
      await Promise.race([
        input.waitFor({ state: 'visible', timeout: 8000 }),
        select2Open.waitFor({ state: 'visible', timeout: 8000 }),
      ]);
      return true;
    } catch {
      const selection = cell.locator('.select2-selection').first();
      if ((await selection.count()) > 0) {
        await selection.click({ force: true });
        try {
          await select2Open.waitFor({ state: 'visible', timeout: 5000 });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  private dropdownOptionsInOpenPanel() {
    const panel = this.page.locator('.select2-container--open').last();
    return panel.locator(
      '.select2-results__option:not(.select2-results__option--disabled), ' +
        'li.select2-results__option:not(.select2-results__option--disabled), ' +
        '[role="option"]:not([aria-disabled="true"]), [role="treeitem"]:not([aria-disabled="true"])'
    );
  }

  private async waitDropdownOpen(): Promise<boolean> {
    return this.page
      .locator('.select2-container--open, .select2-dropdown')
      .last()
      .waitFor({ state: 'visible', timeout: 8000 })
      .then(() => true)
      .catch(() => false);
  }

  private async clickToOpenDropdown(target: Locator): Promise<boolean> {
    if ((await target.count()) === 0) return false;
    try {
      await target.first().click({ force: true, timeout: 5000 });
    } catch {
      await target.first().evaluate((el) => (el as HTMLElement).click());
    }
    return this.waitDropdownOpen();
  }

  /** TD that currently shows inline edit controls (after pencil click). */
  private activeEditCell(): Locator {
    return this.firstDataRow()
      .locator('td')
      .filter({
        has: this.page.locator(
          '.select2-selection, .select2-container--open, select:not([type="hidden"]), .fa-check, .submiticonSummary, input.select2-search__field'
        ),
      })
      .first();
  }

  private picklistRoot(cell: Locator, uiType: string): Locator {
    const scoped = cell.locator(`[data-fieldtype="${uiType}"]`).first();
    return scoped;
  }

  private picklistSelect(cell: Locator, uiType: string): Locator {
    const row = cell.locator('xpath=ancestor::tr[1]');
    return row
      .locator(`[data-fieldtype="${uiType}"] select`)
      .first()
      .or(cell.locator(`[data-fieldtype="${uiType}"] select`).first())
      .or(cell.locator('select.select2, select.multirelatedselct2, select').first())
      .or(row.locator('select').first());
  }

  /** Set picklist value on first data row column via native select / jQuery Select2. */
  private async setPicklistInColumn(
    col: number,
    uiType: string,
    value: string | number | boolean
  ): Promise<boolean> {
    const index = Number(value);
    const label = String(value);
    return this.page.evaluate(
      (args) => {
        const tables = Array.from(document.querySelectorAll('table'));
        const table = tables.find((t) => t.querySelector('tbody tr input[type="checkbox"]'));
        const row = table
          ? (Array.from(table.querySelectorAll('tbody tr')).find((tr) =>
              tr.querySelector('input[type="checkbox"]')
            ) as HTMLTableRowElement | undefined)
          : undefined;
        if (!row || args.col >= row.cells.length) return false;
        const cellEl = row.cells[args.col];
        const roots: Element[] = [];
        const inCell = cellEl.querySelector(`[data-fieldtype="${args.uiType}"]`);
        if (inCell) roots.push(inCell);
        roots.push(cellEl);

        const extraSelects: HTMLSelectElement[] = [];
        cellEl.querySelectorAll('.select2-container').forEach((c) => {
          const prev = c.previousElementSibling;
          if (prev?.tagName === 'SELECT') extraSelects.push(prev as HTMLSelectElement);
        });

        for (const root of roots) {
          const selects = [
            ...Array.from(root.querySelectorAll('select.select2-hidden-accessible, select')) as HTMLSelectElement[],
            ...extraSelects,
          ];
          const seen = new Set<HTMLSelectElement>();
          for (const select of selects) {
            if (seen.has(select)) continue;
            seen.add(select);
            if (!select || select.options.length === 0) continue;

            let pick = 0;
            if (Number.isInteger(args.index) && !Number.isNaN(args.index)) {
              pick = Math.min(Math.max(0, args.index), select.options.length - 1);
            } else {
              const opt = Array.from(select.options).find(
                (o) => o.textContent?.trim() === args.label || o.value === args.label
              );
              if (!opt) continue;
              pick = opt.index;
            }

            type JqSelect = {
              data: (k: string) => unknown;
              val: (v?: string | string[]) => JqSelect;
              trigger: (e: string) => void;
            };
            const jq = (window as unknown as { jQuery?: (el: Element) => JqSelect }).jQuery;
            const val = select.options[pick].value;

            if (jq) {
              const $s = jq(select);
              if ($s.data('select2')) {
                const isMulti = select.multiple;
                $s.val(isMulti ? [val] : val).trigger('change');
                return true;
              }
            }

            if (select.multiple) {
              for (const o of select.options) o.selected = false;
              select.options[pick].selected = true;
            } else {
              select.selectedIndex = pick;
            }
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
        return false;
      },
      { col, uiType, index, label }
    );
  }

  /** Set picklist via hidden/native select or jQuery Select2 (no dropdown UI required). */
  private async setPicklistViaDom(
    cell: Locator,
    uiType: string,
    value: string | number | boolean
  ): Promise<boolean> {
    const index = Number(value);
    const label = String(value);
    return cell.evaluate(
      (cellEl, args) => {
        const row = cellEl.closest('tr');
        const roots: Element[] = [];
        const inCell = cellEl.querySelector(`[data-fieldtype="${args.uiType}"]`);
        const inRow = row?.querySelector(`[data-fieldtype="${args.uiType}"]`);
        if (inCell) roots.push(inCell);
        if (inRow && !roots.includes(inRow)) roots.push(inRow);
        roots.push(cellEl);

        const extraSelects: HTMLSelectElement[] = [];
        cellEl.querySelectorAll('.select2-container').forEach((c) => {
          const prev = c.previousElementSibling;
          if (prev?.tagName === 'SELECT') extraSelects.push(prev as HTMLSelectElement);
        });

        for (const root of roots) {
          const selects = [
            ...Array.from(root.querySelectorAll('select.select2-hidden-accessible, select')) as HTMLSelectElement[],
            ...extraSelects,
          ];
          const seen = new Set<HTMLSelectElement>();
          for (const select of selects) {
            if (seen.has(select)) continue;
            seen.add(select);
            if (!select || select.options.length === 0) continue;

            let pick = 0;
            if (Number.isInteger(args.index) && !Number.isNaN(args.index)) {
              pick = Math.min(Math.max(0, args.index), select.options.length - 1);
            } else {
              const opt = Array.from(select.options).find(
                (o) => o.textContent?.trim() === args.label || o.value === args.label
              );
              if (!opt) continue;
              pick = opt.index;
            }

            type JqSelect = {
              data: (k: string) => unknown;
              val: (v?: string | string[]) => JqSelect;
              trigger: (e: string) => void;
            };
            const jq = (window as unknown as { jQuery?: (el: Element) => JqSelect }).jQuery;
            const val = select.options[pick].value;

            if (jq) {
              const $s = jq(select);
              if ($s.data('select2')) {
                const isMulti = select.multiple || select.classList.contains('select2-hidden-accessible');
                $s.val(isMulti ? [val] : val).trigger('change');
                return true;
              }
            }

            if (select.multiple) {
              for (const o of select.options) o.selected = false;
              select.options[pick].selected = true;
            } else {
              select.selectedIndex = pick;
            }
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
        return false;
      },
      { uiType, index, label }
    );
  }

  private async waitPicklistEditor(cell: Locator, uiType: string): Promise<boolean> {
    const select = this.picklistSelect(cell, uiType);
    const selection = cell.locator(
      `[data-fieldtype="${uiType}"] .select2-selection, .select2-selection, .select2-search__field`
    );
    try {
      await Promise.race([
        select.waitFor({ state: 'attached', timeout: 8000 }),
        selection.first().waitFor({ state: 'visible', timeout: 8000 }),
      ]);
      return true;
    } catch {
      return (await select.count()) > 0 || (await selection.count()) > 0;
    }
  }

  private async openPicklistDropdown(cell: Locator, uiType: string): Promise<boolean> {
    await this.page.waitForTimeout(350);
    const row = cell.locator('xpath=ancestor::tr[1]');

    const clickTargets = [
      cell.locator(`[data-fieldtype="${uiType}"] .select2-selection__arrow`),
      cell.locator(`[data-fieldtype="${uiType}"] .select2-selection`),
      cell.locator('.select2-container--focus .select2-selection'),
      cell.locator('.select2-container .select2-selection'),
      cell.locator('.select2-selection'),
      cell.locator('.select2-search__field'),
      row.locator('.select2-selection').last(),
    ];

    for (const target of clickTargets) {
      if (await this.clickToOpenDropdown(target)) return true;
    }

    const select = this.picklistSelect(cell, uiType);
    if ((await select.count()) > 0) {
      const viaJq = await select
        .evaluate((el) => {
          const jq = (window as unknown as {
            jQuery?: (e: Element) => { data: (k: string) => unknown; select2: (cmd: string) => void };
          }).jQuery;
          if (jq?.(el).data('select2')) {
            jq(el).select2('open');
            return true;
          }
          return false;
        })
        .catch(() => false);
      if (viaJq && (await this.waitDropdownOpen())) return true;
      if (await this.clickToOpenDropdown(select)) return true;
      await select.focus().catch(() => {});
      await this.page.keyboard.press('ArrowDown').catch(() => {});
      if (await this.waitDropdownOpen()) return true;
    }

    const visible = cell.locator('.select2-selection:visible');
    if ((await visible.count()) > 0 && (await this.clickToOpenDropdown(visible.last()))) {
      return true;
    }

    return false;
  }

  private async openPicklistDropdownByCol(col: number, uiType?: string): Promise<boolean> {
    const clicked = await this.page.evaluate(
      ({ colIdx, ut }) => {
        const tables = Array.from(document.querySelectorAll('table'));
        const table = tables.find((t) => t.querySelector('tbody tr input[type="checkbox"]'));
        const row = table
          ? (Array.from(table.querySelectorAll('tbody tr')).find((tr) =>
              tr.querySelector('input[type="checkbox"]')
            ) as HTMLTableRowElement | undefined)
          : undefined;
        if (!row || colIdx >= row.cells.length) return false;
        const td = row.cells[colIdx];

        const tryOpen = (root: Element): boolean => {
          const search = root.querySelector('.select2-search__field') as HTMLElement | null;
          if (search) {
            search.focus();
            search.click();
            return true;
          }
          const arrow = root.querySelector('.select2-selection__arrow') as HTMLElement | null;
          if (arrow) {
            arrow.click();
            return true;
          }
          const selection = root.querySelector(
            '.select2-selection--multiple, .select2-selection'
          ) as HTMLElement | null;
          if (selection) {
            selection.click();
            return true;
          }
          const select = root.querySelector(
            'select.multirelatedselct2, select.select2, select'
          ) as HTMLSelectElement | null;
          const jq = (window as unknown as {
            jQuery?: (el: Element) => { data: (k: string) => unknown; select2: (cmd: string) => void };
          }).jQuery;
          if (select && jq?.(select).data('select2')) {
            jq(select).select2('open');
            return true;
          }
          return false;
        };

        if (ut) {
          const marked = td.querySelector(`[data-fieldtype="${ut}"]`);
          if (marked && tryOpen(marked)) return true;
        }
        return tryOpen(td);
      },
      { colIdx: col, ut: uiType ?? '' }
    );
    if (!clicked) return false;
    return this.waitDropdownOpen();
  }

  private async selectFromOpenDropdown(
    field: ListRowField,
    value: string | number | boolean
  ): Promise<void> {
    const index = Number(value);
    const options = this.dropdownOptionsInOpenPanel();
    await options.first().waitFor({ state: 'visible', timeout: 10_000 });
    const count = await options.count();
    if (count === 0) throw new Error(`No dropdown options for ${field.label}`);

    if (Number.isInteger(index) && !Number.isNaN(index)) {
      const pick = Math.min(Math.max(0, index), count - 1);
      const label = ((await options.nth(pick).textContent()) ?? '').trim();
      await options.nth(pick).click({ force: true, timeout: 8000 });
      console.log(
        `[ListEdit] Picklist UI ${field.uiType} (${field.label}) → clicked option index ${pick} (JSON: ${index}): ${label || '(no text)'}`
      );
      return;
    }

    const byLabel = options.filter({ hasText: String(value) }).first();
    if ((await byLabel.count()) > 0) {
      await byLabel.click({ force: true, timeout: 8000 });
      console.log(`[ListEdit] Picklist UI ${field.uiType} (${field.label}) → label: ${value}`);
      return;
    }
    await this.page.getByRole('treeitem', { name: String(value), exact: true }).click({ timeout: 8000 });
  }

  /** Picklist / Assigned To: set value by DOM, native select, or open Select2 panel. */
  private async fillDropdownByIndex(
    field: ListRowField,
    cell: Locator,
    value: string | number | boolean
  ) {
    const index = Number(value);
    const uiType = field.uiType;
    const select = this.picklistSelect(cell, uiType);

    if (await this.setPicklistViaDom(cell, uiType, value)) {
      console.log(
        `[ListEdit] Picklist UI ${uiType} (${field.label}) → DOM set ${Number.isInteger(index) && !Number.isNaN(index) ? `index ${index}` : `label ${value}`}`
      );
      return;
    }

    if ((await select.count()) > 0) {
      if (Number.isInteger(index) && !Number.isNaN(index)) {
        await select.selectOption({ index }, { force: true });
      } else {
        await select.selectOption({ label: String(value) }, { force: true }).catch(async () => {
          await select.selectOption({ value: String(value) }, { force: true });
        });
      }
      await select.dispatchEvent('change');
      console.log(`[ListEdit] Native select UI ${uiType} (${field.label})`);
      return;
    }

    if (await this.openPicklistDropdown(cell, uiType)) {
      await this.selectFromOpenDropdown(field, value);
      return;
    }

    throw new Error(`No dropdown control found for ${field.label}`);
  }

  /** Dedicated picklist flow: edit icon → open dropdown → select JSON index → tick save. */
  /** Open inline list-cell editor via DOM (avoids flaky cell locator hover/click). */
  private async openCellInlineEdit(col: number): Promise<boolean> {
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    return this.page.evaluate((colIdx) => {
      const tables = Array.from(document.querySelectorAll('table'));
      const table = tables.find((t) => t.querySelector('tbody tr input[type="checkbox"]'));
      if (!table) return false;
      const row = Array.from(table.querySelectorAll('tbody tr')).find((tr) =>
        tr.querySelector('input[type="checkbox"]')
      ) as HTMLTableRowElement | undefined;
      if (!row || colIdx >= row.cells.length) return false;
      const td = row.cells[colIdx];
      td.scrollIntoView({ inline: 'center', block: 'nearest' });
      const icon = td.querySelector(
        '.single-edit, .fa-pencil, .fa-edit, .editIcon, i[class*="pencil"]'
      ) as HTMLElement | null;
      if (icon) {
        icon.click();
        return true;
      }
      td.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      return true;
    }, col);
  }

  private async clickListEditIcon(cell: Locator, col: number): Promise<void> {
    const opened = await this.openCellInlineEdit(col);
    if (!opened) {
      const editIcon = cell.locator('.single-edit, .fa-pencil, .fa-edit, .editIcon').first();
      await editIcon.click({ force: true, timeout: 5000 }).catch(() => cell.click({ force: true }));
    }
    await this.page.waitForTimeout(500);
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  }

  /** Read `data-fieldtype` from list cell (matches Testdata.json keys). */
  private async readFieldTypeAtCol(col: number): Promise<string | null> {
    return this.page.evaluate((colIdx) => {
      const tables = Array.from(document.querySelectorAll('table'));
      const table = tables.find((t) => t.querySelector('tbody tr input[type="checkbox"]'));
      const row = table
        ? (Array.from(table.querySelectorAll('tbody tr')).find((tr) =>
            tr.querySelector('input[type="checkbox"]')
          ) as HTMLTableRowElement | undefined)
        : undefined;
      if (!row || colIdx >= row.cells.length) return null;
      const td = row.cells[colIdx];
      const marked = td.querySelector('[data-fieldtype]');
      if (marked) return marked.getAttribute('data-fieldtype');
      const sel = td.querySelector('select[data-fieldtype]');
      if (sel) return sel.getAttribute('data-fieldtype');
      return null;
    }, col);
  }

  /**
   * Match DOM field type to Testdata.json UI key; return value to apply.
   * Prefers DOM `data-fieldtype` when that key exists in Testdata.
   */
  private resolveTestdataMatch(
    field: ListRowField,
    domFieldType: string | null,
    testdata: TestdataRow
  ): { uiType: string; value: string | number | boolean } | null {
    if (domFieldType && hasTestdataUiType(testdata, domFieldType)) {
      return { uiType: domFieldType, value: getTestdataValue(testdata, domFieldType)! };
    }
    if (hasTestdataUiType(testdata, field.uiType)) {
      return { uiType: field.uiType, value: getTestdataValue(testdata, field.uiType)! };
    }
    return null;
  }

  /** Select picklist option by Testdata index or label (does not save). */
  private async applyPicklistValue(
    field: ListRowField,
    cell: Locator,
    uiType: string,
    value: string | number | boolean
  ): Promise<boolean> {
    if (uiType === '3' && isPicklistIndexValue(value)) {
      await this.page.waitForTimeout(600);
      const editTd = this.firstDataRow().locator('td').nth(field.col);
      const pick = value as number;
      const triggers = [
        editTd.locator('.select2-selection--multiple'),
        editTd.locator('.select2-selection'),
        editTd.locator('[class*="combo"]'),
        editTd.locator('.select2-container'),
      ];
      for (const trigger of triggers) {
        if ((await trigger.count()) === 0) continue;
        await trigger.first().click({ force: true });
        await this.page.waitForTimeout(700);
        if (await this.waitDropdownOpen()) {
          const options = this.dropdownOptionsInOpenPanel();
          const count = await options.count();
          if (count > 0) {
            await options.nth(Math.min(pick, count - 1)).click({ force: true });
            console.log(`[ListEdit] Multi combo UI 3 → option index ${pick}`);
            return true;
          }
        }
      }
      if (await this.setPicklistInColumn(field.col, uiType, value)) return true;
    }

    if (uiType === '11' && typeof value === 'string') {
      await this.page.waitForTimeout(600);
      const editTd = this.firstDataRow().locator('td').nth(field.col);
      const label = value;
      const triggers = editTd.locator('.select2-selection, .multirelatedselct2, .select2-container');
      if ((await triggers.count()) > 0) {
        await triggers.first().click({ force: true });
        await this.page.waitForTimeout(800);
      } else if (!(await this.openPicklistDropdownByCol(field.col, uiType))) {
        await this.openPicklistDropdownByCol(field.col);
      }
      const search = this.page
        .locator('.select2-container--open .select2-search__field, .select2-search__field:visible')
        .last();
      if ((await search.count()) > 0) {
        await search.fill(label);
        await this.page.waitForTimeout(2000);
      }
      const opt = this.page
        .locator('.select2-results__option:not(.select2-results__option--loading-results)')
        .filter({ hasText: label })
        .first();
      if ((await opt.count()) > 0) {
        await opt.click({ force: true });
        console.log(`[ListEdit] Related modules UI 11 → "${label}"`);
        return true;
      }
      try {
        await this.page.getByRole('option', { name: label }).first().click({ timeout: 6000 });
        return true;
      } catch {
        await this.page.getByRole('treeitem', { name: label }).first().click({ timeout: 6000 });
        return true;
      }
    }

    if (isPicklistIndexValue(value)) {
      if (await this.setPicklistInColumn(field.col, uiType, value)) return true;

      const select = this.picklistSelect(cell, uiType);
      if ((await select.count()) > 0) {
        try {
          await select.selectOption({ index: value }, { force: true });
          await select.dispatchEvent('change');
          return true;
        } catch {
          /* Select2 UI */
        }
      }

      if (
        (await this.openPicklistDropdownByCol(field.col, uiType)) ||
        (await this.openPicklistDropdownByCol(field.col))
      ) {
        await this.selectFromOpenDropdown(field, value);
        return true;
      }

      if (await this.openPicklistDropdown(cell, uiType)) {
        await this.selectFromOpenDropdown(field, value);
        return true;
      }
      return false;
    }

    const label = String(value);
    if (await this.openPicklistDropdownByCol(field.col, uiType) || (await this.openPicklistDropdownByCol(field.col))) {
      const search = this.page.locator('.select2-container--open .select2-search__field').last();
      if ((await search.count()) > 0) {
        await search.fill(label);
        await this.page.waitForTimeout(1000);
      }
      const opt = this.dropdownOptionsInOpenPanel().filter({ hasText: label }).first();
      if ((await opt.count()) > 0) {
        await opt.click({ force: true });
        return true;
      }
    }
    if (await this.setPicklistInColumn(field.col, uiType, label)) return true;
    return false;
  }

  /**
   * Picklist / multi-combo / Assigned To / City / State / Country:
   * read field type → match Testdata.json → select index/label → caller saves.
   */
  private async editPicklistFromTestdata(
    field: ListRowField,
    cell: Locator,
    testdata: TestdataRow
  ): Promise<boolean> {
    await this.clickListEditIcon(cell, field.col);
    await this.page.waitForTimeout(500);

    const domType = await this.readFieldTypeAtCol(field.col);
    const match = this.resolveTestdataMatch(field, domType, testdata);
    if (!match) {
      console.warn(
        `[ListEdit] UI ${field.uiType} (${field.label}) — no Testdata match (DOM type=${domType ?? 'none'})`
      );
      return false;
    }

    const { uiType, value } = match;
    const index = getPicklistOptionIndex(testdata, uiType);
    console.log(
      `[ListEdit] Field type DOM=${domType ?? '?'} → Testdata key "${uiType}"` +
        (index !== null ? ` index=${index}` : ` value=${JSON.stringify(value)}`)
    );

    if (domType && domType !== field.uiType && resolveUiType(domType, field.label) !== field.uiType) {
      console.log(`[ListEdit] Using Testdata key "${uiType}" (captured UI ${field.uiType})`);
    }

    const ok = await this.applyPicklistValue(field, cell, uiType, value);
    if (ok) {
      console.log(`[ListEdit] Picklist UI ${uiType} (${field.label}) selected from Testdata`);
    }
    return ok;
  }

  private async fillByKind(
    field: ListRowField,
    cell: Locator,
    value: string | number | boolean
  ): Promise<void> {
    const { fieldKind, uiType } = field;

    if (fieldKind === 'picklist' || fieldKind === 'assignedTo') {
      await this.fillDropdownByIndex(field, cell, value);
      return;
    }

    if (fieldKind === 'checkbox') {
      const input = cell.locator('input[type="checkbox"]').first();
      const checked = value === true || value === 1 || String(value).toLowerCase() === 'true';
      await input.setChecked(checked);
      return;
    }

    if (fieldKind === 'date') {
      await this.fillDateTimeField(cell, uiType, String(value));
      return;
    }

    let target = cell
      .locator(`[data-fieldtype="${uiType}"] input:visible, [data-fieldtype="${uiType}"] textarea:visible`)
      .first();
    if ((await target.count()) === 0) {
      target = cell.locator(
        'input:visible:not([type="hidden"]):not([readonly]), textarea:visible'
      ).first();
    }
    if (fieldKind === 'phone' && (await cell.locator('input:visible').count()) > 1) {
      target = cell.locator('input:visible:not([type="hidden"]):not([readonly])').last();
    }

    await expect(target).toBeVisible({ timeout: 8000 });
    await target.fill(String(value));
  }

  /** Date (7), Date and Time (19), Time (20): set value then tick save (not Enter). */
  private async fillDateTimeField(cell: Locator, uiType: string, value: string) {
    const str = String(value).trim();
    const inputs = cell.locator(
      `[data-fieldtype="${uiType}"] input:visible:not([type="hidden"]), input:visible:not([type="hidden"]):not([readonly])`
    );

    if (uiType === '20') {
      const timeInput = cell
        .locator('[data-fieldtype="20"] input, input[type="time"], input.timepicker')
        .first();
      const target = (await timeInput.count()) > 0 ? timeInput : inputs.first();
      await target.click({ force: true });
      await target.fill(str);
    } else if (uiType === '19') {
      const parts = str.split(/\s+/);
      const datePart = parts[0] ?? str;
      const timePart = parts[1] ?? '';
      const count = await inputs.count();
      if (count >= 2) {
        await inputs.nth(0).click({ force: true });
        await inputs.nth(0).fill(datePart);
        if (timePart) {
          await inputs.nth(1).click({ force: true });
          await inputs.nth(1).fill(timePart);
        }
      } else {
        await inputs.first().click({ force: true });
        await inputs.first().fill(str);
      }
    } else {
      const target =
        (await cell.locator(`[data-fieldtype="${uiType}"] input:visible`).count()) > 0
          ? cell.locator(`[data-fieldtype="${uiType}"] input:visible`).first()
          : inputs.first();
      await target.click({ force: true });
      await target.fill(str);
    }

    await this.page
      .locator('.flatpickr-calendar.open, .datepicker, .bootstrap-datetimepicker-widget')
      .waitFor({ state: 'hidden', timeout: 3000 })
      .catch(() => {});
    await this.page.waitForTimeout(300);
  }

  private mustUseTickSave(field: ListRowField): boolean {
    return field.fieldKind === 'date' || field.fieldKind === 'assignedTo';
  }

  private async clickTickSave(cell: Locator, field: ListRowField) {
    const tickSelectors =
      '.submiticonSummary, .submiticon, .fa-check, .saveIcon, i.fa-check, [class*="submiticon"]';

    const clicked = await this.page.evaluate((colIdx) => {
      const tickSels = [
        '.submiticonSummary',
        '.submiticon',
        '.fa-check',
        '.saveIcon',
        'i.fa-check',
        '[class*="submiticon"]',
      ];
      const tables = Array.from(document.querySelectorAll('table'));
      const table = tables.find((t) => t.querySelector('tbody tr input[type="checkbox"]'));
      const row = table
        ? (Array.from(table.querySelectorAll('tbody tr')).find((tr) =>
            tr.querySelector('input[type="checkbox"]')
          ) as HTMLTableRowElement | undefined)
        : undefined;
      if (!row || colIdx >= row.cells.length) return false;
      const td = row.cells[colIdx];
      for (const s of tickSels) {
        const tick = td.querySelector(s) as HTMLElement | null;
        if (tick) {
          tick.click();
          return true;
        }
      }
      return false;
    }, field.col);

    if (clicked) {
      console.log(`[ListEdit] Tick save clicked for ${field.label}`);
      await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
      return;
    }

    const row = cell.locator('xpath=ancestor::tr[1]');
    for (const scope of [cell, row]) {
      const tick = scope.locator(tickSelectors).filter({ visible: true }).first();
      if ((await tick.count()) > 0) {
        await tick.click({ force: true, timeout: 8000 });
        console.log(`[ListEdit] Tick save clicked for ${field.label}`);
        await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
        return;
      }
    }

    if (this.mustUseTickSave(field)) {
      throw new Error(`Tick save icon required for ${field.label} (UI ${field.uiType})`);
    }
    await this.page.keyboard.press('Enter').catch(() => {});
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  }

  async editFieldInFirstRow(
    field: ListRowField,
    value: string | number | boolean,
    testdata: TestdataRow
  ): Promise<boolean> {
    return this.editFieldDynamic(field, value, testdata);
  }

  async editFieldDynamic(
    field: ListRowField,
    value: string | number | boolean,
    testdata: TestdataRow
  ): Promise<boolean> {
    try {
      await this.resetListFocus();
      await this.scrollFieldIntoView(field);
    } catch (err) {
      console.warn(
        `[ListEdit] Skip UI ${field.uiType} (${field.label}) — scroll: ${err instanceof Error ? err.message : String(err)}`
      );
      await this.recoverListState();
      return false;
    }

    const cell = this.cellForField(field);
    if (!(await this.waitCellEditable(cell))) {
      console.warn(`[ListEdit] Skip UI ${field.uiType} (${field.label}) — not editable`);
      return false;
    }

    try {
      console.log(
        `[ListEdit] Updating UI ${field.uiType} (${field.label}) kind=${field.fieldKind} value=${JSON.stringify(value)}`
      );

      if (field.fieldKind === 'picklist' || field.fieldKind === 'assignedTo') {
        if (!(await this.editPicklistFromTestdata(field, cell, testdata))) {
          console.warn(`[ListEdit] Skip UI ${field.uiType} (${field.label}) — picklist/Testdata not applied`);
          await this.dismissInlineEditor(cell);
          return false;
        }
      } else {
        if (!(await this.openEdit(cell, field.fieldKind))) {
          console.warn(`[ListEdit] Skip UI ${field.uiType} (${field.label}) — could not open edit mode`);
          return false;
        }
        await this.fillByKind(field, cell, value);
      }

      await this.clickTickSave(cell, field);
      await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
      await this.resetListFocus();
      const saveNote = field.fieldKind === 'date' ? ' (tick save after date/time)' : '';
      console.log(`[ListEdit] Saved UI ${field.uiType} (${field.label})${saveNote}`);
      this.lastEditedCol = field.col;
      return true;
    } catch (err) {
      console.error(
        `[ListEdit] Failed UI ${field.uiType} (${field.label}): ${err instanceof Error ? err.message : String(err)}`
      );
      await this.recoverListState();
      return false;
    }
  }

  async editAllFieldsInFirstRow(testdata: TestdataRow): Promise<ListEditResult> {
    if (this.fields.length === 0) await this.captureFirstRowFields();

    const skipped: ListEditResult['skipped'] = [];
    let attempted = 0;
    let succeeded = 0;

    for (let i = 0; i < this.fields.length; i++) {
      const field = this.fields[i];
      const value = getTestdataValue(testdata, field.uiType);
      if (value === undefined) {
        skipped.push({ uiType: field.uiType, label: field.label, reason: 'no Testdata value' });
        continue;
      }
      attempted++;
      if (await this.editFieldInFirstRow(field, value, testdata)) {
        succeeded++;
      } else {
        skipped.push({ uiType: field.uiType, label: field.label, reason: 'edit/save failed' });
        await this.recoverListState();
      }
    }

    return { captured: this.fields.length, attempted, succeeded, skipped };
  }
}

// --- List single edit flows (callable from moduleNav.spec.ts) ---

/** Opens the module used by ListSingleEdit.spec (menu → dynMod index 2). */
export async function navigateToListSingleEditModule(page: Page) {
  const nav = new navToModule(page);
  await nav.waitForDashboardReady();
  await nav.menuIcon();
  await nav.dynMod(1);
}

/** Captures first-row fields and edits each from Testdata.json (default row 0). */
export async function runListSingleEditFirstRow(page: Page, testdataRowIndex = 0) {
  const testdata = loadTestdataRow(testdataRowIndex);
  const listEdit = new ListSingleEdit(page);
  page.setDefaultTimeout(12_000);
  await listEdit.waitForListReady();
  const result = await listEdit.editAllFieldsInFirstRow(testdata);
  expect(
    result.succeeded,
    `No fields updated. Skipped: ${result.skipped.map((s) => s.label).join(', ') || 'none'}`
  ).toBeGreaterThan(0);
  return result;
}

/** Login → module list → capture and edit first row (standalone spec flow). */
export async function runListSingleEditFromLogin(
  page: Page,
  companyName: string,
  userName: string,
  password: string,
  testdataRowIndex = 0
) {
  const logIn = new LoginPage(page);
  await logIn.loginPage();
  await logIn.login(companyName, userName, password);
  await navigateToListSingleEditModule(page);
  return runListSingleEditFirstRow(page, testdataRowIndex);
}
