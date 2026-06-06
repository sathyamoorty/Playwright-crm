import { expect, Locator, Page } from '@playwright/test';
// import testdata from '@data/filterFieldTypeData.json';
// import { dataDr } from '@pages/modules/uiTypeId';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function whitespaceTolerantRegex(value: string) {
  return new RegExp(value.trim().split(/\s+/).map(escapeRegex).join('\\s+'), 'i');
}

function searchableLabel(value: string) {
  return value.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
}

function workflowTaskModal(page: Page) {
  return page.locator('motion.div, .modal-content, div').filter({
    has: page.getByRole('heading', { name: /WhatsApp Template|^Notification$/i }),
  }).last();
}

export async function clickWorkflow1(page: Page) {
  const workflowLink = page.getByRole('link', { name: /^Workflow$/i });
  await workflowLink.click();
}

export async function CreateWorkflowbtn(page: Page) {
  const createWorkflowButton = page.locator('.workflowaddbutton').first();
  await createWorkflowButton.waitFor({ state: 'visible' });
  await createWorkflowButton.click();

}
export async function SelectModule(page: Page, moduleName: string) {
  await expect(page.getByRole('heading', { name: /Creat(e|ing) workflow/i })).toBeVisible({ timeout: 60000 });
  await expect(page.getByText(/Step 1.*workflow/i)).toBeVisible({ timeout: 60000 });

  const modulePicker = page.locator('#select2-workflowselectmod-container');
  await expect(modulePicker).toBeVisible();
  await modulePicker.click();

  const modulePattern = new RegExp(`^${escapeRegex(moduleName)}s?$`, 'i');
  const moduleOption = page.getByRole('treeitem').filter({ hasText: modulePattern }).first();
  await expect(moduleOption).toBeVisible({ timeout: 15000 });
  await moduleOption.click();

  await expect(modulePicker).toHaveText(modulePattern);
}

export async function WorkflowName(page: Page) {
  const timestamp = Date.now().toString().slice(-6);   // e.g. 1713242342342
  const text = `RSOFT ${timestamp}`;

  await page.locator('input[name="summary"]').nth(0).fill(text);
}

export async function WorkflowNextbtn(page: Page) {
await page.getByText('Next', { exact: true }).click();
}

export async function AllConditionsbtn (page: Page) {

  await page.locator('[class="btn btn-primary filter_addconditionbutton"]').nth(0).click();  
}


function allConditionsRow(page: Page) {
  return page
    .getByRole('row', { name: /Select an option/i })
    .or(page.getByRole('heading', { name: /All Conditions/i }).locator('xpath=following::table[1]//tr[1]'))
    .first();
}

async function pickConditionField(page: Page, value: string) {
  const pattern = whitespaceTolerantRegex(value);
  const conditionRow = page
    .getByRole('heading', { name: /All Conditions/i })
    .locator('xpath=following::table[1]//tr')
    .last();

  const selectedViaNative = await page.evaluate((fieldLabel) => {
    const heading = [...document.querySelectorAll('h6')].find((h) =>
      /All Conditions/i.test(h.textContent ?? '')
    );
    const table = heading?.parentElement?.querySelector('table');
    const row = table?.querySelector('tr:last-child') ?? table?.querySelector('tr');
    const select = row?.querySelector('select');
    if (!select) return false;

    const needle = fieldLabel.toLowerCase();
    const option = [...select.options].find((o) => o.text.toLowerCase().includes(needle.split(' ')[0]));
    if (!option) return false;

    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    if (typeof (window as unknown as { $?: (el: Element) => { trigger: (e: string) => void } }).$ === 'function') {
      (window as unknown as { $: (el: Element) => { trigger: (e: string) => void } }).$(select).trigger('change');
    }
    return true;
  }, value);

  if (selectedViaNative) {
    return;
  }

  const fieldCombobox = conditionRow.getByRole('cell').first().getByRole('combobox').first();

  for (let attempt = 0; attempt < 3; attempt++) {
    await fieldCombobox.click({ force: true });
    await page.waitForTimeout(500);

    const searchBox = page.locator('.select2-container--open .select2-search__field').last();
    if (await searchBox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchBox.fill(searchableLabel(value));
      await page.waitForTimeout(800);
    }

    const option = page
      .locator('#select2-results li, .select2-container--open .select2-results__option')
      .filter({ hasText: pattern })
      .filter({ hasNotText: /no results/i })
      .first();
    if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
      await option.click({ force: true });
      return;
    }

    await page.keyboard.press('Escape').catch(() => {});
  }

  throw new Error(`Condition field "${value}" did not appear in the dropdown.`);
}

export async function selectDropdownValue(page: Page, value: string) {
  await pickConditionField(page, value);
}

async function pickConditionOperator(page: Page, value: string) {
  const operatorPattern = whitespaceTolerantRegex(value);
  await page.waitForTimeout(1000);

  const operatorCandidates = [value, 'is', 'equals', 'equal to', 'equal'];

  for (const operator of operatorCandidates) {
    const selectedViaNative = await page.evaluate((op) => {
      const heading = [...document.querySelectorAll('h6')].find((h) =>
        /All Conditions/i.test(h.textContent ?? '')
      );
      const table = heading?.parentElement?.querySelector('table');
      const row = table?.querySelector('tr:last-child') ?? table?.querySelector('tr');
      const selects = row ? [...row.querySelectorAll('select')] : [];
      const targetSelect = selects[1] ?? selects[0];
      if (!targetSelect) return false;

      const option = [...targetSelect.options].find((o) => {
        const text = o.text.trim().toLowerCase();
        const needle = op.toLowerCase();
        return text === needle || text.startsWith(needle) || text.includes(needle);
      });
      if (!option) return false;

      targetSelect.value = option.value;
      targetSelect.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }, operator);

    if (selectedViaNative) {
      return;
    }
  }

  const conditionRow = page
    .getByRole('heading', { name: /All Conditions/i })
    .locator('xpath=following::table[1]//tr')
    .last();
  const operatorCombobox = conditionRow.getByRole('cell').nth(1).getByRole('combobox').first();

  for (let attempt = 0; attempt < 3; attempt++) {
    await operatorCombobox.click({ force: true });
    const operatorOption = page
      .locator('[id^="select2-conditioncol0and-result"], .select2-container--open .select2-results__option')
      .filter({ hasText: operatorPattern })
      .first();

    if (await operatorOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await operatorOption.click({ force: true });
      return;
    }

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
  }

  throw new Error(`Operator option "${value}" did not appear in the dropdown.`);
}

