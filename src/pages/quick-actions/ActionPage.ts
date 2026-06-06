import { expect, Locator, Page } from '@playwright/test';
import { relatedModule } from '@pages/related/relatedMod';
import { relatedModule as RelatedTabsModule } from '@pages/related/related';


function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function flexiblePattern(value: string) {
  return new RegExp(escapeRegex(value).replace(/\s+/g, '\\s*'), 'i');
}

export class SMSModalPage {
  constructor(private page: Page) {}

  async selectSMS() {
    const modal = this.page.locator('#quick-action-modal');
    await expect(modal).toBeVisible({ timeout: 20000 });
    await modal.getByText('sms', { exact: true }).click();
  }
  async clickX(){
    await this.page.getByRole('button', { name: 'Close' }).click();

  }
  async menuIcon1()
{
  await this.page.locator("#vertical_header_name").click();
}  

  async RecipientNumberField(value: string) {
    await this.selectMobileField(value);
  }

  async selectMobileField(mobile: string) {
    const recipient = this.page.locator('[id^="select2-rece_number"]').first();
    await expect(recipient).toBeVisible({ timeout: 15000 });
    await recipient.click();

    const pattern = flexiblePattern(mobile);
    const option = this.page
      .locator(
        '[id^="select2-rece_number-result"], .select2-container--open .select2-results__option'
      )
      .filter({ hasText: pattern })
      .first();

    await expect(option).toBeVisible({ timeout: 15000 });
    await option.click({ force: true });
  }

  async selectTemplate(template: string) {
    const container = this.page
      .locator('[id^="select2-QASmsTemplate"]')
      .first();
    await expect(container).toBeVisible({ timeout: 15000 });
    await container.click();

    const pattern = flexiblePattern(template);
    const option = this.page
      .locator(
        '[id^="select2-QASmsTemplate-result"], .select2-container--open .select2-results__option'
      )
      .filter({ hasText: pattern })
      .first();

    if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
      await option.click({ force: true });
      return;
    }

    const fallback = this.page
      .locator('.select2-container--open .select2-results__option')
      .filter({ hasNotText: /select an option/i })
      .first();
    await expect(fallback).toBeVisible({ timeout: 15000 });
    await fallback.click({ force: true });
  }

  async selectMergeField(value: string) {
    const fieldDropdown = this.page.locator('#select2-qa_selectedfield-container');
    await expect(fieldDropdown).toBeVisible({ timeout: 15000 });
    await fieldDropdown.click();

    // const pattern = flexiblePattern(field);
    // const option = this.page.locator('[id^="select2-qa_selectedfield-result"], .select2-container--open .select2-results__option');
    // await option.click();
    await this.page.getByRole('treeitem', { name: value,exact:true }).click();
    //   .filter({ hasText: pattern })
    //   .first();

    // await expect(option).toBeVisible({ timeout: 15000 });
    // await option.click({ force: true });
  }

  async sendSMS() {
    await this.page.getByRole('button', { name: /send/i }).click();
  }

  async closeModal() {
    if (this.page.isClosed()) return;

    const modal = this.page.locator('#quick-action-modal');
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await modal.getByText('close', { exact: true }).click();
      await expect(modal).toBeHidden({ timeout: 15000 });
    }
  }

  async OpenRecord() {
    const record = this.page.locator('[class="cell-truncate-wrapper"]').nth(3);
    await record.click();
  }


  async openQuickaction() {
    await clickListViewQuickReply(this.page);
  }

  async openLead(rowId: string) {
    const row = this.page.locator(`#row-${rowId}`);
    await row.waitFor({ state: 'visible' });
    await row.click();
  }


  async openQuickReplyDetail() {
    await this.page.locator('button.onetest', { hasText: 'quickreply' }).click();
    await this.page.locator('#quick-action-modal').waitFor({ state: 'visible', timeout: 20000 });
  }

  async openQuickReplySub() {
    const quickreply = this.page
      .locator('[role="tabpanel"]')
      .filter({ has: this.page.locator('table, .listview-table, [id^="row-"]') })
      .getByText('quickreply', { exact: true })
      .first();
    await quickreply.waitFor({ state: 'visible', timeout: 20000 });
    await quickreply.click();
    await this.page.locator('#quick-action-modal').waitFor({ state: 'visible', timeout: 20000 });
  } 

  async openQuickReplyglobal(crmId?: string) {
    if (crmId) {
      await this.page.locator(`[data-record-id="${crmId}"]`).nth(1).click();
    } else {
      await this.page
        .locator('[class="material-symbols-outlined quick_search_qa_icon"]')
        .first()
        .click();
    }
    await this.page.locator('#quick-action-modal').waitFor({ state: 'visible', timeout: 20000 });
  }

  async openrecordfromglobalsearch(crmId: string) {
    await this.page.locator(`a[href*="record=${crmId}"]`).click();
  }
}


  //                               GlobalSearch Page
