import { test, Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '@pages/auth/login';
import {
  clickMenu,
  Menulist,
  WhatsAppPage,
  SMSModalPage,
  EmailModalPage,
  EmailsPage,
  GlobalSearch,
} from '@pages/quick-actions/ActionPage';

let page: Page;
let context: BrowserContext;

async function goToLeads() {
  const closeSearch = page.locator('#quicksearchClose').first();
  if (await closeSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeSearch.click({ force: true });
  }
  await clickMenu(page);
  await Menulist(page, 'Leads');
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120000);
  context = await browser.newContext();
  page = await context.newPage();

  context.on('page', async (newPage) => {
    try {
      await newPage.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
      const url = newPage.url();
      if (
        !newPage.isClosed() &&
        (url === 'about:blank' ||
          url === 'chrome://new-tab-page/' ||
          url.startsWith('chrome://newtab'))
      ) {
        await newPage.close();
      }
    } catch {
      // ignore
    }
  });

  // await login(page, 'RSAUTOMATION', 'rsoft', 'RSoft@2026');
});

test.afterAll(async () => {
  await context?.close();
});

// WhatsApp tests

test('Send WhatsApp Task', async () => {
  test.setTimeout(300000);

  const whatsApp = new WhatsAppPage(page);
  const sms = new SMSModalPage(page);

  await goToLeads();
  await sms.openQuickaction();

  await whatsApp.selectWhatsapp();
  await whatsApp.Provider();
  await whatsApp.selectMobileField();
  await whatsApp.slectTemplate('Test Temp-25322132017416007');
  await whatsApp.AddField('Modified By ID');
  await whatsApp.Sendbutton();
  await whatsApp.closeModal();

  await sms.OpenRecord();

  const update = await page.locator('.updatesappend div.act-time').first().innerText();
  console.log('Update Captured date & Time: ' + update);

  const update1 = await page.locator('li.appendli .base-timeline-info').first().innerText();
  console.log('WhatsApp Message Triggered Update from list View : ' + update1);
});

test('Send WhatsApp Task in Detailview', async () => {
  test.setTimeout(300000);

  const whatsApp = new WhatsAppPage(page);
  const sms = new SMSModalPage(page);

  await goToLeads();
  await sms.OpenRecord();
  await sms.openQuickReplyDetail();

  await whatsApp.selectWhatsapp();
  await whatsApp.Provider();
  await whatsApp.selectMobileField();
  await whatsApp.slectTemplate('Test Temp-25322132017416007');
  await whatsApp.AddField('Modified By ID');
  await whatsApp.Sendbutton();
  await whatsApp.closeModal();

  await page.reload();

  const update = await page.locator('.updatesappend div.act-time').first().innerText();
  console.log('Update Captured date & Time: ' + update);

  const update2 = await page.locator('li.appendli .base-timeline-info').first().innerText();
  console.log('WhatsApp Message Triggered Update from Detail View: ' + update2);
});

test('Send WhatsApp Task from Submodule ListView', async () => {
  test.setTimeout(300000);

  const whatsApp = new WhatsAppPage(page);
  const sms = new SMSModalPage(page);

  await goToLeads();
  await sms.OpenRecord();
  await page.locator('[role="tab"]').nth(2).click();
  await sms.openQuickReplySub();

  await whatsApp.selectWhatsapp();
  await whatsApp.Provider();
  await whatsApp.selectMobileField();
  await whatsApp.slectTemplate('Test Temp-25322132017416007');
  await whatsApp.AddField('Modified By ID');
  await whatsApp.Sendbutton();
  await whatsApp.closeModal();

  await page.reload();

  const update = await page.locator('.updatesappend div.act-time').first().innerText();
  console.log('Update Captured date & Time: ' + update);

  const update1 = await page.locator('li.appendli .base-timeline-info').first().innerText();
  console.log('WhatsApp Message Triggered Update from Submodule ListView: ' + update1);
});

