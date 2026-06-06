import { Locator, Page, expect } from "@playwright/test";
import { dataDr } from '@pages/modules/uiTypeId';
import filterFieldTypeData from "@data/filterFieldTypeData.json";
import commentsData from "@data/comments.json";
import { formatErrorMessage } from '@utils/helpers/formatError';

type CommentEntry = { comments: string };
const commentList = commentsData as CommentEntry[];

function pickRandomComment(): string {
    const index = Math.floor(Math.random() * commentList.length);
    return commentList[index].comments;
}

export class relatedModule{
    constructor(private page:Page){}
    private debug(step: string, detail?: string): void {
        console.log(`[related] ${step}${detail ? ` — ${detail}` : ""}`);
    }
    private esc(text: string): string {
        return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    private normalizeTabText(text: string): string {
        return text.replace(/\(\d+\)\s*$/g, "").replace(/\s+/g, " ").trim();
    }
    private stripLeadingIconToken(text: string): string {
        // Tabs often render "IconText Label (n)" -> keep the business label for matching.
        return text.replace(/^[A-Za-z_]+\s+/, "").trim();
    }

    private quickCreateDialog(): Locator {
        return this.page.getByRole("dialog").filter({
            has: this.page.getByRole("heading", { name: /Quick Create/i }),
        });
    }

    /** Resolve quick-create / full-form container (not Leads detail summary). */
    private async resolveQuickCreateFormScope(): Promise<Locator> {
        const dialog = this.quickCreateDialog();
        await expect(dialog).toBeVisible({ timeout: 20_000 });

        const fieldSelector =
            'input[data-fieldtype]:not([type="hidden"]):not([readonly]):not([disabled]):not([type="search"]), textarea[data-fieldtype]:not([readonly]):not([disabled]), select[data-fieldtype]:not([disabled])';

        if ((await dialog.locator(fieldSelector).count()) === 0) {
            const goFullForm = dialog.getByText(/Go to Fullform/i).first();
            if (await goFullForm.isVisible().catch(() => false)) {
                await goFullForm.click();
                await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 30_000 }).catch(() => {});
            }
        }

        const candidates = [
            this.page.locator("#RelatedPopupAppend:visible"),
            this.page.getByRole("dialog").filter({ has: this.page.locator("[data-fieldtype]") }).last(),
            dialog,
        ];

        for (const candidate of candidates) {
            if ((await candidate.locator(fieldSelector).count()) > 0) {
                return candidate;
            }
        }

