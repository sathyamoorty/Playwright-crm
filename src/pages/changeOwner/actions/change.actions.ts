import { expect, type Page } from '@playwright/test';
import { goToLeadsModule } from '@pages/quick-actions/ActionPage';
import { ChangeOwnerLocators } from '../locators/change.locators';

export type PermissionState = 'on' | 'off';

/**
 * UI actions for Change Owner — list view selection, popup, transfer, profile privileges.
 */
export class ChangeOwnerActions {
  private readonly locators: ChangeOwnerLocators;

  constructor(private readonly page: Page) {
    this.locators = new ChangeOwnerLocators(page);
  }

  async waitForAppReady(timeout = 60_000): Promise<void> {
    await this.locators.livewireOverlay().waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  /** Navigate to Leads module list view (via sidebar menu). */
  async openLeadsListView(): Promise<void> {
    await this.waitForAppReady();
    await goToLeadsModule(this.page);
    await this.waitForAppReady();
    await expect(this.page).toHaveURL(/AdvancedListView|Module=Leads/i, { timeout: 30_000 });
    await expect(this.locators.dataRows().first()).toBeVisible({ timeout: 30_000 });
  }

  async selectRecord(index = 0): Promise<void> {
    const checkbox = this.locators.rowCheckbox(index);
    await expect(checkbox).toBeVisible({ timeout: 15_000 });
    if (!(await checkbox.isChecked())) {
      await checkbox.check({ force: true });
    }
    await this.waitForAppReady(15_000);
  }

  async selectRecords(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.selectRecord(i);
    }
  }

  async unselectRecord(index = 0): Promise<void> {
    const checkbox = this.locators.rowCheckbox(index);
    if (await checkbox.isChecked()) {
      await checkbox.uncheck({ force: true });
    }
    await this.waitForAppReady(10_000);
  }

  async selectAllRecords(): Promise<void> {
    const header = this.locators.headerCheckbox();
    await expect(header).toBeVisible({ timeout: 10_000 });
    if (!(await header.isChecked())) {
      await header.check({ force: true });
    }
    await this.waitForAppReady(15_000);
  }

  async expectToolbarWithChangeOwner(): Promise<void> {
    await expect(this.locators.cancelToolbarButton()).toBeVisible({ timeout: 15_000 });
    await expect(this.locators.changeOwnerButton()).toBeVisible({ timeout: 15_000 });
  }

  async expectChangeOwnerHidden(): Promise<void> {
    await expect(this.locators.changeOwnerButton()).toBeHidden({ timeout: 15_000 });
  }

  async expectToolbarClosed(): Promise<void> {
    await expect(this.locators.cancelToolbarButton()).toBeHidden({ timeout: 10_000 });
    await expect(this.locators.changeOwnerButton()).toBeHidden({ timeout: 10_000 });
    await expect(this.locators.moreActionsButton()).toBeVisible({ timeout: 10_000 });
  }

  async openChangeOwnerPopup(): Promise<void> {
    const modal = this.locators.changeOwnerModal();
    if (!(await modal.isVisible().catch(() => false))) {
      await this.locators.changeOwnerButton().click();
    }
    await expect(modal).toBeVisible({ timeout: 20_000 });
  }

  async closePopupViaCancel(): Promise<void> {
    await this.locators.modalCancelButton().click();
    await expect(this.locators.changeOwnerModal()).toBeHidden({ timeout: 15_000 });
  }

  async closePopupViaCloseIcon(): Promise<void> {
    await this.locators.modalCloseButton().click();
    await expect(this.locators.changeOwnerModal()).toBeHidden({ timeout: 15_000 });
  }