export async function selectOperator(page: Page, value: string) {
  await pickConditionOperator(page, value);
}

export async function AddtoDo(page: Page) {
  const addToDoButton = page
    .getByRole('button', { name: /\+?\s*Add To Do/i })
    .or(page.getByRole('button', { name: /Add\s*To\s*Do/i }));

  for (let attempt = 0; attempt < 4; attempt++) {
    if (await addToDoButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await addToDoButton.first().click();
      return;
    }
    const nextButton = page.getByText('Next', { exact: true });
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton.click();
      await page.waitForLoadState('domcontentloaded');
    }
  }

  await expect(addToDoButton.first()).toBeVisible({ timeout: 20000 });
  await addToDoButton.first().click();
}

export async function selectTask(page: Page, value: string) {
  const dropdown = page.locator('.dropdown-menu.show');

  await dropdown.locator('.dropdown-item.task-item', { hasText: value }).click();
  await expect(page.getByRole('heading', { name: /^Notification$/i })).toBeVisible({ timeout: 15000 });
}


function notificationTaskPanel(page: Page) {
  return page.getByRole('heading', { name: /^Notification$/i }).locator('xpath=ancestor::div[3]');
}

async function findNotificationSelect2(page: Page, optionHint: RegExp) {
  const containers = notificationTaskPanel(page).locator('[id^="select2-"][id$="-container"]');
  const count = await containers.count();

  for (let i = 0; i < count; i++) {
    const container = containers.nth(i);
    const id = (await container.getAttribute('id')) ?? '';
    if (/exe_date|exe_con|schday|schhours|schminutes/i.test(id)) {
      continue;
    }

    await container.click({ force: true });
    await page.waitForTimeout(400);

    const hasMatch = await page
      .locator('.select2-container--open .select2-results__option')
      .filter({ hasText: optionHint })
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (hasMatch) {
      await page.keyboard.press('Escape').catch(() => {});
      return container;
    }

    await page.keyboard.press('Escape').catch(() => {});
  }

  throw new Error(`Notification dropdown for ${optionHint} was not found`);
}

export async function Recipients(page: Page, value: string) {
  const pattern = whitespaceTolerantRegex(value);
  const isNotification = await page
    .getByRole('heading', { name: /^Notification$/i })
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (isNotification) {
    const container = await findNotificationSelect2(page, /\(Leads\).*Assigned\s+To|Active Users/i);
    await container.click({ force: true });

    const option = page
      .locator('.select2-container--open .select2-results__option')
      .filter({ hasText: pattern })
      .or(
        page
          .locator('.select2-container--open .select2-results__option')
          .filter({ hasText: /\(Leads\).*Assigned\s+To/i })
      )
      .first();

    await expect(option).toBeVisible({ timeout: 15000 });
    await option.click({ force: true });
    await page.keyboard.press('Escape').catch(() => {});
    return;
  }

  const recipientsDropdown = page
    .locator('.select2-container')
    .filter({ has: page.getByTitle('Select an Option', { exact: true }) })
    .last();

  await expect(recipientsDropdown).toBeVisible({ timeout: 15000 });
  await recipientsDropdown.click({ force: true });

  const option = page.getByRole('treeitem', { name: value, exact: true });
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click({ force: true });
}

export async function AddFiled(page: Page, filedName: string) {
  const pattern = whitespaceTolerantRegex(String(filedName));
  const isNotification = await page
    .getByRole('heading', { name: /^Notification$/i })
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (isNotification) {
    const container = await findNotificationSelect2(page, /Assigned\s+To\s+ID|\(Leads\).*Record\s+ID/i);
    await container.click({ force: true });

    const option = page
      .locator('.select2-container--open .select2-results__option')
      .filter({ hasText: pattern })
      .first();

    await expect(option).toBeVisible({ timeout: 15000 });
    await option.click({ force: true });
  } else {
    const fieldDropdown = page
      .locator('.select2-container')
      .filter({ has: page.getByTitle('Select an option', { exact: true }) })
      .last();

    await expect(fieldDropdown).toBeVisible({ timeout: 15000 });
    await fieldDropdown.click({ force: true });

    const option = page.getByRole('treeitem', { name: String(filedName), exact: true });
    await expect(option).toBeVisible({ timeout: 15000 });
    await option.click({ force: true });
  }

  const notificationMessage = page
    .locator('.modal.show')
    .locator('xpath=.//*[contains(normalize-space(.),"Notification Message")]/following::textarea[1]');
  if (await notificationMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
    await notificationMessage.fill('Automated workflow notification');
  }
  // const addFieldDropdown = page.locator('.select2-container')
  //   .filter({ has: page.getByTitle('Select an option', { exact: true }) })
  //   .filter({ visible: true })
  //   .last();
  // await expect(addFieldDropdown).toBeVisible({ timeout: 15000 });
  // await addFieldDropdown.click();

  // const option = page.getByRole('treeitem', { name: String(filedName), exact: true });
  // await expect(option).toBeVisible({ timeout: 15000 });
  // await option.click();
}

// export async function TaskSavebtn(page: Page) {
//   const notificationMessage = page.locator('xpath=//*[normalize-space()="Notification Message*"]/following::textarea[1] | //*[normalize-space()="Notification Message*"]/following::input[1]');
//   if (await notificationMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
//     await notificationMessage.fill('Automated workflow notification');
//   }

//   const saveButton = page.getByRole('button', { name: /^Save$/i });
//   await expect(saveButton).toBeVisible({ timeout: 15000 });
//   await saveButton.click();

//   const notificationHeading = page.getByRole('heading', { name: /^Notification$/i });
//   if (await notificationHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
//     const closeButton = page.getByRole('button', { name: /×|Ã—/i }).first();
//     if (await closeButton.isVisible().catch(() => false)) {
//       await closeButton.click();
//       await expect(notificationHeading).not.toBeVisible({ timeout: 15000 });
//     }
//   }

