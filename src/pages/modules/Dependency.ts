import { expect, Page, Locator } from '@playwright/test';

export type DependencyCompareResult = {
  sourceField: string;
  quickActionCities: string[];
  allSourceValues: string[];
  selectedTargetValues: string[];
  missingInGrid: string[];
  extraInGrid: string[];
  /** All dependency-selected cities appear in Quick Action dropdown. */
  matched: boolean;
  /** Every Quick Action city is selected in dependency grid. */
  allDropdownSelectedInGrid: boolean;
  /** Quick Action list exactly equals dependency-selected list. */
  fullMatch: boolean;
};

export const NO_DEPENDENCY_TARGET_MESSAGE =
  'No Dependency values are displaying based on the selected source field';

export class Dependency {
  readonly sourceFieldLabel = 'State';
  readonly targetFieldLabel = 'City';

  constructor(private page: Page) {}

  private pickRandom<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private normalizeText(text: string): string {
    return text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // ---- Quick Action --------------------------------------------------------

  quickActionModal(): Locator {
    return this.page.locator('#quick-action-modal');
  }

  /** Opens list-view quick action → Update Fields (State / City dependency UI). */
  async openUpdateFieldsQuickAction() {
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => {});

    const qaButton = this.page.locator('.qa_button').first();
    await expect(qaButton).toBeVisible({ timeout: 20_000 });
    await qaButton.click();
    await this.quickActionModal().waitFor({ state: 'visible', timeout: 20_000 });

    const updateFields = this.quickActionModal()
      .getByText(/Update Fields/i)
      .or(this.page.getByRole('tab', { name: /Update Fields/i }))
      .or(this.page.getByRole('link', { name: /Update Fields/i }));

    if (await updateFields.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await updateFields.first().click();
    }

    await expect(this.page.getByRole('heading', { name: 'Update Fields' })).toBeVisible({
      timeout: 15_000,
    });
  }

  /**
   * Pick a State that exists in both Quick Action and the dependency grid (avoids e.g. Mizoram in QA but not in grid).
   */
  async selectRandomSourceFromGrid(allSourceValues: string[]): Promise<string> {
    if (allSourceValues.length === 0) {
      throw new Error('Dependency grid has no source columns — cannot pick State for Quick Action.');
    }

    await this.openUpdateFieldsQuickAction();
    const qaOptions = await this.capturePicklistOptions(this.sourceFieldLabel);
    await this.page.keyboard.press('Escape').catch(() => {});

    const norm = (s: string) => this.normalizeText(s).toLowerCase();
    const gridKeys = new Set(allSourceValues.map(norm));
    const eligible = qaOptions.filter((opt) => gridKeys.has(norm(opt)));

    if (eligible.length === 0) {
      throw new Error(
        `No Quick Action "${this.sourceFieldLabel}" option matches dependency grid. QA: [${qaOptions.join(', ')}] Grid: [${allSourceValues.join(', ')}]`,
      );
    }

    const sourceValue = this.pickRandom(eligible);
    await this.selectPicklistByLabel(this.sourceFieldLabel, sourceValue);
    await this.page.waitForTimeout(600);

    console.log(`\n[Step 1] Source "${this.sourceFieldLabel}" = ${sourceValue} (from grid-aligned options)\n`);
    return sourceValue;
  }

  /**
   * Picklist dependency flow (State → City): read grid sources first, then Quick Action, then compare.
   * Call after Leads list is open (e.g. dynMod(1)).
   */
  async runPicklistDependencyFlow() {
    await this.navigateToDependencyEdit();
    const allSourceValues = await this.captureAllSourceFieldValues();
    await this.returnToLeadsList();

    const sourceValue = await this.selectRandomSourceFromGrid(allSourceValues);
    const targetCityOptions = await this.captureTargetFieldOptionsAndSave();

    await this.navigateToDependencyEdit();

    if (targetCityOptions.length === 0) {
      const gridSelected = await this.captureSelectedTargetValuesForSource(sourceValue);
      this.printNoDependencyTestResult(sourceValue, gridSelected);
      expect(gridSelected.length).toBe(0);
      await this.returnToLeadsList();
      return;
    }

    const dependencySelectedCities = await this.captureSelectedTargetValuesForSource(sourceValue);

    const compareResult = await this.compareTargetCityOptions(
      targetCityOptions,
      sourceValue,
      dependencySelectedCities,
      allSourceValues,
    );

    expect(this.sourceValueInGrid(sourceValue, allSourceValues)).toBe(true);
    expect(compareResult.fullMatch).toBe(true);
    expect(compareResult.matched).toBe(true);
    expect(compareResult.allDropdownSelectedInGrid).toBe(true);

    await this.returnToLeadsList();
  }

