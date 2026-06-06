import { test, expect } from '@fixtures'
import { navToModule } from '@pages/modules/navToMod'
import {dataDr} from '@pages/modules/uiTypeId'
import { relatedModule } from '@pages/related/relatedMod'
import {captureTimelineUpdates} from '@utils/helpers/captureUpdates'
import {book} from '@pages/modules/flows'
import { takeScreenshot } from '@utils/helpers/screenshot'
import { dashBoardNav } from '@pages/dashboard/dashNav'
import { widgetCrt } from '@pages/dashboard/widget'
import {ans} from '@pages/modules/ans'
import { filterDash } from '@pages/dashboard/filter'
import { TargetPage } from '@pages/dashboard/target'
import { Book } from '@pages/modules/singleEdit'
import {runQuickActionsFromListView,detailView,submodule,globalSearch, SMSModalPage,} from '@pages/quick-actions/ActionPage';
import { runListViewFilter } from '@pages/modules/listViewFilter'
import {monitorContextForNetworkErrors,logNetworkErrorSummary,type NetworkError,} from '@utils/helpers/networkMonitor'
import { runDashboardcount } from '@pages/dashboard/Dashboardcount'
import { CaptureModulesPage } from '@pages/capture/capture-modules'
import { publishFlowExecutionReport } from '@utils/reporting/publish-execution-report'
import { validateModulesCaptured } from '@validators/capture-modules.validator'
import { Dependency } from '@pages/modules/Dependency'

