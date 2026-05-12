import {test,Page, expect} from "@playwright/test";
import { LoginPage } from "../../pages/login";
import { DashboardPage } from "../../pages/workflows/dashboard";
import { ProfilePage } from "../../pages/workflows/profile";
import { WorkflowMessagePage } from "../../pages/workflows/workflowMessage";
import { leadsModule } from "../../pages/workflows/leadModule";
import { leadWithNoTask } from "../../pages/workflows/untillFirstConTrue";
import { everyTimeRecordSave } from "../../pages/workflows/everyTimeSave";
import { everyTimeModifiedRecord } from "../../pages/workflows/everyTimeModified";
import { detailView } from "../../pages/workflows/detailViewSms";
import { listView } from "../../pages/workflows/listViewSms";
//import { TakeScreenShot } from "../utils/screenshot";


test.describe("Workflow Message End-to-End Flow",()=>{
  test("createWorkflowMessage", async ({ page }) => {
  test.setTimeout(700000);

  const login = new LoginPage(page);
  const dashboard = new DashboardPage(page);
  const workflowMessage = new WorkflowMessagePage(page);
  const leads = new leadsModule(page);
  const noTask = new leadWithNoTask(page);
  const everyTimeSave=new everyTimeRecordSave(page);
  const everyTimeModi=new everyTimeModifiedRecord(page);
  const detailViewSMS=new detailView(page);
  const listSMS=new listView(page);
 // const screenShot=new TakeScreenShot();


  const suffix = Date.now().toString().slice(-6);
  const workFlowName = `TestMessage-${suffix}`;

  await login.loginPage();
  await login.login("NAVEEN", "rsoft", "RSoft!@345");
  await expect(page).toHaveURL(/\/admin\/Dashboard/i);
  await expect(page.getByRole('button', { name: 'Dayin' })).toBeVisible();

  console.log("START: WorkflowCreation-redirectToWorkflowToChangeTheFlow1");
  await test.step("WorkflowCreation-redirectToWorkflowToChangeTheFlow1",async()=>{
  //await page.waitForLoadState('domcontentloaded');
  await dashboard.profileIcon();
  await dashboard.crmSettings();
  // await expect(page.getByRole('heading',{name:'Summary'})).toBeVisible();
  await workflowMessage.otherSettings();
  await workflowMessage.workFlowSettings();
  // await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
  await workflowMessage.createBtn();
  // await expect(page.getByRole('heading',{name:'Creating workflow'})).toBeVisible();
  await workflowMessage.step1("Leads", workFlowName);
  // console.log(workFlowName)
  // await expect(page.getByRole('heading',{name:'Creating workflow'})).toBeVisible();
  await workflowMessage.step2();
  // await expect(page.getByRole('heading',{name:'Creating workflow'})).toBeVisible();
  await workflowMessage.step3();
  await workflowMessage.enableToggleByWorkflowName(workFlowName)
  // console.log(workFlowName)
  console.log("END: WorkflowCreation-redirectToWorkflowToChangeTheFlow1");
  })

  console.log("START: Only on the first save");
  await test.step("Only on the first save",async()=>{
  await leads.menuIcon();
  await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
  await leads.addLead();
  await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
  await leads.dataForInputFields();
  await leads.saveBtn();
 // await leads.saveBtn();
await expect(
  page.getByRole('heading', { name: /Leads Detail View/i })
).toBeVisible({ timeout: 15000 });

  await leads.updateTimeAndData();
  console.log("Condition matched, Only on the first save is triggered")
  console.log("END: Only on the first save");
  })
  
  console.log("START: redirectToWorkflowToChangeTheFlow2");
  await test.step("redirectToWorkflowToChangeTheFlow2",async()=>{
  await dashboard.profileIcon();
  await dashboard.crmSettings();
  // await expect(page.getByRole('heading',{name:'Summary'})).toBeVisible();
  await workflowMessage.otherSettings();
  await workflowMessage.workFlowSettings();
  // await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
  await workflowMessage.clickEditIcon();
  // await expect(page.getByRole('heading',{name:'Editing Workflow'})).toBeVisible();
  await workflowMessage.whenToExecuteWorkFlow1();
  await expect(page.getByRole('heading',{name:'Editing Workflow'})).toBeVisible();
  await workflowMessage.editNext();
  await expect(page.getByRole('heading',{name:'Editing Workflow'})).toBeVisible();
  await workflowMessage.editNext();
  await expect(page.getByRole('heading',{name:'Editing Workflow'})).toBeVisible();
  await workflowMessage.editSubBtn();
  await leads.menuIcon();
  console.log("END: redirectToWorkflowToChangeTheFlow2");
  }) 

  // Until the first time the condition is true
  console.log("START: LeadWithNoTask");
  await test.step("LeadWithNoTask", async () => {
    await leads.addLead();
    await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
    await noTask.diffDropDown();
    await noTask.diffValues("rsoft tech", "1000", "9182725343");
    await leads.saveBtn();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    console.log("Condition not matched , task not get triggered")
    console.log("END: LeadWithNoTask");
  });
  console.log("START: leadWithTask");
  await test.step("leadWithTask",async()=>{
    await leads.menuIcon();
    await noTask.editFirstRow();
    await expect(page.getByRole('heading',{name:"Edit Leads"})).toBeVisible();
    await noTask.againDropDown();
    await leads.saveBtn();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await leads.updateTimeAndData();
    //await screenShot.capture(page, "After Save")
    console.log("Condition matched and task get triggered")
    console.log("END: leadWithTask");
  })
  console.log("START: againTheSameTaskNotToTrigger");
  await test.step("againTheSameTaskNotToTrigger",async()=>{
    await leads.menuIcon();
    await noTask.editFirstRow();
    await expect(page.getByRole('heading',{name:"Edit Leads"})).toBeVisible();
    await page.waitForLoadState('networkidle');
    await leads.saveBtn();
    // await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await leads.updateTimeAndData();
    console.log("Condition not matched, task not get triggered")
    console.log("END: againTheSameTaskNotToTrigger");

  })


  //Every time the record is save
  console.log("START: redirectToWorkflowToChangeTheFlow3");
  await test.step("redirectToWorkflowToChangeTheFlow3",async()=>
{
  // await page.waitForLoadState('networkidle');
  await dashboard.profileIcon();
  await dashboard.crmSettings();
  // await expect(page.getByRole('heading',{name:'Summary'})).toBeVisible();
  await workflowMessage.otherSettings();
  await workflowMessage.workFlowSettings();
  // await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
  await workflowMessage.clickEditIcon();
  await expect(page.getByRole('heading',{name:'Editing Workflow'})).toBeVisible();
  await everyTimeSave.thirdWorkFlow();
  await workflowMessage.editNext();
  await expect(page.getByRole('heading',{name:'Editing Workflow'})).toBeVisible();
  await workflowMessage.editNext();
  await expect(page.getByRole('heading',{name:'Editing Workflow'})).toBeVisible();
  await workflowMessage.editSubBtn();  
  console.log("END: redirectToWorkflowToChangeTheFlow3");
  })
  console.log("START: smsTriggerDuringSave");
  await test.step("smsTriggerDuringSave",async()=>
  {
    await leads.menuIcon();
    await leads.addLead();
    await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
    await leads.dataForInputFields();
    await leads.saveBtn();
     await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await leads.updateTimeAndData();
    console.log("Task get triggered, condition matched")
    console.log("END: smsTriggerDuringSave");
  })
  console.log("START: conMismatch");
  await test.step("conMismatch",async()=>{
    await leads.menuIcon();
    await noTask.editFirstRow();
    await expect(page.getByRole('heading',{name:"Edit Leads"})).toBeVisible();
    await noTask.diffDropDown();
    await noTask.diffValues("rsoft","1000","9182736451");
    await leads.saveBtn();
   // await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await leads.updateTimeAndData();
    console.log("Condition mismatched, no task get triggered")
    console.log("END: conMismatch");
  })

  //Every time the record is modified
  console.log("START: leadCreation");
  await test.step("leadCreation",async()=>{
   await dashboard.profileIcon();
   await dashboard.crmSettings();
  //  await expect(page.getByRole('heading',{name:'Summary'})).toBeVisible();
   await workflowMessage.otherSettings();
   await workflowMessage.workFlowSettings();
  //  await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
   await workflowMessage.clickEditIcon();
   await expect(page.getByRole('heading',{name:'Editing Workflow'})).toBeVisible();
   await everyTimeModi.everyTimeModified();
   await workflowMessage.editNext();
   await expect(page.getByRole('heading',{name:'Editing Workflow'})).toBeVisible();
   await workflowMessage.editNext();
   await expect(page.getByRole('heading',{name:'Editing Workflow'})).toBeVisible();
   await workflowMessage.editSubBtn();  
  })
  await test.step("lastFlowMenu",async()=>{
    await leads.menuIcon();
    await leads.addLead();
    await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
    await leads.dataForInputFields();
    await leads.saveBtn();
  //  await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await leads.updateTimeAndData();
    console.log("Task get triggered, condition matched")
    console.log("END: smsTriggerDuringSave");
  })
  await test.step("taskExecution",async()=>{
    await leads.menuIcon();
    await noTask.editFirstRow();
    await expect(page.getByRole('heading',{name:"Edit Leads"})).toBeVisible();
    await noTask.diffValues("rsoft","1000","9182736451");
    await leads.saveBtn();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await leads.updateTimeAndData();
    console.log("Condition matched, task get triggered")

  })
  await test.step("detailView",async()=>{
     await leads.menuIcon();
    await detailViewSMS.clickFirstRow();
    await expect(page.getByRole('heading',{name:"Send SMS Template"})).toBeVisible();
    await detailViewSMS.clickSmspopupDropDown1();
    await detailViewSMS.clickSmsPopupDropDown2();
    await leads.updateTimeAndData();
  })
  await test.step("listViewSms",async()=>{
    await leads.menuIcon();
    await listSMS.listViewSMS();
    await expect(page.getByRole('heading',{name:'Send SMS'})).toBeVisible();
    await detailViewSMS.clickSmspopupDropDown1();
    await detailViewSMS.clickSmsPopupDropDown2();
    console.log("Sms trigggered in the list view")
  })
  await test.step("updateCaptureForListView",async()=>{
      await listSMS.clickFirstRowForSmsListview();
     // await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
      await leads.updateTimeAndData();
  })
});
})