test('Send WhatsApp Task from Global Search', async () => {
  test.setTimeout(300000);

  const whatsApp = new WhatsAppPage(page);
  const search = new GlobalSearch(page);
  const sms = new SMSModalPage(page);

  await search.Searchicon();
  await search.selectModule('All Records');
  await search.globalsearchbar('9030358240');
  await search.Globalsearchicon();
  await search.selectmodulefromsearch('Leads');

  await sms.openQuickReplyglobal();

  await whatsApp.selectWhatsapp();
  await whatsApp.Provider();
  await whatsApp.selectMobileField();
  await whatsApp.slectTemplate('Test Temp-25322132017416007');
  await whatsApp.AddField('Modified By ID');
  await whatsApp.Sendbutton();
  await whatsApp.closeModal();

  await sms.openrecordfromglobalsearch('284');
});

// SMS tests

test('Send SMS from Listview', async () => {
  test.setTimeout(300000);

  const sms = new SMSModalPage(page);

  await goToLeads();
  await sms.openQuickaction();

  await sms.selectSMS();
  await sms.RecipientNumberField('Assigned To (User) Phone Number');
  await sms.selectTemplate('Custom Template');
  await sms.selectMergeField('Area');
  await sms.sendSMS();
  await sms.closeModal();

  await sms.OpenRecord();

  await page.waitForTimeout(1000);

  const update = await page.locator('li.appendli div').nth(1).innerText();
  console.log('Update Captured date & Time: ' + update);

  const update1 = await page.locator('li.appendli div').nth(2).innerText();
  console.log('SMS Triggered Update from List View: ' + update1);
});

test('Send SMS from Detailview', async () => {
  test.setTimeout(300000);

  const sms = new SMSModalPage(page);

  await goToLeads();
  await sms.OpenRecord();
  await sms.openQuickReplyDetail();

  await sms.selectSMS();
  await sms.RecipientNumberField('Assigned To (User) Phone Number');
  await sms.selectTemplate('Custom Template');
  await sms.selectMergeField('Assigned To');
  await sms.sendSMS();
  await sms.closeModal();

  await page.waitForTimeout(1000);

  const update = await page.locator('li.appendli div').nth(1).innerText();
  console.log('Update Captured date & Time: ' + update);

  const update1 = await page.locator('li.appendli div').nth(2).innerText();
  console.log('SMS Triggered Update from Detail View: ' + update1);
});

test('Send SMS from Submodal using ListView Quickaction', async () => {
  test.setTimeout(300000);

  const sms = new SMSModalPage(page);

  await goToLeads();
  await sms.OpenRecord();

  await page.locator('[role="tab"]').nth(2).click();
  await page.waitForLoadState('domcontentloaded');
  await sms.openQuickReplySub();

  await sms.selectSMS();
  await sms.RecipientNumberField('Assigned To (User) Phone Number');
  await sms.selectTemplate('Custom Template');
  await sms.selectMergeField('Assigned To');
  await sms.sendSMS();
  await sms.closeModal();

  await page.reload();

  await page.waitForTimeout(1000);

  const update = await page.locator('li.appendli div').nth(1).innerText();
  console.log('Update Captured date & Time: ' + update);

  const update1 = await page.locator('li.appendli div').nth(2).innerText();
  console.log('SMS Triggered Update from Submodule ListView: ' + update1);
});

test('Send SMS using GlobalSearch Quickaction', async () => {
  test.setTimeout(300000);

  const sms = new SMSModalPage(page);
  const search = new GlobalSearch(page);

  await search.Searchicon();
  await search.selectModule('All Records');
  await search.globalsearchbar('9030358240');
  await search.Globalsearchicon();
  await search.selectmodulefromsearch('Leads');

  await sms.openQuickReplyglobal();

  await sms.selectSMS();
  await sms.RecipientNumberField('Assigned To (User) Phone Number');
  await sms.selectTemplate('Custom Template');
  await sms.selectMergeField('Assigned To');
  await sms.sendSMS();
  await sms.closeModal();

  await sms.openrecordfromglobalsearch('284');
});