  private fieldRow(label: string): Locator {
    return this.quickActionModal()
      .locator('.qa-field-inner')
      .filter({
        has: this.page.locator('label.qa-form-label', {
          hasText: new RegExp(`^\\s*${label}\\s*$`, 'i'),
        }),
      })
      .first();
  }

  private async openFieldDropdown(fieldLabel: string) {
    await this.quickActionModal().waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.getByRole('heading', { name: 'Update Fields' }).scrollIntoViewIfNeeded();

    const row = this.fieldRow(fieldLabel);
    await expect(row).toBeVisible({ timeout: 15_000 });

    const select2 = row.locator('.select2-selection').first();
    if ((await select2.count()) > 0) {
      await select2.click({ force: true });
      await this.page.waitForTimeout(400);
      return;
    }

    const combo = row.locator('[role="combobox"]').first();
    if ((await combo.count()) > 0) {
      await combo.click({ force: true });
      await this.page.waitForTimeout(400);
      return;
    }

    await row.locator('select').first().click({ force: true });
    await this.page.waitForTimeout(400);
  }

  async selectPicklistByLabel(label: string, value: string) {
    await this.openFieldDropdown(label);

    const row = this.fieldRow(label);
    const nativeSelect = row.locator('select').first();

    if ((await nativeSelect.count()) > 0) {
      try {
        await nativeSelect.selectOption({ label: value }, { force: true, timeout: 3000 });
        await nativeSelect.dispatchEvent('change');
        await this.page.waitForTimeout(800);
        return;
      } catch {
        // Fall through to Select2 / combobox options.
      }
    }

    const option = this.page
      .getByRole('treeitem', { name: value, exact: true })
      .or(this.page.getByRole('option', { name: value, exact: true }));

    await expect(option.first()).toBeVisible({ timeout: 10_000 });
    await option.first().click({ force: true });
    await this.page.waitForTimeout(800);
  }

  private async capturePicklistOptions(fieldLabel: string): Promise<string[]> {
    await this.openFieldDropdown(fieldLabel);
    await this.page.waitForTimeout(400);

    const row = this.fieldRow(fieldLabel);
    const nativeSelect = row.locator('select').first();

    if ((await nativeSelect.count()) > 0) {
      const options = await nativeSelect.evaluate((select) =>
        [...(select as HTMLSelectElement).options]
          .filter((opt) => opt.text.trim() && !/^select an option$/i.test(opt.text.trim()))
          .filter((opt) => !opt.disabled)
          .map((opt) => opt.text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim())
      );
      await this.page.keyboard.press('Escape').catch(() => {});
      return options;
    }

    const openOptions = this.page
      .getByRole('listbox')
      .getByRole('option')
      .or(this.page.getByRole('treeitem'))
      .or(
        this.page.locator(
          '.select2-container--open .select2-results__option:not(.select2-results__option--loading-results)'
        )
      );

    await openOptions.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

    const options: string[] = [];
    const total = await openOptions.count();
    for (let i = 0; i < total; i++) {
      const text = this.normalizeText((await openOptions.nth(i).innerText()) ?? '');
      if (text && !/^select an option$/i.test(text)) options.push(text);
    }

    await this.page.keyboard.press('Escape').catch(() => {});
    return options;
  }

  /** Step 1 – select a random value in the source field (State). */
  async selectRandomSourceValue(): Promise<string> {
    const options = await this.capturePicklistOptions(this.sourceFieldLabel);
    if (options.length === 0) {
      throw new Error(`No options in source field "${this.sourceFieldLabel}"`);
    }

    const sourceValue = this.pickRandom(options);
    await this.selectPicklistByLabel(this.sourceFieldLabel, sourceValue);
    await this.page.waitForTimeout(600);

    console.log(`\n[Step 1] Random source "${this.sourceFieldLabel}" = ${sourceValue}\n`);
    return sourceValue;
  }

