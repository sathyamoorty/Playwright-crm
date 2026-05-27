import { Locator, Page, expect } from '@playwright/test'
import filterFieldTypeData from '../data/filterFieldTypeData.json'

/** text 2,22,5 + dropdown 3,9,29,30,31 */
const TEXT_TYPES = new Set(['1', '2', '4', '5', '10', '22', '24', '25', '26'])
const DROPDOWN_TYPES = new Set(['3', '9', '13', '14', '15', '23', '29', '30', '31'])
const DATE_TYPES = new Set(['7', '16', '17', '19', '20', '33'])
const SKIP_TYPES = new Set(['12']) // empty value in JSON only

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
    return !t || t === 'select' || t.startsWith('select ') || t === '--'
  }

  /** Map JSON index to a valid option when option count changed. */
  private resolvePickIndex(labels: string[], requestedIndex: number): number {
    if (labels.length === 0) {
      return 0
    }

    const firstReal = labels.findIndex((label) => !this.isPlaceholderOption(label))
    const start = firstReal >= 0 ? firstReal : 0
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

  private async selectOnElement(select: Locator, value: unknown, index: number) {
    const textValue = String(value ?? '').trim()

    if (textValue && !Number.isInteger(Number(value))) {
      try {
        await select.selectOption({ label: textValue })
        await select.dispatchEvent('change')
        return
      } catch {
        const labels = await select.locator('option').allTextContents()
        const matchIndex = labels.findIndex((label) =>
          label.trim().toLowerCase().includes(textValue.toLowerCase()),
        )
        if (matchIndex >= 0) {
          await select.selectOption({ index: matchIndex })
          await select.dispatchEvent('change')
          return
        }
      }
    }

    const labels = await select.locator('option').allTextContents()
    const pick = this.resolvePickIndex(labels, index)
    await select.selectOption({ index: pick })
    await select.dispatchEvent('change')
  }

  async selectDropdownByCurrentField(field: Locator, value: unknown, index: number) {
    const tag = await field.evaluate((el) => el.tagName.toLowerCase())

    if (tag === 'select') {
      await this.selectOnElement(field, value, index)
      return
    }

    const hiddenSelect = field
      .locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " form-group ")][1]//select[data-fieldtype][contains(@class,"select2-hidden-accessible")]')
      .first()

    if ((await hiddenSelect.count()) > 0) {
      await this.selectOnElement(hiddenSelect, value, index)
      return
    }

    const group = field.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " form-group ")][1]')
    const select2 = group.locator('.select2-selection:visible').first()

    if ((await select2.count()) > 0) {
      const textValue = String(value ?? '').trim()
      if (textValue && !Number.isInteger(Number(value))) {
        await select2.click()
        const byName = this.page.getByRole('treeitem', { name: textValue, exact: true })
        if ((await byName.count()) > 0) {
          await byName.first().click()
          return
        }
      }

      await select2.click()
      const options = this.page.locator('.select2-container--open .select2-results__option:not(.select2-results__option--disabled)')
      await expect(options.first()).toBeVisible({ timeout: 15000 })
      const labels = await options.allTextContents()
      const pick = this.resolvePickIndex(labels, index)
      await options.nth(pick).click()
    }
  }

  private async fillDateField(field: Locator) {
    const tag = await field.evaluate((el) => el.tagName.toLowerCase())
    const input =
      tag === 'input'
        ? field
        : field.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " form-group ")][1]//input[data-fieldtype]:visible').first()

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
        return
      }
    }

    const apply = this.page.locator('.daterangepicker:visible button.applyBtn, .clockpicker-popover:visible button:has-text("Apply")').last()
    if ((await apply.count()) > 0) {
      await apply.click()
    }
  }

  private async fillType11(field: Locator) {
    const group = field.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " form-group ")][1]')
    const search = group.locator(".searchicon, [title='Search'], .fa-search").first()
    await search.click()

    const modal = this.page.locator('#RelatedPopupAppend.modal.show, #RelatedPopupAppend:visible').last()
    await expect(modal).toBeVisible({ timeout: 10000 })

    const firstRow = modal.locator('tbody tr:visible, .user-item:visible').first()
    await expect(firstRow).toBeVisible({ timeout: 10000 })
    await firstRow.click()

    const close = modal.locator('.btn-close, .close, [data-bs-dismiss="modal"]').first()
    if ((await close.count()) > 0) {
      await close.click()
    }
  }

  private async shouldProcessField(field: Locator): Promise<boolean> {
    const tag = await field.evaluate((el) => el.tagName.toLowerCase())

    if (tag === 'select') {
      return true
    }

    return field.isVisible()
  }

  async fillCurrentModuleFields() {
    const finaldata = (filterFieldTypeData as Array<Record<string, unknown>>)[0]

    const tagName = this.page.locator(
      'input[data-fieldtype]:not([type="hidden"]):not([readonly]):not([disabled]):not([type="search"]), textarea[data-fieldtype]:not([readonly]):not([disabled]), select[data-fieldtype]:not([disabled])'
    )

    await tagName.first().waitFor({ state: 'attached', timeout: 15000 })

    const countTag = await tagName.count()
    const filledKeys = new Set<string>()
    let filledCount = 0

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

      await tname.scrollIntoViewIfNeeded()

      if (capAttr === '22') {
        const tag = await tname.evaluate((el) => el.tagName.toLowerCase())
        const isPrefix = await this.isNamePrefixField(tname)
        const dropdownIndex = this.captIndex(finaldata, capAttr)

        if (tag === 'select' || isPrefix) {
          await this.selectDropdownByCurrentField(tname, dropdownIndex, dropdownIndex)
        } else {
          await tname.fill(String(value))
        }

        filledKeys.add(fieldKey)
        filledCount++
      } else if (TEXT_TYPES.has(capAttr)) {
        const tag = await tname.evaluate((el) => el.tagName.toLowerCase())
        if (tag === 'select') {
          await this.selectDropdownByCurrentField(tname, value, this.captIndex(finaldata, capAttr))
        } else {
          await tname.fill(String(value))
        }
        filledKeys.add(fieldKey)
        filledCount++
      } else if (DROPDOWN_TYPES.has(capAttr)) {
        await this.selectDropdownByCurrentField(tname, value, this.captIndex(finaldata, capAttr))
        filledKeys.add(fieldKey)
        filledCount++
      } else if (capAttr === '6') {
        const tag = await tname.evaluate((el) => el.tagName.toLowerCase())
        const checkbox =
          tag === 'input'
            ? tname
            : tname.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " form-group ")][1]//input[type="checkbox"]').first()
        await checkbox.setChecked(Boolean(value))
        filledKeys.add(fieldKey)
        filledCount++
      } else if (DATE_TYPES.has(capAttr)) {
        await this.fillDateField(tname)
        filledKeys.add(fieldKey)
        filledCount++
      } else if (capAttr === '11') {
        await this.fillType11(tname)
        filledKeys.add(fieldKey)
        filledCount++
      } else {
        console.log('Unsupported fieldtypeNO=> ' + capAttr)
      }
    }

    if (filledCount === 0) {
      throw new Error('No fields were filled from filterFieldTypeData.json. Check data-fieldtype attributes on the form.')
    }
  }
}