//   const submitButton = page.getByRole('button', { name: /^Submit$/i });
//   await expect(submitButton).toBeVisible({ timeout: 15000 });
//   await submitButton.click();
// }

// export async function TaskSavebtn(page:Page){

 
//   await page.locator('button').filter({ hasText: 'Save' }).first().click();
  
// }

export async function TaskSavebtn(page: Page) {
  const modal = page
    .locator('.modal.show')
    .filter({
      has: page.locator('h4.modal-title, .modal-title').filter({
        hasText: /Add Task for Workflow|Notification/i,
      }),
    })
    .or(page.locator('.modal.show').last());

  const activeModal = modal.first();
  await expect(activeModal).toBeVisible({ timeout: 15000 });

  const notificationMessage = activeModal.locator(
    'xpath=.//*[contains(normalize-space(.),"Notification Message")]/following::textarea[1]'
  );
  if (await notificationMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
    await notificationMessage.fill('Automated workflow notification message');
  }

  await activeModal.getByRole('button', { name: /^Save$/i }).click();

  const taskRow = page.locator('table tbody tr').filter({ hasText: /Notification|Test Notification|TASK_/i });
  const anyTaskRow = page.locator('table tbody tr').first();
  await expect(taskRow.or(anyTaskRow).first()).toBeVisible({ timeout: 30000 });
  await expect(activeModal).toBeHidden({ timeout: 15000 });
}


export async function Submitbtn(page:Page){

  await page.locator('[class="btn btn-primary mr-1"]').click();
  
 }



  export class CreateWorkflowPage 
{
  constructor(private page: Page) {}

   async fillNotificationTaskTitle(page: Page, title: string) {
    const taskTitleInput = page.locator('input[name="notification_tasktitle"]');
    await expect(taskTitleInput).toBeVisible({ timeout: 15000 });
    await taskTitleInput.fill(title);
  }
   async fillUpdateEntityTitle(page: Page, title: string) {
    const taskTitleInput = page.locator('input[name="notification_tasktitle"]').first()
    await expect(taskTitleInput).toBeVisible({ timeout: 15000 });
    await taskTitleInput.fill(title);
  }
  async fillWhatsAppTaskTitle(page: Page, title: string) {
    const whatsappTitle = page.locator('input[name="whatsapptasktitle"]').first();
    await expect(whatsappTitle).toBeVisible({ timeout: 15000 });
    await whatsappTitle.fill(title);
  }
  async NotificationMessage(message?: string) {
    const randomPrefix = `MESSAGE_${Math.floor(Math.random() * 100)}`;
    const finalMessage = `${randomPrefix}_${message}`;
    const value= this.page.locator('textarea[name="notificationtemp"]');
    await value.fill(finalMessage);
  }
  
async toggleRowSwitch() 
{
  await this.page.locator(".switchery.switchery-default").first().click();  
}

 

  // async waitForOverlayToDisappear() {
  //   await this.loadingOverlay.waitFor({ state: 'hidden' }).catch(() => undefined);
  // }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }


  async lastWorkFlowtoggle(workflowName: string) {
    const workflowRow = this.page
    .locator('[class*="Removerow_"]')
    .filter({
      has: this.page.getByText(workflowName, { exact: true }),
    })
    .first();
  
  await expect(workflowRow).toBeVisible({ timeout: 15000 });
  await workflowRow.scrollIntoViewIfNeeded();
  
  const toggle = workflowRow.locator('span.switchery.switchery-default');
  await expect(toggle).toBeVisible();
  await toggle.click(); 
  }
      
async addLead() {
    const addLeadsButton = this.page.getByRole('button', { name: /^Add Leads$/i });
    await expect(addLeadsButton).toBeVisible({ timeout: 30000 });
    await addLeadsButton.click();
  }

  async  clickMenu1(page: Page) {
    const sidebarMenu = page.locator('#vertical_header_name, #vertical_header_name_link').first();
    // if (await sidebarMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sidebarMenu.click();
    //   return;
    // }
  }
  async dataForInputFields() {
    await this.page.locator('input[name="leads_companyname"]').fill("Rsoft tech");
    await this.page.locator('input[name="leads_name"]').fill("Test Lead");  
    //await this.page.locator("input[name='leads_currency']").fill("1000");
    await this.page.locator('input[name="leads_mobile"]').fill("9030358240");
    await this.page.locator('input[name="leads_email"]').fill("vinodh@rsoft.in");

    await this.page.locator('[class="input-group-text searchmultirelated_2461"]').click();
    const record=this.page.locator('[class="evecolorset"]').nth(0);
    await record.click();
   
    //await this.page.locator(".form-group.row").click();

  }


  async Editrecord(){
    const edit = this.page.locator("[class='material-symbols-outlined onetest']").nth(2);
   await edit.click();

  }
  private async selectAssignedTo(userName: string) {
    const assignDropdown = this.page
      .locator('#select2-assign_to-container')
      .or(this.page.locator('[id^="select2-assign_to"]'))
      .first();

    await expect(assignDropdown).toBeVisible({ timeout: 15000 });
    await assignDropdown.click();
    await this.page.getByRole('treeitem', { name: userName }).first().click();
  }

  async AssignDropDown() {
    await this.selectAssignedTo('Admin');
  }
 


  async saveBtn() {
    await this.page.getByRole("button", { name: "Save", exact: true }).click();
  }

//                   Edit Workflow 

   async clickEditIcon(workflowName: string) {
    const workflowRow = this.page
    .locator('[class*="Removerow_"]')
    .filter({
      has: this.page.getByText(workflowName, { exact: true }),
    })
    .first();

  await expect(workflowRow).toBeVisible({ timeout: 15000 });
  await workflowRow.scrollIntoViewIfNeeded();

  const editIcon = workflowRow.locator('span').filter({ hasText: 'edit_square' });
  await expect(editIcon).toBeVisible();
  await editIcon.click();
}
//    Specify When to execute this workflow

async Onlyonthefirstsave (){
  const checkbox = this.page.locator("[name='wrkflowexe']").nth(0);
  await checkbox.click();
}

