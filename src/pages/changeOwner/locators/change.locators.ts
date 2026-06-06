import type { Locator, Page } from '@playwright/test';

/** Locators for Change Owner (profile privileges, list view toolbar, popup). */
export class ChangeOwnerLocators {
  constructor(private readonly page: Page) {}

  livewireOverlay(): Locator {
    return this.page.locator('#livewireOverly');
  }

  // ---- List view -----------------------------------------------------------

  listTable(): Locator {
    return this.page
      .locator('table')
      .filter({ has: this.page.locator('tbody tr input[type="checkbox"]') })
      .first();
  }

  dataRows(): Locator {
    return this.listTable()
      .locator('tbody tr')
      .filter({ has: this.page.locator('input[type="checkbox"]') })
      .filter({ visible: true });
  }

  rowCheckbox(index: number): Locator {
    return this.dataRows().nth(index).locator('input[type="checkbox"]').first();
  }

  headerCheckbox(): Locator {
    return this.listTable()
      .locator('thead input[type="checkbox"], tr input[type="checkbox"]')
      .first();
  }

  /** Assigned To column cell (profile image + user name). */
  assignedToCell(rowIndex: number): Locator {
    return this.dataRows()
      .nth(rowIndex)
      .locator('td')
      .filter({ has: this.page.locator('img[alt="Profile"]') })
      .first();
  }

  moreActionsButton(): Locator {
    // App label is "More Action" (singular), not "More Actions".
    return this.page.getByRole('button', { name: /more action/i });
  }

  cancelToolbarButton(): Locator {
    // Accessible name includes icon glyph, e.g. " Cancel" — not exactly "Cancel".
    return this.page.getByRole('button', { name: /cancel/i }).first();
  }

  changeOwnerButton(): Locator {
    return this.page.getByRole('button').filter({ hasText: /change owner/i }).first();
  }

  // ---- Change Owner popup --------------------------------------------------

  /** Bootstrap modal or inline list-view panel ("Change Owner - Chosen Record N"). */
  changeOwnerModal(): Locator {
    const bootstrapModal = this.page
      .locator('.modal:visible, [role="dialog"]:visible, .modal-dialog:visible')
      .filter({ hasText: /change owner/i });
    // Nearest ancestor of the title that also contains Transfer/Cancel (avoids matching the whole page).
    const inlinePanel = this.page
      .getByText(/change owner\s*-\s*chosen record/i)
      .locator(
        'xpath=ancestor::*[.//button[normalize-space()="Transfer"] and .//*[contains(translate(normalize-space(.),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"),"transfer to")]][1]',
      );
    return bootstrapModal.or(inlinePanel).first();
  }

  /** Post-transfer panel ("Change Owner - Selected User N"); chosen-record popup gets `.hide`. */
  changeOwnerSuccessPanel(): Locator {
    return this.page
      .locator('.change-owner-popup:not(.hide)')
      .filter({ hasText: /change owner\s*-\s*selected user/i })
      .first();
  }

  modalHeader(): Locator {
    return this.changeOwnerModal().getByText(/change owner\s*-\s*chosen record/i).first();
  }

  modalCloseButton(): Locator {
    const panel = this.changeOwnerModal();
    return panel
      .getByRole('button', { name: /close/i })
      .or(panel.locator('button.close, .btn-close'))
      .or(panel.getByText(/change owner\s*-\s*chosen record/i).locator('xpath=following-sibling::*[1]'))
      .first();
  }

  modalCancelButton(): Locator {
    return this.changeOwnerModal().getByRole('button', { name: /cancel/i });
  }

  modalTransferButton(): Locator {
    return this.changeOwnerModal().getByRole('button', { name: /^transfer$/i });
  }

  transferToField(): Locator {
    const panel = this.changeOwnerModal();
    return panel
      .getByText(/^transfer to$/i)
      .locator('xpath=following-sibling::*[1]')
      .or(panel.getByText(/select users?/i))
      .or(panel.locator('.select2-selection, .select2-container, [id*="select2"]'))
      .or(panel.getByPlaceholder(/select user/i))
      .first();
  }

  transferToDropdownArrow(): Locator {
    return this.changeOwnerModal()
      .locator('.select2-selection__arrow, [class*="dropdown"]')
      .first();
  }

  chosenRecordLabel(): Locator {
    return this.changeOwnerModal().getByText(/chosen record/i);
  }