  /** Step 2 – open target field and capture values (empty list allowed). */
  async captureTargetFieldOptions(): Promise<string[]> {
    const row = this.fieldRow(this.targetFieldLabel);
    const nativeSelect = row.locator('select').first();

    if ((await nativeSelect.count()) > 0) {
      const options = await nativeSelect.evaluate((select) =>
        [...(select as HTMLSelectElement).options]
          .filter((opt) => opt.text.trim() && !/^select an option$/i.test(opt.text.trim()))
          .filter((opt) => !opt.disabled)
          .map((opt) => opt.text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim())
      );

      console.log(`\n[Step 2] Target "${this.targetFieldLabel}" options (${options.length}):`);
      if (options.length === 0) {
        console.log('  (none)\n');
      } else {
        options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
        console.log('');
      }
      return options;
    }

    const options = await this.capturePicklistOptions(this.targetFieldLabel);
    console.log(`\n[Step 2] Target "${this.targetFieldLabel}" options (${options.length}):`);
    if (options.length === 0) {
      console.log('  (none)\n');
    } else {
      options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
      console.log('');
    }
    return options;
  }

  /** Step 2 (continued) – after capture, select first target value if any, then Save. */
  async captureTargetFieldOptionsAndSave(): Promise<string[]> {
    const options = await this.captureTargetFieldOptions();

    if (options.length > 0) {
      await this.selectPicklistByLabel(this.targetFieldLabel, options[0]);
      console.log(`[Step 2] Selected first target value: ${options[0]}\n`);
    }

    await this.saveQuickAction();
    console.log('[Step 2] Quick Action saved.\n');
    return options;
  }

  async closeQuickActionModal() {
    const modal = this.quickActionModal();
    if (!(await modal.isVisible().catch(() => false))) return;

    const closeBtn = modal.getByRole('button', { name: /^close$/i });
    if ((await closeBtn.count()) > 0) {
      await closeBtn.first().click({ force: true });
    } else {
      await this.page.keyboard.press('Escape');
    }
    await modal.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  }

  /** Step 4 – dependency grid has no selected targets for this source value. */
  async verifyNoDependencySelectionForSource(sourceValue: string): Promise<boolean> {
    const selected = await this.captureSelectedTargetValuesForSource(sourceValue);
    const empty = selected.length === 0;

    console.log(`[Step 4] Dependency grid for "${sourceValue}" – selected count: ${selected.length}`);
    if (empty) {
      console.log('  No values selected in dependency grid for this source.\n');
    } else {
      console.log(`  Unexpected selections: ${selected.join(', ')}\n`);
    }

    return empty;
  }

  private formatResultLine(label: string, value: string): string {
    return `  ${label.padEnd(22)}: ${value}`;
  }

  /** Step 3 – standard compare result block for console / report. */
  printCompareTestResult(result: DependencyCompareResult) {
    const quickList = result.quickActionCities.join(', ') || 'none';
    const gridList = result.selectedTargetValues.join(', ') || 'none';

    console.log('\n[Step 3] Compare targetCityOptions vs dependency grid selection');
    console.log(this.formatResultLine('Quick Action cities', quickList));
    console.log(this.formatResultLine('Grid selected cities', gridList));
    console.log(
      this.formatResultLine('Missing in grid', result.missingInGrid.length ? result.missingInGrid.join(', ') : 'none')
    );
    console.log(
      this.formatResultLine('Extra in grid', result.extraInGrid.length ? result.extraInGrid.join(', ') : 'none')
    );
    console.log(this.formatResultLine('Grid cities in QA', result.matched ? 'YES' : 'NO'));
    console.log(this.formatResultLine('QA cities in grid', result.allDropdownSelectedInGrid ? 'YES' : 'NO'));
    console.log(this.formatResultLine('Full match', result.fullMatch ? 'YES' : 'NO'));
    console.log('');
  }

  /** Step 4–5 – no target options in Quick Action; verify empty dependency grid. */
  printNoDependencyTestResult(sourceValue: string, gridSelected: string[]) {
    console.log('\n[Step 4] Compare targetCityOptions vs dependency grid selection');
    console.log(this.formatResultLine('Selected source', sourceValue));
    console.log(this.formatResultLine('Quick Action cities', 'none'));
    console.log(this.formatResultLine('Grid selected cities', gridSelected.length ? gridSelected.join(', ') : 'none'));
    console.log(this.formatResultLine('Missing in grid', 'none'));
    console.log(this.formatResultLine('Extra in grid', 'none'));
    console.log(this.formatResultLine('Grid cities in QA', 'YES'));
    console.log(this.formatResultLine('QA cities in grid', 'YES'));
    console.log(this.formatResultLine('Full match', gridSelected.length === 0 ? 'YES' : 'NO'));
    console.log('');
    console.log(NO_DEPENDENCY_TARGET_MESSAGE);
    console.log('');
  }

