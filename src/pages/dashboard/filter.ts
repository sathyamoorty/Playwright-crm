import { Locator, Page, expect } from "@playwright/test";
import filterFieldTypeData from "@data/filterFieldTypeData.json";

const DROPDOWN_FIELD_TYPES = new Set([
  "3",
  "9",
  "11",
  "13",
  "14",
  "15",
  "21",
  "23",
  "29",
  "30",
  "31",
]);

const DATE_TIME_FIELD_TYPES = new Set(["7", "16", "17", "19", "20", "33"]);

export class filterDash{
    constructor(private page:Page){}

    async filterateBtn(){
        const filterName = this.page.getByRole('textbox', { name: 'Filter name' });

        if (await filterName.isVisible().catch(() => false)) {
            return;
        }

        const dropdown = this.page.locator("#dropdownOpen:visible:not(.hide)").first();

        if (await dropdown.count()) {
            await dropdown.click();
            await this.page.locator('a').filter({ hasText: 'Filter' }).nth(2).click();
        } else {
            const directOpen = this.page.locator("#directOpen:visible").first();

            if (await directOpen.count()) {
                await directOpen.click();
            } else {
                await this.page.locator("#directOpen, #dropdownOpen").last().evaluate((element) => {
                    (element as HTMLElement).click();
                });
            }
        }

        if (!(await filterName.isVisible().catch(() => false))) {
            await this.page.evaluate(() => {
                const customFilterFieldList = (window as unknown as {
                    customFilterFieldList?: (selector: string, action: string, mode: string) => void;
                }).customFilterFieldList;

                if (typeof customFilterFieldList === "function") {
                    customFilterFieldList("selectedCustomFilter", "Edit", "New");
                }
            });
        }

        if (!(await filterName.isVisible().catch(() => false))) {
            await this.page.evaluate(() => {
                const customFilterFieldList = (window as unknown as {
                    customFilterFieldList?: (selector: string, action: string, mode: string) => void;
                }).customFilterFieldList;

                if (typeof customFilterFieldList === "function") {
                    customFilterFieldList("selectedCustomFilter", "New", "New");
                }
            });
        }

        await expect(filterName).toBeVisible({ timeout: 15000 });
    }
    async applyBtn(){
        const applyButton = this.page.locator("#filterBar .apply-button:visible").first();
        await expect(applyButton).toBeVisible({ timeout: 15000 });
        await applyButton.click();
    }
    async addedFilter(){
        await this.page.locator('a').filter({ hasText: 'arrow_drop_down' }).click();
        await this.page.getByRole('button',{name:"+"}).click();
    }
    async filterBox(){
        const finaldata = (filterFieldTypeData as Array<Record<string, unknown>>)[0];

        if (await this.isFilterAlreadyPresent()) {
            await this.addedFilter();
            await this.chooseRandomFields(`Leads-${Date.now().toString().slice(-6)}`, 3);

        } else {
            await this.chooseRandomFields(`Leads-${Date.now().toString().slice(-6)}`, 3);
        }

        await this.applyBtn();
    }
  async chooseRandomFields(filterName:string, fieldCount = 3)
{
    await this.page.getByRole('textbox', { name: 'Filter name' }).fill(filterName);
    const finaldata = (filterFieldTypeData as Array<Record<string, unknown>>)[0];

    const uncheckedFields = this.page.locator("#unCheckFiledListDetail li:visible");
    await expect(uncheckedFields.first()).toBeVisible({ timeout: 10000 });

    const availableFieldCount = await uncheckedFields.count();
    if (availableFieldCount < fieldCount) {
        throw new Error(`Only ${availableFieldCount} fields are available, but ${fieldCount} fields were requested.`);
    }

    const selectedIndexes = new Set<number>();
    while (selectedIndexes.size < fieldCount) {
        selectedIndexes.add(Math.floor(Math.random() * availableFieldCount));
    }

    for (const randomIndex of [...selectedIndexes].sort((a, b) => b - a)) {
        const field = uncheckedFields.nth(randomIndex);
        await field.click();
    }

    await this.applyFilterSetup();
    await this.fillSelectedFieldValues(finaldata);
}

private async getFieldType(field: Locator): Promise<string | null> {
    const directFieldType =
        await field.getAttribute("data-field-type") ||
        await field.getAttribute("data-fieldtype");

    if (directFieldType) {
        return directFieldType;
    }

    const fieldTypeElement = field.locator('[data-field-type], [data-fieldtype]').first();

    if (await fieldTypeElement.count()) {
        return await fieldTypeElement.getAttribute("data-field-type") ||
            await fieldTypeElement.getAttribute("data-fieldtype");
    }

    const hiddenFieldType = field.locator('input[name*="_Fieldtype"], input[name*="_fieldtype"]').first();

    if (await hiddenFieldType.count()) {
        return hiddenFieldType.getAttribute("value");
    }

    return null;
}

private async applyFilterSetup() {
    const setupApplyButton = this.page.locator("#applyFiltersButton:visible").first();
    await expect(setupApplyButton).toBeVisible({ timeout: 15000 });
    await setupApplyButton.click();
    await expect(this.page.locator("#filterBar .filter-item").first()).toBeVisible({ timeout: 15000 });
}

private async isFilterAlreadyPresent(): Promise<boolean> {
    return await this.page.locator("#filterBar .filter-item:visible").count() > 0;
}

private async fillSelectedFieldValues(finaldata: Record<string, unknown>) {
    const filterItems = this.page.locator("#filterBar .filter-item");
    const filterItemCount = await filterItems.count();
    let filledCount = 0;

    for (let i = 0; i < filterItemCount; i++) {
        const fieldRow = filterItems.nth(i);
        const fieldType = await this.getFieldType(fieldRow);

        if (!fieldType || !(fieldType in finaldata)) {
            console.log(`Skipping filter fieldtypeNO=> ${fieldType}`);
            continue;
        }

        const value = finaldata[fieldType];

        await fieldRow.scrollIntoViewIfNeeded();

        const filled = await this.fillFilterField(fieldRow, fieldType, value);

        if (filled) {
            filledCount++;
        } else {
            console.log(`Skipping filter fieldtypeNO=> ${fieldType}. No supported input was found.`);
        }
    }

    if (filledCount === 0) {
        throw new Error("No selected filter fields were filled from filterFieldTypeData.json. Check data-field-type attributes in #filterBar.");
    }
}

private async fillFilterField(fieldRow: Locator, fieldType: string, value: unknown): Promise<boolean> {
    if (await this.chooseVisibleNativeDropdowns(fieldRow, value)) {
        return true;
    }

    if (await this.chooseVisibleSelect2Dropdowns(fieldRow)) {
        return true;
    }

    if (await this.chooseFirstFilterPopupValue(fieldRow, fieldType, value)) {
        return true;
    }

    if (DROPDOWN_FIELD_TYPES.has(fieldType)) {
        return false;
    }

    const checkbox = fieldRow.locator('input[type="checkbox"]:visible:not([disabled])').first();

    if (await checkbox.count()) {
        await checkbox.setChecked(Boolean(value));
        return true;
    }

    const input = fieldRow.locator(
        'input:visible:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([readonly]):not([disabled]), textarea:visible:not([readonly]):not([disabled])'
    ).last();

    if (await input.count()) {
        await input.fill(String(value ?? ""));
        return true;
    }

    return false;
}

private async chooseVisibleNativeDropdowns(fieldRow: Locator, value: unknown): Promise<boolean> {
    const dropdowns = fieldRow.locator("select:visible:not([disabled])");
    const dropdownCount = await dropdowns.count();
    let filled = false;

    for (let i = 0; i < dropdownCount; i++) {
        const dropdown = dropdowns.nth(i);
        const optionCount = await dropdown.locator("option").count();

        if (optionCount === 0) {
            continue;
        }

        const requestedIndex = Number(value);
        const optionIndex = Number.isInteger(requestedIndex)
            ? Math.min(requestedIndex, optionCount - 1)
            : optionCount > 1 ? 1 : 0;

        await dropdown.selectOption({ index: optionIndex });
        await dropdown.dispatchEvent("change");
        filled = true;
    }

    return filled;
}

private async chooseVisibleSelect2Dropdowns(fieldRow: Locator): Promise<boolean> {
    const dropdowns = fieldRow.locator(".select2-selection:visible");
    const dropdownCount = await dropdowns.count();
    let filled = false;

    for (let i = 0; i < dropdownCount; i++) {
        const dropdown = dropdowns.nth(i);

        await dropdown.click();

        const options = this.page.locator(
            '.select2-results__option[role="treeitem"]:visible:not(.select2-results__option--disabled)'
        );

        await expect(options.first()).toBeVisible({ timeout: 15000 });
        await options.nth(await options.count() > 1 ? 1 : 0).click();
        filled = true;
    }

    return filled;
}

private async chooseFirstFilterPopupValue(fieldRow: Locator, fieldType: string, value: unknown): Promise<boolean> {
    const filterInputWrapper = fieldRow.locator(".filter-circle-input").first();

    if (await filterInputWrapper.count() === 0) {
        return false;
    }

    await filterInputWrapper.click();
    await this.page.waitForTimeout(300);

    const userItems = fieldRow.locator(".user-item:visible");

    if (await userItems.count()) {
        const requestedUserId = String(value ?? "");
        const requestedUser = fieldRow.locator(`.user-full-name[data-user-id="${requestedUserId}"]`).locator("xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' user-item ')][1]");
        const userToClick = await requestedUser.count() ? requestedUser.first() : userItems.first();

        await userToClick.click();
        await fieldRow.locator(".filteraction-buttons .apply-btn:visible").first().click();
        return true;
    }

    const popupOptions = fieldRow.locator(
        '.select2-results__option[role="treeitem"]:visible:not(.select2-results__option--disabled), .dropdown-item:visible, li:visible'
    );

    if (await popupOptions.count()) {
        const requestedIndex = Number(value);
        const optionIndex = Number.isInteger(requestedIndex)
            ? Math.max(0, Math.min(requestedIndex - 1, await popupOptions.count() - 1))
            : 0;

        await popupOptions.nth(optionIndex).click();

        const popupApply = fieldRow.locator(".filteraction-buttons .apply-btn:visible").first();
        if (await popupApply.count()) {
            await popupApply.click();
        }

        return true;
    }

    if (DROPDOWN_FIELD_TYPES.has(fieldType)) {
        const selected = await fieldRow.evaluate((row, rawValue) => {
            const root = row as HTMLElement;
            const requestedIndex = Number(rawValue);
            const optionIndex = Number.isInteger(requestedIndex) ? Math.max(0, requestedIndex - 1) : 0;
            const blockedTexts = new Set(["", "clear", "search", "select all", "cancel", "apply"]);
            const candidates = Array.from(root.querySelectorAll<HTMLElement>("div, span, label, li"))
                .filter((element) => {
                    const style = window.getComputedStyle(element);
                    const text = element.innerText.trim().toLowerCase();

                    return style.display !== "none" &&
                        style.visibility !== "hidden" &&
                        element.offsetParent !== null &&
                        !blockedTexts.has(text) &&
                        !element.closest(".filter-content") &&
                        !element.closest(".filteraction-buttons") &&
                        !element.closest(".search-container") &&
                        !element.classList.contains("filter-label") &&
                        element.children.length === 0;
                });
            const option = candidates[optionIndex] ?? candidates[0];

            if (!option) {
                return false;
            }

            option.click();
            return true;
        }, value);

        if (selected) {
            const popupApply = fieldRow.locator(".filteraction-buttons .apply-btn:visible").first();
            if (await popupApply.count()) {
                await popupApply.click();
            }

            return true;
        }

        return false;
    }

    const filterInput = fieldRow.locator("input.filter-input").first();

    if (await filterInput.count()) {
        await filterInput.evaluate((element, inputValue) => {
            const input = element as unknown as { value: string; dispatchEvent: (event: Event) => boolean };
            input.value = String(inputValue ?? "");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        }, value);

        if (DATE_TIME_FIELD_TYPES.has(fieldType)) {
            await this.clickDateTimePopupApply();
        }

        return true;
    }

    return false;
}

private async clickDateTimePopupApply() {
    await this.page.waitForTimeout(300);

    const pickerApply = this.page.locator(
        '.daterangepicker:visible button.applyBtn, .daterangepicker:visible .applyBtn, .daterangepicker:visible button:has-text("Apply"), .drp-buttons:visible button:has-text("Apply"), .clockpicker-popover:visible button:has-text("Apply"), .datepicker:visible button:has-text("Apply")'
    ).last();

    if (await pickerApply.count()) {
        await pickerApply.scrollIntoViewIfNeeded();
        const box = await pickerApply.boundingBox();

        if (box) {
            await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        } else {
            await pickerApply.click({ force: true, timeout: 5000 });
        }

        await this.page.waitForTimeout(300);
        return;
    }

    const clicked = await this.page.evaluate(() => {
        const isVisible = (element: Element) => {
            const htmlElement = element as HTMLElement;
            const style = window.getComputedStyle(htmlElement);

            return style.display !== "none" &&
                style.visibility !== "hidden" &&
                htmlElement.offsetParent !== null;
        };

        const popups = Array.from(document.querySelectorAll(
            ".daterangepicker, .drp-buttons, .clockpicker-popover, .datepicker, .bootstrap-timepicker-widget"
        )).filter(isVisible);
        const popup = popups[popups.length - 1];

        if (!popup) {
            return false;
        }

        const applyButton = Array.from(popup.querySelectorAll("button, .btn, a"))
            .find((element) => isVisible(element) && element.textContent?.trim().toLowerCase() === "apply");

        if (!applyButton) {
            return false;
        }

        const htmlApplyButton = applyButton as HTMLElement;
        const rect = htmlApplyButton.getBoundingClientRect();
        const eventOptions = {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            view: window,
        };

        htmlApplyButton.dispatchEvent(new MouseEvent("mouseover", eventOptions));
        htmlApplyButton.dispatchEvent(new MouseEvent("mousemove", eventOptions));
        htmlApplyButton.dispatchEvent(new MouseEvent("mousedown", eventOptions));
        htmlApplyButton.dispatchEvent(new MouseEvent("mouseup", eventOptions));
        htmlApplyButton.dispatchEvent(new MouseEvent("click", eventOptions));
        htmlApplyButton.click();
        return true;
    });

    if (!clicked) {
        console.log("Date/time popup Apply button was not found.");
    }
}
}
