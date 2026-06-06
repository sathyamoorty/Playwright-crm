import{Page,expect} from '@playwright/test';
import { widgetCrt } from './widget';
 
export class TargetPage {
    constructor(private page:Page){}
 
 async  ProfileIcon(page: Page) {
          await page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
           await page.locator('.dropdown-toggle.nav-link.dropdown-user-link').click();
  }
 
  async goToCRMSettings(page: Page) {
    await this.page.getByRole('link', { name: /CRM Setting/i }).click();
  }
 
  async UserAccess(){
    await this.page.locator('span').filter({ hasText: 'User & Access Control' }).first().click();
  }
 
  async profile(){
 
    await this.page.locator('span:has-text("Profile")').first().click();
  }
 
  async Editprofile(page: Page, profileName: string) {
     const row = page.locator('tr', {
    has: page.locator('td', { hasText: profileName }),
  });
   
     await this.page.getByText('category', { exact: true }).click();
  }
 
  async clickFieldAndToolPrivileges(page: Page, moduleName: string) {
 
  // Find the row using module name
  const moduleRow = page.locator('tr', {
    has: page.getByText(moduleName, { exact: true })
  });
 
  // Click the dropdown/button under "Field and Tool Privileges"
  const privilegeDropdown = moduleRow.locator('td').last().locator('button, select, span, div').first();
 
  await privilegeDropdown.click();
}
 
async Webaction(){
    await this.page.locator('a.col-sm-2.Maskingvalue.webAction_18').click();
 
}
 
async TargetPermission(data:string){
    const Permission=this.page.locator('tr', {
    has: this.page.getByText(data, { exact: true })
  });
 
    const checkbox = Permission.locator('td').nth(1).locator('input[type="checkbox"]');
    await checkbox.check();
}
 
async enableFunctionToggle(page: Page, functionName: string) {
  // Locate the row using function name text
  const row = page.locator(`tr:has-text("${functionName}"), div.row:has-text("${functionName}"), li:has-text("${functionName}")`).first();
  await expect(row).toBeVisible({ timeout: 10000 });
 
  const checkbox = row.locator('input[type="checkbox"]').first();
  const toggle = await checkbox.count() ? checkbox : row.locator('label, button, [role="switch"], .switch, .toggle').first();
 
  await expect(toggle).toBeVisible({ timeout: 10000 });
 
  const ariaChecked = await toggle.getAttribute('aria-checked');
  const checked = await toggle.isChecked().catch(() => false);
  const isEnabled = ariaChecked === 'true' || checked;
 
  if (!isEnabled) {
    await toggle.click();
  } else {
    console.log(`${functionName} is already enabled.`);
  }
}
 
async home(){
    await this.page.locator('i').filter({ hasText: 'home' }).click();
}
 
async Dashboardtab(module:string){
         await this.page.locator('id=MoreMod_'+module).click();
}
async target(){
    await this.page.locator('[id="baseIcon-tab3"]').click();
}
async addtarget(){
    await this.page.getByText('add',{exact:true}).nth(1).click();
}
 
async Title(TargetName: string){
   
    const name=this.page.locator('[id="target_tittle"]');
    await name.fill(TargetName);
}
async format(){
    const format= this.page.locator('[id="select2-target_type-container"]');
    await format.click();
    const option=this.page.getByRole('treeitem', { name: 'Count', exact: true });
    await option.click();
}
async targetvalue(value:string){
    const value1=this.page.locator('[id="target_value"]');
    await value1.fill(value.toString());
    await value1.scrollIntoViewIfNeeded();
}
  async Next() {
    // Widget wizard leaves hidden "Next" nodes in DOM (step2-next / ThirdWidgetPopup) — only click target wizard.
    const next = this.page
      .locator(
        'button:not(.d-none):not(.step2-next):not([onclick*="ThirdWidgetPopup"])',
      )
      .filter({ hasText: "Next" })
      .filter({ visible: true });

    await expect(next.first()).toBeVisible({ timeout: 15_000 });
    await next.first().click();
  }
 