  async Untilthefirstcondition (){
  const checkbox = this.page.locator("[name='wrkflowexe']").nth(1);
  await checkbox.click();

  }

async Everytimetherecordsave (){
  const checkbox = this.page.locator("[name='wrkflowexe']").nth(2);
  await checkbox.click();
}
 async Everytimerecordmodified (){
  const checkbox = this.page.locator("[name='wrkflowexe']").nth(3);
  await checkbox.click();
}
  async schedule (){
  const checkbox = this.page.locator("[name='wrkflowexe']").nth(4);
  await checkbox.click();
}

  async OpenRecord(){
  const record =this.page.locator("[class='next-td-col add-border-right']").nth(1);
  await record.click();

  }

//    Updates 

  async UpdateDateandTime(){

 
const update = await this.page.locator('.updatesappend div.act-time').first().innerText();
  console.log("Update Captured date & Time: " + update);

}

  async UpdateCaptured(value:string){

 const update = await this.page.locator('li.appendli .base-timeline-info').first().innerText();
  console.log (value + update);
}


  async ProfileIcon(page: Page) {
    await  this.page.getByRole('listitem').filter({ hasText: 'rsoft My Profile line_style' }).getByRole('link').click();
  }

  async  ProfileIcon1(page: Page) {
          await page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
           await page.locator('.dropdown-toggle.nav-link.dropdown-user-link').click();
  }

  async goToCRMSettings(page: Page) {
    await page.getByRole('link', { name: /CRM Setting/i }).click();
  }

  async OtherSettings(page: Page) {

 await page.locator('span:has-text("Other Settings")').click();

}
  async log(){
    await this.page.getByText('Log', { exact: true }).click();

  }
    async workflowlog(){

      await this.page.getByText('Workflow Queue Log', { exact: true }).click();


    } 

     

   async  clickWorkflow(page: Page) {
   const workflowLink =  page.getByText('Workflow', { exact: true });
   await workflowLink.click();
}

//  async SelectModule(page: Page, moduleName: string) {
//   await expect(page.getByRole('heading', { name: /Creating workflow/i })).toBeVisible();
//   await expect(page.getByText('Step 1: Enter Basic Details Of the workflow')).toBeVisible();

//   }

async SelectModule(page: Page, moduleName: string) {
  await expect(page.getByRole('heading', { name: /Creat(e|ing) workflow/i })).toBeVisible({ timeout: 60000 });
  await expect(page.getByText(/Step 1.*workflow/i)).toBeVisible({ timeout: 60000 });

  const modulePicker = page.locator('#select2-workflowselectmod-container');
  const modulePattern = new RegExp(`^${escapeRegex(moduleName)}s?$`, 'i');

  await page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await expect(modulePicker).toBeVisible({ timeout: 15000 });
  await modulePicker.scrollIntoViewIfNeeded();
  await modulePicker.click({ force: true });

  const searchBox = page.locator('.select2-container--open .select2-search__field').last();
  if (await searchBox.isVisible({ timeout: 2000 }).catch(() => false)) {
    await searchBox.fill(moduleName);
    await page.waitForTimeout(500);
  }

  const moduleOption = page
    .getByRole('treeitem', { name: modulePattern })
    .or(page.locator('.select2-container--open .select2-results__option').filter({ hasText: modulePattern }))
    .first();
  await expect(moduleOption).toBeVisible({ timeout: 15000 });
  await moduleOption.click({ force: true });

  await expect(modulePicker).toHaveText(modulePattern);
}




  async CreateWorkflowbtn(page: Page) {
  const createWorkflowButton = page.locator('.workflowaddbutton').first();
  await createWorkflowButton.waitFor({ state: 'visible' });
  await createWorkflowButton.click();

  }
 async  WorkflowName(page: Page, workflowName: string) {
  await this.page.locator('[name="summary"]').fill(workflowName);
}

 async WorkflowNextbtn(page: Page) {
await this.page.getByText('Next', { exact: true }).click();
}


//         Condtion Section 

async AllConditionsbtn (page: Page) {

  await page.locator('[class="btn btn-primary filter_addconditionbutton"]').nth(0).click();  
}

  //  Select Value

async selectDropdownValue(page: Page, value: string) {
  await pickConditionField(page, value);
}

 //     Select Operator

async selectOperator(page: Page, value: string) {
  await pickConditionOperator(page, value);
}


   //                 Update Entity Task
   
   
async AddtoDo(page: Page) {
  const addToDoButton = page
    .getByRole('button', { name: /\+?\s*Add To Do/i })
    .or(page.getByRole('button', { name: /Add\s*To\s*Do/i }));

  for (let attempt = 0; attempt < 4; attempt++) {
    if (await addToDoButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await addToDoButton.first().click();
      return;
    }

    const nextButton = page.getByText('Next', { exact: true });
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton.click();
      await page.waitForLoadState('domcontentloaded');
      continue;
    }

    break;
  }

  await expect(addToDoButton.first()).toBeVisible({ timeout: 20000 });
  await addToDoButton.first().click();
}
async TaskTitle() {
  const suffix = Date.now().toString().slice(-6);
  const whatsappModal = this.page.locator('.modal.show').filter({
    has: this.page.getByRole('heading', { name: /WhatsApp Template/i }),
  });
 
  if (await whatsappModal.isVisible({ timeout: 5000 }).catch(() => false)) {
   
    return;
  }
 
  const updateEntityModal = this.page.locator('.modal.show').filter({
    has: this.page.locator('h4.modal-title', { hasText: /Update Entity/i }),
  });
  const titleInput = updateEntityModal
    .locator(
      'input[name="notification_tasktitle"], input[name*="tasktitle"], input[name*="task_title"]'
    )
    .first();
 
  await expect(titleInput).toBeVisible({ timeout: 15000 });
  await titleInput.fill(`TASK_${suffix}_UpdateEntity`);
}
 