// Email tests

test('Send email to lead and verify', async () => {
  test.setTimeout(300000);

  // const leads1 = new LeadsPage1(page);
  const emailModalPage = new EmailModalPage(page);
  const emailsPage = new EmailsPage(page);
  const sms = new SMSModalPage(page);

  await goToLeads();
  await sms.openQuickaction();
  await emailsPage.QuickEmail();

  await emailModalPage.selectEmailType('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.openEmailFieldsDropdown();
  await emailModalPage.selectEmailField('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.selectTemplate('Allotment Letter For Your...');
  await emailModalPage.sendEmail();
  await emailsPage.Quickclose();

    await sms.OpenRecord();

  const update = await page.locator('li.appendli div').nth(1).innerText();
  console.log('Update Captured date & Time: ' + update);

  const update1 = await page.locator('li.appendli div').nth(2).innerText();
  console.log('Email Triggered Update from List View: ' + update1);
});

test('Send email from detail view', async () => {
  test.setTimeout(300000);

  // const leads1 = new LeadsPage1(page);
  const emailModalPage = new EmailModalPage(page);    
  const sms = new SMSModalPage(page);
  const emailsPage3 = new EmailsPage(page);

  await goToLeads();
  
  await sms.OpenRecord();
  await sms.openQuickReplyDetail();
  await emailModalPage.QuickEmail();

  await emailModalPage.selectEmailType('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.openEmailFieldsDropdown();
  await emailModalPage.selectEmailField('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.selectTemplate('Allotment Letter For Your...');
  await emailModalPage.sendEmail();
  await emailsPage3.Quickclose();

  await page.reload();

  const update = await page.locator('li.appendli div').nth(1).innerText();
  console.log('Update Captured date & Time: ' + update);

  const update1 = await page.locator('li.appendli div').nth(2).innerText();
  console.log('Email Triggered Update from Detail View: ' + update1);
});

test('Send email from submodule', async () => {
  test.setTimeout(300000);

  // const leads1 = new LeadsPage1(page);
  const emailModalPage = new EmailModalPage(page);
  const emailsPage1 = new EmailsPage(page);
  const sms = new SMSModalPage(page);   

  await goToLeads();
  await sms.OpenRecord();
  await page.locator('[role="tab"]').nth(2).click();
  await page.waitForLoadState('domcontentloaded');
  await sms.openQuickReplySub();
  await emailModalPage.QuickEmail();

  await emailModalPage.selectEmailType('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.openEmailFieldsDropdown();
  await emailModalPage.selectEmailField('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.selectTemplate('Allotment Letter For Your...');
  await emailModalPage.sendEmail();
  await emailsPage1.Quickclose();

  await page.reload();

  const update = await page.locator('li.appendli div').nth(1).innerText();
  console.log('Update Captured date & Time: ' + update);

  const update1 = await page.locator('li.appendli div').nth(2).innerText();
  console.log('Email Triggered Update from Submodule: ' + update1);
});

test('Send email from global search', async () => {
  test.setTimeout(300000);

  // const leads1 = new LeadsPage1(page);
  const emailModalPage = new EmailModalPage(page);
  const emailsPage2 = new EmailsPage(page);
  const search = new GlobalSearch(page);
  const sms = new SMSModalPage(page);

  await search.Searchicon();
  await search.selectModule('All Records');
  await search.globalsearchbar('9030358240');
  await search.Globalsearchicon();
  await search.selectmodulefromsearch('Leads');

  await sms.openQuickReplyglobal();
  await emailModalPage.QuickEmail();

  await emailModalPage.selectEmailType('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.openEmailFieldsDropdown();
  await emailModalPage.selectEmailField('Secondary Email ( rsoft Assigned To )');
  await emailModalPage.selectTemplate('Allotment Letter For Your...');
  await emailModalPage.sendEmail();
  await emailsPage2.Quickclose();

  await sms.openrecordfromglobalsearch('284');
  await page.reload();
});
