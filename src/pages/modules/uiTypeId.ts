import { Locator, Page } from '@playwright/test'
import filterFieldTypeData from '@data/filterFieldTypeData.json'
import { formatErrorMessage } from '@utils/helpers/formatError'

/** text 2,22,5 + dropdown 3,9,29,30,31 */
const TEXT_TYPES = new Set(['1', '2', '4', '5', '10', '22', '24', '25', '26'])
const DROPDOWN_TYPES = new Set(['3', '9', '13', '14', '15', '23', '29', '30', '31'])
const DATE_TYPES = new Set(['7', '16', '17', '19', '20', '33'])
const SKIP_TYPES = new Set(['12']) // empty value in JSON only

export type FillModuleFieldsOptions = {
  /** When true, throws if no field could be filled (legacy strict mode). */
  requireAtLeastOne?: boolean
}

export class dataDr {
  constructor(private page: Page) {}

  async getCurrentFieldType(field: Locator): Promise<string | null> {
    return field.getAttribute('data-fieldtype')
  }

  captIndex(finaldata: Record<string, unknown>, fieldType: string): number {
    const index = Number(finaldata[fieldType])
    return Number.isInteger(index) ? index : 0
  }

  private async getFieldKey(field: Locator, capAttr: string, loopIndex: number): Promise<string> {
    const attrs = await field.evaluate((el) => ({
      fieldname: el.getAttribute('fieldname')?.trim() ?? '',
      name: el.getAttribute('name')?.trim() ?? '',
      id: el.getAttribute('id')?.trim() ?? '',
    }))
    const id = attrs.fieldname || attrs.name || attrs.id || `loop-${loopIndex}`
    return `${capAttr}:${id}`
  }

  private isPlaceholderOption(text: string): boolean {
    const t = text.trim().toLowerCase()
    return (
      !t ||
      t === 'select' ||
      t.startsWith('select ') ||
      t === '--' ||
      t === 'none' ||
      /no\s*data|no\s*results|not\s*found/i.test(t)
    )
  }

  private hasSelectableOptions(labels: string[]): boolean {
    return labels.some((label) => !this.isPlaceholderOption(label))
  }

  private skipValue(v: unknown): boolean {
    return v === undefined || v === null || v === ''
  }

  /** Map JSON index to a valid option when option count changed. */
  private resolvePickIndex(labels: string[], requestedIndex: number): number {
    if (labels.length === 0) {
      return 0
    }

    const firstReal = labels.findIndex((label) => !this.isPlaceholderOption(label))
    if (firstReal < 0) {
      return -1
    }

    const start = firstReal
    let pick = Math.min(Math.max(requestedIndex, 0), labels.length - 1)

    if (pick < start) {
      pick = start
    }

    if (this.isPlaceholderOption(labels[pick] ?? '')) {
      pick = start
    }

    if (requestedIndex >= labels.length) {
      pick = labels.length - 1
      if (this.isPlaceholderOption(labels[pick] ?? '')) {
        pick = start
      }
    }

    return pick
  }

  private async dismissOpenUi(): Promise<void> {
    await this.closeRelatedPopup()
    await this.page.keyboard.press('Escape').catch(() => {})
  }

  private relatedPopupModal() {
    return this.page
      .locator(
        '#RelatedPopupAppend.modal.show, #RelatedPopupAppend:visible, ' +
          '.modal.show:has(.popup-cancel-icon), .modal.show:has(.modal-header .btn-close)',
      )
      .last()
  }

  /** Lookup modal X — `<div class="popup-cancel-icon" data-dismiss="modal">` */
  private relatedPopupCloseIcon(modal: Locator): Locator {
    return modal.locator('.popup-cancel-icon[data-dismiss="modal"]').first()
  }

