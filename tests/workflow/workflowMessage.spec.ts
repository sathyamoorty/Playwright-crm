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
import { creatEntity } from "../../pages/createEntity";
//import { TakeScreenShot } from "../utils/screenshot";
import { WorkflowEmailPage } from "../../pages/workflows/CreateWorkflow";
import modules from "../../data/modules.json"
import testdata from "../../data/filterFieldTypeData.json"
import { takeScreenshot } from '../../utils/screenshot'
import { CreateWorkflowPage } from "../../pages/workflows/CreateWorkflow";

let workflowSeq = 0;
function uniqueWorkflowName(label: string): string {
  workflowSeq += 1;
  return `TestMessage-${label}-${String(workflowSeq).padStart(3, '0')}`;
}

test.describe("Workflow Message End-to-End Flow",()=>{
  test("createWorkflowMessage", async ({ page },testInfo) =>
 {
  test.setTimeout(1500000);

  const login = new LoginPage(page);
  const dashboard = new DashboardPage(page);
  const workflowMessage = new WorkflowMessagePage(page);
  const leads = new leadsModule(page);
  const noTask = new leadWithNoTask(page);
  const everyTimeSave=new everyTimeRecordSave(page);
  const everyTimeModi=new everyTimeModifiedRecord(page);
  const detailViewSMS=new detailView(page);
  const listSMS=new listView(page);
  const entity=new creatEntity(page);
  const updateEntity = new CreateWorkflowPage(page);
  const sShot={takeScreenshot};
 const Updateentity = new CreateWorkflowPage(page);
 const email = new WorkflowEmailPage(page);
 const flow = new CreateWorkflowPage(page);
 const moduleName ='leads'
 const data= modules[moduleName as keyof typeof modules];
 const testdata1=testdata[moduleName as keyof typeof testdata];
  


  workflowSeq = 0;
  const smsWorkflowName = uniqueWorkflowName('SMS');
  const entityWorkflowName = uniqueWorkflowName('Entity');
  const emailWorkflowName = uniqueWorkflowName('Email');
  const notificationWorkflowName = uniqueWorkflowName('Notification');
  const whatsAppWorkflowName = uniqueWorkflowName('WhatsApp');
  const scheduleWorkflowName = uniqueWorkflowName('Schedule');

  await login.loginPage();
  await login.login("RSAUTOMATION", "rsoft", "RSoft@2026");
  await expect(page).toHaveURL(/\/admin\/Dashboard/i);
  await expect(page.getByRole('button', { name: 'Dayin' })).toBeVisible();

  console.log("START: WorkflowCreation-redirectToWorkflowToChangeTheFlow1");
  await test.step("WorkflowCreation-redirectToWorkflowToChangeTheFlow1",async()=>{
  await updateEntity.ProfileIcon1(page);
  await updateEntity.goToCRMSettings(page);
  await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
  await workflowMessage.otherSettings();
  await workflowMessage.workFlowSettings();
  await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
  await workflowMessage.createBtn();
  await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
  await workflowMessage.step1("Testing", smsWorkflowName);
  await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
  await workflowMessage.step2();
  await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
  await workflowMessage.step3();
  await workflowMessage.enableToggleByWorkflowName(smsWorkflowName);
  console.log("END: WorkflowCreation-redirectToWorkflowToChangeTheFlow1");
  })

  console.log("START: Only on the first save");
  await test.step("Only on the first save",async()=>{
  await updateEntity.clickMenu1(page);
  await leads.testMod();
  await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
  await leads.addLead();
  await expect(page.getByRole('heading',{name:'Create Testing'})).toBeVisible();
  await leads.dataForInputFields();
  await leads.saveBtn();
  await expect(page.getByRole('heading', { name: /Testing Detail View/i })).toBeVisible();
  await sShot.takeScreenshot(page,testInfo,"Only on the first save SMS");
  console.log("Condition matched, Only on the first save is triggered")
  console.log("END: Only on the first save");
  })
  
  console.log("START: redirectToWorkflowToChangeTheFlow2");
  await test.step("redirectToWorkflowToChangeTheFlow2",async()=>{
  await updateEntity.ProfileIcon1(page);
  await updateEntity.goToCRMSettings(page);
  await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
  await workflowMessage.otherSettings();
  await workflowMessage.workFlowSettings();
  await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
  await workflowMessage.clickEditIcon(smsWorkflowName);
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await workflowMessage.whenToExecuteWorkFlow1();
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await workflowMessage.editNext();
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await workflowMessage.editNext();
  await workflowMessage.editSubBtn();
  await updateEntity.clickMenu1(page);
  await leads.testMod();
  await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
  console.log("END: redirectToWorkflowToChangeTheFlow2");
  }) 

  // Until the first time the condition is true
  console.log("START: LeadWithNoTask");
  await test.step("LeadWithNoTask", async () => {
    await leads.addLead();
    await expect(page.getByRole('heading',{name:'Create Testing'})).toBeVisible();
    await noTask.diffDropDown();
    await noTask.diffValues("rsoft tech", "1000", "Arjun", "9182726352");
    await leads.saveBtn();
    await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"LeadWithNoTask SMS");
    console.log("Condition not matched , task not get triggered")
    console.log("END: LeadWithNoTask");
  });
  console.log("START: leadWithTask");
  await test.step("leadWithTask",async()=>{
    await updateEntity.clickMenu1(page);
    await leads.testMod();
    await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
    await noTask.editFirstRow();
    await expect(page.getByRole('heading',{name:"Edit Testing"})).toBeVisible();
    await noTask.againDropDown();
    await leads.saveBtn();
    await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"leadWithTask SMS");
    console.log("Condition matched and task get triggered")
    console.log("END: leadWithTask");
  })
  console.log("START: againTheSameTaskNotToTrigger");
  await test.step("againTheSameTaskNotToTrigger",async()=>{
    await updateEntity.clickMenu1(page);
    await leads.testMod();
    await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
    await noTask.editFirstRow();
    await expect(page.getByRole('heading',{name:"Edit Testing"})).toBeVisible();
    await page.waitForLoadState('networkidle');
    await leads.saveBtn();
    await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"againTheSameTaskNotToTrigger SMS");
    console.log("Condition not matched, task not get triggered")
    console.log("END: againTheSameTaskNotToTrigger");

  })


  //Every time the record is save
  console.log("START: redirectToWorkflowToChangeTheFlow3");
  await test.step("redirectToWorkflowToChangeTheFlow3",async()=>
{
  await updateEntity.ProfileIcon1(page);
  await updateEntity.goToCRMSettings(page);
  await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
  await workflowMessage.otherSettings();
  await workflowMessage.workFlowSettings();
  await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
  await workflowMessage.clickEditIcon(smsWorkflowName);
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await everyTimeSave.thirdWorkFlow();
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await workflowMessage.editNext();
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await workflowMessage.editNext();
  await workflowMessage.editSubBtn();  
  console.log("END: redirectToWorkflowToChangeTheFlow3");
  })
  console.log("START: smsTriggerDuringSave");
  await test.step("smsTriggerDuringSave",async()=>
  {
    await updateEntity.clickMenu1(page);
    await leads.testMod();
    await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
    await leads.addLead();
    await expect(page.getByRole('heading',{name:'Create Testing'})).toBeVisible();
    await leads.dataForInputFields();
    await leads.saveBtn();
    await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"smsTriggerDuringSave SMS");
    console.log("Task get triggered, condition matched")
    console.log("END: smsTriggerDuringSave");
  })
  console.log("START: conMismatch");
  await test.step("conMismatch",async()=>{
    await updateEntity.clickMenu1(page);
    await leads.testMod();
    await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
    await noTask.editFirstRow();
    await expect(page.getByRole('heading',{name:"Edit Testing"})).toBeVisible();
    await noTask.diffDropDown();
    await noTask.diffValues("rsoft","1000", "Arjun", "9182726352");
    await leads.saveBtn();
    await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"conMismatch SMS");
    console.log("Condition mismatched, no task get triggered")
    console.log("END: conMismatch");
  })

  //Every time the record is modified
  console.log("START: leadCreation");
  await test.step("leadCreation",async()=>{
   await updateEntity.ProfileIcon1(page);
   await updateEntity.goToCRMSettings(page);
   await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
   await workflowMessage.otherSettings();
   await workflowMessage.workFlowSettings();
   await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
   await workflowMessage.clickEditIcon(smsWorkflowName);
   await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
   await everyTimeModi.everyTimeModified();
   await workflowMessage.editNext();
   await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
   await workflowMessage.editNext();
   await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
   await workflowMessage.editSubBtn();  
  })
  await test.step("lastFlowMenu",async()=>{
    await updateEntity.clickMenu1(page);
    await leads.testMod();
    await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
    await leads.addLead();
    await expect(page.getByRole('heading',{name:'Create Testing'})).toBeVisible();
    await leads.dataForInputFields();
    await leads.saveBtn();
    await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"lastFlowMenu SMS");
    console.log("Task get triggered, condition matched")
    console.log("END: smsTriggerDuringSave");
  })
  await test.step("taskExecution",async()=>{
    await updateEntity.clickMenu1(page);
    await leads.testMod();
    await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
    await noTask.editFirstRow();
    await expect(page.getByRole('heading',{name:"Edit Testing"})).toBeVisible();
    await noTask.diffValues("arjun@yopmail.com","1000", "Arjun", "9182726352"); //
    await leads.saveBtn();
    await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"taskExecution SMS");
    console.log("Condition matched, task get triggered")

  })
  await test.step("detailView",async()=>{
     await updateEntity.clickMenu1(page);
     await leads.testMod();
     await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
    await detailViewSMS.clickFirstRow();
    await detailViewSMS.clickSmspopupDropDown1();
    await detailViewSMS.clickSmsPopupDropDown2();
  })
 
  
  
  
  
   await test.step("WorkFlowCreateEntity",async()=>{
    await updateEntity.ProfileIcon1(page);
    await updateEntity.goToCRMSettings(page);
    await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
    await workflowMessage.otherSettings();
    await workflowMessage.workFlowSettings();
    await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
    await workflowMessage.createBtn();
    await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
    await workflowMessage.step1("Testing", entityWorkflowName);
    await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
    await workflowMessage.step2();
    await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
    await entity.workFlowStep3();
    
    console.log("Entity created")
    await entity.popupDropDown();
      await entity.popDropDown2();
            await entity.popupDropDown3();
            await entity.targetModule();
            await entity.sourceModule();
            await entity.addFieldBtn();
            await entity.mapTheFields();
            await entity.mapTheField2();
            await entity.popupBtn();
            await entity.toggleTask();
            await workflowMessage.enableToggleByWorkflowName(entityWorkflowName);
  })
  await test.step("createEntity",async()=>{
    await updateEntity.clickMenu1(page);
    await leads.testMod();
    await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
            await leads.addLead();
            await expect(page.getByRole('heading',{name:'Create Testing'})).toBeVisible();
            await entity.dataForLeads( "Krish","arjun@yopmail.com");
            await leads.saveBtn();
            await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
            await sShot.takeScreenshot(page,testInfo,"createEntity SMS");
            await page.reload()
            await entity.relatedModule();
      
  })
  await test.step("editFirstRecord",async()=>
    {
        await updateEntity.clickMenu1(page);
        await leads.testMod();
        await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
        await noTask.editFirstRow(); 
        await expect(page.getByRole('heading',{name:"Edit Testing"})).toBeVisible();
        await entity.changeAssign();
        await leads .saveBtn();
        await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
        await sShot.takeScreenshot(page,testInfo,"editFirstRecord Create Entity executed");
     
    })
    await test.step("navigateToWorkFlow",async()=>
      {
     await updateEntity.ProfileIcon1(page);
     await updateEntity.goToCRMSettings(page);
     await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
     await workflowMessage.otherSettings();
     await workflowMessage.workFlowSettings();
     await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
     await workflowMessage.clickEditIcon(entityWorkflowName);
     await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
     await workflowMessage.whenToExecuteWorkFlow1();
     await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
     await workflowMessage.editNext();
     await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
     await workflowMessage.editNext();
     await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
     await workflowMessage.editSubBtn();
     await updateEntity.clickMenu1(page);
     await leads.testMod();
     await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
     })
      // Until the first time the condition is true
  console.log("START: LeadWithNoTask");
  await test.step("LeadWithNoTask", async () => {
    await leads.addLead();
    await expect(page.getByRole('heading',{name:'Create Testing'})).toBeVisible();
    await entity.changeAssign();
    await entity.dataForLeads( "Krish","arjun@yopmail.com");
    await leads.saveBtn();
    await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"Until the first time the condition true create entity");
    
      console.log("END: LeadWithNoTask");
    });
    await test.step("conditionMatched",async()=>{
      await updateEntity.clickMenu1(page);
      await leads.testMod();  
      await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
      await noTask.editFirstRow();
      await expect(page.getByRole('heading',{name:"Edit Testing"})).toBeVisible();
      await noTask.againDropDown();
      await leads.saveBtn();
      await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
      await sShot.takeScreenshot(page,testInfo,"conditionMatched create entity");
      await entity.relatedModule();
      await updateEntity.clickMenu1(page);
      await leads.testMod();
      await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
      await noTask.editFirstRow();
      await page.waitForLoadState('networkidle')
      await leads.saveBtn();
      await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
      await sShot.takeScreenshot(page,testInfo,"navigateToWorkFlowFor3 create entity");
   
    })
    //Every time the record is save
  await test.step("navigateToWorkFlowFor3",async()=>
    {
    await updateEntity.ProfileIcon1(page);
    await updateEntity.goToCRMSettings(page);
    await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
    await workflowMessage.otherSettings();
    await workflowMessage.workFlowSettings();
    await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
    await workflowMessage.clickEditIcon(entityWorkflowName);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await everyTimeSave.thirdWorkFlow();
    await workflowMessage.editNext();
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await workflowMessage.editNext();
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await workflowMessage.editSubBtn();  
    console.log("END: navigateToWorkFlowFor3");
    })
    await test.step("redirectToLeadModule",async()=>{
      await updateEntity.clickMenu1(page);
      await leads.testMod();
      await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
      await leads.addLead();
      await expect(page.getByRole('heading',{name:'Create Testing'})).toBeVisible();
      await entity.dataForLeads( "Krish","rsoft@yopmail.com");
      await leads.saveBtn();
      await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
      await sShot.takeScreenshot(page,testInfo,"redirectToLeadModule create entity");
      await entity.relatedModule();
           
    })
    await test.step("editRow",async()=>{
      await updateEntity.clickMenu1(page);
      await leads.testMod();  
      await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
      await noTask.editFirstRow();
      await expect(page.getByRole('heading',{name:"Edit Testing"})).toBeVisible();
      await entity.dataForLeads( "Krishna","rsoft@yopmail.com");
       await leads.saveBtn();
       await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
       await sShot.takeScreenshot(page,testInfo,"editRow create entity")
      await entity.relatedModule();
            
    })
    await test.step("conditionMismatch",async()=>{
      await updateEntity.clickMenu1(page);
      await leads.testMod();
      await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
     await noTask.editFirstRow();
     await noTask.diffDropDown();
     await leads.saveBtn();
     await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
     await sShot.takeScreenshot(page,testInfo,"conditionMismatch create entity");
   
   await test.step("redirectToWork",async()=>
    {
      await updateEntity.ProfileIcon1(page);
      await updateEntity.goToCRMSettings(page);
      await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
      await workflowMessage.otherSettings();
      await workflowMessage.workFlowSettings();
      await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
      await workflowMessage.clickEditIcon(entityWorkflowName);
      await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
      await everyTimeModi.everyTimeModified();
      await workflowMessage.editNext();
      await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
      await workflowMessage.editNext();
      await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
      await workflowMessage.editSubBtn();  
      console.log("END: redirectToWork");
    })
    await test.step("redirectToLeadCreation",async()=>{
      await updateEntity.clickMenu1(page);
      await leads.testMod();
      await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
      await leads.addLead();
      await expect(page.getByRole('heading',{name:'Create Testing'})).toBeVisible();
      await entity.dataForLeads( "Krish","Rsoft@yopmail.com");
      await leads.saveBtn();
      await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
      await sShot.takeScreenshot(page,testInfo,"redirectToLeadCreation create entity");

     })
     await test.step("editTheFirstRow",async()=>{
      await updateEntity.clickMenu1(page);
      await leads.testMod();
      await expect(page.getByRole('heading',{name:'Testing'})).toBeVisible();
      await noTask.editFirstRow();
      await expect(page.getByRole('heading',{name:"Edit Testing"})).toBeVisible();
      await page.waitForLoadState('networkidle')
     await leads.saveBtn();
     await expect(page.getByRole('heading',{name:"Testing Detail View"})).toBeVisible();
     await sShot.takeScreenshot(page,testInfo,"editTheFirstRow create entity");
       await entity.relatedModule();
         
    })
 






    await test.step("updateEntity",async()=>{
      await Updateentity.ProfileIcon1(page);
      await Updateentity.goToCRMSettings(page);
      await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
      await Updateentity.OtherSettings(page);
      await Updateentity.clickWorkflow(page);
      await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
      await Updateentity.CreateWorkflowbtn(page);
      await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
      await Updateentity.SelectModule(page, moduleName);
      await Updateentity.WorkflowName(page, emailWorkflowName);
      // await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
      await Updateentity.WorkflowNextbtn(page);
      await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
      //Condition Section
      // await Updateentity.AllConditionsbtn(page);
      // await Updateentity.selectDropdownValue(page, 'Assigned To')
      // await Updateentity.selectOperator(page,'is');
      await workflowMessage.step2();
      // await Updateentity.WorkflowNextbtn(page); 
  
  
      //Add Task
      await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
      await Updateentity.AddtoDo(page);
      await Updateentity.selectTask(page,'Email');
  
      //  Email Pop-up
      await email.tasltitle();
      await email.fromemail('Assigned To: (Leads) Primary Email');
      await email.Toemail('(Leads) Leads: (Email)');
      await email.temp('Allotment Letter For Your Booked Property');
      await email.savebtn();
      await flow.toggleRowSwitch();
      await Updateentity.Submitbtn(page);
  
      // Create Record
      await expect(page.getByRole('heading',{name:"Workflow"})).toBeVisible();
      // await flow.clickMenu1(page);
      await flow.lastWorkFlowtoggle(emailWorkflowName);
      await Updateentity.Menulist('Leads');
      await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
      await flow.addLead();
      await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
      await flow.dataForInputFields();
      await flow.saveBtn();
       await page.reload();
       await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
       await sShot.takeScreenshot(page,testInfo,"Email first task");
      // await flow.UpdateDateandTime();
      // await flow.UpdateCaptured('Update Captured :'); 
  
  
  
  
      //      Untilthefirstcondition
  
    await Updateentity.ProfileIcon1(page);
    await Updateentity.goToCRMSettings(page);
    await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
    await Updateentity.OtherSettings(page);
    await Updateentity.clickWorkflow(page);
    await flow.clickEditIcon(emailWorkflowName);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await flow.Untilthefirstcondition();
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await Updateentity.WorkflowNextbtn(page);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await Updateentity.WorkflowNextbtn(page);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await Updateentity.Submitbtn(page);
    await expect(page.getByRole('heading',{name:'Workflow'})).toBeVisible();
  
    
    //  Create New Record
    // await flow.clickMenu1(page);
    await Updateentity.Menulist('Leads');
    await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
    await flow.addLead();
    await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
    await flow.dataForInputFields();
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"Email second task");
  
    // await flow.UpdateDateandTime();
    // await flow.UpdateCaptured('Update Captured :');
  
    await flow.Editrecord();
    await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
    await flow.AssignDropDown();
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"Email third task");
  
    //  Edit & Save Again
    await flow.Editrecord();
    await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
    await page.waitForLoadState('networkidle');
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"Email task");
    
  
    // Every Time Record Save
    await Updateentity.ProfileIcon1(page);
    await Updateentity.goToCRMSettings(page);
    await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
    await Updateentity.OtherSettings(page);
    await Updateentity.clickWorkflow(page);
    await flow.clickEditIcon(emailWorkflowName);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await flow.Everytimetherecordsave();
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await Updateentity.WorkflowNextbtn(page);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await Updateentity.WorkflowNextbtn(page);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await Updateentity.Submitbtn(page);
  
    //  Create Record
    // await flow.clickMenu1(page);
    await Updateentity.Menulist('Leads');
    await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
    await flow.addLead();
    await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
    await flow.dataForInputFields();
    await flow.saveBtn();
    await page.reload();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"Email fourth task");
  
    // await flow.UpdateDateandTime();
    // await flow.UpdateCaptured('Update Captured:');
  
    //  Edit Same Record
    await flow.Editrecord();
    await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
    await page.waitForLoadState('networkidle');
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"Email fifth task");
    // await flow.UpdateDateandTime();
    // await flow.UpdateCaptured('Update Captured');
  
    // Every Time Record Modified
    await Updateentity.ProfileIcon1(page);
    await Updateentity.goToCRMSettings(page);
    await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
    await Updateentity.OtherSettings(page);
    await Updateentity.clickWorkflow(page);
    await flow.clickEditIcon(emailWorkflowName);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await flow.Everytimerecordmodified();
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await Updateentity.WorkflowNextbtn(page);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await Updateentity.WorkflowNextbtn(page);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await Updateentity.Submitbtn(page);
  
    // await flow.clickMenu1(page);
    await Updateentity.Menulist('Leads');
    await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
    await flow.addLead();
    await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
    await flow.dataForInputFields();
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"Email sixth task");

  
    //  Edit & Save
    await flow.Editrecord();
    await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
    await page.waitForLoadState('networkidle');
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"Email seventh task"); 
    //  await flow.UpdateDateandTime();
    // await flow.UpdateCaptured('Update Captured');
  
  
    //                 Notification Workflow

    //  Navigate to Workflow
    await Updateentity.ProfileIcon1(page);
    await Updateentity.goToCRMSettings(page);
    await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
    await Updateentity.OtherSettings(page);
    await Updateentity.clickWorkflow(page);
    await Updateentity.CreateWorkflowbtn(page);
    await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
    await Updateentity.SelectModule(page, "Leads");
    await Updateentity.WorkflowName(page, notificationWorkflowName);  
    await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
    await Updateentity.WorkflowNextbtn(page);
  
  //  Condition Section
    // await Updateentity.AllConditionsbtn(page);
    await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
    // await Updateentity.selectDropdownValue(page, 'Assigned To');
    // await Updateentity.selectOperator(page,'is');
    await workflowMessage.step2();
    // await Updateentity.WorkflowNextbtn(page);
  
  //  Add Task
  await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
  await Updateentity.AddtoDo(page);
  await Updateentity.selectTask(page, 'Notification');
  
  //  Notification Task
  await updateEntity.fillNotificationTaskTitle(page, 'Test Notification');
  await Updateentity.Recipients('(Leads) Assigned To');
  // await Updateentity.Addfield(page, '(Leads) Assigned To ID');
  await Updateentity.NotificationMessage();
  await Updateentity.TaskSavebtn(page);
  
  await flow.toggleRowSwitch();
  await Updateentity.Submitbtn(page);
  
  //  Create Record
  // await flow.clickMenu1(page);

  await flow.lastWorkFlowtoggle(notificationWorkflowName);
  await Updateentity.Menulist('Leads');
  await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
  await flow.addLead();
  await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
  await flow.dataForInputFields();
  await flow.saveBtn();
  await page.reload();
  await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
  await sShot.takeScreenshot(page,testInfo,"Notification first task");
  // await page.reload();
  
  // await flow.UpdateDateandTime();
  // await flow.UpdateCaptured('Update Captured :');
  
  //  Edit Workflow → Until First Condition
  await Updateentity.ProfileIcon1(page);
  await Updateentity.goToCRMSettings(page);
  await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
  await Updateentity.OtherSettings(page);
  await Updateentity.clickWorkflow(page);
  await flow.clickEditIcon(notificationWorkflowName);
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await flow.Untilthefirstcondition();
  await Updateentity.WorkflowNextbtn(page);
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await Updateentity.WorkflowNextbtn(page);
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await Updateentity.Submitbtn(page);
  
  //  Create New Record
  // await flow.clickMenu1(page);
  await Updateentity.Menulist('Leads');
  await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
  await flow.addLead();
  await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
  await flow.dataForInputFields();
  await flow.saveBtn();
  await page.reload();
  await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
  await sShot.takeScreenshot(page,testInfo,"Notification second task");
  
  //  Edit Record (Unmatched Condition)
  await flow.Editrecord();
  await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
  await flow.AssignDropDown();
  await flow.saveBtn();
  await page.reload();
  await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
  await sShot.takeScreenshot(page,testInfo,"Notification third task");

  
  //  Edit & Save Again
  await flow.Editrecord();
  await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
  await page.waitForLoadState('networkidle');
  await flow.saveBtn();
  await page.reload();
  await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
  await sShot.takeScreenshot(page,testInfo,"Notification fourth task");
  //  Every Time Record Save
  await Updateentity.ProfileIcon1(page);
  await Updateentity.goToCRMSettings(page);
  await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
  await Updateentity.OtherSettings(page);
  await Updateentity.clickWorkflow(page);
  await flow.clickEditIcon(notificationWorkflowName);
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await flow.Everytimetherecordsave();
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await Updateentity.WorkflowNextbtn(page);
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await Updateentity.WorkflowNextbtn(page);
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await Updateentity.Submitbtn(page);
  
  //  Create Record
  // await flow.clickMenu1(page);
  await Updateentity.Menulist('Leads');
  await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
  await flow.addLead();
  await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
  await flow.dataForInputFields();
  await flow.saveBtn();
  await page.reload();
  await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
  await sShot.takeScreenshot(page,testInfo,"Notification fifth task");
  // await flow.UpdateDateandTime();
  // await flow.UpdateCaptured('Update Captured:');
  
  //  Edit Same Record
  await flow.Editrecord();
  await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
  await page.waitForLoadState('networkidle');
  await flow.saveBtn();
  await page.reload();
  await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
  await sShot.takeScreenshot(page,testInfo,"Notification sixth task");
  
  //  Every Time Record Modified
  await Updateentity.ProfileIcon1(page);
  await Updateentity.goToCRMSettings(page);
  await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
  await Updateentity.OtherSettings(page);
  await Updateentity.clickWorkflow(page);
  await flow.clickEditIcon(notificationWorkflowName);
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await flow.Everytimerecordmodified();
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await Updateentity.WorkflowNextbtn(page);
  await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
  await Updateentity.WorkflowNextbtn(page);
  await Updateentity.Submitbtn(page);
  
  //  Create Record
  // await flow.clickMenu1(page);
  await Updateentity.Menulist('Leads');
  await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
  await flow.addLead();
  await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
  await flow.dataForInputFields();
  await flow.saveBtn();
  await page.reload();
  await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
  await sShot.takeScreenshot(page,testInfo,"Notification seventh task");

  
  //  Edit & Save
  await flow.Editrecord();
  await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
  await page.waitForLoadState('networkidle');
  await flow.saveBtn();
  await page.reload();
  await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
  await sShot.takeScreenshot(page,testInfo,"Notification eighth task");  
  
  
  //                 WhatsApp Workflow
  
  
  await Updateentity.ProfileIcon1(page);
    await Updateentity.goToCRMSettings(page);
    await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
    await Updateentity.OtherSettings(page);
    await Updateentity.clickWorkflow(page);
    await Updateentity.CreateWorkflowbtn(page);
    await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
    await Updateentity.SelectModule(page, 'Leads');
    await Updateentity.WorkflowName(page, whatsAppWorkflowName);
    await Updateentity.WorkflowNextbtn(page);
  
    //Condition Section
    // await Updateentity.AllConditionsbtn(page);
    await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
    // await Updateentity.selectDropdownValue(page, 'Assigned To');
    // await Updateentity.selectOperator(page, 'is');
    await workflowMessage.step2();
    // await Updateentity.WorkflowNextbtn(page);
  
    //Add Task
    await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
    await Updateentity.AddtoDo(page);
    await Updateentity.selectTask(page, 'WhatsApp');
  
    //WhatsApp Pop-up
    await Updateentity.fillWhatsAppTaskTitle(page, 'Test WhatsApp');
    await Updateentity.Recipients('(Leads) Leads: (Mobile Phone)');
    await Updateentity.Selectprovider();
    await Updateentity.Selecttemplate();
    // await Updateentity.AddfieldWhatsApp('(Leads) Mobile Phone');
    //await Updateentity.WhatsAppMessage('Test WhatsApp Message');
    await Updateentity.TaskSavebtn(page);
    await Updateentity.toggleRowSwitch();
    await Updateentity.Submitbtn(page);
  
    //Create Record
    // await flow.clickMenu1(page);  
    await flow.lastWorkFlowtoggle(whatsAppWorkflowName);
    await Updateentity.Menulist('Leads');
    await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
    await flow.addLead();
    await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
    await flow.dataForInputFields();
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"WhatsApp first task");
    //Edit Workflow
    await Updateentity.ProfileIcon1(page);
    await Updateentity.goToCRMSettings(page);
    await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
    await Updateentity.OtherSettings(page);
    await Updateentity.clickWorkflow(page);
    await flow.clickEditIcon(whatsAppWorkflowName);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await flow.Untilthefirstcondition();
    await Updateentity.WorkflowNextbtn(page);
    await Updateentity.WorkflowNextbtn(page);
    await Updateentity.Submitbtn(page);
  
    //  Create New Record
    // await flow.clickMenu1(page);    
    await Updateentity.Menulist('Leads');
    await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
    await flow.addLead();
    await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
    await flow.dataForInputFields();
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"WhatsApp second task");
 
    await flow.Editrecord();
    await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
    await flow.AssignDropDown();
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"WhatsApp third task");

    //  Edit & Save Again
    await flow.Editrecord();
    await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
    await page.waitForLoadState('networkidle');
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"WhatsApp fourth task")

  
    // Every Time Record Save
    await Updateentity.ProfileIcon1(page);
    await Updateentity.goToCRMSettings(page);
    await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
    await Updateentity.OtherSettings(page);
    await Updateentity.clickWorkflow(page);
    await flow.clickEditIcon(whatsAppWorkflowName);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await flow.Everytimetherecordsave();
    await Updateentity.WorkflowNextbtn(page);
    await Updateentity.WorkflowNextbtn(page);
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await Updateentity.Submitbtn(page);
  
    //  Create Record
    // await flow.clickMenu1(page);      
    await Updateentity.Menulist('Leads');
    await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
    await flow.addLead();
    await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
    await flow.dataForInputFields();
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"WhatsApp fifth task");

    //  Edit Same Record
    await flow.Editrecord();
    await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
    await page.waitForLoadState('networkidle');
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"WhatsApp sixth task");
  
  
    // Every Time Record Modified
    await Updateentity.ProfileIcon1(page);
    await Updateentity.goToCRMSettings(page);
    await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
    await Updateentity.OtherSettings(page);
    await Updateentity.clickWorkflow(page);
    await flow.clickEditIcon(whatsAppWorkflowName);
    await flow.Everytimerecordmodified();
    await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
    await Updateentity.WorkflowNextbtn(page); 
    await Updateentity.WorkflowNextbtn(page);
    await Updateentity.Submitbtn(page);
  
    // await flow.clickMenu1(page);
    await Updateentity.Menulist('Leads');
    await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
    await flow.addLead();
    await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
    await flow.dataForInputFields();
    await flow.saveBtn(); 
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"WhatsApp seventh task")
  
    //  Edit & Save
    await flow.Editrecord();
    await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
    await page.waitForLoadState('networkidle');
    await flow.saveBtn();
    await page.reload();
    await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
    await sShot.takeScreenshot(page,testInfo,"WhatsApp eighth task")  
  
  // //     Update Entity Schedule Task---------------------------------------
  
  
  await Updateentity.ProfileIcon1(page);
      await Updateentity.goToCRMSettings(page);
      await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
      await Updateentity.OtherSettings(page); 
      await Updateentity.clickWorkflow(page);
      await Updateentity.CreateWorkflowbtn(page);
      await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
      await Updateentity.SelectModule(page, "Leads");
      await Updateentity.WorkflowName(page, scheduleWorkflowName);
      await Updateentity.WorkflowNextbtn(page);
      
      //Condition Section
      // await Updateentity.AllConditionsbtn(page);
      await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
      // await Updateentity.selectDropdownValue(page, 'Assigned To')
      // await Updateentity.selectOperator(page,'is');
      await workflowMessage.step2(); 
      // await Updateentity.WorkflowNextbtn(page);
  
      //Add Task 
      await expect(page.getByRole('heading',{name:'Create Workflow'})).toBeVisible();
      await Updateentity.AddtoDo(page);
      await Updateentity.selectTask(page,'Update Entity');
      //const record = page.locator('li.appendli').first();
      // Create Entity Task
      await Updateentity.fillUpdateEntityTitle(page, 'Test Update Entity');
      await expect(page.getByRole('heading',{name:'Update Entity'})).toBeVisible();
      await Updateentity.Selectmod(page)
      await Updateentity.SelectTargetmod(page,'Enquiry');
      await Updateentity.ActionModifiedBy('(Source)Assigned To');
      await Updateentity.Targetdropdown(page,'Leads ID');
      await Updateentity.Sourcedropdown('Lead Number');
  
      // Schedule Tasl
  
      await Updateentity.Scheduletab();
      await Updateentity.selectScheduleExecutionField(page, 'Created Time');
      //await Updateentity.Selecthours(page, '1');
      await Updateentity.Selectminutes(page, '5');
      await Updateentity.fillScheduleAtTime('12:00');
      await Updateentity.Failcase();
      await Updateentity.failminutes('5');
      await Updateentity.TaskSavebtn(page);
      await Updateentity.toggleRowSwitch();
      await Updateentity.Submitbtn(page);
  
     //  Create New Record 
  
    //  await flow.clickMenu1(page);
     await Updateentity.lastWorkFlowtoggle(scheduleWorkflowName);
     await Updateentity.Menulist('Leads');
     await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
     await Updateentity.addrecord();
     await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
     await Updateentity.dataForInputFields();
     await Updateentity.saveBtn();
     await page.reload();
     await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
     await sShot.takeScreenshot(page,testInfo,"Schedule first task")
  
     await Updateentity.Editrecord();
     await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
     await Updateentity.Assignto();
     await Updateentity.saveBtn();
     await page.reload();
     await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
     await sShot.takeScreenshot(page,testInfo,"Schedule second task")
   
          // Log 
      await Updateentity.ProfileIcon1(page);
      await Updateentity.goToCRMSettings(page);
      await Updateentity.log();
      await Updateentity.workflowlog();
      await expect(page.getByRole('heading',{name:'Workflow Queue Log'})).toBeVisible();
      await sShot.takeScreenshot(page,testInfo,"log")
      //await validateLogTime(page);
      await Updateentity.logdetails();
  
      // Until the first time the condition is true
  
      await Updateentity.ProfileIcon1(page);
      await Updateentity.goToCRMSettings(page);
      await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
      await Updateentity.OtherSettings(page); 
      await Updateentity.clickWorkflow(page);
      await Updateentity.clickEditIcon(scheduleWorkflowName);
      await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
      await Updateentity.Untilthefirstcondition();
      await Updateentity.WorkflowNextbtn(page);
      await Updateentity.WorkflowNextbtn(page);
      await Updateentity.Submitbtn(page);
  
      // Create New Record 
  
      // await flow.clickMenu1(page);
      await Updateentity.Menulist('Leads');
      await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
      await Updateentity.addrecord();
      await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
      await Updateentity.AssignDropDown();
      await Updateentity.dataForInputFields();
      await Updateentity.saveBtn();
      await page.reload();
      await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
      await sShot.takeScreenshot(page,testInfo,"Schedule third task")
  
     // Edit and match the condition
     await Updateentity.Editrecord();
     await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
     await Updateentity.Assignto();
     await Updateentity.saveBtn();
     await page.reload();
     await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
     await sShot.takeScreenshot(page,testInfo,"Schedule fourth task")
     
    // log Captured 
      await Updateentity.ProfileIcon1(page);
      await Updateentity.goToCRMSettings(page);
      await Updateentity.log();
      await Updateentity.workflowlog();
      await expect(page.getByRole('heading',{name:'Workflow Queue Log'})).toBeVisible();
      await sShot.takeScreenshot(page,testInfo,"log")
      //await validateLogTime(page);
      await Updateentity.logdetails();
  
  
      // Every time the record is save
      await Updateentity.ProfileIcon1(page);
      await Updateentity.goToCRMSettings(page);
      await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
      await Updateentity.OtherSettings(page);
      await Updateentity.clickWorkflow(page);
      await Updateentity.clickEditIcon(scheduleWorkflowName);
      await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
      await Updateentity.Everytimetherecordsave();
      await Updateentity.WorkflowNextbtn(page);
      await Updateentity.WorkflowNextbtn(page);
      await Updateentity.Submitbtn(page);
  
      // Create New Record
      // await flow.clickMenu1(page);
      await Updateentity.Menulist('Leads');
      await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
      await Updateentity.addrecord();
      await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
      await Updateentity.AssignDropDown();
      await Updateentity.dataForInputFields();
      await Updateentity.saveBtn();
      await page.reload();
      await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
      await sShot.takeScreenshot(page,testInfo,"Schedule fifth task")
  
      // Edit and match the condition
      await Updateentity.Editrecord();
      await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
      await Updateentity.Assignto();
      await Updateentity.saveBtn();
      await page.reload();
      await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
      await sShot.takeScreenshot(page,testInfo,"Schedule sixth task")

      // Every time the record is modified
      await Updateentity.ProfileIcon1(page);
      await Updateentity.goToCRMSettings(page);
      await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
      await Updateentity.OtherSettings(page);
      await Updateentity.clickWorkflow(page);
      await Updateentity.clickEditIcon(scheduleWorkflowName);
      await Updateentity.Everytimerecordmodified();
      await expect(page.getByRole('heading',{name:'Edit Workflow'})).toBeVisible();
      await Updateentity.WorkflowNextbtn(page);
      await Updateentity.WorkflowNextbtn(page );
      await Updateentity.Submitbtn(page);
      // Create New Record
      // await flow.clickMenu1(page);
      await Updateentity.Menulist('Leads');
      await expect(page.getByRole('heading',{name:'Leads'})).toBeVisible();
      await Updateentity.addrecord();
      await expect(page.getByRole('heading',{name:'Create Leads'})).toBeVisible();
      await Updateentity.AssignDropDown();
      await Updateentity.dataForInputFields();
      await Updateentity.saveBtn();
      await page.reload();
      await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
      await sShot.takeScreenshot(page,testInfo,"Schedule seventh task")
      // Edit and match the condition
      await Updateentity.Editrecord();
      await expect(page.getByRole('heading',{name:'Edit Leads'})).toBeVisible();
      await Updateentity.Assignto();
      await Updateentity.saveBtn();
      await page.reload();
      await expect(page.getByRole('heading',{name:"Leads Detail View"})).toBeVisible();
      await sShot.takeScreenshot(page,testInfo,"Schedule eighth task")
    })
  });

  //                  Workflow Email......................................................

  // await test.step("Workflow Email", async ({ page }) => {
  // test.setTimeout(300000);



  // await login(page,"RSAUTOMATION","rsoft","RSoft@2026");
 

  });
});

