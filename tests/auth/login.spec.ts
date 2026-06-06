import {expect, test} from '@playwright/test';  
import { LoginPage } from '@pages/auth/login'

test.describe("loginPage",()=>{

    test("login with invalid company name",async ({page})=>{
        const loginFun = new LoginPage(page);
        await loginFun.loginPage();
        await loginFun.login("1234567890", "rsoft", "RSoft!@345");
        // const toastMessage = await toasterMess(page);
        // expect(toastMessage).toContain("Incorrect Company Name");
    });

    test("login with invalid user name", async({page})=>
    {
        const loginUser = new LoginPage(page);
        await loginUser.loginPage();
        await loginUser.login("SATHYAMOORTHY", "Krish", "RSoft!@345");
        // const toastMessage = await toasterMess(page);
        // expect(toastMessage).toContain("Incorrect User Name or Password");
    });

    test("login with invalid password", async({page})=>
    {
        const loginPass = new LoginPage(page);
        await loginPass.loginPage();
        await loginPass.login("SATHYAMOORTHY", "rsoft", "RSoft");
        // const toastMessage = await toasterMess(page);
        // expect(toastMessage).toContain("Incorrect User Name or Password");
    });
    test("login only clicking the login button", async({page})=>
    {
        const loginBtn = new LoginPage(page);
        await loginBtn.loginPage();
        await loginBtn.clickLoginBtn();
        // const toastMessage = await toasterMess(page);
        // expect(toastMessage).toContain("Please Enter Company Name");
    });

    test("login with valid credentials", async({page})=>
    {
        const loginValid = new LoginPage(page);
        await loginValid.loginPage();
        await loginValid.login("SATHYAMOORTHY", "rsoft", "RSoft!@345");
        const url = page.url();
        expect(url).toBe("https://rdot.in/public/admin/Dashboard");
        console.log("url is: "+url);
    })

});