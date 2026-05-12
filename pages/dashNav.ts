// import { Page,expect } from "@playwright/test";
// import { navToModule } from "./navToMod";

// export class dashBoardNav{
//     constructor (private page:Page){}
    
//     async dashBoardNav(){
//         const clk=new navToModule(this.page);
//         await clk.waitForDashboardReady();
//         const allEnquiryCard = this.page
//             .getByText("All Enquiry", { exact: true })
//             .locator("xpath=ancestor::div[contains(@class, 'clicko')][1]");

//         await expect(allEnquiryCard).toBeVisible();
//         await this.page.locator("#dashboardfilter").evaluate((input) => {
//             (input as HTMLInputElement).value = "Same Tab";
//         });
//         await allEnquiryCard.click();
//         await expect(this.page).toHaveURL(/Module=Enquiry/i);
//         await clk.waitForAppReady();
//     }
// }
