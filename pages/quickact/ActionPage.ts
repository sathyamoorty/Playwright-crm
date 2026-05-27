import { expect, Page } from '@playwright/test';
import { relatedModule } from '../relatedMod.ts';


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
    const quickaction = this.page.locator('.qa_button').first();
    await quickaction.waitFor({ state: 'visible', timeout: 20000 });
    await quickaction.click();
    await this.page.locator('#quick-action-modal').waitFor({ state: 'visible', timeout: 20000 });
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
  await this.page.locator('i.ficon.ft-search').click();

}

async globalsearchbar(searchTerm: string) {
  await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});

  const searchBox = this.page.locator('#Q_serach_word, input[name="Q_serach_word"]');
  await expect(searchBox).toBeVisible({ timeout: 20_000 });
  await searchBox.click();
  await searchBox.fill(searchTerm);
  await this.page.keyboard.press('Enter');
}
async selectmodulefromsearch(moduleName: string) {
const moduleButton = this.page.getByRole('button', { name: new RegExp(moduleName, 'i') }).first();
if (await moduleButton.isVisible({ timeout: 10000 }).catch(() => false)) {
  await moduleButton.click();
  return;
}

const moduleLink = this.page.getByRole('link', { name: moduleName, exact: true });
for (let i = 0; i < (await moduleLink.count()); i++) {
  if (await moduleLink.nth(i).isVisible()) {
    await moduleLink.nth(i).click();
    return;
  }
}
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

export async function goToLeadsModule(page: Page) {
  const closeSearch = page.locator('#quicksearchClose').first();
  if (await closeSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeSearch.click({ force: true });
  }
  await clickMenu(page);
  await Menulist(page, 'Leads');
}

export async function sendWhatsAppFromListView(page: Page) {
  const whatsApp = new WhatsAppPage(page);
  const sms = new SMSModalPage(page);

  await goToLeadsModule(page);
  await sms.openQuickaction();
  await whatsApp.selectWhatsapp();
  await whatsApp.Provider();
  await whatsApp.selectMobileField();
  await whatsApp.slectTemplate('Test Temp-25322132017416007');
  await whatsApp.AddField('Modified By ID');
  await whatsApp.Sendbutton();
  await whatsApp.closeModal();
  await sms.OpenRecord();
}

export async function sendSmsFromListView(page: Page) {
  const sms = new SMSModalPage(page);

  await goToLeadsModule(page);
  await sms.openQuickaction();
  await sms.selectSMS();
  await sms.RecipientNumberField('Assigned To (User) Phone Number');
  await sms.selectTemplate('Custom Template');
  await sms.selectMergeField('Area');
  await sms.sendSMS();
  await sms.closeModal();
  await sms.OpenRecord();
}

export async function sendEmailFromListView(page: Page) {
  const emailModalPage = new EmailModalPage(page);
  const emailsPage = new EmailsPage(page);
  const sms = new SMSModalPage(page);

  await goToLeadsModule(page);
  await sms.openQuickaction();
  await emailsPage.QuickEmail();
  await emailModalPage.selectEmailType('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.openEmailFieldsDropdown();
  await emailModalPage.selectEmailField('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.selectTemplate('Allotment Letter For Your...');
  await emailModalPage.sendEmail();
  await emailsPage.Quickclose();
  await sms.OpenRecord();
}

/** Runs WhatsApp + SMS + Email quick actions from Leads list view. */
export async function runQuickActionsFromListView(page: Page) {
  await sendWhatsAppFromListView(page);
  await sendSmsFromListView(page);
  await sendEmailFromListView(page);
}
export async function detailView(page: Page) {
  const whatsApp = new WhatsAppPage(page);
  const sms = new SMSModalPage(page);
  const emailModalPage = new EmailModalPage(page);
  const emailsPage = new EmailsPage(page);
  await sms.openQuickReplyDetail()
  // await sms.OpenRecord();
  await whatsApp.selectWhatsapp();
  await whatsApp.Provider();
  await whatsApp.selectMobileField();
  await whatsApp.slectTemplate('Test Temp-25322132017416007');
  await whatsApp.AddField('Modified By ID');
  await whatsApp.Sendbutton();
  await whatsApp.closeModal();
  await sms.openQuickReplyDetail();
  await sms.selectSMS();
  await sms.RecipientNumberField('Assigned To (User) Phone Number');
  await sms.selectTemplate('Custom Template');
  await sms.selectMergeField('Area');
  await sms.sendSMS();
  await sms.closeModal();
  await sms.openQuickaction();
  await emailsPage.QuickEmail();
  await emailModalPage.selectEmailType('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.openEmailFieldsDropdown();
  await emailModalPage.selectEmailField('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.selectTemplate('Allotment Letter For Your...');
  await emailModalPage.sendEmail();
  await emailsPage.Quickclose();
}
export async function submodule(page: Page) {
  const whatsApp = new WhatsAppPage(page);
  const sms = new SMSModalPage(page);
  const emailModalPage = new EmailModalPage(page);
  const emailsPage = new EmailsPage(page);
  const relatedModulePage = new relatedModule(page);
  await relatedModulePage.relModule(0);
  await sms.openQuickReplySub();
  await whatsApp.selectWhatsapp();
  await whatsApp.Provider();  
  await whatsApp.selectMobileField();
  await whatsApp.slectTemplate('Test Temp-25322132017416007');
  await whatsApp.AddField('Modified By ID');
  await whatsApp.Sendbutton();
  await whatsApp.closeModal();
  await sms.openQuickReplySub();
  await sms.selectSMS();
  await sms.RecipientNumberField('Assigned To (User) Phone Number');
  await sms.selectTemplate('Custom Template');
  await sms.selectMergeField('Assigned To');
  await sms.sendSMS();
  await sms.closeModal();
  await sms.openQuickReplySub();
  await emailsPage.QuickEmail();
  await emailModalPage.selectEmailType('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.openEmailFieldsDropdown();
  await emailModalPage.selectEmailField('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.selectTemplate('Allotment Letter For Your...');
  await emailModalPage.sendEmail();
  await emailsPage.Quickclose();
}
export async function globalSearch(page: Page) {
  const whatsApp = new WhatsAppPage(page);
  const sms = new SMSModalPage(page);
  const emailModalPage = new EmailModalPage(page);
  const emailsPage = new EmailsPage(page);
  const globalSearch = new GlobalSearch(page);
  const closeSearch = page.locator('#quicksearchClose').first();
  if (await closeSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeSearch.click({ force: true });
  }
  await page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  await globalSearch.Searchicon();
  await globalSearch.selectModule('All Records');
  await globalSearch.globalsearchbar('9030358240');
  await globalSearch.Globalsearchicon();
  await globalSearch.selectmodulefromsearch('Leads');
  // await globalSearch.openrecordfromglobalsearch('1');
  await sms.openQuickReplyglobal();
  await whatsApp.selectWhatsapp();
  await whatsApp.Provider();
  await whatsApp.selectMobileField();
  await whatsApp.slectTemplate('Test Temp-25322132017416007');
  await whatsApp.AddField('Modified By ID');
  await whatsApp.Sendbutton();
  await whatsApp.closeModal();
  await sms.openQuickReplyglobal();
  await sms.selectSMS();
  await sms.RecipientNumberField('Assigned To (User) Phone Number');
  await sms.selectTemplate('Custom Template');
  await sms.selectMergeField('Area');
  await sms.sendSMS();
  await sms.closeModal();
  await sms.openQuickReplyglobal();
  await emailsPage.QuickEmail();
  await emailModalPage.selectEmailType('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.openEmailFieldsDropdown();
  await emailModalPage.selectEmailField('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.selectTemplate('Allotment Letter For Your...');
  await emailModalPage.sendEmail();
  await emailsPage.Quickclose();  
  
}