//                               GlobalSearch Page  ------------------------------------  ------------------------------------  GlobalSearch Page

export class GlobalSearch {
  private page: Page; 
  constructor(page: Page) {
      this.page = page;
  }   


  async Searchicon() {
      await this.page.getByRole('button', { name: 'search' }).click();
  }   

async selectModule(moduleName: string) {
  await this.page.locator('#select2-Q_serach_module-container').click();
  await this.page.getByRole('treeitem', { name: moduleName, exact: true }).click();
  await expect(this.page.locator('#Q_serach_word')).toBeVisible({ timeout: 15_000 });
}

async Globalsearchicon() {
  const inPanel = this.quickSearchPanel().locator('i.ficon.ft-search').first();
  if (await inPanel.isVisible({ timeout: 3000 }).catch(() => false)) {
    await inPanel.click();
    return;
  }
  await this.page.locator('i.ficon.ft-search').first().click();
}

async globalsearchbar(searchTerm: string) {
  await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});

  const searchBox = this.page.locator('#Q_serach_word, input[name="Q_serach_word"]');
  await expect(searchBox).toBeVisible({ timeout: 20_000 });
  await searchBox.click();
  await searchBox.fill(searchTerm);
  await this.page.keyboard.press('Enter');
  await this.waitForSearchResults();
}

/** Panel that contains #quicksearchClose — avoids clicking sidebar module buttons. */
private quickSearchPanel(): Locator {
  return this.page
    .locator('div')
    .filter({ has: this.page.locator('#quicksearchClose') })
    .last();
}

async waitForSearchResults(timeoutMs = 30_000) {
  await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  const panel = this.quickSearchPanel();
  await expect
    .poll(
      async () => {
        const qaIcons = await this.page.locator('.quick_search_qa_icon').count();
        const panelButtons = await panel.getByRole('button').count();
        return qaIcons > 0 || panelButtons > 0;
      },
      { timeout: timeoutMs, intervals: [500, 1000, 2000] },
    )
    .toBeTruthy();
}

async selectmodulefromsearch(moduleName: string, alternateNames: string[] = []) {
  const names = [...new Set([moduleName, ...alternateNames].map((n) => n?.trim()).filter(Boolean))];
  await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
  await this.waitForSearchResults();

  const panel = this.quickSearchPanel();
  const pageWide = this.page;

  for (const name of names) {
    const pattern = moduleNamePattern(name);

    for (const scope of [panel, pageWide]) {
      const moduleButton = scope.getByRole('button', { name: pattern }).first();
      if (await moduleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await moduleButton.scrollIntoViewIfNeeded().catch(() => {});
        await moduleButton.click({ timeout: 15_000 });
        await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
        console.log(`[globalSearch] Selected module filter: ${name}`);
        return;
      }

      const moduleLink = scope.getByRole('link', { name: pattern }).first();
      if (await moduleLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moduleLink.scrollIntoViewIfNeeded().catch(() => {});
        await moduleLink.click({ timeout: 15_000 });
        await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
        console.log(`[globalSearch] Selected module link: ${name}`);
        return;
      }
    }
  }

  const leadsFallback = panel.getByRole('button', { name: /leads/i }).first();
  if (await leadsFallback.isVisible({ timeout: 3000 }).catch(() => false)) {
    await leadsFallback.scrollIntoViewIfNeeded().catch(() => {});
    await leadsFallback.click({ timeout: 15_000 });
    console.log('[globalSearch] Selected module filter: Leads (fallback)');
    return;
  }

  throw new Error(
    `selectmodulefromsearch: no module chip found for [${names.join(', ')}]`,
  );
}
}

//                               WhatsApp Page
//                               WhatsApp Page  ------------------------------------  ------------------------------------  WhatsApp Page


export class WhatsAppPage {
  constructor(private page: Page) {}