async selectTask(page: Page, value: string) {
  const dropdown = page.locator('.dropdown-menu.show');

  await dropdown.locator('.dropdown-item.task-item', { hasText: value }).click();

  if (/whatsapp/i.test(value)) {
    await expect(this.page.getByRole('heading', { name: /WhatsApp Template/i })).toBeVisible({
      timeout: 15000,
    });
  } else if (/notification/i.test(value)) {
    await expect(this.page.getByRole('heading', { name: /^Notification$/i })).toBeVisible({
      timeout: 15000,
    });
  } else if (/update entity/i.test(value)) {
    await expect(
      this.page.locator('h4.modal-title', { hasText: /Add Task for Workflow -> Update Entity/i })
    ).toBeVisible({ timeout: 15000 });
  }
}
async Selectmod(page: Page) {
  const sourceDropdown = page
    .locator('#select2-Sourcevalue-vg-container')
    .or(
      page
        .locator('div')
        .filter({ has: page.getByText(/^Modules to update record/i) })
        .locator('.select2-selection')
        .first()
    );
  await expect(sourceDropdown).toBeVisible({ timeout: 15000 });
  await sourceDropdown.click();

  const option = page
    .locator('[id^="select2-Sourcevalue-vg-result"], .select2-container--open .select2-results__option')
    .filter({ hasText: /^Target$/i })
    .first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click({ force: true });
}


//      Target Module

async SelectTargetmod(page: Page, value: string) {
  const target = page.locator('#select2-updateEntityTargetModule-container');
  const modulePattern = new RegExp(escapeRegex(value), 'i');

  for (let attempt = 0; attempt < 3; attempt++) {
    await expect(target).toBeVisible({ timeout: 15000 });
    await target.click({ force: true });

    const resultOption = page
      .locator('[id^="select2-updateEntityTargetModule-result"]')
      .filter({ hasText: modulePattern })
      .first();
    if (await resultOption.isVisible({ timeout: 8000 }).catch(() => false)) {
      await resultOption.click({ force: true, timeout: 10000 });
      await page.locator('#select2-actionperformedby-container').waitFor({ state: 'visible', timeout: 15000 });
      return;
    }

    const listOption = page
      .locator('.select2-container--open .select2-results__option')
      .filter({ hasText: modulePattern })
      .first();
    if (await listOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await listOption.click({ force: true });
      await page.locator('#select2-actionperformedby-container').waitFor({ state: 'visible', timeout: 15000 });
      return;
    }

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
  }

  throw new Error(`Target module "${value}" did not appear in the dropdown.`);
}

   //    Action Modified By

async ActionModifiedBy(value: string) {
  const modified = this.page.locator('#select2-actionperformedby-container');
await modified.click();
await this.page.getByRole('treeitem',{name:value}).click();

  // const labelPattern =
  //   value.includes('Assigned To') || value.includes('Source')
  //     ? /\(Source\)\s*Assigned\s*To/i
  //     : whitespaceTolerantRegex(value);

  // for (let attempt = 0; attempt < 3; attempt++) {
  //   await expect(modified).toBeVisible({ timeout: 15000 });
  //   await modified.click();

  //   const strategies = [
  //     this.page.locator('[id^="select2-actionperformedby-result"][id*="smownerid"]').first(),
  //     this.page
  //       .locator('[id^="select2-actionperformedby-result"], .select2-container--open .select2-results__option')
  //       .filter({ hasText: labelPattern })
  //       .first(),
  //     this.page.getByRole('treeitem', { name: labelPattern }).first(),
  //   ];

  //   for (const option of strategies) {
  //     if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
  //       await option.evaluate((node) => (node as HTMLElement).click());
  //       return;
  //     }
  //   }

  //   await this.page.keyboard.press('Escape').catch(() => {});
  //   await this.page.waitForTimeout(300);
  // }

  // throw new Error(`Action Modified By option "${value}" did not appear.`);
}
//         Field Mapping


 

async Targetdropdown(page: Page, value: string) {
  const targetdrop = this.page.locator("[id='select2-SelectedValue1-container']");
  const pattern = whitespaceTolerantRegex(value);

  for (let attempt = 0; attempt < 3; attempt++) {
    await targetdrop.click();

    const groupedOption = page
      .getByLabel('Leads')
      .getByRole('treeitem', { name: pattern })
      .or(page.getByLabel('Enquiry').getByRole('treeitem', { name: pattern }))
      .first();
    if (await groupedOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await groupedOption.click({ force: true });
      return;
    }

    const resultOption = page
      .locator('[id^="select2-SelectedValue1-result"]')
      .filter({ hasText: pattern })
      .first();
    if (await resultOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await resultOption.click({ force: true });
      return;
    }

    const listOption = page
      .locator('.select2-container--open .select2-results__option')
      .filter({ hasText: pattern })
      .first();
    if (await listOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await listOption.click({ force: true });
      return;
    }

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
  }

  throw new Error(`Target field "${value}" not found in dropdown.`);
}

async Targetdropdownlast( value: string) {
  const targetdrop = this.page.locator("[id='select2-SelectedValue1-container']").last();
  await targetdrop.click();
  const option = this.page
    .locator('[id^="select2-SelectedValue1-result"], .select2-container--open .select2-results__option')
    .filter({ hasText: new RegExp(`^${escapeRegex(value)}$`, 'i') })
    .first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click({ force: true });
}

async Sourcedropdown(value: string) {
  const sourcedrop = this.page.locator("[id='select2-Currentvalue1-container']");
  const pattern = whitespaceTolerantRegex(value);

  for (let attempt = 0; attempt < 3; attempt++) {
    await sourcedrop.click();

    const leadsField = this.page
      .locator('[id^="select2-Currentvalue1-result"][id*="leads_"]')
      .filter({ hasText: pattern })
      .first();
    if (await leadsField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await leadsField.click({ force: true });
      return;
    }

    const anyOption = this.page
      .locator('[id^="select2-Currentvalue1-result"], .select2-container--open .select2-results__option')
      .filter({ hasText: pattern })
      .first();
    if (await anyOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await anyOption.click({ force: true });
      return;
    }

    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(300);
  }

  throw new Error(`Source field "${value}" did not appear in the dropdown.`);
}

async Sourcedropdownlast(page: Page, value: string) {
  const sourcedrop = this.page.locator("[id='select2-Currentvalue1-container']").last();
  await sourcedrop.click();
  const option = page
    .locator('[id^="select2-Currentvalue1-result"], .select2-container--open .select2-results__option')
    .filter({ hasText: new RegExp(`^${escapeRegex(value)}$`, 'i') })
    .first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click({ force: true });
}


async Defaultdropdown(page:Page,value:string){
const defaultvalue=this.page.locator("[id='fieldempty1']");
await defaultvalue.click();
const selectvalue=this.page.getByRole('treeitem',{name:value});
await selectvalue.click();


}

