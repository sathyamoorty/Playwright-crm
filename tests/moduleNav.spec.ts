import {test,expect} from '@playwright/test'
import { LoginPage } from '../pages/login'
import {navToModule} from '../pages/navToMod'
import {dataDr} from '../pages/uiTypeId'
import { relatedModule } from '../pages/relatedMod'
import {captureTimelineUpdates} from '../utils/captureUpdates'
import {book} from '../pages/flows'
import { takeScreenshot } from '../utils/screenshot'
// import { dashBoardNav } from '../pages/dashNav'


test.describe("module",()=>{
    test.describe.configure({ timeout: 220000 });

    test("login",async({page},testInfo)=>{
    const logIn=new LoginPage(page);
    const dynmicModule=new navToModule(page)
    const uiTypeId=new dataDr(page);
    const relMod=new relatedModule(page);
    const singleEditIcon=new book(page);
    const sShot={takeScreenshot};
    await logIn.loginPage();
    await logIn.login("RSAUTOMATION","rsoft","RSoft@2026");
    await dynmicModule.waitForDashboardReady();
    await dynmicModule.menuIcon();
    await dynmicModule.dynMod(0);
    await dynmicModule.dynMicHeading("Enquiry");
    await dynmicModule.dynamicAddBtn();
    await dynmicModule.dynMicHeading("Create Enquiry");
    await uiTypeId.fillCurrentModuleFields();
    await dynmicModule.saveBtn()
    await dynmicModule.dynMicHeading("Enquiry Detail View");
    await sShot.takeScreenshot(page,testInfo,"Enquiry updates captured")
    const timelineData = await captureTimelineUpdates(page, testInfo,"Enquiry updates");
    expect(timelineData.length).toBeGreaterThan(0);
    await relMod.relModule(1);
    await dynmicModule.menuIcon();
    await dynmicModule.dynMod(1);
    await dynmicModule.dynMicHeading("Leads");
    await relMod.editFirstRow();
    await singleEditIcon.updateDetailPicklistByLabel("Lead Type","Channel Partner");
    await sShot.takeScreenshot(page,testInfo,"Leads updates captured") 
    const timelineData1 = await captureTimelineUpdates(page, testInfo,"Leads updates");
    expect(timelineData1.length).toBeGreaterThan(0);
    await relMod.clkQuickAct();
    await dynmicModule.dynMicHeading("Quick Action")
    await relMod.scrollView()
    await relMod.selectDropdownByLabel("Lead Status","Site Visit Scheduled");
    await dynmicModule.saveBtn()
    await page.reload();
    await relMod.nextIcon();
    await dynmicModule.dynMicHeading("Leads Detail View");
    await relMod.prevIcon();
    await dynmicModule.dynMicHeading("Leads Detail View");
    await sShot.takeScreenshot(page,testInfo,"Lead updates captured after quick action")
    const timelineData2 = await captureTimelineUpdates(page, testInfo,"Lead updates after quick action");
    expect(timelineData2.length).toBeGreaterThan(0);
    await dynmicModule.menuIcon();
    await dynmicModule.dynMod(3)
    await relMod.editFirstRow();
     await page.reload();
    await singleEditIcon.updateDetailPicklistByLabel("Site Visit Status","Booked")
    await dynmicModule.dynMicHeading("Site Visit Detail View");
    await page.reload();
    await sShot.takeScreenshot(page,testInfo,"Site Visit updates captured")
    const timelineData3 = await captureTimelineUpdates(page, testInfo,"Site Visit updates");
    expect(timelineData3.length).toBeGreaterThan(0);
    await relMod.relModule(5);
    await relMod.clickRelModRow();
    await dynmicModule.dynMicHeading("Cost Sheet Detail View");
     await sShot.takeScreenshot(page,testInfo,"Cost Sheet updates captured")
    const timelineData6 = await captureTimelineUpdates(page, testInfo,"Cost sheet updates");
    expect(timelineData6.length).toBeGreaterThan(0);
    await relMod.relModule(3);
    await relMod.clickAddIconRelMod();
    await relMod.clickTheSearchInQucikcreate();
    await dynmicModule.saveBtn();
    await page.reload();
     await dynmicModule.dynMicHeading("Cost Sheet Detail View");
    await sShot.takeScreenshot(page,testInfo,"Cost Sheet updates captured after the quick Create")
    const timelineData4 = await captureTimelineUpdates(page, testInfo,"Cost Sheet updates after the quick rate");
    expect(timelineData4.length).toBeGreaterThan(0);
    await relMod.relModule(3);
    await relMod.clickRelModRow();
    await dynmicModule.dynMicHeading("Booking Information Detail View");
    await sShot.takeScreenshot(page,testInfo,"Booking module updates captured")
    const timelineData5 = await captureTimelineUpdates(page, testInfo,"Booking module updates");
    expect(timelineData5.length).toBeGreaterThan(0);
    await singleEditIcon.updateDetailPicklistByLabel("Status","Approved");
    await singleEditIcon.clickRelamodulEyeIcon("Unit");
    await page.reload()
    // const timelineData6 = await captureTimelineUpdates(page, testInfo,"Unit updates captured");
    // expect(timelineData6.length).toBeGreaterThan(0);
    // await sShot.takeScreenshot(page,testInfo,"Update module updates captured")
    // await relMod.relModule(5)
    // await dynmicModule.dynMicHeading("Unit Detail View");
    })
})
