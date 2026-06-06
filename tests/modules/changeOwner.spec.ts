import { test, expect } from '@fixtures';
import { ChangeOwnerPage } from '@pages/changeOwner';

const PROFILE = process.env.PW_PROFILE ?? ChangeOwnerPage.DEFAULT_PROFILE;
/** Profile used for CO_05 — must not be mutated by CO_10/CO_11 (they toggle PROFILE). */
const DEFAULT_STATE_PROFILE = process.env.PW_CO05_PROFILE ?? 'Admin Profile';
const TRANSFER_USER = process.env.PW_TRANSFER_USER;

/**
 * E2E flow (serial):
 * 1. Login → Profile → Admin (icon) → Leads row → expand → Web Actions (Change Owner toggle)
 * 2. Leads module → checkbox → Change Owner toolbar
 * 3. Change Owner popup → user dropdown
 * 4. Transfer → verify Assigned To in list view
 * (+ negative scenarios woven per step; skipped cases kept at end)
 */
test.describe('Change Owner — Leads module', () => {
  test.describe.configure({ mode: 'serial', timeout: 600_000 });

  // -------------------------------------------------------------------------
  // Step 1: Profile → Admin icon → Leads → expand → Web Actions
  // -------------------------------------------------------------------------
  test.describe('Step 1 — Profile & Web Actions permission', () => {
    test.afterEach(async ({ dashboardPage }) => {
      await new ChangeOwnerPage(dashboardPage).closeProfileModulePopup();
    });

    test('CO_01 CO_02 — Change Owner field below Import in Web Actions', async ({
      dashboardPage,
    }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.openProfileList();
      await changeOwner.openProfileModulePrivileges(PROFILE);
      await changeOwner.openModuleWebActions(ChangeOwnerPage.MODULE_NAME);
      await changeOwner.expectChangeOwnerPermissionBelowImport(ChangeOwnerPage.MODULE_NAME);
      await changeOwner.expectChangeOwnerPermissionRow(ChangeOwnerPage.MODULE_NAME);
    });

    test('CO_05 — Change Owner default is OFF for existing modules', async ({
      dashboardPage,
    }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.openProfileList();
      await changeOwner.openProfileModulePrivileges(DEFAULT_STATE_PROFILE);
      await changeOwner.openModuleWebActions(ChangeOwnerPage.MODULE_NAME);
      const state = await changeOwner.getChangeOwnerPermissionState(ChangeOwnerPage.MODULE_NAME);
      expect(state).toBe('off');
    });

    test('CO_11 — Change Owner hidden when profile permission is OFF', async ({
      dashboardPage,
    }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);

      try {
        await changeOwner.disableChangeOwnerForLeads(PROFILE);
        await changeOwner.openLeadsListView();
        await changeOwner.selectRecord(0);
        await changeOwner.expectChangeOwnerHidden();
      } finally {
        // Restore permission only — test is done; no need to navigate back to Leads.
        await changeOwner.enableChangeOwnerForLeads(PROFILE, false);
      }
    });

    test('CO_10 — Change Owner visible when profile permission is ON', async ({
      dashboardPage,
    }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);

      try {
        await changeOwner.enableChangeOwnerForLeads(PROFILE);
        await changeOwner.openLeadsListView();
        await changeOwner.selectRecord(0);
        await changeOwner.expectToolbarWithChangeOwner();
      } finally {
        await changeOwner.enableChangeOwnerForLeads(PROFILE, false);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Step 2: Leads module → checkbox select → Change Owner toolbar
  // -------------------------------------------------------------------------
  test.describe('Step 2 — List view selection & toolbar', () => {
    test.beforeEach(async ({ dashboardPage }) => {
      await new ChangeOwnerPage(dashboardPage).openLeadsListView();
    });

    test('CO_07 CO_09 — single record shows Cancel and Change Owner', async ({
      dashboardPage,
    }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.selectRecord(0);
      await changeOwner.expectToolbarWithChangeOwner();
    });

    test('CO_08 — uncheck record closes toolbar options', async ({ dashboardPage }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.selectRecord(0);
      await changeOwner.expectToolbarWithChangeOwner();
      await changeOwner.unselectRecord(0);
      await changeOwner.expectToolbarClosed();
    });

    test('CO_17 CO_18 — chosen record count updates dynamically', async ({
      dashboardPage,
    }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.selectRecord(0);
      await changeOwner.openChangeOwnerPopup();
      await changeOwner.expectPopupStructure(1);

      await changeOwner.closePopupViaCloseIcon();
      await changeOwner.selectRecord(1);
      await changeOwner.openChangeOwnerPopup();
      await changeOwner.expectPopupStructure(2);
    });
  });

  // -------------------------------------------------------------------------
  // Step 3: Click Change Owner → popup UI → user dropdown
  // -------------------------------------------------------------------------
  test.describe('Step 3 — Change Owner popup & user dropdown', () => {
    test.beforeEach(async ({ dashboardPage }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.openLeadsListView();
      await changeOwner.selectRecord(0);
      await changeOwner.openChangeOwnerPopup();
    });

    test('CO_14 CO_15 CO_16 — popup header, chosen record, transfer to field', async ({
      dashboardPage,
    }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.expectPopupStructure(1);
    });

    test('CO_19 CO_20 — dropdown search and Select All', async ({ dashboardPage }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.openTransferToDropdown();
      await changeOwner.expectDropdownHasSearchAndSelectAll();
    });

    test('CO_27 CO_28 — search user and select shows in Transfer To', async ({
      dashboardPage,
    }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.openTransferToDropdown();
      if (TRANSFER_USER) {
        await changeOwner.searchUserInDropdown(TRANSFER_USER);
        await changeOwner.selectUserFromDropdown(new RegExp(TRANSFER_USER, 'i'));
      } else {
        await changeOwner.selectFirstAvailableUser();
      }
      await changeOwner.expectTransferButtonVisible();
    });

    test('CO_29 — Select All ticks all users in dropdown', async ({ dashboardPage }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.selectAllUsersInDropdown();
      await changeOwner.expectTransferButtonVisible();
    });

    test('CO_37 — Cancel closes popup', async ({ dashboardPage }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.closePopupViaCancel();
    });

    test('CO_38 — Transfer button only when user selected', async ({ dashboardPage }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.expectTransferButtonHidden();
      await changeOwner.openTransferToDropdown();
      if (TRANSFER_USER) {
        await changeOwner.selectUserFromDropdown(new RegExp(TRANSFER_USER, 'i'));
      } else {
        await changeOwner.selectFirstAvailableUser();
      }
      await changeOwner.expectTransferButtonVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Step 4: Select user → Transfer → verify Assigned To in list view
  // -------------------------------------------------------------------------
  test.describe('Step 4 — Transfer & list view verification', () => {
    test('CO_39 CO_40 CO_48 CO_49 — transfer single record and verify Assigned To', async ({
      dashboardPage,
    }) => {
      const changeOwner = new ChangeOwnerPage(dashboardPage);
      await changeOwner.openLeadsListView();
      await changeOwner.selectRecord(0);
      await changeOwner.openChangeOwnerPopup();

      let selectedUser: string;
      if (TRANSFER_USER) {
        await changeOwner.openTransferToDropdown();
        await changeOwner.searchUserInDropdown(TRANSFER_USER);
        await changeOwner.selectUserFromDropdown(new RegExp(TRANSFER_USER, 'i'));
        selectedUser = TRANSFER_USER;
      } else {
        selectedUser = await changeOwner.selectFirstAvailableUser();
      }

      await changeOwner.clickTransfer();
      await changeOwner.expectTransferProgressOrSuccess();
      await changeOwner.waitForTransferComplete();
      await changeOwner.expectRecordAssignedTo(0, new RegExp(selectedUser, 'i'));
    });
  });

  // -------------------------------------------------------------------------
  // Conditional / manual scenarios (kept — not omitted)
  // -------------------------------------------------------------------------
  test.describe('Scheduler & bulk (conditional)', () => {
    test.skip('CO_55 CO_56 — schedule popup for 900+ records', async () => {
      // Requires selecting 900+ Leads records — run manually with bulk data.
    });

    test.skip('CO_68 CO_69 — scheduler Change Owner column and edit popup', async () => {
      // Requires CRM Scheduler access and an active bulk transfer job.
    });
  });

  test.describe('Sharing / edit permission (negative)', () => {
    test.skip('CO_81 — read-only record via sharing rule should not transfer', async () => {
      // Needs a record with read-only sharing for the login user.
    });

    test.skip('CO_82 — no module edit permission should block transfer', async () => {
      // Needs a low-privilege user (set PW_USER / PW_PASSWORD).
    });
  });
});