        throw new Error("Quick create form fields were not found in dialog/full form.");
    }

    /** Fill all fields only inside related quick create (avoids Leads detail fields). Returns true if Save was clicked in quick-create dialog. */
    private async fillQuickCreateAllFields(): Promise<boolean> {
        if (this.page.isClosed()) return false;

        this.debug("quickCreate", "start fill");
        const scope = await this.resolveQuickCreateFormScope();
        const fields = scope.locator(
            'input[data-fieldtype]:not([type="hidden"]):not([readonly]):not([disabled]):not([type="search"]), textarea[data-fieldtype]:not([readonly]):not([disabled]), select[data-fieldtype]:not([disabled])',
        );

        await expect(fields.first()).toBeVisible({ timeout: 20_000 });

        const finaldata = (filterFieldTypeData as Array<Record<string, unknown>>)[0];
        const fill = new dataDr(this.page);
        const filler = fill as unknown as {
            getCurrentFieldType: (f: Locator) => Promise<string | null>;
            getFieldKey: (f: Locator, cap: string, i: number) => Promise<string>;
            shouldProcessField: (f: Locator) => Promise<boolean>;
            tryFillField: (f: Locator, cap: string, v: unknown, d: Record<string, unknown>) => Promise<boolean>;
            fillType11FromGroup: (g: Locator, idx: number) => Promise<boolean>;
            captIndex: (d: Record<string, unknown>, cap: string) => number;
            relatedSearchIcon: (g: Locator) => Locator;
        };

        const filledKeys = new Set<string>();
        const count = await fields.count();

        for (let i = 0; i < count; i++) {
            if (this.page.isClosed()) return false;

            const field = fields.nth(i);
            const capAttr = await fill.getCurrentFieldType(field);
            const fieldKey = await filler.getFieldKey(field, capAttr ?? "", i);
            if (!capAttr || capAttr === "12" || !(capAttr in finaldata) || filledKeys.has(fieldKey)) {
                continue;
            }

            const value = finaldata[capAttr];
            if (value === "" || value === null || value === undefined) continue;
            if (!(await filler.shouldProcessField(field))) continue;

            await field.scrollIntoViewIfNeeded().catch(() => {});

            let ok = false;
            try {
                ok = await filler.tryFillField(field, capAttr, value, finaldata);
            } catch (err) {
                console.log(
                    `[related fill] Skip field ${i} (uiType ${capAttr}): ${formatErrorMessage(err)}`,
                );
                ok = false;
            } finally {
                if (!ok) {
                    await this.page.keyboard.press("Escape").catch(() => {});
                }
            }

            if (ok) {
                filledKeys.add(fieldKey);
            }
        }

        const type11Groups = scope.locator(".form-group.row, .form-group").filter({
            has: scope.locator('[data-fieldtype="11"]'),
        });
        const groupCount = await type11Groups.count();
        for (let i = 0; i < groupCount; i++) {
            if (this.page.isClosed()) return false;
            const group = type11Groups.nth(i);
            const anchor = group.locator('[data-fieldtype="11"]').first();
            const fieldKey = await filler.getFieldKey(anchor, "11", i + 10_000);
            if (filledKeys.has(fieldKey) || (await filler.relatedSearchIcon(group).count()) === 0) {
                continue;
            }

            await group.scrollIntoViewIfNeeded().catch(() => {});
            let ok = false;
            try {
                ok = await filler.fillType11FromGroup(group, filler.captIndex(finaldata, "11"));
            } catch {
                ok = false;
            } finally {
                if (!ok) {
                    await this.page.keyboard.press("Escape").catch(() => {});
                }
            }
            if (ok) filledKeys.add(fieldKey);
        }

        await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});

        const dialog = this.quickCreateDialog();
        if (await dialog.isVisible().catch(() => false)) {
            this.debug("quickCreate", "click Save in dialog");
            await dialog.getByRole("button", { name: "Save" }).click();
            await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});
            return true;
        }
        return false;
    }

    private quickActionModal(): Locator {
        return this.page.locator("#quick-action-modal");
    }

    private async closeQuickActionModal(): Promise<void> {
        const modal = this.quickActionModal();
        const visible = await modal.isVisible().catch(() => false);
        if (!visible) {
            await this.page.keyboard.press("Escape").catch(() => {});
            return;
        }

        this.debug("quickReply", "close quick-action modal");
        const cancelBtn = modal.getByRole("button", { name: /Cancel/i }).first();
        if (await cancelBtn.isVisible().catch(() => false)) {
            await cancelBtn.click();
        } else {
            await this.page.keyboard.press("Escape").catch(() => {});
        }
        await modal.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {});
        await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});
    }

    private async fillQuickReplyCommentAndSave(): Promise<void> {
        const modal = this.quickActionModal();
        await expect(modal).toBeVisible({ timeout: 15_000 });

        const commentBox = modal.getByRole("textbox", { name: "Type or Speak Comments" });
        const hasCommentField = await commentBox.isVisible().catch(() => false);

        if (hasCommentField) {
            this.debug("quickReply", "comment field present — fill and save");
            await commentBox.click();
            await commentBox.fill(pickRandomComment());
        } else {
            this.debug("quickReply", "no comment field — click Save only");
        }

        this.debug("quickReply", "click Save inside quick-action modal only");
        await modal.getByRole("button", { name: "Save", exact: true }).click();
        await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});
        await this.closeQuickActionModal();
    }

    /** Related submodule tabs (#rsoftTab or detail-view tablist fallback). */
    private relatedTabs(): Locator {
        return this.page
            .locator("#rsoftTab")
            .getByRole("tab")
            .or(this.page.getByRole("tablist").last().getByRole("tab"));
    }

    private tabMatchesLabel(tabText: string, labelOnly: string): boolean {
        const normalized = this.moduleLabel(tabText);
        if (!labelOnly) return false;
        if (normalized === labelOnly) return true;
        if (normalized.endsWith(labelOnly)) return true;
        return new RegExp(`\\b${this.esc(labelOnly)}(\\s*\\(\\d+\\))?\\s*$`, "i").test(normalized);
    }

    /** Resolve tab by captured label (e.g. "Chats" → "Send WhatsApp Chats"). */
    private async resolveRelatedTab(tabName: string): Promise<Locator | null> {
        const labelOnly = this.moduleLabel(tabName);
        const tabs = this.relatedTabs();
        const count = await tabs.count();

        for (let i = 0; i < count; i++) {
            const tab = tabs.nth(i);
            const text = ((await tab.textContent()) ?? "").replace(/\s+/g, " ").trim();
            if (this.tabMatchesLabel(text, labelOnly)) {
                return tab;
            }
        }
        return null;
    }

    private relatedTabLink(tabName: string): Locator {
        const labelOnly = this.moduleLabel(tabName);
        return this.relatedTabs().filter({
            hasText: new RegExp(`${this.esc(labelOnly)}(\\s*\\(|$)`, "i"),
        }).first();
    }

    private activeModuleTabPanel(): Locator {
        return this.page.locator('[role="tabpanel"]:visible').last();
    }

    /** Table inside the active related-module tab panel (not page-wide first table). */
    private moduleTableScope(): Locator {
        return this.activeModuleTabPanel().locator(".table-responsive").first();
    }

    private async clickRelatedModuleTab(tabName: string): Promise<void> {
        const labelOnly = this.moduleLabel(tabName);
        this.debug("reselectTab", `target module: ${labelOnly}`);

        await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});

        const tabLink = (await this.resolveRelatedTab(tabName)) ?? this.relatedTabLink(tabName);
        await expect(tabLink).toBeVisible({ timeout: 15_000 });
        await tabLink.scrollIntoViewIfNeeded().catch(() => {});
        await tabLink.click();
        await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});

        const activeTab = this.page.locator('[role="tab"][aria-selected="true"]').first();
        const activeText = ((await activeTab.textContent()) ?? "").replace(/\s+/g, " ").trim();
        this.debug("reselectTab", `active tab after click: ${activeText}`);
    }

    /** Re-open the same related module tab after quick create save (app often jumps to Updates). */
    private async reselectRelatedTab(tabName: string): Promise<void> {
        await this.clickRelatedModuleTab(tabName);
    }

    private async waitForModuleTableRows(tableScope: Locator, timeoutMs = 30_000): Promise<boolean> {
        const rows = tableScope.locator("tbody tr:has(td)");
        try {
            await expect
                .poll(async () => rows.count(), { timeout: timeoutMs, intervals: [500, 1000, 2000] })
                .toBeGreaterThan(0);
            return true;
        } catch {
            return false;
        }
    }

    private moduleLabel(tabName: string): string {
        return this.stripLeadingIconToken(this.normalizeTabText(tabName));
    }

    private skipModule(tabName: string, reason: string): void {
        console.log(`[related] SKIP module "${this.moduleLabel(tabName)}" — ${reason}`);
    }

    private setupSubmoduleConfigText(): Locator {
        return this.page.getByText("Setup Submodule Configuration");
    }

    /**
     * Detail view related strip loads async (Livewire). Wait for tabs or empty setup state.
     * @returns tabs | setup | none (timed out)
     */
    private async waitForRelatedSectionReady(timeoutMs = 60_000): Promise<"tabs" | "setup" | "none"> {
        await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 30_000 }).catch(() => {});
        await expect(this.page.locator("#rsoftTab")).toBeVisible({ timeout: timeoutMs }).catch(() => {});

        let state: "tabs" | "setup" | "none" = "none";
        try {
            await expect
                .poll(
                    async () => {
                        if (await this.hasNoModulesSetupState()) {
                            state = "setup";
                            return true;
                        }
                        if ((await this.relatedTabs().count()) > 0) {
                            state = "tabs";
                            return true;
                        }
                        return false;
                    },
                    { timeout: timeoutMs, intervals: [500, 1000, 2000] },
                )
                .toBe(true);
        } catch {
            state = "none";
        }
        this.debug("relatedReady", state);
        return state;
    }

    /** True when related area shows empty submodule setup (no modules configured). */
    private async hasNoModulesSetupState(): Promise<boolean> {
        return this.setupSubmoduleConfigText().isVisible().catch(() => false);
    }

    private async hasNoModulesSetupStateInPanel(): Promise<boolean> {
        return this.activeModuleTabPanel()
            .getByText("Setup Submodule Configuration")
            .isVisible()
            .catch(() => false);
    }

    private logNoModulesPresent(context?: string): void {
        const suffix = context ? ` — ${context}` : "";
        console.log(
            `[related] NOTE — no modules present (Setup Submodule Configuration displayed)${suffix}; skipping`,
        );
    }

    private emailChatMainContent(): Locator {
        return this.page.locator("#chat-card").locator(".EmailMainContent").first();
    }

    private async hasEmailChatCardVisible(): Promise<boolean> {
        return this.emailChatMainContent().isVisible().catch(() => false);
    }

    private async isWhatsAppChatsPanel(): Promise<boolean> {
        const panel = this.activeModuleTabPanel();
        return panel
            .getByText(/MetaWhatApp|template message/i)
            .first()
            .isVisible()
            .catch(() => false);
    }

    /** Skip module tab when setup empty state or chat UI is shown instead of list. */
    private async skipReasonAfterModuleTabClick(): Promise<string | null> {
        if (await this.hasNoModulesSetupStateInPanel()) {
            return "no modules present — Setup Submodule Configuration";
        }
        if (await this.hasEmailChatCardVisible()) {
            return "email chat view present (#chat-card .EmailMainContent)";
        }
        if (await this.isWhatsAppChatsPanel()) {
            return "WhatsApp Chats panel (no list/quickreply flow)";
        }
        return null;
    }

    /** First-row quickreply control inside the module table (same scoping idea as quick-create +). */
    private quickReplyIconInRow(row: Locator): Locator {
        return row
            .locator(".qa_button_related_tab")
            .locator(".qa_icon, .material-symbols-outlined, button, [role='button']")
            .filter({ hasText: /quickreply/i })
            .first();
    }

    private async resolveQuickReplyIcon(tableScope: Locator): Promise<Locator | null> {
        const firstRow = tableScope.locator("tbody tr:has(td)").first();
        if ((await firstRow.count()) === 0) {
            return null;
        }

        const panel = this.activeModuleTabPanel();
        const candidates: Locator[] = [
            this.quickReplyIconInRow(firstRow),
            firstRow.locator(".qa_button_related_tab").getByText("quickreply", { exact: true }).first(),
            firstRow.getByRole("button", { name: /quickreply/i }).first(),
            firstRow.getByText("quickreply", { exact: true }).first(),
            panel.locator(".table-responsive").first().getByText("quickreply", { exact: true }).first(),
        ];

        for (const candidate of candidates) {
            if ((await candidate.count()) === 0) continue;
            if (await candidate.isVisible().catch(() => false)) {
                return candidate;
            }
        }
        return null;
    }

    private async waitForQuickReplyIcon(tableScope: Locator, timeoutMs = 30_000): Promise<Locator | null> {
        let resolved: Locator | null = null;
        try {
            await expect
                .poll(async () => {
                    resolved = await this.resolveQuickReplyIcon(tableScope);
                    return resolved !== null;
                }, { timeout: timeoutMs, intervals: [500, 1000, 2000] })
                .toBe(true);
        } catch {
            return null;
        }
        return resolved;
    }

    /** Quick reply on first row — mirrors runQuickCreateForModule (reselect tab, wait, enabled, scoped modal). */
    private async runQuickReplyForModule(tabName: string, tableScope: Locator): Promise<boolean> {
        this.debug("quickReply", `start for module: ${this.moduleLabel(tabName)}`);

        await this.reselectRelatedTab(tabName);

        const scopedTable = this.moduleTableScope();
        await scopedTable.click().catch(() => {});

        const rowsReady = await this.waitForModuleTableRows(scopedTable);
        if (!rowsReady) {
            this.skipModule(tabName, "no records in table before quickreply");
            return false;
        }

        const actionIcon = await this.waitForQuickReplyIcon(scopedTable);
        if (!actionIcon) {
            this.skipModule(tabName, "quickreply icon not found on first row (timeout)");
            return false;
        }

        const isButtonLike = await actionIcon
            .evaluate((el) => {
                const tag = el.tagName.toLowerCase();
                return tag === "button" || tag === "a" || el.getAttribute("role") === "button";
            })
            .catch(() => false);

        if (isButtonLike) {
            await expect(actionIcon).toBeEnabled({ timeout: 15_000 }).catch(() => {
                this.skipModule(tabName, "quickreply icon is disabled");
            });
            if (!(await actionIcon.isEnabled().catch(() => false))) {
                return false;
            }
        }

        this.debug("quickReply", "icon ready — click");
        await actionIcon.scrollIntoViewIfNeeded().catch(() => {});
        await actionIcon.click();
        await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});

        try {
            await this.fillQuickReplyCommentAndSave();
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.skipModule(tabName, `quickreply modal failed: ${msg}`);
            await this.closeQuickActionModal();
            return false;
        }

        this.debug("quickReply", "finished for module");
        return true;
    }

    private async resolveQuickCreateAddButton(panel: Locator): Promise<Locator | null> {
        const buttons = panel.getByRole("button").filter({ hasText: /^$/ });
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
            const btn = buttons.nth(i);
            if (await btn.isVisible().catch(() => false)) {
                return btn;
            }
        }
        return null;
    }

    private async getReadyQuickCreateAddButton(panel: Locator): Promise<Locator | null> {
        const addBtn = await this.resolveQuickCreateAddButton(panel);
        if (!addBtn) return null;
        if (await addBtn.isEnabled().catch(() => false)) return addBtn;
        return null;
    }

    private async runQuickCreateForModule(tabName: string): Promise<Locator | null> {
        this.debug("quickCreate", `start for module: ${this.moduleLabel(tabName)}`);
        const activeTabPanel = this.activeModuleTabPanel();
        const addBtn = await this.getReadyQuickCreateAddButton(activeTabPanel);

        if (!addBtn) {
            const anyVisible = await this.resolveQuickCreateAddButton(activeTabPanel);
            if (!anyVisible) {
                this.skipModule(tabName, "add (+) button not found for quick create");
            } else {
                this.skipModule(tabName, "add (+) button is disabled");
            }
            return null;
        }

        await addBtn.click();
        const savedInDialog = await this.fillQuickCreateAllFields();
        this.debug("quickCreate", `saved in dialog: ${savedInDialog}`);

        await this.reselectRelatedTab(tabName);

        const refreshedTable = this.moduleTableScope();
        await refreshedTable.click().catch(() => {});
        this.debug("quickCreate", "finished for module");
        return refreshedTable;
    }

    private async clickQuickReplyIfRecordExists(tabName: string): Promise<void> {
        this.debug("moduleTab", `start actions for: ${this.moduleLabel(tabName)}`);

        const skipReason = await this.skipReasonAfterModuleTabClick();
        if (skipReason) {
            this.skipModule(tabName, skipReason);
            return;
        }

        const tableScope = this.moduleTableScope();
        await tableScope.click().catch(() => {});

        const rows = tableScope.locator("tbody tr:has(td)");

        if ((await rows.count()) === 0) {
            const activeTabPanel = this.activeModuleTabPanel();
            if (!(await this.getReadyQuickCreateAddButton(activeTabPanel))) {
                const anyVisible = await this.resolveQuickCreateAddButton(activeTabPanel);
                if (!anyVisible) {
                    this.skipModule(tabName, "no rows and add (+) not available — next tab");
                } else {
                    this.skipModule(tabName, "no rows and add (+) disabled — next tab");
                }
                return;
            }

            const refreshedTable = await this.runQuickCreateForModule(tabName);
            if (!refreshedTable) {
                return;
            }

            const rowsReady = await this.waitForModuleTableRows(refreshedTable);
            if (!rowsReady) {
                this.skipModule(tabName, "no records in table after quick create (timeout)");
                return;
                
            }
            this.debug("moduleTab", "rows loaded after quick create");
        } else {
            this.debug("moduleTab", "rows exist in table");
        }

        await this.runQuickReplyForModule(tabName, tableScope);
    }

    async captureRelatedTabs(): Promise<string[]> {
        const ready = await this.waitForRelatedSectionReady();

        if (ready === "setup" || (ready === "none" && (await this.hasNoModulesSetupState()))) {
            this.logNoModulesPresent();
            return [];
        }

        if (ready === "none") {
            console.log("[related] NOTE — related tabs not loaded (#rsoftTab empty after wait); skipping");
            return [];
        }

        const tabs = this.relatedTabs();
        await expect(tabs.first()).toBeVisible({ timeout: 15_000 });
        const count = await tabs.count();
        const captured: string[] = [];

        for (let i = 0; i < count; i++) {
            const text = ((await tabs.nth(i).textContent()) ?? "").replace(/\s+/g, " ").trim();
            if (text) captured.push(text);
        }

        if (captured.length === 0) {
            if (await this.hasNoModulesSetupState()) {
                this.logNoModulesPresent();
            } else {
                console.log("[related] NOTE — no related tab labels captured; skipping");
            }
            return [];
        }
        return captured;
    }

    async relatedTab(){
        const capturedTabs = await this.captureRelatedTabs();
        if (capturedTabs.length === 0) {
            return;
        }
        await this.runRelatedActions(capturedTabs);
    }

    async runRelatedActions(capturedTabs: string[]) {
        if (capturedTabs.length === 0) {
            if (await this.hasNoModulesSetupState()) {
                this.logNoModulesPresent();
            } else {
                console.log("[related] NOTE — no related tabs to run actions on; skipping");
            }
            return;
        }

        let enteredTab = false;

        const moduleTabs = capturedTabs.filter((tab) => {
            const n = this.normalizeTabText(tab);
            return !n.includes("Updates") && !n.includes("Comments");
        });
        const viewOnlyTabs = capturedTabs.filter((tab) => {
            const n = this.normalizeTabText(tab);
            return n.includes("Updates") || n.includes("Comments");
        });

        this.debug("runActions", `module tabs: ${moduleTabs.join(" | ")}`);
        this.debug("runActions", `view-only tabs: ${viewOnlyTabs.join(" | ")}`);

        for (const tab of moduleTabs) {
            const tabName = tab.trim();
            if (!tabName) continue;

            const tabLink = await this.resolveRelatedTab(tabName);
            if (!tabLink) {
                this.skipModule(tabName, "related tab not found in tab strip");
                continue;
            }

            await this.clickRelatedModuleTab(tabName);

            const skipReason = await this.skipReasonAfterModuleTabClick();
            if (skipReason) {
                this.skipModule(tabName, skipReason);
                continue;
            }

            await this.clickQuickReplyIfRecordExists(tabName);
            this.debug("runActions", `finished module: ${this.moduleLabel(tabName)} — moving to next`);
            enteredTab = true;
        }

        if (viewOnlyTabs.length > 0) {
            await this.closeQuickActionModal();
            for (const tab of viewOnlyTabs) {
                const tabName = tab.trim();
                if (!tabName) continue;
                this.debug("runActions", `view tab only: ${tabName}`);
                if (tabName.includes("Updates")) {
                    await this.page.locator("#rsoft-Updates").click();
                } else {
                    await this.page.locator("#rsoft-Comments").click();
                }
                await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});
                enteredTab = true;
            }
        }

        if (!enteredTab) {
            if (await this.hasNoModulesSetupState()) {
                this.logNoModulesPresent();
                return;
            }
            console.log("[related] NOTE — no related module actions ran; skipping");
        }
    }

    private filterActionableModuleTabs(capturedTabs: string[]): string[] {
        return capturedTabs.filter((tab) => {
            const n = this.normalizeTabText(tab);
            return !n.includes("Updates") && !n.includes("Comments");
        });
    }

    /** Module tab labels from the detail view strip (same as runRelatedActions, no Updates/Comments). */
    async getSubmoduleModuleTabs(): Promise<string[]> {
        return this.filterActionableModuleTabs(await this.captureRelatedTabs());
    }

    /**
     * Opens a related module tab and clicks the first-row quickreply icon when present.
     * Returns false when the tab or icon is missing (caller should skip that module).
     */
    async openSubmoduleQuickReplyModal(tabName: string): Promise<boolean> {
        const tabLink = await this.resolveRelatedTab(tabName);
        if (!tabLink) {
            this.skipModule(tabName, "related tab not found in tab strip");
            return false;
        }

        await this.clickRelatedModuleTab(tabName);

        const skipReason = await this.skipReasonAfterModuleTabClick();
        if (skipReason) {
            this.skipModule(tabName, skipReason);
            return false;
        }

        const tableScope = this.moduleTableScope();
        await tableScope.click().catch(() => {});

        if ((await tableScope.locator("tbody tr:has(td)").count()) === 0) {
            this.skipModule(tabName, "no records in table — quickreply not available");
            return false;
        }

        const actionIcon = await this.waitForQuickReplyIcon(tableScope);
        if (!actionIcon) {
            this.skipModule(tabName, "quickreply icon not found on first row (timeout)");
            return false;
        }

        const isButtonLike = await actionIcon
            .evaluate((el) => {
                const tag = el.tagName.toLowerCase();
                return tag === "button" || tag === "a" || el.getAttribute("role") === "button";
            })
            .catch(() => false);

        if (isButtonLike && !(await actionIcon.isEnabled().catch(() => false))) {
            this.skipModule(tabName, "quickreply icon is disabled");
            return false;
        }

        this.debug("submoduleQA", `quickreply icon ready — click (${this.moduleLabel(tabName)})`);
        await actionIcon.scrollIntoViewIfNeeded().catch(() => {});
        await actionIcon.click();
        await expect(this.page.locator("#quick-action-modal")).toBeVisible({ timeout: 20_000 });
        return true;
    }
}