  transferToLabel(): Locator {
    return this.changeOwnerModal().getByText(/transfer to/i);
  }

  /** Inline user list (Search + Select All) or select2 results. */
  dropdownListContainer(): Locator {
    const panel = this.changeOwnerModal();
    return panel
      .getByRole('textbox', { name: /^search$/i })
      .locator('xpath=following-sibling::*[1]')
      .or(this.page.locator('.select2-container--open .select2-results').last())
      .first();
  }

  openDropdown(): Locator {
    const panel = this.changeOwnerModal();
    return panel
      .getByRole('textbox', { name: /^search$/i })
      .or(this.page.locator('.select2-container--open').last())
      .first();
  }

  dropdownSearchInput(): Locator {
    const panel = this.changeOwnerModal();
    return panel
      .getByRole('textbox', { name: /^search$/i })
      .or(this.page.locator('.select2-container--open .select2-search__field').last())
      .first();
  }

  dropdownOptions(): Locator {
    const panel = this.changeOwnerModal();
    return panel
      .getByRole('textbox', { name: /^search$/i })
      .locator('xpath=following-sibling::*[1]/*')
      .or(
        this.page.locator(
          '.select2-container--open .select2-results__option, .select2-container--open [role="treeitem"]',
        ),
      );
  }

  selectAllOption(): Locator {
    const panel = this.changeOwnerModal();
    return panel
      .getByText(/^select all$/i)
      .or(this.dropdownOptions().filter({ hasText: /select all/i }).first())
      .first();
  }

  userOption(name: string | RegExp): Locator {
    const panel = this.changeOwnerModal();
    return panel
      .getByRole('textbox', { name: /^search$/i })
      .locator('xpath=following-sibling::*[1]')
      .locator('div')
      .filter({ hasText: name })
      .filter({ hasNotText: /^select all$/i })
      .first()
      .or(this.dropdownOptions().filter({ hasText: name }).first());
  }

  progressBar(): Locator {
    return this.changeOwnerModal()
      .or(this.changeOwnerSuccessPanel())
      .locator('.progress, .progress-bar, [class*="progress"]')
      .first();
  }

  successHeading(): Locator {
    return this.page.getByRole('heading', { name: /changed owner successfully/i });
  }

  scheduleModal(): Locator {
    return this.page
      .locator('.modal:visible, [role="dialog"]:visible')
      .filter({ hasText: /record transfer due to a change of owner has been scheduled/i })
      .first();
  }

  // ---- Profile / module privileges -----------------------------------------

  /** Module-privileges overlay opened from the Profiles list category icon. */
  profileModulePopup(): Locator {
    return this.page.locator('#profileModualSectionPopup');
  }

  profileModulePopupCloseButton(): Locator {
    return this.profileModulePopup()
      .getByRole('button', { name: /^×$/ })
      .or(this.profileModulePopup().locator('button.close, .btn-close'))
      .first();
  }

  profileMenu(): Locator {
    return this.page.locator('.dropdown-toggle.nav-link.dropdown-user-link').first();
  }

  crmSettingsLink(): Locator {
    return this.page.getByRole('link', { name: /CRM Setting/i });
  }

  userAccessControl(): Locator {
    return this.page
      .getByRole('button', { name: /user & access control/i })
      .or(this.page.locator('span').filter({ hasText: 'User & Access Control' }).first());
  }

  profileNav(): Locator {
    return this.page.getByRole('link', { name: 'Profile', exact: true });
  }

  profilesHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Profiles' });
  }

  profilesTable(): Locator {
    return this.page.getByRole('table').filter({
      has: this.page.getByRole('columnheader', { name: 'Profile Name' }),
    });
  }

  profileRow(profileName: string): Locator {
    return this.profilesTable()
      .locator('tr')
      .filter({ has: this.page.getByRole('cell', { name: profileName, exact: true }) })
      .first();
  }

  profileActionCell(profileName: string): Locator {
    return this.profileRow(profileName).locator('td').last();
  }

  /** Module privileges icon (category / tree) on the Profiles list — not the edit pencil. */
  profileModulePrivilegesIcon(profileName: string): Locator {
    return this.profileActionCell(profileName).getByText('category', { exact: true });
  }

  profileEditIcon(profileName: string): Locator {
    return this.profileActionCell(profileName)
      .locator('a[href*="edit_profile"], i.fa-pencil, .fa-edit, .iconshover')
      .first();
  }

  /** Panel title e.g. "Administrator - Modules Privileges" (h4, not a generic heading match). */
  modulePrivilegesHeading(profileName?: string): Locator {
    if (profileName) {
      const escaped = profileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return this.page
        .locator('h4')
        .filter({ hasText: new RegExp(`${escaped}.*modules privileges`, 'i') })
        .first();
    }
    return this.page.locator('h4').filter({ hasText: /modules privileges/i }).first();
  }

  /** Privileges grid — table is sibling of heading row, not inside heading parent. */
  modulePrivilegesTable(): Locator {
    return this.page.getByRole('table').filter({
      has: this.page.getByRole('columnheader', { name: 'Field and Tool Privileges' }),
    });
  }

  /** Module row in the privileges grid (e.g. "Leads expand_more" or "Leads expand_less"). */
  modulePrivilegesRow(moduleName: string): Locator {
    const table = this.modulePrivilegesTable();
    const escaped = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return table
      .getByRole('row', { name: new RegExp(`^${escaped}\\s+expand_`, 'i') })
      .first();
  }

  /** expand_more — only present when the module row is collapsed. */
  fieldAndToolPrivilegesExpandButton(moduleName: string): Locator {
    return this.modulePrivilegesRow(moduleName).getByRole('button', { name: /expand_more/i });
  }

  /** Expanded detail row (Fields / Masking / Web Actions tabs) — next <tr> after module row. */
  moduleExpandedPanel(moduleName: string): Locator {
    return this.modulePrivilegesRow(moduleName).locator('xpath=following-sibling::tr[1]');
  }

  /**
   * Web Actions tab — <a class="col-sm-2 Maskingvalue webAction_*" maskval="webAction">.
   * Leads uses webAction_18; maskval is stable across modules.
   */
  webActionsTab(moduleName: string): Locator {
    const panel = this.moduleExpandedPanel(moduleName);
    return panel.locator('a.col-sm-2.Maskingvalue[maskval="webAction"]');
  }

  /** Web Actions permission list (ul/li) inside the expanded module panel. */
  webActionsPermissionList(moduleName: string): Locator {
    return this.moduleExpandedPanel(moduleName).locator('ul, list').last();
  }

  webActionPermissionRow(moduleName: string, label: string): Locator {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.moduleExpandedPanel(moduleName)
      .getByRole('listitem')
      .filter({ hasText: new RegExp(escaped, 'i') })
      .first();
  }

  /** Change Owner list item in Web Actions (Export → Import → Change Owner). */
  changeOwnerPermissionLabel(moduleName: string): Locator {
    return this.webActionPermissionRow(moduleName, 'Change Owner');
  }

  /** Visible / Invisible / ReadOnly badge on the Web Actions list row. */
  changeOwnerPermissionStatus(moduleName: string): Locator {
    return this.changeOwnerPermissionLabel(moduleName)
      .getByText(/^(Visible|Invisible|ReadOnly)$/i)
      .last();
  }

  /** Radio toggle block inside the Change Owner list item. */
  changeOwnerWebActionBlock(moduleName: string): Locator {
    return this.changeOwnerPermissionLabel(moduleName).locator(
      'div.webaction_list_action, .radio-wrapper',
    );
  }

  changeOwnerYesRadio(moduleName: string): Locator {
    return this.changeOwnerPermissionLabel(moduleName).locator('input.yes[type="radio"]');
  }

  changeOwnerNoRadio(moduleName: string): Locator {
    return this.changeOwnerPermissionLabel(moduleName).locator('input.no[type="radio"]');
  }

  changeOwnerHiddenValue(moduleName: string): Locator {
    return this.changeOwnerPermissionLabel(moduleName).locator(
      'input[type="hidden"][name*="change_owner"]',
    );
  }

  permissionRow(moduleName: string, label: string): Locator {
    return this.webActionPermissionRow(moduleName, label);
  }

  permissionToggle(moduleName: string, label: string): Locator {
    if (/change owner/i.test(label)) {
      return this.changeOwnerYesRadio(moduleName);
    }
    return this.permissionRow(moduleName, label)
      .locator(
        'input[type="checkbox"], input[type="radio"].yes, [role="switch"], label.switch, .toggle',
      )
      .first();
  }

  saveProfileButton(): Locator {
    return this.page
      .getByRole('button', { name: /^save$/i })
      .or(this.profileModulePopup().getByRole('button', { name: /^save$/i }))
      .first();
  }
}