 async addcondition(){
 
    await this.page.locator('[class="btn btn-primary filter_addconditionbutton"]').first().click();
    const dropdown=this.page.locator('[id="select2-fieldcol0and-container"]');
    await dropdown.click();
    const option=this.page.getByLabel('Leads').getByRole('treeitem', { name: 'Created By', exact: true });
    await option.click();
}
async selectOperator(){
    const dropdown=this.page.locator('[id="select2-conditioncol0and-container"]');
    await dropdown.click();
    const option=this.page.getByRole('treeitem', { name: 'Is', exact: true });
    await option.click();
}
 
async Accesswith(){
  const access=this.page.locator('[id="select2-access_with-container"]');
  await access.click();
  const option=this.page.getByRole('treeitem', { name: 'View and Edit', exact: true });
  await option.click();
 
}
async clicksubmit() {
    const submit = this.page
      .locator('button:not([onclick*="SubmitWidgetPopup"]):not([class*="3rd-Step-save"])')
      .filter({ hasText: 'Submit' })
      .filter({ visible: true });

    await expect(submit.first()).toBeVisible({ timeout: 15_000 });
    await submit.first().click();
  }
async scrollToBottom(){
    const widget=new widgetCrt(this.page);
    await widget.scrollMainWidgetAreaToBottom();
    // await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

/**
 * Same flow as widget maximize: scroll dashboard (via widgetCrt), find card by target title, click ft-maximize.
 * Keeps target-specific logic here; does not change widget.ts.
 */
async maximizeTargetCard(targetTitle: string) {
    const widgets = new widgetCrt(this.page);
    const trimmed = targetTitle.trim();
    const titleLoc = this.page.locator("h4.card-title").filter({ hasText: trimmed });
    let clickedTargetsTab = false;
    let clickedWidgetsTab = false;

    await expect.poll(
        async () => {
            await widgets.scrollMainWidgetAreaToBottom();
            if ((await titleLoc.count()) > 0) {
                return true;
            }
            if (!clickedTargetsTab) {
                await this.page.locator('[id="baseIcon-tab3"]').click();
                clickedTargetsTab = true;
                return false;
            }
            if (!clickedWidgetsTab) {
                await this.page.getByRole("link", { name: "widgets", exact: true }).click();
                clickedWidgetsTab = true;
            }
            return (await titleLoc.count()) > 0;
        },
        { timeout: 25000, intervals: [200, 400, 600] },
    ).toBe(true);

    const title = titleLoc.last();
    await title.scrollIntoViewIfNeeded();
    await expect(title).toBeVisible({ timeout: 10000 });

    const card = title.locator(
        'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " card ")][1]',
    );
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.hover();
    await this.page.waitForTimeout(150);

    const clicked = await card.evaluate((el) => {
        const icon = el.querySelector("i.ft-maximize");
        if (!icon) return false;
        const target = (icon.closest("a") ?? icon.closest("button") ?? icon) as HTMLElement;
        target.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true, view: window }),
        );
        return true;
    });

    if (!clicked) {
        await card.locator("i.ft-maximize, a:has(.ft-maximize)").first().click({
            force: true,
            timeout: 5000,
        });
    }

    await this.page.waitForTimeout(3500);
}
async clickTarget(){
    await this.page.locator('[id="baseIcon-tab3"]').click();
}

  /** Navbar / layout customizers can steal clicks from dashboard tabs — dismiss before Targets flow. */
  async dismissCustomizerOverlays() {
    for (let i = 0; i < 3; i++) {
      await this.page.keyboard.press('Escape')
      await this.page.waitForTimeout(150)
    }

    const closeSelectors = [
      this.page.locator('.customizer .close').first(),
      this.page.locator('.customizer-close').first(),
      this.page.getByRole('button', { name: /^close$/i }).first(),
      this.page.locator('[aria-label="close"]').first(),
    ]

    for (const loc of closeSelectors) {
      if (await loc.isVisible().catch(() => false)) {
        await loc.click({ timeout: 3000 }).catch(() => {})
        break
      }
    }

    await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
  }

}
 