  private async clickRelatedPopupClose(modal?: Locator): Promise<void> {
    const target = modal ?? this.relatedPopupModal()
    if ((await target.count()) === 0) return

    const popupCancel = this.relatedPopupCloseIcon(target)
    if (await popupCancel.isVisible().catch(() => false)) {
      await popupCancel.click({ force: true }).catch(() => {})
    } else {
      const fallback = target
        .locator(
          '.modal-header .btn-close, .modal-header button.close, .btn-close, [aria-label="Close"], [data-bs-dismiss="modal"]',
        )
        .first()
      if (await fallback.isVisible().catch(() => false)) {
        await fallback.click({ force: true }).catch(() => {})
      } else {
        await this.page.keyboard.press('Escape').catch(() => {})
      }
    }

    await target.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  }

  private async closeRelatedPopup(): Promise<void> {
    const modal = this.relatedPopupModal()
    if ((await modal.count()) === 0) return
    await this.clickRelatedPopupClose(modal)
  }

  private formGroupFor(field: Locator): Locator {
    return field.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " form-group ")][1]')
  }

  /** True when lookup modal has no rows to pick (e.g. "Showing page 0 to 0 of 0"). */
  private async isRelatedPopupEmpty(modal: Locator): Promise<boolean> {
    if (await modal.getByText(/0\s*to\s*0\s*of\s*0/i).isVisible().catch(() => false)) {
      return true
    }
    if (await modal.getByText(/no\s*data|no\s*record|not\s*found/i).isVisible().catch(() => false)) {
      return true
    }

    const selectable = modal.locator(
      'tbody tr:visible:has(input[type="checkbox"]), tbody tr:visible td a, tbody tr.cursor-pointer, tbody tr[onclick]',
    )
    return (await selectable.count()) === 0
  }

  /** Left-side X on related inputs — clears selection when lookup has no data. */
  private async clickRelatedFieldClearIcon(group: Locator): Promise<void> {
    const clear = group
      .locator(
        '.removeicon, .remove_multirelated, .multirelated-remove, .clearrelated, .relatedclear, ' +
          '[title="Remove"], [title="Clear"], ' +
          '.input-group-text:has(.fa-times), .input-group-text:has(.fa-close), ' +
          '.fa-times:not(.btn-close), .fa-close:not(.btn-close)',
      )
      .filter({ visible: true })
      .first()

    if ((await clear.count()) > 0) {
      await clear.click({ force: true }).catch(() => {})
      await this.page.waitForTimeout(200)
    }
  }

  private async isNamePrefixField(field: Locator): Promise<boolean> {
    const tag = await field.evaluate((el) => el.tagName.toLowerCase())
    if (tag === 'select') {
      return true
    }

    const attrs = await field.evaluate((el) => ({
      fieldname: (el.getAttribute('fieldname') ?? '').toLowerCase(),
      name: (el.getAttribute('name') ?? '').toLowerCase(),
      id: (el.getAttribute('id') ?? '').toLowerCase(),
    }))

    return attrs.fieldname.includes('prefix') || attrs.name.includes('prefix') || attrs.id.includes('prefix')
  }

  private select2Options() {
    return this.page.locator(
      '.select2-container--open .select2-results__option:not(.select2-results__option--disabled), ' +
        '.select2-container--open [role="treeitem"]:not([aria-disabled="true"])'
    )
  }

  private async selectOnElement(select: Locator, value: unknown, index: number): Promise<boolean> {
    const labels = await select.locator('option').allTextContents()
    if (!this.hasSelectableOptions(labels)) {
      return false
    }

    const textValue = String(value ?? '').trim()

    if (textValue && !Number.isInteger(Number(value))) {
      try {
        await select.selectOption({ label: textValue })
        await select.dispatchEvent('change')
        return true
      } catch {
        const matchIndex = labels.findIndex((label) =>
          label.trim().toLowerCase().includes(textValue.toLowerCase()),
        )
        if (matchIndex >= 0 && !this.isPlaceholderOption(labels[matchIndex] ?? '')) {
          await select.selectOption({ index: matchIndex })
          await select.dispatchEvent('change')
          return true
        }
      }
    }

    const pick = this.resolvePickIndex(labels, index)
    if (pick < 0) {
      return false
    }

    await select.selectOption({ index: pick })
    await select.dispatchEvent('change')
    return true
  }

  async selectDropdownByCurrentField(field: Locator, value: unknown, index: number): Promise<boolean> {
    try {
      const tag = await field.evaluate((el) => el.tagName.toLowerCase())

      if (tag === 'select') {
        return await this.selectOnElement(field, value, index)
      }

      const hiddenSelect = field
        .locator(
          'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " form-group ")][1]//select[data-fieldtype][contains(@class,"select2-hidden-accessible")]',
        )
        .first()

      if ((await hiddenSelect.count()) > 0) {
        return await this.selectOnElement(hiddenSelect, value, index)
      }

      const group = field.locator(
        'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " form-group ")][1]',
      )
      const select2 = group.locator('.select2-selection:visible').first()

      if ((await select2.count()) === 0) {
        return false
      }

      const textValue = String(value ?? '').trim()
      await select2.click()

      const options = this.select2Options()
      const opened = await options
        .first()
        .waitFor({ state: 'visible', timeout: 8000 })
        .then(() => true)
        .catch(() => false)

      if (!opened) {
        await this.dismissOpenUi()
        return false
      }

      const optionCount = await options.count()
      if (optionCount === 0) {
        await this.dismissOpenUi()
        return false
      }

      const labels = await options.allTextContents()
      if (!this.hasSelectableOptions(labels)) {
        await this.dismissOpenUi()
        return false
      }

      if (textValue && !Number.isInteger(Number(value))) {
        const byName = this.page.getByRole('treeitem', { name: textValue, exact: true })
        if ((await byName.count()) > 0) {
          await byName.first().click()
          return true
        }
        const match = options.filter({ hasText: textValue }).first()
        if ((await match.count()) > 0) {
          await match.click()
          return true
        }
      }

      const pick = this.resolvePickIndex(labels, index)
      if (pick < 0) {
        await this.dismissOpenUi()
        return false
      }

      await options.nth(pick).click()
      return true
    } catch {
      await this.dismissOpenUi()
      return false
    }
  }

  private async fillDateField(field: Locator): Promise<boolean> {
    try {
      const tag = await field.evaluate((el) => el.tagName.toLowerCase())
      const input =
        tag === 'input'
          ? field
          : field
              .locator(
                'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " form-group ")][1]//input[data-fieldtype]:visible',
              )
              .first()

      if ((await input.count()) === 0) {
        return false
      }

      await input.click()
      await this.page.waitForTimeout(300)

      const picker = this.page.locator('.daterangepicker:visible').last()
      if ((await picker.count()) > 0) {
        const cell = picker.locator('td.available, td.weekend').first()
        if ((await cell.count()) > 0) {
          await cell.click()
        }
        const apply = picker.locator('button.applyBtn, .applyBtn, button:has-text("Apply")').first()
        if ((await apply.count()) > 0) {
          await apply.click()
          return true
        }
      }

      const apply = this.page
        .locator('.daterangepicker:visible button.applyBtn, .clockpicker-popover:visible button:has-text("Apply")')
        .last()
      if ((await apply.count()) > 0) {
        await apply.click()
        return true
      }

      return true
    } catch {
      return false
    }
  }

  private relatedSearchIcon(group: Locator): Locator {
    return group.locator(
      ".searchicon, [title='Search'], .fa-search, .related-link, [class*='searchmultirelated']",
    )
  }

  /** Clicks a data row in the lookup popup; returns false when only empty/header rows exist. */
  private async selectRelatedPopupRecord(modal: Locator, recordIndex: number): Promise<boolean> {
    const rows = modal.locator('tbody tr:visible, .user-item:visible')
    const rowCount = await rows.count()
    const dataRowIndexes: number[] = []

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      if ((await row.locator('button:has-text("Search")').count()) > 0) {
        continue
      }
      const text = (await row.textContent())?.trim() ?? ''
      if (!text || /no\s*data/i.test(text)) {
        continue
      }
      dataRowIndexes.push(i)
    }

    if (dataRowIndexes.length === 0) {
      return false
    }

    const pick = dataRowIndexes[Math.min(Math.max(recordIndex, 0), dataRowIndexes.length - 1)]!
    await rows.nth(pick).click({ force: true })
    return true
  }

  /** Related / lookup (uiType 11): select row when data exists, else `.popup-cancel-icon` X. */
  private async fillType11FromGroup(group: Locator, recordIndex: number): Promise<boolean> {
    try {
      await this.closeRelatedPopup()

      const search = this.relatedSearchIcon(group).last()
      if ((await search.count()) === 0) {
        return false
      }

      await search.scrollIntoViewIfNeeded().catch(() => {})
      await search.click({ force: true })

      const modal = this.relatedPopupModal()
      const visible = await modal.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false)
      if (!visible) {
        return false
      }

      if (await this.isRelatedPopupEmpty(modal)) {
        console.log('[fill] uiType 11 — no lookup data, clicking popup-cancel-icon (X)')
        await this.clickRelatedPopupClose(modal)
        await this.clickRelatedFieldClearIcon(group)
        return false
      }

      const selected = await this.selectRelatedPopupRecord(modal, recordIndex)
      if (selected) {
        await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
        if (await modal.isVisible().catch(() => false)) {
          await this.clickRelatedPopupClose(modal)
        }
        return true
      }

      console.log('[fill] uiType 11 — no selectable row, clicking popup-cancel-icon (X)')
      await this.clickRelatedPopupClose(modal)
      await this.clickRelatedFieldClearIcon(group)
      return false
    } catch {
      await this.closeRelatedPopup()
      await this.clickRelatedFieldClearIcon(group).catch(() => {})
      return false
    }
  }

  private async fillType11(field: Locator, finaldata: Record<string, unknown>): Promise<boolean> {
    return this.fillType11FromGroup(this.formGroupFor(field), this.captIndex(finaldata, '11'))
  }

  /** Type-11 fields often use a visible lookup row while the input is hidden — fill those too. */
  private async fillAllType11Fields(
    finaldata: Record<string, unknown>,
    filledKeys: Set<string>,
  ): Promise<{ filled: number; skipped: number }> {
    if (!('11' in finaldata) || this.skipValue(finaldata['11'])) {
      return { filled: 0, skipped: 0 }
    }

    const groups = this.page.locator('.form-group.row, .form-group').filter({
      has: this.page.locator('[data-fieldtype="11"]'),
    })

    let filled = 0
    let skipped = 0
    const count = await groups.count()

    for (let i = 0; i < count; i++) {
      const group = groups.nth(i)
      const anchor = group.locator('[data-fieldtype="11"]').first()
      const fieldKey = await this.getFieldKey(anchor, '11', i + 10_000)

      if (filledKeys.has(fieldKey)) {
        continue
      }

      if ((await this.relatedSearchIcon(group).count()) === 0) {
        continue
      }

      await group.scrollIntoViewIfNeeded().catch(() => {})

      let ok = false
      try {
        ok = await this.fillType11FromGroup(group, this.captIndex(finaldata, '11'))
      } catch {
        ok = false
      } finally {
        if (!ok) {
          await this.dismissOpenUi()
        }
      }

      if (ok) {
        filledKeys.add(fieldKey)
        filled++
      } else {
        skipped++
        console.log(`[fill] Skip ${fieldKey} (uiType 11) — no lookup data`)
      }
    }

    return { filled, skipped }
  }

  private async shouldProcessField(field: Locator): Promise<boolean> {
    const tag = await field.evaluate((el) => el.tagName.toLowerCase())

    if (tag === 'select') {
      return true
    }

    return field.isVisible()
  }

  private async tryFillField(
    field: Locator,
    capAttr: string,
    value: unknown,
    finaldata: Record<string, unknown>,
  ): Promise<boolean> {
    if (capAttr === '22') {
      const tag = await field.evaluate((el) => el.tagName.toLowerCase())
      const isPrefix = await this.isNamePrefixField(field)
      const dropdownIndex = this.captIndex(finaldata, capAttr)

      if (tag === 'select' || isPrefix) {
        return this.selectDropdownByCurrentField(field, dropdownIndex, dropdownIndex)
      }

      await field.fill(String(value))
      return true
    }

    if (TEXT_TYPES.has(capAttr)) {
      const tag = await field.evaluate((el) => el.tagName.toLowerCase())
      if (tag === 'select') {
        return this.selectDropdownByCurrentField(field, value, this.captIndex(finaldata, capAttr))
      }
      await field.fill(String(value))
      return true
    }

    if (DROPDOWN_TYPES.has(capAttr)) {
      return this.selectDropdownByCurrentField(field, value, this.captIndex(finaldata, capAttr))
    }

    if (capAttr === '6') {
      const tag = await field.evaluate((el) => el.tagName.toLowerCase())
      const checkbox =
        tag === 'input'
          ? field
          : field
              .locator(
                'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " form-group ")][1]//input[type="checkbox"]',
              )
              .first()
      if ((await checkbox.count()) === 0) {
        return false
      }
      await checkbox.setChecked(Boolean(value))
      return true
    }

    if (DATE_TYPES.has(capAttr)) {
      return this.fillDateField(field)
    }

    if (capAttr === '11') {
      return this.fillType11(field, finaldata)
    }

    console.log('Unsupported fieldtypeNO=> ' + capAttr)
    return false
  }

  /**
   * Fills create/edit form fields from filterFieldTypeData.json.
   * Skips dropdowns, picklists, and related fields with no selectable data and continues.
   */
  async fillCurrentModuleFields(options: FillModuleFieldsOptions = {}) {
    const finaldata = (filterFieldTypeData as Array<Record<string, unknown>>)[0]

    const tagName = this.page.locator(
      'input[data-fieldtype]:not([type="hidden"]):not([readonly]):not([disabled]):not([type="search"]), textarea[data-fieldtype]:not([readonly]):not([disabled]), select[data-fieldtype]:not([disabled])',
    )

    await tagName.first().waitFor({ state: 'attached', timeout: 15000 })

    const countTag = await tagName.count()
    const filledKeys = new Set<string>()
    let filledCount = 0
    let skippedCount = 0

    for (let i = 0; i < countTag; i++) {
      const tname = tagName.nth(i)
      const capAttr = await this.getCurrentFieldType(tname)
      const fieldKey = await this.getFieldKey(tname, capAttr ?? '', i)

      if (!capAttr || SKIP_TYPES.has(capAttr) || !(capAttr in finaldata) || filledKeys.has(fieldKey)) {
        continue
      }

      const value = finaldata[capAttr]
      if (value === '' || value === null || value === undefined) {
        continue
      }

      if (!(await this.shouldProcessField(tname))) {
        continue
      }

      await tname.scrollIntoViewIfNeeded().catch(() => {})

      let ok = false
      try {
        ok = await this.tryFillField(tname, capAttr, value, finaldata)
      } catch (err) {
        console.log(`[fill] Skip ${fieldKey} (error): ${formatErrorMessage(err)}`)
        ok = false
      } finally {
        if (!ok) {
          await this.dismissOpenUi()
        }
      }

      if (ok) {
        filledKeys.add(fieldKey)
        filledCount++
      } else {
        skippedCount++
        console.log(`[fill] Skip ${fieldKey} (uiType ${capAttr}) — no data or not fillable`)
      }
    }

    const type11 = await this.fillAllType11Fields(finaldata, filledKeys)
    filledCount += type11.filled
    skippedCount += type11.skipped

    await this.dismissOpenUi()

    console.log(`[fill] Filled ${filledCount} field(s), skipped ${skippedCount}`)

    if (options.requireAtLeastOne && filledCount === 0) {
      throw new Error(
        'No fields were filled from filterFieldTypeData.json. Check data-fieldtype attributes on the form.',
      )
    }
  }
}