  printNoDependencyTargetMessage() {
    console.log(`\n${NO_DEPENDENCY_TARGET_MESSAGE}\n`);
  }

  async captureCityOptionsAndSelectFirst(): Promise<string[]> {
    await this.openFieldDropdown('City');
    await this.page.waitForTimeout(500);

    const row = this.fieldRow('City');
    const nativeSelect = row.locator('select').first();

    if ((await nativeSelect.count()) > 0) {
      const cityOptions: string[] = [];
      const optionLoc = row.locator('select option');
      const optionCount = await optionLoc.count();

      for (let i = 0; i < optionCount; i++) {
        const opt = optionLoc.nth(i);
        const text = (await opt.textContent())?.trim() ?? '';
        if (!text || /^select an option$/i.test(text)) continue;
        if (!(await opt.isEnabled())) continue;
        cityOptions.push(text);
      }

      if (cityOptions.length === 0) {
        cityOptions.push(
          ...(await nativeSelect.evaluate((select) =>
            [...(select as HTMLSelectElement).options]
              .map((opt) => opt.text.trim())
              .filter((text) => text && !/^select an option$/i.test(text))
          ))
        );
      }

      console.log('\n[City dropdown] Values after State selection:');
      cityOptions.forEach((city, index) => console.log(`  ${index + 1}. ${city}`));

      if (cityOptions.length === 0) {
        throw new Error('City dropdown has no options after selecting State');
      }

      console.log(`\n[City dropdown] Selecting first value: ${cityOptions[0]}\n`);
      await nativeSelect.selectOption({ label: cityOptions[0] }, { force: true });
      await nativeSelect.dispatchEvent('change');
      return cityOptions;
    }

    const openOptions = this.page
      .getByRole('listbox')
      .getByRole('option')
      .or(this.page.getByRole('treeitem'))
      .or(
        this.page.locator(
          '.select2-container--open .select2-results__option:not(.select2-results__option--loading-results)'
        )
      );

    await openOptions.first().waitFor({ state: 'visible', timeout: 10_000 });

    const total = await openOptions.count();
    const cityOptions: string[] = [];

    for (let i = 0; i < total; i++) {
      const text = (await openOptions.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text && !/^select an option$/i.test(text)) {
        cityOptions.push(text);
      }
    }

    console.log('\n[City dropdown] Values after State selection:');
    if (cityOptions.length === 0) {
      throw new Error('City dropdown has no options after selecting State');
    }

    cityOptions.forEach((city, index) => console.log(`  ${index + 1}. ${city}`));
    console.log(`\n[City dropdown] Selecting first value: ${cityOptions[0]}\n`);

    await openOptions.filter({ hasText: cityOptions[0] }).first().click({ force: true });
    await this.page.keyboard.press('Escape').catch(() => {});

    return cityOptions;
  }

