// import { Locator, Page, expect } from "@playwright/test";
// import mod from "../data/modules.json"



// export class widgetCrt{

//     constructor (private page:Page){}
    
// //     async clickMod(index: number) {
// //   const moduleName = mod[index];

// //   if (!moduleName) {
// //     throw new Error(`Module index ${index} not found in modules.json`);
// //   }

// //   const moduleId = moduleName
// //     .trim()
// //     .split(/\s+/)
// //     .map((word, index) => index === 0 ? word : word.toLowerCase())
// //     .join("_");

// //   const moduleLink = this.page
// //     .locator(`a[href*="Module=${moduleId}"]`)
// //     .filter({ hasText: moduleName })
// //     .first();

// //   await moduleLink.click();
// //   await expect(this.page).toHaveURL(new RegExp(`Module=${moduleId}`, "i"));
// // }
//     async clickMod(index:number){
//      const moduleName = mod[index];

//         if (!moduleName) {
//             throw new Error(`Module index ${index} not found in modules.json`);
//         }

//         await this.page.locator('id=MoreMod_' + moduleName).click();
//    }

//     async openCreateWidget(index:number){
//         // await this.dashIcon();
//         await this.clickMod(index);
//         await this.clickWid();
//         await this.clickAdd();
//         await expect(this.page.locator('#widgetname')).toBeVisible({ timeout: 30000 });
//     }
    
//     async dashIcon(){
//         await this.page.getByRole('link',{name:"home",exact:true}).click();
//         await expect(this.page).toHaveURL(/\/admin\/Dashboard/i);
//     }
//     async clickWid(){
//         await this.page.getByRole('link',{name:"widgets",exact:true}).click();
//         await expect(this.page.locator("#createWidget")).toBeVisible({ timeout: 30000 });
//     }
//     async clickAdd(){
//         await this.page.locator("[id='createWidget']").click();
//         await expect(this.page.locator('#widgetname')).toBeVisible({ timeout: 30000 });
//         // await this.page.getByRole('link',{name:"add",exact:true}).click();
//     }
//     async tempField(widgetNames:string){
//         await expect(this.page.locator('#widgetname')).toBeVisible();
//         await this.page.locator('#widgetname').fill(widgetNames);
//     }
//     async nextBtn(){
//         await this.page.getByRole('button',{name:"Next"}).click();   
//     }

//     async step2(fieldIndex = 0, operatorIndex = 0) {
//         // const allConditions = this.page.locator("#content-andcon");
//         const allConditions = this.page.getByLabel('widgets Widgets').locator('#content-andcon')
//         await expect(allConditions).toBeVisible({ timeout: 15000 });
//         await allConditions.getByRole("button", { name: "Add Condition" }).click();

//         const dropdowns = allConditions.locator(".select2-selection");
//         await expect(dropdowns).toHaveCount(3, { timeout: 15000 });

//         await this.pickSelect2ByIndex(dropdowns.nth(0), fieldIndex);
//         await this.pickSelect2ByIndex(dropdowns.nth(1), operatorIndex);
//         // await this.pickSelect2ByIndex(dropdowns.nth(2), valueIndex);

//         await this.page.getByRole("button", { name: "Next" }).click();
//     }

//     private async pickSelect2ByIndex(trigger: Locator, index: number) {
//         await trigger.scrollIntoViewIfNeeded();
//         await trigger.click();

//         const options = this.page.locator(
//             '.select2-container--open .select2-results__option[role="treeitem"]:not(.select2-results__option--disabled)',
//         );
//         await expect(options.nth(index)).toBeVisible({ timeout: 15000 });
//         await options.nth(index).click();
//         await expect(this.page.locator(".select2-container--open")).toHaveCount(0, { timeout: 5000 });
//     }

//     async subBtn() {
//         await this.page.getByRole("button", { name: "Submit" }).click();
//         await expect(this.page.locator("#widgetname")).toBeHidden({ timeout: 15000 });
//     }

    /** Scroll until the new widget (by unique id in name) is in DOM, then maximize that card only. */
    // async maximizeLastWidget(widgetName: string) {
    //     await expect(this.page.locator("#createWidget")).toBeVisible({ timeout: 15000 });