  async selectWhatsapp() {
    //await this.page.locator('.fa fa-whatsapp icon whatappsmsemail').click();
    // const modal = this.page.locator('#quick-action-modal');
    // await modal.waitFor({ state: 'visible', timeout: 20000 });
    await this.page.locator(".icon-container").nth(1).click();
    //  const whatsAppButton = modal.locator('span.label.whatappsmsemail:visible', { hasText: 'WhatsApp' }).first();
    //  await whatsAppButton.waitFor({ state: 'visible', timeout: 20000 });
    //  await whatsAppButton.click();
  //  await this.page.getByText('.fa.fa-whatsapp.icon WhatsApp', { exact: true }).click();
    //await this.page.locator('span.icon-container.whatsapptab').getByText('WhatsApp', { exact: true }).click();    
  }

  async Provider(){
     const provider=this.page.locator('[id="select2-qa_providerList-container"]');
     await provider.click();
     await this.page.getByRole('treeitem',{name:'MetaWhatApp (8031406121)'}).click();

  }

async selectMobileField() {
    
    const mobile=this.page.locator('#select2-qa_myselects_phone-container');
    await mobile.click();
    await this.page.getByRole('treeitem',{name:'Assigned To (User) Phone Number'}).click();



    // await this.page.locator('.select2-results').waitFor({ state: 'visible', timeout: 10000 });
    // await this.page.locator('li:has-text("Alternat Phone (Leads)")').click();
}

 async slectTemplate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  const pattern = digits.length >= 8 ? new RegExp(digits) : new RegExp(value, 'i');

  await this.page.locator('#select2-qa_selectedtemp-container').click();
  await this.page.getByRole('treeitem', { name: pattern }).first().click();
  // await this.page.locator('.select2-results').waitFor({ state: 'visible', timeout: 10000 });
  // await this.page.getByRole('treeitem', { name: 'payment_receipt -' }).click();
 }
async AddField(value:string){
    const field=this.page.locator('#select2-qa_selectedfields-container');
    await field.click();
    await this.page.getByRole('treeitem',{name:value}).click();
    // await this.page.locator('.select2-results').waitFor({ state: 'visible', timeout: 10000 });
    // await this.page.getByRole('treeitem', { name: 'Modified By ID' }).click();
}
async URLField(){
    await this.page.locator('#select2-qa_WhatsappShortUrl-container').click();
    await this.page.locator('li:has-text("image jpg")').click();
}
    async EXpiryDate(){
        await this.page.locator('#whatsappExpiryDate').click();
        await this.page.locator('td.today.active.start-date.active.end-date.available').click();
    }

    async Sendbutton (){
     await this.page.getByRole('button', { name: 'send' }).click();

    }
    async closeModal() {
    await this.page.locator('#quick-action-modal').getByText('close', { exact: true }).click();  
  }
 async closeModaldetail() {
    
  await this.page.locator('button:has-text("close")').click();
}
}

//                           Email Page
//                  Email Page  ------------------------------------  ------------------------------------  Email Page


export class EmailsPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async clickViewAll() {
    await this.page.getByRole('link', { name: 'View All -' }).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.getByRole('link', { name: 'View All -' }).click();
  }

  async openEmailBySubject(subject: string) {
    // Custom retry logic for email search with waits between attempts
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        // Wait for email list to load
        await this.page.locator('table, [class*="email"], [class*="list"]').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        
        // Try to find and click email with partial text matching
        const emailRow = this.page.locator(`text="${subject}"`).first();
        const isVisible = await emailRow.isVisible().catch(() => false);
        
        if (isVisible) {
          await emailRow.click();
          return;
        }
        
        // Scroll down to load more emails
        await this.page.evaluate(() => window.scrollBy(0, 500));
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        lastError = e as Error;
        if (attempt < 4) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    throw lastError || new Error(`Email with subject "${subject}" not found after 5 attempts`);
  }

  async clickMailBoxSection() {
    await this.page.locator('.mail-box-section').waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator('.mail-box-section').click();
  }

async QuickEmail(){
  //  await this.page.locator('#qa-modal-container span',{ hasText: 'Email' }).click();
  //await this.page.getByText("Email").click();
  //await this.page.getByText('mail', { exact: true }).click();
  // await this.page.getByRole('button', { name: 'Email' }).click();
  await this.page.getByText('mail Email', { exact: true }).click();
}


async FromEmail() {
  // await this.page.getByRole('combobox').click();
  await this.page.locator('input[type="search"]').nth(9).click();
}