  async expectPopupStructure(selectedCount: number): Promise<void> {
    const modal = this.locators.changeOwnerModal();
    await expect(modal).toBeVisible();
    await expect(this.locators.modalHeader()).toContainText(/change owner/i);
    await expect(this.locators.modalHeader()).toContainText(String(selectedCount));
    await expect(this.locators.modalCloseButton()).toBeVisible();
    await expect(this.locators.transferToLabel()).toBeVisible();
    await expect(this.locators.transferToField()).toBeVisible();
    await expect(this.locators.modalCancelButton()).toBeVisible();
    await expect(this.locators.chosenRecordLabel()).toBeVisible();
  }

  async openTransferToDropdown(): Promise<void> {
    const search = this.locators.dropdownSearchInput();
    if (await search.isVisible().catch(() => false)) {
      return;
    }

    await this.locators.transferToField().click();
    await expect(search).toBeVisible({ timeout: 15_000 });
  }

  /** Inline dropdown stays open after selection and overlays Transfer — collapse it first. */
  async closeTransferToDropdown(): Promise<void> {
    const search = this.locators.dropdownSearchInput();
    if (!(await search.isVisible().catch(() => false))) {
      return;
    }

    await this.locators.modalHeader().click();
    await expect(search).toBeHidden({ timeout: 10_000 });
  }

  async expectDropdownHasSearchAndSelectAll(): Promise<void> {
    await expect(this.locators.dropdownSearchInput()).toBeVisible({ timeout: 10_000 });
    await expect(this.locators.selectAllOption()).toBeVisible({ timeout: 10_000 });
  }

  async searchUserInDropdown(query: string): Promise<void> {
    const search = this.locators.dropdownSearchInput();
    await search.fill(query);
    await this.page.waitForTimeout(500);
  }

  async selectUserFromDropdown(name: string | RegExp): Promise<void> {
    const option = this.locators.userOption(name);
    await expect(option).toBeVisible({ timeout: 15_000 });
    await option.click({ force: true });
    await this.closeTransferToDropdown();
  }

  async selectFirstAvailableUser(): Promise<string> {
    await this.openTransferToDropdown();
    const options = this.locators.dropdownOptions().filter({ hasNotText: /select all/i });
    const first = options.first();
    await expect(first).toBeVisible({ timeout: 15_000 });
    const label = (await first.innerText()).trim();
    await first.click({ force: true });
    await this.closeTransferToDropdown();
    return label;
  }

  async selectAllUsersInDropdown(): Promise<void> {
    await this.openTransferToDropdown();
    await this.locators.selectAllOption().click({ force: true });
    await this.closeTransferToDropdown();
  }

  /** Transfer stays visible; it is disabled until a user is chosen. */
  async expectTransferButtonVisible(): Promise<void> {
    const btn = this.locators.modalTransferButton();
    await expect(btn).toBeVisible({ timeout: 10_000 });
    await expect(btn).toBeEnabled({ timeout: 10_000 });
  }

  async expectTransferButtonHidden(): Promise<void> {
    const btn = this.locators.modalTransferButton();
    await expect(btn).toBeVisible({ timeout: 10_000 });
    await expect(btn).toBeDisabled({ timeout: 10_000 });
  }

  async clickTransfer(): Promise<void> {
    await this.closeTransferToDropdown();
    const btn = this.locators.modalTransferButton();
    await expect(btn).toBeEnabled({ timeout: 10_000 });
    await btn.click();
  }

  async expectTransferProgressOrSuccess(): Promise<void> {
    await expect(
      this.locators.successHeading().or(this.locators.progressBar()),
    ).toBeVisible({ timeout: 30_000 });
  }

  async waitForTransferComplete(timeout = 120_000): Promise<void> {
    await expect(this.locators.successHeading()).toBeVisible({ timeout });
  }

  /** Assert list-view Assigned To matches the user chosen in the Change Owner dropdown. */
  async expectRecordAssignedTo(rowIndex: number, userName: string | RegExp): Promise<void> {
    await this.waitForAppReady(30_000);
    const cell = this.locators.assignedToCell(rowIndex);
    await expect(cell).toBeVisible({ timeout: 30_000 });
    await expect(cell).toContainText(userName);
  }

  // ---- Profile privileges ----------------------------------------------------