//         const widgetId = widgetName.replace(/^TestMessage-?/i, "").trim();
        // const createdTitle = this.page.locator("h4.card-title").filter({ hasText: widgetId });

//         await expect.poll(
//             async () => {
//                 await this.scrollMainWidgetAreaToBottom();
                // return (await createdTitle.count()) > 0;
//             },
            // { timeout: 25000, intervals: [200, 400, 600] },
//         ).toBe(true);

        // const title = createdTitle.last();
        // await title.scrollIntoViewIfNeeded();
        // await expect(title).toBeVisible({ timeout: 10000 });

        // const widgetCard = title.locator(
        //     'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " card ")][1]',
        // );
        // await expect(widgetCard).toBeVisible({ timeout: 10000 });

//         await widgetCard.hover();
//         await this.page.waitForTimeout(150);

//         const clicked = await widgetCard.evaluate((card) => {
//             const icon = card.querySelector("i.ft-maximize");
//             if (!icon) {
//                 return false;
//             }
//             const clickable = (icon.closest("a") ?? icon.closest("button") ?? icon) as HTMLElement;
//             clickable.dispatchEvent(
//                 new MouseEvent("click", { bubbles: true, cancelable: true, view: window }),
//             );
//             return true;
//         });

//         if (!clicked) {
//             await widgetCard.locator("i.ft-maximize, a:has(.ft-maximize)").first().click({
//                 force: true,
//                 timeout: 5000,
//             });
//         }

        // await this.waitForMaximizedWidgetReady();
//     }

//     /** Dashboard widgets often live in a nested scrollable panel, not the window. */
//     public async scrollMainWidgetAreaToBottom() {
//         await this.page.mouse.wheel(0, 400);
//         await this.page.evaluate(() => {
//             const roots: Element[] = [
//                 document.querySelector("#idgetsTap .tab-pane.active"),
//                 document.querySelector("#idgetsTap"),
//                 document.querySelector('[role="tabpanel"]'),
//                 document.scrollingElement ?? document.documentElement,
//                 document.documentElement,
//             ].filter(Boolean) as Element[];

//             for (const root of roots) {
//                 const el = root as HTMLElement;
//                 if (el.scrollHeight > el.clientHeight + 20) {
//                     el.scrollTop = el.scrollHeight;
//                 }
//             }
//             window.scrollTo(0, document.documentElement.scrollHeight);
//         });
//     }

    /** Brief settle after fullscreen so chart can paint (3–4s). */
    // private async waitForMaximizedWidgetReady() {
    //     await this.page.waitForTimeout(3500);
    // }
//   async closeMaximizedWidget() {
//     const minimizeVisible = this.page.locator("i.ft-minimize").filter({ visible: true })

//     if ((await minimizeVisible.count()) > 0) {
//       await minimizeVisible
//         .first()
//         .evaluate((icon) => (icon as HTMLElement).click())
//       await expect(minimizeVisible)
//         .toHaveCount(0, { timeout: 10_000 })
//         .catch(() => {})
//     } else {
//       await this.page.keyboard.press("Escape")
//     }

//     await this.page.keyboard.press("Escape")
//     await this.page.waitForTimeout(200)
//   }
//     /**
    //  * After maximizeLastWidget(): click chart → Leads module view.
    //  * Returns the page to use next (new tab if opened, otherwise same page).
//      */
//     async clickMaximizedWidgetToModuleList(_moduleIndex = 1): Promise<Page> {
//         const maximizedCard = this.page
//             .locator(".card")
//             .filter({ has: this.page.locator("i.ft-minimize").filter({ visible: true }) })
//             .last();

//         const bar = maximizedCard.locator(".apexcharts-series path").first();
//         const newTab = this.page.context().waitForEvent("page", { timeout: 10_000 }).catch(() => null);

//         await bar.click({ force: true, timeout: 15_000 });

