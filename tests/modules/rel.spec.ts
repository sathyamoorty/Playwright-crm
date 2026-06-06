import {test,expect} from '@playwright/test'
import { LoginPage } from '@pages/auth/login'
import { navToModule } from '@pages/modules/navToMod'
import { relatedModule as relatedTabModule } from '@pages/related/related'
import { relatedModule } from '@pages/related/relatedMod'

test.describe("related",()=>{
    test("related",async({page})=>{
        const logIn=new LoginPage(page);
        const nav=new navToModule(page);
        const relMod=new relatedModule(page);
        const rel=new relatedTabModule(page);
        await logIn.loginPage();
        await logIn.login("DVJ", "rsoft", "RSoft!@3456");
        await nav.waitForDashboardReady();
        await nav.menuIcon();
        await nav.dynMod(1);
        await relMod.editFirstRow()
        const capturedTabs = await rel.captureRelatedTabs();
        await rel.runRelatedActions(capturedTabs);

    })
})