async Quickclose() {
    const closeBtn = this.page.locator('#quick-action-modal')
  .getByText('close', { exact: true });

 if (await closeBtn.isVisible()) {
 await closeBtn.click();
}
  }

}
export function Selectfrom(page: Page, name: string) {
  return page.locator(`//li[contains(@class,'select2-results__option') and contains(text(),'${name}')]`);
}
export async function Menulist(page: Page, moduleName: string) {
  try {
    const moduleLocator = page.getByText(moduleName, { exact: true }).first();
 
    // Check if module exists & visible
    if (await moduleLocator.count() === 0) {
      console.log(`❌ User doesn't having permission of the ${moduleName}`);
      return false;
    }
 
    if (!(await moduleLocator.isVisible())) {
      console.log(`❌ User doesn't having permission of the ${moduleName}`);
      return false;
    }
 
    // Click if available
    await moduleLocator.click();
    console.log(`✅ Navigated to ${moduleName}`);
    return true;
 
  } catch (error) {
    console.log(`❌ User doesn't having permission of the ${moduleName}`);
    return false; // DO NOT throw error
  }
}
export async function clickMenu(page: Page) {
  const sidebarMenu = page.locator('#vertical_header_name, #vertical_header_name_link').first();
  if (await sidebarMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
    await sidebarMenu.click();
    return;
  }
}
 
 




//                               Email Page
//                               Email Page  ------------------------------------  ------------------------------------  Email Page

export class EmailModalPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private get modal() {
    return this.page.locator('#quick-action-modal');
  }

  private getFieldContainer(label: string) {
    return this.modal.locator(`xpath=.//*[normalize-space(text())="${label}"]/following-sibling::*[1]`).first();
  }
  async QuickEmail(){
    await this.page.getByText('mail Email', { exact: true }).click();
  }

  private toExactCaseInsensitiveRegex(value: string) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escaped}$`, 'i');
  }

  private async openLabeledCombobox(label: string) {
    const container = this.getFieldContainer(label);
    await container.waitFor({ state: 'visible', timeout: 15000 });

    const trigger = container.getByRole('combobox').last();
    //await trigger.waitFor({ state: 'visible', timeout: 15000 });
    await trigger.click();

    return container;
  }

  async selectEmailType(_emailType?: string) {
    const toEmailContainer = this.getFieldContainer('To Email');
    if (await toEmailContainer.isVisible().catch(() => false)) {
      return;
    }

    const emailTrigger = this.modal.getByText('mail', { exact: true }).first();
    await emailTrigger.waitFor({ state: 'visible', timeout: 10000 });
    await emailTrigger.click();
    await this.modal.getByText('To Email', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  }

  async openEmailFieldsDropdown() {
    await this.openLabeledCombobox('To Email');
    await this.page.waitForTimeout(300);
  }

  async OutgoingEmailAddress(emailAddress: string) {
    const outgoingServer = this.modal.locator('[id^="select2-qa_OutGoingserverval-"][id$="-container"]').first();
    if (await outgoingServer.isVisible().catch(() => false)) {
      await outgoingServer.click({ timeout: 10000, force: true });
    } else {
      await this.openLabeledCombobox('Outgoing Email Address');
    }

    const emailOption = this.page
      .getByRole('treeitem', { name: emailAddress, exact: true })
      .or(this.page.getByRole('option', { name: emailAddress, exact: true }))
      .last();
    await emailOption.waitFor({ state: 'visible', timeout: 10000 });
    await emailOption.click({ timeout: 10000 });
  }

  private async clickSelect2Option(fieldName: string) {
    const exactMatcher = this.toExactCaseInsensitiveRegex(fieldName);
    const exactOption = this.page
      .getByRole('treeitem', { name: exactMatcher })
      .or(this.page.getByRole('option', { name: exactMatcher }))
      .last();

    if (await exactOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exactOption.click({ force: true });
      return;
    }

    const pattern = flexiblePattern(fieldName);
    const flexibleOption = this.page
      .locator('.select2-container--open .select2-results__option')
      .filter({ hasText: pattern })
      .first();
    await expect(flexibleOption).toBeVisible({ timeout: 15000 });
    await flexibleOption.click({ force: true });
  }

  async selectEmailField(fieldName: string) {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await this.clickSelect2Option(fieldName);
        return;
      } catch (e) {
        lastError = e as Error;
        if (attempt < 4) await this.page.waitForTimeout(2000);
      }
    }
    throw lastError ?? new Error(`Failed to select email field: ${fieldName}`);
  }

  async selectTemplate(templateName: string) {
    await this.openLabeledCombobox('Choose Template');
    await this.clickSelect2Option(templateName);
  }

  async editEmailContent(content: string) {
    const iframe = this.page.locator('iframe[title="Editor, qaBlockArea"]');
    await iframe.waitFor({ state: 'attached', timeout: 10000 });
    const frame = iframe.contentFrame();
    await frame.getByText('aaaaaa.').waitFor({ state: 'visible', timeout: 10000 });
    await frame.getByText('aaaaaa.').click();
    await frame.getByRole('textbox', { name: 'Editor, qaBlockArea' }).fill(content);
  }

  async sendEmail() {
    await this.page.getByRole('button', { name: 'send' }).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.getByRole('button', { name: 'send' }).click();
  }

  async closeModal() {
    await this.page.locator('#quick-action-modal').getByText('close', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator('#quick-action-modal').getByText('close', { exact: true }).click();
  }

  async selectAdditionalField(fieldName: string) {
    await this.openLabeledCombobox('Add Fields');
    const option = this.page
      .getByRole('treeitem', { name: fieldName, exact: true })
      .or(this.page.getByRole('option', { name: fieldName, exact: true }))
      .last();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
  }

  async selectfromemail(fromLabel = 'Primary Email ( rsoft Assigned To)') {
    const fromContainer = this.getFieldContainer('From Email');
    const trigger = fromContainer
      .locator('#select2-qa_temp_fromemail-container')
      .or(fromContainer.getByRole('combobox'))
      .last();
    await trigger.click({ force: true });
    await this.clickSelect2Option(fromLabel);
  }
}

// --- Quick action flows (callable from moduleNav.spec.ts) ---

export type QuickActionTaskName = 'Send WhatsApp' | 'Send SMS' | 'Send Email';

export function logQuickActionNoPermission(taskName: QuickActionTaskName): void {
  console.log(`login user Doesn't having the ${taskName} tasks permission`);
}