test.describe("module",()=>{
    // 60 min — includes capture-all-modules flow + remaining flows (see npm run test:module:slow)
    test.describe.configure({ timeout: 60 * 60 * 1000 });

    test("login", async ({ dashboardPage: page, context }, testInfo) => {
    const networkErrors: NetworkError[] = [];
    monitorContextForNetworkErrors(context, networkErrors);

    try {
    const dashNav=new dashBoardNav(page);
    const sShot={takeScreenshot};
    const dashboardModule=new navToModule(page);
    const capture = new CaptureModulesPage(page);
    const modules = await capture.captureModules();
    validateModulesCaptured(modules);
    await capture.runCreateForAllModules(modules, testInfo);
    await publishFlowExecutionReport(testInfo, capture);
    await dashboardModule.waitForDashboardReady();
    const newPage = await dashNav.openCardInNewPage(0, 'New Enquiry');
    const dynmicModule=new navToModule(newPage)
    const uiTypeId=new dataDr(newPage);
    const relMod=new relatedModule(newPage);
    const singleEditIcon=new book(newPage);
    const dashIcon=new widgetCrt(newPage)
    const ranDrop=new ans(newPage);
    const filter=new filterDash(newPage)
    const targetData=new TargetPage(newPage);
    const suffix = Date.now().toString().slice(-6);
    const widgetNames = `TestMessage-${suffix}`;
    const TargetName = `Target_${Date.now()}`;
    const TargetValue = Math.floor(Math.random() * 100).toString();
    await dynmicModule.dynamicAddBtn();
    await uiTypeId.fillCurrentModuleFields();
    await dynmicModule.saveBtn();
    await sShot.takeScreenshot(newPage,testInfo,"Enquiry updates captured");
    const timelineData = await captureTimelineUpdates(newPage, testInfo,"Enquiry updates");
    expect(timelineData.length).toBeGreaterThan(0);
    await relMod.relModule(1);
    await dynmicModule.menuIcon();
    await dynmicModule.dynMod(1);
    await new Dependency(newPage).runPicklistDependencyFlow();
    await relMod.editFirstRow();
                   //await dynmicModule.dynMicHeading("Leads Detail View");
    await new Book(newPage).runFromTestdata();
    await sShot.takeScreenshot(newPage,testInfo,"Leads updates captured") 
    const timelineData1 = await captureTimelineUpdates(newPage, testInfo,"Leads updates");
    expect(timelineData1.length).toBeGreaterThan(0);
    const commentText = await relMod.fillComments();
    console.log('Random comment used:', commentText);
    await relMod.post();
    await sShot.takeScreenshot(newPage,testInfo,"Lead follwup Comments") 
    await relMod.clkQuickAct();
                        //await dynmicModule.dynMicHeading("Quick Action")
    await relMod.scrollView()
    await relMod.selectDropdownByLabel1("Lead Status","Site Visit Scheduled");
    await dynmicModule.saveBtn()
    await newPage.reload();
                       //await dynmicModule.dynMicHeading("Leads Detail View");
    await sShot.takeScreenshot(newPage,testInfo,"Lead updates captured after quick action")
    const timelineData2 = await captureTimelineUpdates(newPage, testInfo,"Lead updates after quick action");
    expect(timelineData2.length).toBeGreaterThan(0);
    await dynmicModule.menuIcon();
    await dynmicModule.dynMod(3)
    await relMod.editFirstRow();
    await newPage.reload();
                          //await dynmicModule.dynMicHeading("Site Visit Detail View");
    await singleEditIcon.updateDetailPicklistByLabel("Site Visit Status","Booked")
    await newPage.reload();
                  //await dynmicModule.dynMicHeading("Site Visit Detail View");
    await sShot.takeScreenshot(newPage,testInfo,"Site Visit updates captured")
    const timelineData3 = await captureTimelineUpdates(newPage, testInfo,"Site Visit updates");
    expect(timelineData3.length).toBeGreaterThan(0);
    await relMod.relModule(5);
    await relMod.clickRelModRow();
                     //await dynmicModule.dynMicHeading("Cost Sheet Detail View");
     await sShot.takeScreenshot(newPage,testInfo,"Cost Sheet updates captured")
    const timelineData6 = await captureTimelineUpdates(newPage, testInfo,"Cost sheet updates");
    expect(timelineData6.length).toBeGreaterThan(0);
    await relMod.relModule(3);
    await relMod.clickAddIconRelMod();
    await relMod.clickTheSearchInQucikcreate();
    await dynmicModule.saveBtn();
    await newPage.reload();
                            //await dynmicModule.dynMicHeading("Cost Sheet Detail View");
    await sShot.takeScreenshot(newPage,testInfo,"Cost Sheet updates captured after the quick Create")
    const timelineData4 = await captureTimelineUpdates(newPage, testInfo,"Cost Sheet updates after the quick rate");
    expect(timelineData4.length).toBeGreaterThan(0);
    await relMod.relModule(3);
    await relMod.clickRelModRow();
    await sShot.takeScreenshot(newPage,testInfo,"Booking module updates captured")
    const timelineData5 = await captureTimelineUpdates(newPage, testInfo,"Booking module updates");
    expect(timelineData5.length).toBeGreaterThan(0);
    await singleEditIcon.updateDetailPicklistByLabel("Status","Approved");
    await newPage.reload()
                          //await dynmicModule.dynMicHeading("Booking Information Detail View");
    await newPage.reload();
    const timelineData7 = await captureTimelineUpdates(newPage, testInfo,"Email executed in the booking module");
    expect(timelineData7.length).toBeGreaterThan(0);
    await sShot.takeScreenshot(newPage,testInfo,"Booking updates captured after the alotment letter executed")
    await dashIcon.dashIcon();
    await dashIcon.clickMod(1)
    await filter.filterateBtn();
    await filter.filterBox();
    await targetData.dismissCustomizerOverlays();
    await targetData.clickTarget();
    await targetData.addtarget()
    await targetData.Title(TargetName)
    await targetData.format()
    await targetData.targetvalue(TargetValue)
    await targetData.Next()
    await targetData.addcondition() 
    await targetData.selectOperator()
    await targetData.Next();
    await targetData.Accesswith()
    await targetData.clicksubmit();
    await targetData.maximizeTargetCard(TargetName);
    await sShot.takeScreenshot(newPage, testInfo, "Target maximized");
    await dashIcon.closeMaximizedWidget();
    await dashIcon.openCreateWidget(1);
    await dashIcon.tempField(widgetNames);
    await relMod.selectDropdownByLabel("Chart Size", "col-6");
    await relMod.selectDropdownByLabel("Select X-axis column","Created By");
    await relMod.selectDropdownByLabel("Chart Type","Bar Chart");
    await sShot.takeScreenshot(newPage,testInfo,"Widget creation in the first step")
    await dashIcon.nextBtn();
    await dashIcon.step2(1, 1);
    await sShot.takeScreenshot(newPage,testInfo,"Widget creation in the Second step")
                                 //await dynmicModule.dynMicHeading(" Sharing ");
    // await sShot.takeScreenshot(newPage,testInfo,"Widget creation in the third step")
    await dashIcon.subBtn();
    await dashIcon.maximizeLastWidget(widgetNames);
    await sShot.takeScreenshot(newPage, testInfo, "Widget maximized");
                       // await dashIcon.closeMaximizedWidget();
    const leadsPage = await dashIcon.clickMaximizedWidget(widgetNames);
    const leadsModule = new navToModule(leadsPage);
                       //await leadsModule.dynMicHeading('Leads');
    const sms = new SMSModalPage(leadsPage);
    await runQuickActionsFromListView(leadsPage);
    await detailView(leadsPage);
    await submodule(leadsPage);
    await globalSearch(leadsPage);
    await sms.clickX();

    console.log("Running dashboard count");
    await runDashboardcount(leadsPage);
    console.log("Dashboard count completed");
    // await leadsPage.close();

    
                     // await dynmicModule.menuIcon();
    // await sms.menuIcon1();
    // await dynmicModule.dynMod(1);
                 // await leadsPage.bringToFront();
                 // await leadsPage.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
                 //await leadsModule.dynMicHeading('Leads');
    // await runListViewFilter(leadsPage, 3);
    

  await sShot.takeScreenshot(leadsPage, testInfo, 'Widget opened module list view after quick actions');

    } finally {
        logNetworkErrorSummary(networkErrors, 'module login');
    }

})
})
