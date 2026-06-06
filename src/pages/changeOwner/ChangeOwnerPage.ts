import type { Page } from '@playwright/test';
import { ChangeOwnerActions, type PermissionState } from './actions/change.actions';

/** Page object facade for Change Owner flows on the Leads module. */
export class ChangeOwnerPage extends ChangeOwnerActions {
  static readonly MODULE_NAME = 'Leads';
  static readonly DEFAULT_PROFILE = process.env.PW_PROFILE ?? 'Administrator';

  constructor(page: Page) {
    super(page);
  }

  async enableChangeOwnerForLeads(
    profileName = ChangeOwnerPage.DEFAULT_PROFILE,
    returnToLeads = true,
  ): Promise<void> {
    await this.configureChangeOwnerPermission(profileName, 'on', returnToLeads);
  }

  async disableChangeOwnerForLeads(
    profileName = ChangeOwnerPage.DEFAULT_PROFILE,
    returnToLeads = true,
  ): Promise<void> {
    await this.configureChangeOwnerPermission(profileName, 'off', returnToLeads);
  }

  private async configureChangeOwnerPermission(
    profileName: string,
    state: PermissionState,
    returnToLeads = true,
  ): Promise<void> {
    const moduleName = ChangeOwnerPage.MODULE_NAME;

    await this.openProfileList();
    await this.openProfileModulePrivileges(profileName);
    await this.openModuleWebActions(moduleName);

    const changed =
      state === 'on'
        ? await this.ensureChangeOwnerEnabled(moduleName)
        : await this.ensureChangeOwnerDisabled(moduleName);

    if (changed) {
      await this.saveProfileChanges();
    }

    await this.closeProfileModulePopup();
    if (returnToLeads) {
      await this.returnToLeadsFromSettings();
    }
  }
}