export async function closeQuickActionPopup(page: Page): Promise<void> {
  const sms = new SMSModalPage(page);
  await sms.closeModal();
}

/** Log no permission, close popup, then caller opens popup again for the next task. */
export async function skipQuickActionTask(page: Page, taskName: QuickActionTaskName): Promise<void> {
  logQuickActionNoPermission(taskName);
  await closeQuickActionPopup(page);
}

export async function isQuickActionTaskVisible(
  page: Page,
  taskName: QuickActionTaskName,
): Promise<boolean> {
  const modal = page.locator('#quick-action-modal');
  if (!(await modal.isVisible({ timeout: 3000 }).catch(() => false))) {
    return false;
  }

  switch (taskName) {
    case 'Send WhatsApp':
      return (
        (await modal
          .locator('.fa-whatsapp, .icon-container.whatsapptab, .whatappsmsemail')
          .filter({ hasText: /whatsapp/i })
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)) ||
        (await modal.locator('.icon-container').nth(1).isVisible({ timeout: 2000 }).catch(() => false))
      );
    case 'Send SMS':
      return modal.getByText('sms', { exact: true }).isVisible({ timeout: 2000 }).catch(() => false);
    case 'Send Email':
      return (
        (await modal.getByText('mail Email', { exact: true }).isVisible({ timeout: 2000 }).catch(() => false)) ||
        (await modal.getByText('mail', { exact: true }).first().isVisible({ timeout: 2000 }).catch(() => false))
      );
    default:
      return false;
  }
}

export type QuickActionFlowOptions = {
  /** Default true. Set false when already on the list view opened from the dashboard card. */
  navigateToLeads?: boolean;
  moduleLabel?: string;
  moduleName?: string;
};

function resolveModuleName(options: QuickActionFlowOptions = {}): string {
  return (options.moduleName || options.moduleLabel || 'Leads').trim();
}

function moduleNamePattern(name: string): RegExp {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(esc.replace(/\s+/g, '\\s*'), 'i');
}

export async function dismissGlobalSearchIfOpen(page: Page) {
  const closeSearch = page.locator('#quicksearchClose').first();
  if (await closeSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeSearch.click({ force: true });
  }
  await page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
}

export async function goToLeadsModule(page: Page) {
  await dismissGlobalSearchIfOpen(page);
  await clickMenu(page);
  await Menulist(page, 'Leads');
}