  /** Dismiss the module-privileges overlay so it does not block navigation clicks. */
  async closeProfileModulePopup(): Promise<void> {
    const popup = this.locators.profileModulePopup();
    if (!(await popup.isVisible().catch(() => false))) {
      return;
    }

    // × uses data-dismiss="modal" and can hang Playwright on pending navigation — reload instead.
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.waitForAppReady();
    await expect(popup).toBeHidden({ timeout: 15_000 });
  }

  async openProfileList(): Promise<void> {
    await this.waitForAppReady();
    await this.closeProfileModulePopup();

    if (/Module=Profile/i.test(this.page.url())) {
      await expect(this.locators.profilesHeading()).toBeVisible({ timeout: 20_000 });
      return;
    }

    if (/SettingDashboard|parent=Setting/i.test(this.page.url())) {
      await this.locators.profileNav().click();
      await expect(this.page).toHaveURL(/Module=Profile/i, { timeout: 20_000 });
      await expect(this.locators.profilesHeading()).toBeVisible({ timeout: 20_000 });
      return;
    }

    await this.locators.profileMenu().click();
    await this.locators.crmSettingsLink().click();
    await this.locators.userAccessControl().click();
    await this.locators.profileNav().click();
    await expect(this.page).toHaveURL(/Module=Profile/i, { timeout: 20_000 });
    await expect(this.locators.profilesHeading()).toBeVisible({ timeout: 20_000 });
  }

  /** Click the category (module privileges) icon on the Profiles list row. */
  async openProfileModulePrivileges(profileName: string): Promise<void> {
    const privilegesTable = this.locators.modulePrivilegesTable();
    const heading = this.locators.modulePrivilegesHeading(profileName);

    if (
      (await privilegesTable.isVisible().catch(() => false)) &&
      (await heading.isVisible().catch(() => false))
    ) {
      return;
    }

    await this.closeProfileModulePopup();

    const icon = this.locators.profileModulePrivilegesIcon(profileName);
    await expect(icon).toBeVisible({ timeout: 15_000 });
    await icon.scrollIntoViewIfNeeded();
    await icon.click();

    await expect(privilegesTable).toBeVisible({ timeout: 20_000 });
    await expect(heading).toBeVisible({ timeout: 20_000 });
  }

  async openModuleWebActions(moduleName: string): Promise<void> {
    await expect(this.locators.modulePrivilegesTable()).toBeVisible({ timeout: 15_000 });

    const moduleRow = this.locators.modulePrivilegesRow(moduleName);
    await expect(moduleRow).toBeVisible({ timeout: 15_000 });
    await moduleRow.scrollIntoViewIfNeeded();

    const expandBtn = this.locators.fieldAndToolPrivilegesExpandButton(moduleName);
    if (await expandBtn.isVisible().catch(() => false)) {
      await expandBtn.click();
      await this.waitForAppReady();
    }

    await this.clickWebActionsTab(moduleName);
  }