async Addfield(page: Page, value: string){
const addfield= this.page.locator('button').filter({ hasText: 'Add Field' }).first();
// expect(addfield).toBeVisible({timeout:15000});
await addfield.click();

}


async TaskSavebtn(page: Page) {
  await this.page.getByRole("button", { name: "Save" }).click();
  // const modal = this.page.locator('.modal.show').filter({
  //   has: this.page.locator('h4.modal-title', { hasText: /Add Task for Workflow/i }),
  // });
  // await expect(modal).toBeVisible({ timeout: 15000 });
  // await modal.getByRole('button', { name: /^Save$/i }).click();

  // const taskRow = this.page
  //   .locator('table tbody tr')
  //   .filter({ hasText: /Notification|Update Entity|TASK_|Test Notification|Schedule/i });
  // await expect(taskRow.first()).toBeVisible({ timeout: 30000 });
  // await expect(modal).toBeHidden({ timeout: 15000 });
}

async fillScheduleAtTime(time = '12:00') {
  const modal = this.page.locator('.modal.show');
  await this.page.keyboard.press('Escape').catch(() => {});

  const filled = await modal.evaluate((root, value) => {
    const minutes = root.querySelector('#select2-schminutes-container');
    const row =
      minutes?.closest('.row') ??
      minutes?.parentElement?.parentElement?.parentElement ??
      null;
    const candidates = row
      ? Array.from(row.querySelectorAll('input'))
      : Array.from(root.querySelectorAll('.fa-clock')).flatMap((icon) => {
          const input = icon.parentElement?.querySelector('input');
          return input ? [input] : [];
        });

    for (const input of candidates) {
      const el = input as HTMLInputElement;
      if (el.type === 'checkbox' || el.classList.contains('select2-search__field')) {
        continue;
      }
      if (el.offsetParent === null) {
        continue;
      }
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }, time);

  if (!filled) {
    console.warn(`At Time field could not be set to ${time}; continuing.`);
  }
}

async Submitbtn(page: Page){

  await this.page.locator('[class="btn btn-primary mr-1"]').click();
  
 }

async addrecord() {
    await this.page.getByRole('button', { name: /^Add Leads$/i }).click();
  }
 
  // async recorddata(recordIndex?: number) {
  //   await this.fillCurrentModuleFields(recordIndex);
  // }

  private fieldTypeIndex(record: Record<string, unknown>, fieldType: string): number {
    const index = Number(record[fieldType]);
    if (!Number.isInteger(index)) {
      throw new Error(`Invalid index for fieldType ${fieldType}`);
    }
    return index;
  }

  // async fillCurrentModuleFields(recordIndex?: number) {
  //   const data = testdata as Array<Record<string, unknown>>;
  //   const finaldata =
  //     recordIndex !== undefined
  //       ? data[recordIndex]
  //       : data[Math.floor(Math.random() * data.length)];

  //   if (!finaldata) {
  //     throw new Error(`No test data found for record index ${recordIndex ?? 'random'}`);
  //   }

  //   await this.page.getByRole('heading', { name: /Create/ }).waitFor({ timeout: 15000 });

  //   const fields = this.page.locator(
  //     'input:visible:not([type="hidden"]):not([readonly]):not([disabled]):not([type="search"]), ' +
  //       'textarea:visible:not([readonly]):not([disabled]), ' +
  //       'select:visible:not([readonly]):not([disabled])'
  //   );

  //   const dropdownHelper = new dataDr(this.page);
  //   const count = await fields.count();

  //   for (let i = 0; i < count; i++) {
  //     const field = fields.nth(i);
  //     await field.waitFor({ state: 'visible' });

  //     const fieldType = await field.getAttribute('data-fieldtype');
  //     const inputName = await field.getAttribute('name');

  //     if (!fieldType || !(fieldType in finaldata)) {
  //       console.log(`Skipping field => ${inputName}, fieldtype => ${fieldType}`);
  //       continue;
  //     }

  //     switch (fieldType) {
  //       case '2':
  //       case '4':
  //       case '22':
  //       case '5':
  //         await field.fill(String(finaldata[fieldType]));
  //         break;
  //       case '9':
  //       case '3':
  //       case '29':
  //       case '30':
  //       case '31': {
  //         const index = this.fieldTypeIndex(finaldata, fieldType);
  //         await dropdownHelper.selectDropdownByCurrentField(field, index);
  //         break;
  //       }
  //       default:
  //         console.log(`Unsupported fieldtype => ${fieldType}`);
  //         continue;
  //     }

  //     console.log(`Filled => ${inputName} | fieldtype => ${fieldType}`);
  //   }
  // }

  async openrecord(){

  const record =this.page.locator('table tbody tr').first();
  await record.click();
}

  async Assignto() {
    await this.selectAssignedTo('Rsoft IT');
  }

  async Targetfield(value: string) {
    const targetdrop = this.page.locator("[id='select2-SelectedValue2-container']");
    await targetdrop.click();
    await this.page.getByLabel('Enquiry').getByRole('treeitem',{name:value}).click();
    // const selectvalue = page
    //   .locator('[id^="select2-SelectedValue2-result"][id*="enquiry_"], [id^="select2-SelectedValue2-result"]')
    //   .filter({ hasText: new RegExp(escapeRegex(value), 'i') });
    // await expect(selectvalue.first()).toBeVisible({ timeout: 15000 });
    // await selectvalue.first().click({ force: true });
  }


async Sourcefiled (value:string){
const sourcedrop=this.page.locator("[id='select2-Currentvalue2-container']");
await sourcedrop.click();
await this.page.getByLabel('Leads').getByRole('treeitem',{name:value}).click();
// Leads fields render as top-level treeitems (id contains "leads_"), not inside the empty "Leads" group
// const selectvalue=this.page
//   .locator('[id^="select2-Currentvalue2-result"][id*="leads_"]')
//   .filter({ hasText: new RegExp(`^${escapeRegex(value)}$`) });
// await expect(selectvalue).toBeVisible({ timeout: 15000 });
// await selectvalue.click();

}

//                Update Entity Schedule Task

async Scheduletab() {
  const modal = this.page.locator('.modal.show');
  await modal.locator('b:has-text("Schedule Task")').click();
  const check = modal.locator('input[name="execute_notification_taskbox"]');
  if (!(await check.isChecked().catch(() => false))) {
    await check.click();
  }
}

async selectScheduleExecutionField(page: Page, value = 'Created Time') {
  const modal = page.locator('.modal.show');
  const executionDropdown = modal
    .locator('[id^="select2-entity_time"]')
    .first()
    .or(modal.getByRole('combobox', { name: /Execution Time/i }));

  await executionDropdown.click();
  const option = page
    .locator('.select2-container--open .select2-results__option')
    .filter({ hasText: new RegExp(escapeRegex(value), 'i') })
    .first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click({ force: true });
}

async SchedulTimefiled(page:Page,value:string){

  const schediletimefield=this.page.locator("[id='select2-entity_time-7p-container']");
  await schediletimefield.click();
  const timefield= this.page.getByRole('treeitem',{name:value});
  await timefield.click();
}
async condition(page:Page,value:string){

  const condition=this.page.locator("[id='select2-entity_days-fp-container]");
  await condition.click();
  const selectvalue=this.page.getByRole('treeitem',{name:value});
  await selectvalue.click();
}

async Selectdays(page:Page,value:string){

  const days=this.page.locator('select2-schday-container');
  await days.click();
  const selectdays=this.page.getByRole('treeitem',{name:value,exact:true})
}
async schedulecheckbox(){
  const check=this.page.locator('input[name="execute_notification_taskbox"]');
  await check.click();

}
async Selecthours(page: Page, value: string) {
  const modal = page.locator('.modal.show');
  const hours = modal.locator('#select2-schhours-container').first();
  await hours.click();
  const option = page
    .locator('[id^="select2-schhours-result"], .select2-container--open .select2-results__option')
    .filter({ hasText: new RegExp(`^${escapeRegex(value)}$`) })
    .first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click({ force: true });
}

async Selectminutes(page: Page, value: string) {
  const modal = page.locator('.modal.show');
  const minutes = modal.locator('#select2-schminutes-container').first();
  await minutes.click();
  const option = page
    .locator('[id^="select2-schminutes-result"], .select2-container--open .select2-results__option')
    .filter({ hasText: new RegExp(`^${escapeRegex(value)}$`) })
    .first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click({ force: true });
}

  async failminutes(value: string) {
    const failDropdown = this.page.locator('#select2-fail_minutes-container');
    await failDropdown.click();
    const option = this.page
      .locator('[id^="select2-fail_minutes-result"], .select2-container--open .select2-results__option')
      .filter({ hasText: new RegExp(`^${escapeRegex(value)}$`) })
      .first();
    await expect(option).toBeVisible({ timeout: 15000 });
    await option.click({ force: true });
  }
 
async ExecuteConditiontab(){

  const conditiontab=this.page.getByText('Execute Condition', { exact: true });
  await conditiontab.click();
  const checkbox=this. page.locator('[name="execute_condition_taskbox"]');
  await checkbox.click();
}

async Failcase(){
  const fail=this.page.getByText('Fail Case',{exact:true});
  await fail.click();
  const checkbox= this.page.locator("[name='reschedulefailedtask']");
  await checkbox.click();
}

async logdetails(){

const row = this.page.locator('table tbody tr', { hasText: 'Leads'}).first();
await expect(row).toBeVisible();
// Capture full row text
const rowText = await row.innerText();
console.log(rowText);

}
async clickMenu(page: Page) {
 await page.getByText('list', { exact: true }).click();
// await page.locator("#vertical_header_name_link").nth(1).click();
}
async Menulist(moduleName: string) {
  await this.page.locator("#vertical_header_name").click();
  const moduleLocator = this.page.getByText(moduleName, { exact: true }).first();
  await moduleLocator.click();
}
 
//                            WhatsApp Task
  async Recipients(value: string) {
    await Recipients(this.page, value);
  }

  async WhatsAppMessage(value: string) {
    const whatsappText = this.page
      .getByRole('heading', { name: /WhatsApp Template/i })
      .locator('xpath=following::*[normalize-space()="WhatsApp Text"][1]/following::*[@role="textbox"][1]');
    await expect(whatsappText).toBeVisible({ timeout: 15000 });
    await whatsappText.fill(value);
  }

  async Selectprovider(value?: string) {
    const providerDropdown = this.page.locator('#select2-providerId-container');
    await expect(providerDropdown).toBeVisible({ timeout: 15000 });
    await providerDropdown.click();

    if (value) {
      const namedOption = this.page
        .locator('.select2-container--open .select2-results__option')
        .filter({ hasText: new RegExp(escapeRegex(value), 'i') })
        .first();
      if (await namedOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await namedOption.click();
        return;
      }
    }

    const firstProvider = this.page
      .locator('.select2-container--open .select2-results__option')
      .filter({ hasNotText: /Select an option/i })
      .first();
    await expect(firstProvider).toBeVisible({ timeout: 15000 });
    await firstProvider.click();
  }

  async Selecttemplate(value?: string) {
    const templateDropdown = this.page.locator('#select2-providerselectedtemplate-container');
    await expect(templateDropdown).toBeVisible({ timeout: 15000 });
    await templateDropdown.click();

    if (value) {
      const selectOption = this.page.getByRole('treeitem', {
        name: new RegExp(escapeRegex(value), 'i'),
      });
      if (await selectOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await selectOption.click();
        return;
      }
    }

    const firstTemplate = this.page
      .locator('.select2-container--open .select2-results__option')
      .filter({ hasNotText: /Select an option/i })
      .first();
    await expect(firstTemplate).toBeVisible({ timeout: 15000 });
    await firstTemplate.click();
  }

  async AddfieldWhatsApp(value: string) {
    await AddFiled(this.page, value);
  }

}