async function prepareListPageForQuickActions(
  page: Page,
  options: QuickActionFlowOptions = {},
) {
  if (options.navigateToLeads === false) {
    await dismissGlobalSearchIfOpen(page);
    return;
  }
  await goToLeadsModule(page);
}

async function runWhatsAppTask(page: Page): Promise<void> {
  const whatsApp = new WhatsAppPage(page);
  await whatsApp.selectWhatsapp();
  await whatsApp.Provider();
  await whatsApp.selectMobileField();
  await whatsApp.slectTemplate('Test Temp-25322132017416007');
  await whatsApp.AddField('Modified By ID');
  await whatsApp.Sendbutton();
  await whatsApp.closeModal();
}

async function runSmsTask(page: Page, mergeField = 'Area'): Promise<void> {
  const sms = new SMSModalPage(page);
  await sms.selectSMS();
  await sms.RecipientNumberField('Assigned To (User) Phone Number');
  await sms.selectTemplate('Custom Template');
  await sms.selectMergeField(mergeField);
  await sms.sendSMS();
  await sms.closeModal();
}

async function runEmailTask(page: Page): Promise<void> {
  const emailModalPage = new EmailModalPage(page);
  const emailsPage = new EmailsPage(page);
  await emailsPage.QuickEmail();
  await emailModalPage.selectEmailType('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.openEmailFieldsDropdown();
  await emailModalPage.selectEmailField('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.selectTemplate('Allotment Letter For Your...');
  await emailModalPage.sendEmail();
  await emailsPage.Quickclose();
}

export async function sendWhatsAppFromListView(page: Page) {
  const sms = new SMSModalPage(page);
  await goToLeadsModule(page);
  await sms.openQuickaction();
  if (await isQuickActionTaskVisible(page, 'Send WhatsApp')) {
    await runWhatsAppTask(page);
  } else {
    await skipQuickActionTask(page, 'Send WhatsApp');
  }
  await sms.OpenRecord();
}

export async function sendSmsFromListView(page: Page) {
  const sms = new SMSModalPage(page);
  await goToLeadsModule(page);
  await sms.openQuickaction();
  if (await isQuickActionTaskVisible(page, 'Send SMS')) {
    await runSmsTask(page);
  } else {
    await skipQuickActionTask(page, 'Send SMS');
  }
  await sms.OpenRecord();
}

export async function sendEmailFromListView(page: Page) {
  const sms = new SMSModalPage(page);
  await goToLeadsModule(page);
  await sms.openQuickaction();
  if (await isQuickActionTaskVisible(page, 'Send Email')) {
    await runEmailTask(page);
  } else {
    await skipQuickActionTask(page, 'Send Email');
  }
  await sms.OpenRecord();
}

/** First list-view data row (table row, row id, or truncate cell ancestor). */
async function listViewFirstRow(page: Page): Promise<Locator> {
  const tableRow = page.locator('tbody tr:has(td)').first();
  if (
    (await tableRow.count()) > 0 &&
    (await tableRow.isVisible({ timeout: 3000 }).catch(() => false))
  ) {
    return tableRow;
  }

  const rowById = page.locator('[id^="row-"]').first();
  if (
    (await rowById.count()) > 0 &&
    (await rowById.isVisible({ timeout: 3000 }).catch(() => false))
  ) {
    return rowById;
  }

  const truncate = page.locator('.cell-truncate-wrapper').first();
  const rowFromTruncate = truncate.locator('xpath=ancestor::tr[1]');
  if (
    (await rowFromTruncate.count()) > 0 &&
    (await rowFromTruncate.isVisible({ timeout: 3000 }).catch(() => false))
  ) {
    return rowFromTruncate;
  }

  return truncate;
}

/** quickreply on list row: .qa / .qa_icon / material icon text, legacy .qa_button. */
function quickReplyCandidatesIn(scope: Locator): Locator[] {
  return [
    scope
      .locator('.qa, .qa_icon')
      .filter({ hasText: /quickreply/i })
      .first(),
    scope
      .locator('.material-symbols-outlined, [class*="qa"]')
      .filter({ hasText: /quickreply/i })
      .first(),
    scope.locator('button.onetest').filter({ hasText: /quickreply/i }).first(),
    scope.getByRole('button', { name: /quickreply/i }).first(),
    scope.getByText('quickreply', { exact: true }).first(),
    scope.locator('.qa_button').first(),
    scope.locator('.qa_button_related_tab .qa, .qa_button_related_tab .qa_icon').filter({ hasText: /quickreply/i }).first(),
  ];
}

async function isQuickReplyCandidateVisible(candidate: Locator): Promise<boolean> {
  if ((await candidate.count()) === 0) return false;
  return candidate.isVisible({ timeout: 1500 }).catch(() => false);
}

/** Resolve visible list-view quickreply control (icon name/text: quickreply). */
async function resolveListViewQuickReplyIcon(page: Page): Promise<Locator | null> {
  await page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});

  const firstRow = await listViewFirstRow(page);
  await firstRow.hover({ force: true }).catch(() => {});
  await page.waitForTimeout(300);

  const scopes: Locator[] = [
    firstRow,
    page.locator('.table-responsive').first(),
    page.locator('table, .listview-table').first(),
  ];

  for (const scope of scopes) {
    if ((await scope.count()) === 0) continue;
    for (const candidate of quickReplyCandidatesIn(scope)) {
      if (await isQuickReplyCandidateVisible(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

/** True when list view has quickreply (.qa / .qa_icon / quickreply text / .qa_button). */
async function hasListViewQuickReplyIcon(page: Page): Promise<boolean> {
  const icon = await resolveListViewQuickReplyIcon(page);
  if (icon) {
    console.log('[quickact] List view quickreply icon found');
    return true;
  }
  console.log('[quickact] List view quickreply icon not detected');
  return false;
}

/** Click list-view quickreply and wait for quick-action modal. */
export async function clickListViewQuickReply(page: Page): Promise<void> {
  let icon = await resolveListViewQuickReplyIcon(page);

  if (!icon) {
    try {
      await expect
        .poll(async () => {
          icon = await resolveListViewQuickReplyIcon(page);
          return icon !== null;
        }, { timeout: 20_000, intervals: [500, 1000, 2000] })
        .toBe(true);
    } catch {
      throw new Error(
        'List view quickreply icon not found (.qa / .qa_icon / quickreply text / .qa_button)',
      );
    }
  }

  icon = icon ?? (await resolveListViewQuickReplyIcon(page));
  if (!icon) {
    throw new Error(
      'List view quickreply icon not found (.qa / .qa_icon / quickreply text / .qa_button)',
    );
  }

  console.log('[quickact] Click list view quickreply icon');
  await icon.scrollIntoViewIfNeeded();
  await icon.click({ force: true });
  await page.locator('#quick-action-modal').waitFor({ state: 'visible', timeout: 20_000 });
}

/** Open quick-action modal from list row icon, or first row + detail quickreply. */
async function openListViewQuickActionEntry(
  page: Page,
  sms: SMSModalPage,
  relMod: relatedModule,
  useListQuickReply: boolean,
): Promise<void> {
  await page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});

  if (useListQuickReply) {
    await clickListViewQuickReply(page);
    return;
  }

  console.log('[quickact] List quickreply not on list — opening first record (detail quickreply)');
  await relMod.editFirstRow();
  await page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
  await sms.openQuickReplyDetail();
}

/** Runs WhatsApp + SMS + Email quick actions from list view. */
export async function runQuickActionsFromListView(
  page: Page,
  options: QuickActionFlowOptions = {},
) {
  const sms = new SMSModalPage(page);
  const relMod = new relatedModule(page);
  await prepareListPageForQuickActions(page, options);

  const useListQuickReply = await hasListViewQuickReplyIcon(page);

  await openListViewQuickActionEntry(page, sms, relMod, useListQuickReply);
  if (await isQuickActionTaskVisible(page, 'Send WhatsApp')) {
    await runWhatsAppTask(page);
  } else {
    await skipQuickActionTask(page, 'Send WhatsApp');
  }

  await sms.closeModal();
  await openListViewQuickActionEntry(page, sms, relMod, useListQuickReply);
  if (await isQuickActionTaskVisible(page, 'Send SMS')) {
    await runSmsTask(page);
  } else {
    await skipQuickActionTask(page, 'Send SMS');
  }

  await sms.closeModal();
  await openListViewQuickActionEntry(page, sms, relMod, useListQuickReply);
  if (await isQuickActionTaskVisible(page, 'Send Email')) {
    await runEmailTask(page);
  } else {
    await skipQuickActionTask(page, 'Send Email');
  }

  if (useListQuickReply) {
    await sms.OpenRecord();
  }
}
export async function detailView(page: Page) {
  const sms = new SMSModalPage(page);

  await sms.openQuickReplyDetail();
  if (await isQuickActionTaskVisible(page, 'Send WhatsApp')) {
    await runWhatsAppTask(page);
  } else {
    await skipQuickActionTask(page, 'Send WhatsApp');
  }

  await sms.openQuickReplyDetail();
  if (await isQuickActionTaskVisible(page, 'Send SMS')) {
    await runSmsTask(page);
  } else {
    await skipQuickActionTask(page, 'Send SMS');
  }

  await sms.openQuickReplyDetail();
  if (await isQuickActionTaskVisible(page, 'Send Email')) {
    await runEmailTask(page);
  } else {
    await skipQuickActionTask(page, 'Send Email');
  }
}
async function reopenSubmoduleQuickReply(
  page: Page,
  sms: SMSModalPage,
  related: RelatedTabsModule,
  tabName: string,
): Promise<boolean> {
  if (await page.locator('#quick-action-modal').isVisible({ timeout: 2000 }).catch(() => false)) {
    return true;
  }
  try {
    await sms.openQuickReplySub();
    return true;
  } catch {
    return related.openSubmoduleQuickReplyModal(tabName);
  }
}

/** Submodule quick actions using related.ts tab + quickreply icon detection (skip when absent). */
export async function submodule(page: Page) {
  const sms = new SMSModalPage(page);
  const related = new RelatedTabsModule(page);
  const tabs = await related.getSubmoduleModuleTabs();

  if (tabs.length === 0) {
    console.log('[quickact] submodule — no related module tabs; skipping');
    return;
  }

  for (const tabName of tabs) {
    if (!(await related.openSubmoduleQuickReplyModal(tabName))) {
      continue;
    }

    if (await isQuickActionTaskVisible(page, 'Send WhatsApp')) {
      await runWhatsAppTask(page);
    } else {
      await skipQuickActionTask(page, 'Send WhatsApp');
    }

    if (!(await reopenSubmoduleQuickReply(page, sms, related, tabName))) {
      continue;
    }
    if (await isQuickActionTaskVisible(page, 'Send SMS')) {
      await runSmsTask(page, 'Assigned To');
    } else {
      await skipQuickActionTask(page, 'Send SMS');
    }

    if (!(await reopenSubmoduleQuickReply(page, sms, related, tabName))) {
      continue;
    }
    if (await isQuickActionTaskVisible(page, 'Send Email')) {
      await runEmailTask(page);
    } else {
      await skipQuickActionTask(page, 'Send Email');
    }

    await sms.closeModal();
    console.log(`[quickact] submodule — finished quick actions for tab: ${tabName}`);
  }
}
export async function globalSearch(
  page: Page,
  options: QuickActionFlowOptions = {},
) {
  const sms = new SMSModalPage(page);
  const globalSearchPage = new GlobalSearch(page);
  const moduleForResults = resolveModuleName(options);
  const moduleAlternates = [options.moduleLabel, options.moduleName, 'Leads'].filter(
    (n): n is string => Boolean(n?.trim()),
  );
  await dismissGlobalSearchIfOpen(page);
  await globalSearchPage.Searchicon();
  await globalSearchPage.selectModule('All Records');
  await globalSearchPage.globalsearchbar('9030358240');
  try {
    await globalSearchPage.Globalsearchicon();
  } catch {
    console.log('[globalSearch] Globalsearchicon skipped — results already loaded');
  }
  await globalSearchPage.selectmodulefromsearch(moduleForResults, moduleAlternates);
  // await globalSearch.openrecordfromglobalsearch('1');
  await sms.openQuickReplyglobal();
  if (await isQuickActionTaskVisible(page, 'Send WhatsApp')) {
    await runWhatsAppTask(page);
  } else {
    await skipQuickActionTask(page, 'Send WhatsApp');
  }

  await sms.openQuickReplyglobal();
  if (await isQuickActionTaskVisible(page, 'Send SMS')) {
    await runSmsTask(page);
  } else {
    await skipQuickActionTask(page, 'Send SMS');
  }

  await sms.openQuickReplyglobal();
  if (await isQuickActionTaskVisible(page, 'Send Email')) {
    await runEmailTask(page);
  } else {
    await skipQuickActionTask(page, 'Send Email');
  }
}