  async saveQuickAction() {
    await this.quickActionModal().getByRole('button', { name: 'Save', exact: true }).click({ force: true });
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => {});
  }

  // ---- Settings navigation -------------------------------------------------

  async profileIcon() {
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.page.locator('.dropdown-toggle.nav-link.dropdown-user-link').click();
  }

  async goToCRMSettings() {
    await this.page.getByRole('link', { name: /CRM Setting/i }).click();
  }

  async openStudio() {
    await this.page.locator('span:has-text("Studio")').click();
  }

  async openPicklistDependencyList() {
    await this.page.locator('span:has-text("Picklist Dependency")').click();
    await this.page.getByRole('heading', { name: /Picklist Dependency/i }).first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  async openDependencyEdit() {
    await this.page.locator("//i[@class='fa fa-pencil iconshover']").first().click();
    await this.waitForDependencyEditPage();
  }

  async navigateToDependencyEdit() {
    await this.profileIcon();
    await this.goToCRMSettings();
    await this.openStudio();
    await this.openPicklistDependencyList();
    await this.openDependencyEdit();
  }

  async returnToLeadsList() {
    await this.page.locator('#vertical_header_name').click();
    await this.page.getByText('Leads', { exact: true }).first().click();
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => {});
  }

  // ---- Dependency edit grid ------------------------------------------------

  async waitForDependencyEditPage() {
    await this.page.getByRole('heading', { name: /Edit Picklist Dependency/i }).waitFor({ state: 'visible', timeout: 30_000 });
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => {});
  }

  private dependencyGridScroller(): Locator {
    return this.page.locator('.table-scroll-wrap.custom-scroll-position').first();
  }

  private sourceColumnCount(): Promise<number> {
    return this.page.locator('input[id^="checkedsourceval_"]').count();
  }

  /** Step 1 – hover the dependency grid so lazy-loaded values can render on scroll. */
  async hoverDependencyGrid() {
    await this.waitForDependencyEditPage();
    const scroller = this.dependencyGridScroller();
    await expect(scroller).toBeVisible({ timeout: 15_000 });
    await scroller.hover();
    await this.page.waitForTimeout(300);
    console.log('\n[Step 1] Hovered dependency grid area\n');
  }

  /** Horizontal scroll until all source columns are loaded (count stable). */
  async scrollDependencyGridHorizontalUntilComplete(): Promise<void> {
    await this.hoverDependencyGrid();
    const scroller = this.dependencyGridScroller();

    let lastCount = 0;
    let stable = 0;

    await scroller.evaluate((el) => {
      el.scrollLeft = 0;
    });
    await this.page.waitForTimeout(200);

    for (let i = 0; i < 60; i++) {
      const count = await this.sourceColumnCount();

      if (count === lastCount) {
        stable++;
      } else {
        stable = 0;
        lastCount = count;
      }

      const atEnd = await scroller.evaluate((el) => {
        const max = el.scrollWidth - el.clientWidth;
        if (el.scrollLeft >= max - 5) {
          el.scrollLeft = max;
          return true;
        }
        el.scrollLeft += Math.max(el.clientWidth * 0.6, 150);
        el.dispatchEvent(new Event('scroll', { bubbles: true }));
        return false;
      });

      await this.page.waitForTimeout(200);

      if (atEnd && stable >= 4 && i > 5) break;
      if (stable >= 6 && i > 8) break;
    }

    console.log(`[Grid scroll] Horizontal complete – ${lastCount} source columns loaded\n`);
  }

  /** Scroll the selected source column into view before vertical read. */
  async scrollSourceColumnIntoView(sourceField: string): Promise<void> {
    const colKey = sourceField.replace(/\s+/g, '');
    const scroller = this.dependencyGridScroller();

    await this.page.evaluate(
      ({ source, col }) => {
        const scrollerEl = document.querySelector(
          '.table-scroll-wrap.custom-scroll-position'
        ) as HTMLElement | null;
        if (!scrollerEl) return;

        const header =
          document.querySelector(`input[id^="checkedsourceval_"][data-col="${source}"]`) ||
          document.querySelector(`input[id^="checkedsourceval_"][data-col="${col}"]`) ||
          [...document.querySelectorAll('input[id^="checkedsourceval_"]')].find(
            (el) => el.getAttribute('data-col')?.replace(/\s+/g, '') === col
          );

        const target = (header?.closest('th, td, .source-col, div') ?? header) as HTMLElement | null;
        if (!target) return;

        target.scrollIntoView({ inline: 'center', block: 'nearest' });
        const targetRect = target.getBoundingClientRect();
        const scrollerRect = scrollerEl.getBoundingClientRect();
        scrollerEl.scrollLeft += targetRect.left - scrollerRect.left - scrollerRect.width / 3;
        scrollerEl.dispatchEvent(new Event('scroll', { bubbles: true }));
      },
      { source: sourceField, col: colKey }
    );

    await this.page.waitForTimeout(400);
  }

  /** Vertical scroll for one source column until target cells stop loading. */
  private async scrollDependencyGridVerticalUntilComplete(colKey: string): Promise<void> {
    await this.page.evaluate(async (col) => {
      const scroller = document.querySelector(
        '.table-scroll-wrap.custom-scroll-position'
      ) as HTMLElement | null;
      if (!scroller) return;

      let lastCount = 0;
      let stable = 0;

      scroller.scrollTop = 0;
      scroller.dispatchEvent(new Event('scroll', { bubbles: true }));

      for (let i = 0; i < 100; i++) {
        const totalCells = document.querySelectorAll(
          `td.targetvalues[class*="hidetarget_${col}"]`
        ).length;

        if (totalCells === lastCount) stable++;
        else {
          stable = 0;
          lastCount = totalCells;
        }

        scroller.scrollTop += 120;
        scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 120));

        const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 5;
        if (stable >= 5 && i > 10) break;
        if (atBottom && stable >= 3) break;
      }
    }, colKey);

    await this.page.waitForTimeout(200);
  }

  /** Step 2 – scroll grid (H then V) until complete, then read selected target values. */
  async captureSelectedTargetValuesForSource(sourceField: string): Promise<string[]> {
    await this.scrollDependencyGridHorizontalUntilComplete();
    await this.scrollSourceColumnIntoView(sourceField);
    await this.scrollDependencyGridVerticalUntilComplete(sourceField.replace(/\s+/g, ''));

    const colKey = sourceField.replace(/\s+/g, '');
    const result = await this.page.evaluate((col) => {
      const selected = new Set<string>();
      document.querySelectorAll(`td.targetvalues[class*="hidetarget_${col}"]`).forEach((td) => {
        if (!td.classList.contains('bg-selectedbackgroundcolor')) return;
        const text = td.textContent?.replace(/\s+/g, ' ').trim();
        if (text) selected.add(text);
      });
      const totalCells = document.querySelectorAll(`td.targetvalues[class*="hidetarget_${col}"]`).length;
      return { values: [...selected], totalCells };
    }, colKey);

    console.log(
      `\n[Step 2] Scrolled grid – ${result.totalCells} target cells loaded for "${sourceField}"`
    );
    console.log(`[Step 2] Selected Target values: ${result.values.join(', ')}\n`);
    return result.values;
  }

  /** Scroll grid horizontally until complete, then capture every Source Field column name. */
  async captureAllSourceFieldValues(): Promise<string[]> {
    await this.waitForDependencyEditPage();
    await this.scrollDependencyGridHorizontalUntilComplete();

    const values = await this.page.evaluate(() => {
      const seen = new Set<string>();
      document.querySelectorAll('input[id^="checkedsourceval_"]').forEach((el) => {
        const name =
          el.getAttribute('data-col')?.trim() ||
          el.parentElement?.querySelector('label')?.textContent?.replace(/\s+/g, ' ').trim();
        if (name) seen.add(name.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim());
      });
      return [...seen];
    });

    console.log(`\n[Source Field] Columns (${values.length}): ${values.join(', ')}\n`);
    return values;
  }

  sourceValueInGrid(sourceValue: string, allSourceValues: string[]): boolean {
    const norm = (s: string) => s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    const key = norm(sourceValue);
    return allSourceValues.some((v) => norm(v) === key);
  }

  /**
   * Step 3 – compare Quick Action city dropdown (targetCityOptions) with dependency grid selection.
   * Pass known grid values when already captured after hover + scroll.
   */
  async compareTargetCityOptions(
    targetCityOptions: string[],
    sourceField: string,
    knownSelectedTargets?: string[],
    knownSourceValues?: string[]
  ): Promise<DependencyCompareResult> {
    return this.compareQuickActionCitiesWithDependency(
      targetCityOptions,
      sourceField,
      knownSelectedTargets,
      knownSourceValues
    );
  }

  /**
   * Compare Quick Action city dropdown with dependency grid selection.
   * Pass known grid values when already on the Leads page.
   */
  async compareQuickActionCitiesWithDependency(
    quickActionCities: string[],
    sourceField: string,
    knownSelectedTargets?: string[],
    knownSourceValues?: string[]
  ): Promise<DependencyCompareResult> {
    const allSourceValues = knownSourceValues ?? (await this.captureAllSourceFieldValues());
    const selectedTargetValues =
      knownSelectedTargets ?? (await this.captureSelectedTargetValuesForSource(sourceField));

    const quickSet = [...new Set(quickActionCities)].sort();
    const gridSet = [...new Set(selectedTargetValues)].sort();

    const missingInGrid = quickSet.filter((city) => !gridSet.includes(city));
    const extraInGrid = gridSet.filter((city) => !quickSet.includes(city));
    const matched = gridSet.every((city) => quickSet.includes(city));
    const allDropdownSelectedInGrid = quickSet.every((city) => gridSet.includes(city));
    const fullMatch =
      missingInGrid.length === 0 && extraInGrid.length === 0 && quickSet.length === gridSet.length;

    const result: DependencyCompareResult = {
      sourceField,
      quickActionCities: quickSet,
      allSourceValues,
      selectedTargetValues: gridSet,
      missingInGrid,
      extraInGrid,
      matched,
      allDropdownSelectedInGrid,
      fullMatch,
    };

    this.printCompareTestResult(result);
    return result;
  }

  async runStateCityDependency() {
    await this.selectPicklistByLabel('State', 'Tamilnadu');
    return this.captureCityOptionsAndSelectFirst();
  }
}