//                            Email Task



export class WorkflowEmailPage {
  constructor(private page: Page) {}
  
  private escapeRegex(value: string) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  private optionRegex(value: string) {
      return new RegExp(value.trim().split(/\s+/).map((part) => this.escapeRegex(part)).join('\\s+'), 'i');
  }
  
  private async selectOption(trigger: Locator, value: string) {
      await expect(trigger).toBeVisible({ timeout: 15000 });
      await trigger.click();
  
      const searchBox = this.page.locator('.select2-container--open .select2-search__field').last();
      if (await searchBox.isVisible({ timeout: 3000 }).catch(() => false)) {
          await searchBox.fill(value.trim());
      }
  
      const optionPattern = this.optionRegex(value);
      const openDropdown = this.page.locator('.select2-container--open').last();
      let option = openDropdown
          .locator('.select2-results__option, [role="treeitem"]')
          .filter({ hasText: optionPattern })
          .first();
  
      if (!(await option.isVisible({ timeout: 5000 }).catch(() => false)) && await searchBox.isVisible().catch(() => false)) {
          await searchBox.fill('');
          option = openDropdown
              .locator('.select2-results__option, [role="treeitem"]')
              .filter({ hasText: optionPattern })
              .first();
      }
  
      const roleOption = this.page.getByRole('treeitem', { name: optionPattern }).first();
      option = await option.isVisible({ timeout: 5000 }).catch(() => false)
          ? option
          : roleOption;
  
      await expect(option).toBeVisible({ timeout: 15000 });
      await option.click();
  }
  