  /** Click Web Actions tab in the expanded module privileges section. */
  async clickWebActionsTab(moduleName: string): Promise<void> {
    const webActions = this.locators.webActionsTab(moduleName);
    await webActions.scrollIntoViewIfNeeded();
    await expect(webActions).toBeVisible({ timeout: 20_000 });
    await webActions.click();

    // Web Actions list (Import, Change Owner, …) loads asynchronously after tab click.
    await expect(this.locators.webActionPermissionRow(moduleName, 'Import')).toBeVisible({
      timeout: 30_000,
    });
    await expect(this.locators.changeOwnerPermissionLabel(moduleName)).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectChangeOwnerPermissionBelowImport(moduleName: string): Promise<void> {
    const importRow = this.locators.permissionRow(moduleName, 'Import');
    const changeOwnerRow = this.locators.permissionRow(moduleName, 'Change Owner');
    await expect(importRow).toBeVisible({ timeout: 15_000 });
    await expect(changeOwnerRow).toBeVisible({ timeout: 15_000 });

    const importBox = await importRow.boundingBox();
    const changeOwnerBox = await changeOwnerRow.boundingBox();
    if (importBox && changeOwnerBox) {
      expect(changeOwnerBox.y).toBeGreaterThan(importBox.y);
    }
  }

  async expectChangeOwnerPermissionRow(moduleName: string): Promise<void> {
    const row = this.locators.changeOwnerPermissionLabel(moduleName);
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText(/change owner/i);
  }

  /** Reads Visible/Invisible badge first, then yes/no radios or hidden value. */
  async getChangeOwnerPermissionState(moduleName: string): Promise<PermissionState> {
    const status = this.locators.changeOwnerPermissionStatus(moduleName);
    if (await status.isVisible().catch(() => false)) {
      const label = (await status.innerText()).trim().toLowerCase();
      return label === 'visible' ? 'on' : 'off';
    }

    const yes = this.locators.changeOwnerYesRadio(moduleName);
    if ((await yes.count()) > 0 && (await yes.isChecked().catch(() => false))) {
      return 'on';
    }

    const value = await this.locators.changeOwnerHiddenValue(moduleName).getAttribute('value').catch(() => null);
    if (value === '1') return 'on';
    if (value === '0') return 'off';

    return 'off';
  }

  async setChangeOwnerPermission(moduleName: string, state: PermissionState): Promise<void> {
    const current = await this.getChangeOwnerPermissionState(moduleName);
    if (current === state) return;

    const row = this.locators.changeOwnerPermissionLabel(moduleName);
    await row.scrollIntoViewIfNeeded();
    await row.click();

    const target =
      state === 'on'
        ? this.locators.changeOwnerYesRadio(moduleName)
        : this.locators.changeOwnerNoRadio(moduleName);

    if ((await target.count()) > 0) {
      const radioId = await target.getAttribute('id');
      const label = radioId ? this.page.locator(`label[for="${radioId}"]`) : null;

      if (label && (await label.count()) > 0) {
        await label.click({ force: true });
      } else {
        // Radios are often visually hidden — dispatch click on the input directly.
        await target.evaluate((el: HTMLInputElement) => {
          el.click();
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
    } else {
      await row.locator('.radio-wrapper, div.webaction_list_action').click();
    }

    await this.waitForAppReady();
    await expect
      .poll(() => this.getChangeOwnerPermissionState(moduleName), { timeout: 10_000 })
      .toBe(state);
  }

  /** Enable only when currently off; skip save when already on. */
  async ensureChangeOwnerEnabled(moduleName: string): Promise<boolean> {
    const state = await this.getChangeOwnerPermissionState(moduleName);
    if (state === 'on') return false;

    await this.setChangeOwnerPermission(moduleName, 'on');
    return true;
  }

  /** Disable only when currently on. */
  async ensureChangeOwnerDisabled(moduleName: string): Promise<boolean> {
    const state = await this.getChangeOwnerPermissionState(moduleName);
    if (state === 'off') return false;

    await this.setChangeOwnerPermission(moduleName, 'off');
    return true;
  }

  async saveProfileChanges(): Promise<void> {
    const saveBtn = this.locators.saveProfileButton();
    if (!(await saveBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      // Module-privileges overlay often auto-saves when toggling Web Actions.
      return;
    }
    await saveBtn.click();
    await this.waitForAppReady(30_000);
  }

  async returnToLeadsFromSettings(): Promise<void> {
    await this.closeProfileModulePopup();

    const origin = new URL(this.page.url()).origin;
    await this.page.goto(
      `${origin}/public/admin/?Module=Leads&view=AdvancedListView&viewname=`,
    );
    await this.waitForAppReady();
    await expect(this.page).toHaveURL(/AdvancedListView|Module=Leads/i, { timeout: 30_000 });
    await expect(this.locators.dataRows().first()).toBeVisible({ timeout: 30_000 });
  }
}