//         const modulePage = (await newTab) ?? this.page;
//         await modulePage.waitForLoadState("domcontentloaded");
//         this.page = modulePage;
//         return modulePage;
//     }
// }
import { Locator, Page, expect } from "@playwright/test";
import mod from "../data/modules.json"



export class widgetCrt{

    constructor (private page:Page){}
    
//     async clickMod(index: number) {
//   const moduleName = mod[index];

//   if (!moduleName) {
//     throw new Error(`Module index ${index} not found in modules.json`);
//   }

//   const moduleId = moduleName
//     .trim()
//     .split(/\s+/)
//     .map((word, index) => index === 0 ? word : word.toLowerCase())
//     .join("_");

//   const moduleLink = this.page
//     .locator(`a[href*="Module=${moduleId}"]`)
//     .filter({ hasText: moduleName })
//     .first();

//   await moduleLink.click();
//   await expect(this.page).toHaveURL(new RegExp(`Module=${moduleId}`, "i"));
// }
async clickMod(index:number){
    const moduleName = mod[index];

       if (!moduleName) {
           throw new Error(`Module index ${index} not found in modules.json`);
       }

       await this.page.locator('id=MoreMod_' + moduleName).click();
  }

   async openCreateWidget(index:number){
       await this.dashIcon();
       await this.clickMod(index);
       await this.clickWid();
       await this.clickAdd();
       await expect(this.page.locator('#widgetname')).toBeVisible({ timeout: 30000 });
   }
   
   async dashIcon(){
       await this.page.getByRole('link',{name:"home",exact:true}).click();
       await expect(this.page).toHaveURL(/\/admin\/Dashboard/i);
   }
   async clickWid(){
       await this.page.getByRole('link',{name:"widgets",exact:true}).click();
       await expect(this.page.locator("#createWidget")).toBeVisible({ timeout: 30000 });
   }
   async clickAdd(){
       await this.page.locator("[id='createWidget']").click();
       await expect(this.page.locator('#widgetname')).toBeVisible({ timeout: 30000 });
       // await this.page.getByRole('link',{name:"add",exact:true}).click();
   }
   async tempField(widgetNames:string){
       await expect(this.page.locator('#widgetname')).toBeVisible();
       await this.page.locator('#widgetname').fill(widgetNames);
   }
   async nextBtn(){
       await this.page.getByRole('button',{name:"Next"}).click();   
   }

   async step2(fieldIndex = 0, operatorIndex = 0) {
       const allConditions = this.page.locator("#content-andcon");
       await expect(allConditions).toBeVisible({ timeout: 15000 });
       await allConditions.getByRole("button", { name: "Add Condition" }).click();

       const dropdowns = allConditions.locator(".select2-selection");
       await expect(dropdowns).toHaveCount(3, { timeout: 15000 });

       await this.pickSelect2ByIndex(dropdowns.nth(0), fieldIndex);
       await this.pickSelect2ByIndex(dropdowns.nth(1), operatorIndex);
       // await this.pickSelect2ByIndex(dropdowns.nth(2), valueIndex);

       await this.page.getByRole("button", { name: "Next" }).click();
   }

   private async pickSelect2ByIndex(trigger: Locator, index: number) {
       await trigger.scrollIntoViewIfNeeded();
       await trigger.click();

       const options = this.page.locator(
           '.select2-container--open .select2-results__option[role="treeitem"]:not(.select2-results__option--disabled)',
       );
       await expect(options.nth(index)).toBeVisible({ timeout: 15000 });
       await options.nth(index).click();
       await expect(this.page.locator(".select2-container--open")).toHaveCount(0, { timeout: 5000 });
   }

   async subBtn() {
       await this.page.getByRole("button", { name: "Submit" }).click();
       await expect(this.page.locator("#widgetname")).toBeHidden({ timeout: 15000 });
   }

