import { Locator, Page } from '@playwright/test'
import dataTest from '../data/uidata.json'

export class dataDr {
  constructor(private page: Page) {}

  async getCurrentFieldType(field: Locator): Promise<string | null> {
    const fieldType = await field.getAttribute('data-fieldtype');

    if (fieldType) {
      return fieldType;
    }

    const formGroupFieldType = field
      .locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " form-group ")][1]//input[contains(@name, "_Fieldtype[]")]')
      .first();

    if (await formGroupFieldType.count() === 0) {
      return null;
    }

    return formGroupFieldType.getAttribute('value');
  }

  async selectDropdownByCurrentField(field: Locator, index: number) {
    await field.selectOption({ index });
    await field.dispatchEvent("change");
  }

   captIndex(finaldata: Record<string, any>, fieldType: string | null): number {
    if (!fieldType) {
      throw new Error("Field type is null");
    }

    const value = finaldata[fieldType];
    const index = Number(value);

    if (!Number.isInteger(index)) {
      throw new Error("invalid index number");
    }

    return index;
  }

  async fillCurrentModuleFields() {
    const data = dataTest as Array<Record<string, any>>;
    // const finaldata = data[Math.floor(Math.random() * data.length)];
    const finaldata = data[0];

    const tagName = this.page.locator(
      'input[data-fieldtype]:visible:not([type="hidden"]):not([readonly]):not([disabled]):not([type="search"]), input[fieldname]:visible:not([type="hidden"]):not([readonly]):not([disabled]):not([type="search"]), textarea[data-fieldtype]:visible:not([readonly]):not([disabled]), textarea[fieldname]:visible:not([readonly]):not([disabled]), select[data-fieldtype]:visible:not([readonly]):not([disabled])'
    );

    await tagName.first().waitFor({ state: "visible", timeout: 15000 });

    const countTag = await tagName.count();
    let filledCount = 0;

    for (let i = 0; i < countTag; i++) {
      const tname = tagName.nth(i);
  //     await tname.scrollIntoViewIfNeeded();
  // await this.page.waitForTimeout(300);

        // await tname.scrollIntoViewIfNeeded();

      await tname.waitFor({ state: "visible" });
      

      const capAttr = await this.getCurrentFieldType(tname);

      if (!capAttr || !(capAttr in finaldata)) {
        console.log("Skipping fieldtypeNO=> " + capAttr);
        continue;
      }
      await tname.scrollIntoViewIfNeeded();

      if (capAttr === "2" || capAttr === "22" || capAttr === "5") {
        await tname.fill(String(finaldata[capAttr]));
        filledCount++;
      } else if (
        capAttr === "9" ||
        capAttr === "3" ||
        capAttr === "29" ||
        capAttr === "30" ||
        capAttr === "31"
      ) {
        const index = this.captIndex(finaldata, capAttr);
        await this.selectDropdownByCurrentField(tname, index);
        filledCount++;
      } else {
        console.log("Unsupported fieldtypeNO=> " + capAttr);
        continue;
      }
    }

    if (filledCount === 0) {
      throw new Error("No fields were filled from uidata.json. Check data-fieldtype attributes on the form.");
    }
  }
}