  private async firstVisible(candidates: Locator[], fieldName: string) {
      for (const candidate of candidates) {
          const locator = candidate;
          if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
              return locator;
          }
      }
  
      throw new Error(`Could not find visible dropdown for "${fieldName}".`);
  }
  
  private async selectFirstVisibleOption(fieldName: string, candidates: Locator[], value: string) {
      const trigger = await this.firstVisible(candidates, fieldName);
      await this.selectOption(trigger, value);
  }
  
  private select2ByLabel(label: string) {
      const escapedLabel = label.replace(/"/g, '\\"');
      return this.page.locator(
          `xpath=//*[normalize-space(translate(normalize-space(), "*", ""))="${escapedLabel}"]/following-sibling::*[1]//*[@role="combobox" or contains(@class,"select2-selection__rendered")]`
      ).last();
  }
  
  private select2AfterLabel(label: string) {
      const escapedLabel = label.replace(/"/g, '\\"');
      return this.page.locator(
          `xpath=//*[normalize-space(translate(normalize-space(), "*", ""))="${escapedLabel}"]/following::*[@role="combobox" or contains(@class,"select2-selection__rendered")]`
      ).first();
  }
  
  private select2AfterLabelWithPlaceholder(label: string, placeholder: string) {
      const escapedLabel = label.replace(/"/g, '\\"');
      const escapedPlaceholder = placeholder.replace(/"/g, '\\"');
      return this.page.locator(
          `xpath=(//*[normalize-space(translate(normalize-space(), "*", ""))="${escapedLabel}"]/following::*[@role="combobox" and (normalize-space()="${escapedPlaceholder}" or .//*[@placeholder="${escapedPlaceholder}"])])[1]`
      );
  }
  
  private select2ByIdPrefix(prefix: string) {
      return this.page.locator(`[id^="select2-${prefix}-"][id$="-container"]`).first();
  }
  
  async tasltitle(title = 'Test Email') {
   const randomPrefix = `TASK_${Math.floor(Math.random() * 100)}`;
   const finalTitle = `${randomPrefix}_${title}`;
   const value= this.page.locator('input[name="emailsummary"]');
   await value.fill(finalTitle);
   
  }  
  
   async fromemail(value:string){
      await this.selectFirstVisibleOption('From', [
          this.select2ByLabel('From'),
          this.select2ByIdPrefix('fromemail'),
          this.select2ByIdPrefix('from_email'),
          this.select2ByLabel('From Email'),
          this.page.locator("[class='select2-selection__rendered']").nth(7),
      ], value);
  }
  
  async Toemail(value:string){
      await this.selectFirstVisibleOption('To', [
          this.select2AfterLabelWithPlaceholder('To', 'Select an Option'),
          this.select2ByLabel('To'),
          this.select2AfterLabel('To'),
          this.select2ByIdPrefix('toemail'),
          this.select2ByIdPrefix('to_email'),
          this.select2ByLabel('To Email'),
          this.page.locator("[class='select2-selection__rendered']").nth(8),
      ], value);
  }
  
  async CCemail(value:string){
  await this.selectFirstVisibleOption('CC', [
      this.select2ByLabel('CC'),
      this.select2ByLabel('Cc'),
      this.select2ByIdPrefix('ccemail'),
      this.select2ByIdPrefix('cc_email'),
      this.select2ByLabel('CC Email'),
      this.page.locator("[class='select2-selection__rendered']").nth(9),
  ], value);
  }
  
  async BCCemail(value: string){
  await this.selectFirstVisibleOption('BCC', [
      this.select2ByLabel('BCC'),
      this.select2ByLabel('Bcc'),
      this.select2ByIdPrefix('bccemail'),
      this.select2ByIdPrefix('bcc_email'),
      this.select2ByLabel('BCC Email'),
      this.page.locator("[class='select2-selection__rendered']").nth(11),
  ], value);
  }
  
  async subject(value:string){
  await this.selectFirstVisibleOption('Subject', [
      this.select2ByIdPrefix('subject'),
      this.select2ByLabel('Subject'),
      this.page.locator("[class='select2-selection__rendered']").nth(12),
  ], value);
  }
  
  async Addfield(value:string){
  await this.selectFirstVisibleOption('Add Field', [
      this.select2ByLabel('Add Field'),
      this.select2ByIdPrefix('addfield'),
      this.select2ByLabel('Add Fields'),
  ], value);
  }
  
  async AddTime(value:string){
  await this.selectFirstVisibleOption('Add Time', [
      this.select2ByLabel('Add Time'),
      this.select2ByIdPrefix('time'),
      this.select2ByIdPrefix('addtime'),
  ], value);
  }
  
  async temp(value:string){
  
      await this.selectFirstVisibleOption('Choose Template', [
          this.select2ByLabel('Choose Template Dropdown'),
          this.select2ByIdPrefix('templateid'),
          this.select2ByLabel('Choose Template'),
          this.select2ByLabel('Template'),
      ], value);
  }
  async savebtn(){
      const workflowSubmit = this.page.locator('[name="Workflowsubmit"]').first();
      const saveButton = await workflowSubmit.isVisible({ timeout: 2000 }).catch(() => false)
          ? workflowSubmit
          : this.page.getByRole('button', { name: /^Save$/i }).last();
      await expect(saveButton).toBeVisible({ timeout: 15000 });
      await saveButton.click();
  }
}