   /** Scroll until the new widget (by unique id in name) is in DOM, then maximize that card only. */
   async maximizeLastWidget(widgetName: string) {
       await expect(this.page.locator("#createWidget")).toBeVisible({ timeout: 15000 });

       const widgetId = widgetName.replace(/^TestMessage-?/i, "").trim();
       const createdTitle = this.page.locator("h4.card-title").filter({ hasText: widgetId });

       await expect.poll(
           async () => {
               await this.scrollMainWidgetAreaToBottom();
               return (await createdTitle.count()) > 0;
           },
           { timeout: 25000, intervals: [200, 400, 600] },
       ).toBe(true);

       const title = createdTitle.last();
       await title.scrollIntoViewIfNeeded();
       await expect(title).toBeVisible({ timeout: 10000 });

       const widgetCard = title.locator(
           'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " card ")][1]',
       );
       await expect(widgetCard).toBeVisible({ timeout: 10000 });

       await widgetCard.hover();
       await this.page.waitForTimeout(150);

       const clicked = await widgetCard.evaluate((card) => {
           const icon = card.querySelector("i.ft-maximize");
           if (!icon) {
               return false;
           }
           const clickable = (icon.closest("a") ?? icon.closest("button") ?? icon) as HTMLElement;
           clickable.dispatchEvent(
               new MouseEvent("click", { bubbles: true, cancelable: true, view: window }),
           );
           return true;
       });

       if (!clicked) {
           await widgetCard.locator("i.ft-maximize, a:has(.ft-maximize)").first().click({
               force: true,
               timeout: 5000,
           });
       }

       await this.waitForMaximizedWidgetReady();
   }

   /** Dashboard widgets often live in a nested scrollable panel, not the window. */
   public async scrollMainWidgetAreaToBottom() {
       await this.page.mouse.wheel(0, 400);
       await this.page.evaluate(() => {
           const roots: Element[] = [
               document.querySelector("#idgetsTap .tab-pane.active"),
               document.querySelector("#idgetsTap"),
               document.querySelector('[role="tabpanel"]'),
               document.scrollingElement ?? document.documentElement,
               document.documentElement,
           ].filter(Boolean) as Element[];

           for (const root of roots) {
               const el = root as HTMLElement;
               if (el.scrollHeight > el.clientHeight + 20) {
                   el.scrollTop = el.scrollHeight;
               }
           }
           window.scrollTo(0, document.documentElement.scrollHeight);
       });
   }

   /** Brief settle after fullscreen so chart can paint (3–4s). */
   private async waitForMaximizedWidgetReady() {
       await this.page.waitForTimeout(3500);
   }
   /** Maximized card only (ft-minimize visible). */
   private maximizedWidgetCard(widgetName: string) {
       const widgetId = widgetName.replace(/^TestMessage-?/i, "").trim();
       return this.page
           .locator(".card")
           .filter({ has: this.page.locator("i.ft-minimize").filter({ visible: true }) })
           .filter({ has: this.page.locator("h4.card-title").filter({ hasText: widgetId }) })
           .last();
   }

   /**
    * After maximizeLastWidget(): click the chart inside the maximized widget only.
    * Does not use the widgets tab or module menu — stays scoped to the max view card.
    */
   async clickMaximizedWidget(widgetName: string): Promise<Page> {
       const maximizedCard = this.maximizedWidgetCard(widgetName);
       await expect(maximizedCard).toBeVisible({ timeout: 15000 });

       const chartBar = maximizedCard.locator(".apexcharts-series path").first();
       await expect(chartBar).toBeVisible({ timeout: 15000 });

       const newTab = this.page.context().waitForEvent("page", { timeout: 10_000 }).catch(() => null);
       await chartBar.click({ force: true, timeout: 15_000 });

       const modulePage = (await newTab) ?? this.page;
       await modulePage.waitForLoadState("domcontentloaded");
       return modulePage;
   }

 async closeMaximizedWidget() {
   const minimizeVisible = this.page.locator("i.ft-minimize").filter({ visible: true })

   if ((await minimizeVisible.count()) > 0) {
     await minimizeVisible
       .first()
       .evaluate((icon) => (icon as HTMLElement).click())
     await expect(minimizeVisible)
       .toHaveCount(0, { timeout: 10_000 })
       .catch(() => {})
   } else {
     await this.page.keyboard.press("Escape")
   }

   await this.page.keyboard.press("Escape")
   await this.page.waitForTimeout(200)
 }
}

