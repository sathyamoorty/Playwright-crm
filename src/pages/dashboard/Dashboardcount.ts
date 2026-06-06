import { expect, Page } from '@playwright/test';
import { dashboardModules, type DashboardModule } from '@pages/dashboard/dashboardModules';
import { dashBoardNav } from '@pages/dashboard/dashNav';

type CardMeta = {
  cardName: string;
  cardCount: number;
  cvid: string;
  moduleName: string;
};

type RawCardMeta = {
  cardName: string;
  cardText: string;
  cvid: string;
  moduleName: string;
};

type VisibleModule = {
  moduleId: string;
  moduleLabel: string;
};

/** Fixed pause after list-view redirect before reading counts (~2 s). */
export const LIST_VIEW_SETTLE_MS = 2_000;

export class Dashboardcount {
  constructor(private page: Page) {}
  private firstCardMeta: CardMeta | null = null;

  private async waitReady() {
    await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {});
  }

  /** Light wait for dashboard cards after closing a list-view tab. */
  async waitForDashboardCards() {
    await this.waitReady();
    await this.page
      .locator('.card-content .card_list_box')
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => {});
  }

  private extractNumber(text: string): number {
    const match = text.replace(/,/g, "").match(/\d+/g);
    if (!match || match.length === 0) {
      throw new Error(`Unable to parse count from text: "${text}"`);
    }
    return Number(match[0]);
  }

  private tryExtractNumber(text: string): number | null {
    try {
      return this.extractNumber(text);
    } catch {
      return null;
    }
  }

  private extractLastNumber(text: string): number {
    const match = text.replace(/,/g, "").match(/\d+/g);
    if (!match || match.length === 0) {
      throw new Error(`Unable to parse count from text: "${text}"`);
    }
    return Number(match[match.length - 1]);
  }

  private tryExtractLastNumber(text: string): number | null {
    try {
      return this.extractLastNumber(text);
    } catch {
      return null;
    }
  }

  private buildDashboardListUrl(moduleName: string, cvid: string): string {
    const params = new URLSearchParams({
      Module: moduleName || "Enquiry",
      view: "AdvancedListView",
      viewname: cvid || "",
      viewtype: "dashboard",
      SelectFilter: cvid || "",
      viewModule: moduleName || "Enquiry",
      RecordFilter: cvid || "",
    });
    return `https://rdot.in/public/admin?${params.toString()}`;
  }

  private normalizeCardName(cardText: string): string {
    return cardText.split("\n").map((s) => s.trim()).filter(Boolean)[0] ?? "Unknown";
  }

  private async waitForActiveModuleTab(modulename: string) {
    const tab = this.page.locator(`#MoreMod_${modulename}`);
    await expect(tab).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(
        async () => {
          const active =
            (await tab.getAttribute('active_type')) === 'active' ||
            (await tab.evaluate((el) => el.classList.contains('active')));
          return active;
        },
        { timeout: 30_000 },
      )
      .toBe(true);
    await this.waitReady();
  }

  private cardBelongsToModule(
    cardName: string,
    dataModuleName: string,
    modulename: string,
    moduleLabel: string,
  ): boolean {
    const mn = modulename.toLowerCase();
    const label = moduleLabel.toLowerCase().replace(/\.\.\./g, '').trim();
    const cn = cardName.toLowerCase();
    const dm = (dataModuleName || '').toLowerCase();

    if (dm && (dm === mn || dm.includes(mn) || mn.includes(dm))) {
      return true;
    }

    if (mn === 'enquiry' || label.includes('enquiry')) {
      return cn.includes('enquiry') && !/^leads[-\s]/.test(cn);
    }
    if (mn === 'leads' || label === 'leads') {
      return cn.includes('lead');
    }
    if (mn === 'site_visit' || label.includes('site visit')) {
      return cn.includes('site') || cn.includes('visit');
    }
    if (mn.includes('booking') || label.includes('booking')) {
      return cn.includes('booking');
    }
    if (mn === 'unit' || label === 'unit') {
      return cn.includes('unit');
    }

    return true;
  }

  private async readVisibleCardsFromDom(
    expectedModulename?: string,
    strictActiveTab = true,
  ): Promise<RawCardMeta[]> {
    return this.page.evaluate(
      ({ expectedMod, strict }) => {
      const activeTab = document.querySelector<HTMLElement>(
        '#homemenucard a.filterlist.active, #homemenucard a.filterlist[active_type="active"]',
      );
      const activeModule = (activeTab?.getAttribute('modulename') ?? '').trim();

      if (
        strict &&
        expectedMod &&
        activeModule &&
        activeModule.toLowerCase() !== expectedMod.toLowerCase()
      ) {
        return [];
      }

      const cardBoxes = Array.from(
        document.querySelectorAll<HTMLElement>('.card-content .card_list_box'),
      ).filter((box) => !!box.offsetParent);

      const results: RawCardMeta[] = [];

      for (const box of cardBoxes) {
        const clickables = Array.from(
          box.querySelectorAll<HTMLElement>(
            '[onclick*="GotoListPage"], [onclick*="gotoListPage"]',
          ),
        ).filter((el) => !!el.offsetParent);

        for (const el of clickables) {
          const text = (el.innerText || '').trim();
          const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
          const countLine = lines.find((line) => /^\d[\d,]*$/.test(line)) ?? '';

          const container = (el.closest('[data-cvid]') ||
            el.closest("[id*='-']")) as HTMLElement | null;
          const containerId = container?.getAttribute('id') ?? '';
          const idMatch = containerId.match(/^(\d+)-/);

          results.push({
            cardName: lines[0] ?? 'Unknown',
            cardText: countLine || text,
            cvid: container?.getAttribute('data-cvid') ?? (idMatch?.[1] ?? ''),
            moduleName:
              container?.getAttribute('data-module-name') ??
              activeModule ??
              'Enquiry',
          });
        }
      }

      return results;
    },
      { expectedMod: expectedModulename ?? '', strict: strictActiveTab },
    );
  }

  /** Wait until dashboard cards render for the active module tab. */
  async waitForModuleDashboardCards(
    mod: Pick<DashboardModule, 'modulename' | 'label'>,
  ): Promise<boolean> {
    const card = this.page.locator('.card-content .card_list_box').first();
    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.waitForActiveModuleTab(mod.modulename).catch(() => {});
      if (await card.isVisible({ timeout: 20_000 }).catch(() => false)) {
        const raw = await this.readVisibleCardsFromDom(mod.modulename, false);
        if (raw.length > 0) return true;
      }
      console.log(
        `[dashboard count] Cards not ready for "${mod.label}" (attempt ${attempt}/3) — clear filter and reselect tab`,
      );
      await this.clearDashboardFilter();
      await new dashboardModules(this.page).clickModuleTab(mod.modulename);
      await this.waitReady();
    }
    return false;
  }

  private async triggerDashboardCardClick(cardName: string): Promise<void> {
    await this.page.evaluate((name) => {
      const visibleCards = Array.from(
        document.querySelectorAll<HTMLElement>('[onclick*="GotoListPage"], [onclick*="gotoListPage"]')
      ).filter((el) => !!el.offsetParent);

      const targetCard =
        visibleCards.find((el) => (el.innerText || "").toLowerCase().includes((name || "").toLowerCase())) ?? visibleCards[0];
      if (!targetCard) return;

      const w = window as unknown as {
        GotoListPage?: (event: Event | null, target: Element, mode: string) => void;
        gotoListPage?: (event: Event | null, target: Element, mode: string) => void;
      };

      if (typeof w.GotoListPage === "function") {
        w.GotoListPage(null, targetCard, "dashboard");
        return;
      }
      if (typeof w.gotoListPage === "function") {
        w.gotoListPage(null, targetCard, "dashboard");
        return;
      }

      targetCard.click();
    }, cardName);
  }

  async openDashboard() {
    await this.page.goto("https://rdot.in/public/admin/Dashboard");
    await this.waitReady();
  }

  /** Clears an applied dashboard filter before switching to the next module tab. */
  async clearDashboardFilter() {
    await this.waitReady();
    const clear = this.page.locator('[class="dashFilterclrBtn"]').first();
    if (await clear.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await clear.click({ timeout: 5_000 }).catch(() => {});
      await this.waitReady();
      return;
    }
    const filterArrow = this.page
      .locator('a.arrow[onclick*="filtersListDetails"]')
      .first();
    if (await filterArrow.isVisible({ timeout: 1_500 }).catch(() => false)) {
      await filterArrow.click({ timeout: 3_000 }).catch(() => {});
    }
    if (await clear.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await clear.click({ timeout: 5_000 }).catch(() => {});
    }
    await this.waitReady();
  }

  async getVisibleModuleNames(): Promise<string[]> {
    await this.waitReady();
    const bar = await new dashboardModules(this.page).getVisibleBarModules();
    return bar.map((m) => m.label);
  }

  async getVisibleModules(): Promise<VisibleModule[]> {
    await this.waitReady();
    const bar = await new dashboardModules(this.page).getVisibleBarModules();
    return bar.map((m) => ({
      moduleId: `MoreMod_${m.modulename}`,
      moduleLabel: m.label,
    }));
  }

  async selectModuleByName(moduleName: string): Promise<void> {
    await this.waitReady();
    await new dashboardModules(this.page).clickModuleTab(moduleName);
    await this.waitReady();
  }

  async selectModuleById(moduleId: string): Promise<void> {
    await this.waitReady();
    await new dashboardModules(this.page).clickModuleTab(moduleId);
    await this.waitReady();
  }

  async getFirstCardNameAndCount(): Promise<{ cardName: string; cardCount: number }> {
    await this.waitReady();
    const cards = await this.readVisibleCardsFromDom();
    const first = cards[0];

    if (!first || !first.cardText) {
      throw new Error("Unable to locate first dashboard card");
    }

    const cardCount = this.extractNumber(first.cardText);
    const cardName = this.normalizeCardName(first.cardText);
    this.firstCardMeta = { cardName, cardCount, cvid: first.cvid, moduleName: first.moduleName };
    return { cardName, cardCount };
  }

  async getAllVisibleCardsMeta(
    mod?: Pick<DashboardModule, 'modulename' | 'label'>,
  ): Promise<CardMeta[]> {
    await this.waitReady();
    const expectedMod = mod?.modulename;
    if (expectedMod) {
      await this.waitForActiveModuleTab(expectedMod);
    }

    let all = await this.readVisibleCardsFromDom(expectedMod, true);
    if (all.length === 0 && expectedMod) {
      all = await this.readVisibleCardsFromDom(expectedMod, false);
    }
    const cards: CardMeta[] = [];

    for (const x of all) {
      if (!/\d/.test(x.cardText)) continue;
      const cardCount = this.tryExtractNumber(x.cardText);
      if (cardCount === null) continue;
      const meta: CardMeta = {
        cardName: x.cardName,
        cardCount,
        cvid: x.cvid,
        moduleName: x.moduleName,
      };
      if (
        mod &&
        !this.cardBelongsToModule(
          meta.cardName,
          meta.moduleName,
          mod.modulename,
          mod.label,
        )
      ) {
        continue;
      }
      cards.push(meta);
    }

    return cards;
  }

  /** Open list view in a new tab via dashboard filter URL (reliable vs card title click). */
  async openListViewForCard(card: CardMeta, moduleModulename: string): Promise<Page> {
    const listPage = await this.page.context().newPage();
    await listPage.goto(
      this.buildDashboardListUrl(moduleModulename || card.moduleName, card.cvid),
    );
    await this.waitForListViewReady(listPage);
    return listPage;
  }

  async openCardListByMeta(meta: { cvid: string; moduleName: string; cardName: string }) {
    await this.page.goto(this.buildDashboardListUrl(meta.moduleName, meta.cvid));
    await this.waitReady();
  }

  /** User click on card → new tab with list view (same as moduleNav line 41). */
  async openCardInNewPage(cardName: string): Promise<Page> {
    await this.waitReady();
    const listPage = await new dashBoardNav(this.page).clickCardInNewPage(cardName);
    await this.waitForListViewReady(listPage);
    return listPage;
  }

  /** Wait for redirect, then pause 2–3 s before reading list counts. */
  async waitForListViewReady(onPage: Page) {
    await onPage.bringToFront();
    await onPage
      .waitForURL(/AdvancedListView|view=AdvancedListView|viewtype=dashboard/i, {
        timeout: 15_000,
      })
      .catch(() => {});
    await onPage
      .locator('#livewireOverly')
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => {});
    await onPage.waitForTimeout(LIST_VIEW_SETTLE_MS);
  }

  private async readListViewTotalCountFromDom(onPage: Page): Promise<number | null> {
    return onPage.evaluate(() => {
      const body = document.body?.innerText ?? '';
      const patterns = [
        /Showing\s+Page\s+\d+\s+to\s+\d+\s+of\s+([\d,]+)/i,
        /Showing\s+\d+\s+to\s+\d+\s+of\s+([\d,]+)/i,
        /of\s+([\d,]+)\s+entries?/i,
        /of\s+([\d,]+)\s+records?/i,
        /Total\s+Records?\s*:?\s*([\d,]+)/i,
      ];
      for (const re of patterns) {
        const m = body.match(re);
        if (m?.[1]) {
          const n = Number(m[1].replace(/,/g, ''));
          if (!Number.isNaN(n)) return n;
        }
      }
      return null;
    });
  }

  async clickFirstCard() {
    await this.waitReady();
    await this.triggerDashboardCardClick(this.firstCardMeta?.cardName ?? "");

    await this.page.waitForFunction(
      () => /AdvancedListView|view=AdvancedListView|viewtype=dashboard/i.test(window.location.href),
      undefined,
      { timeout: 10_000 }
    ).catch(async () => {});

    if (this.firstCardMeta?.cvid) {
      const url = this.page.url();
      const hasCvid = url.includes(`RecordFilter=${this.firstCardMeta.cvid}`) || url.includes(`SelectFilter=${this.firstCardMeta.cvid}`);
      const stillDashboard = /\/Dashboard$/i.test(new URL(url).pathname);
      if (!hasCvid || stillDashboard) {
        await this.page.goto(this.buildDashboardListUrl(this.firstCardMeta.moduleName, this.firstCardMeta.cvid));
      }
    }
    await this.waitReady();
  }

  async getListViewTotalCount(onPage: Page = this.page): Promise<number | null> {
    if (onPage.isClosed()) {
      return null;
    }
    return this.readListViewTotalCountFromDom(onPage);
  }

  async getListViewFilterName(fallbackName: string, onPage: Page = this.page): Promise<string> {
    await onPage.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    const candidates = [
      onPage.locator('#filterBar .filter-item:visible').first(),
      onPage.locator('.viewname:visible').first(),
      onPage.locator('h1:visible').first(),
      onPage.locator('h2:visible').first(),
    ];

    for (const locator of candidates) {
      if ((await locator.count()) === 0) continue;
      if (!(await locator.isVisible({ timeout: 2000 }).catch(() => false))) continue;
      const text = ((await locator.innerText()) ?? '').trim().split('\n')[0]?.trim();
      if (text) return text;
    }

    return fallbackName;
  }

  logDashboardListViewMismatch(
    cardName: string,
    cardCount: number,
    listFilterName: string,
    listCount: number,
  ): void {
    console.log(
      `Dashboard Card ${cardName} & ${cardCount} mismatch with List view filter ${listFilterName} & ${listCount}`,
    );
  }

  logDashboardListViewMatch(
    cardName: string,
    cardCount: number,
    listFilterName: string,
    listCount: number,
  ): void {
    console.log(
      `Dashboard Card ${cardName} & ${cardCount} matches List view filter ${listFilterName} & ${listCount}`,
    );
  }

  /**
   * Step 1: dashboard card header + count (caller logs).
   * Step 2: navigate to list view and read filter name + count.
   * Step 3: match → log success. Step 4: mismatch → log only, never throw.
   */
  async compareCardWithListView(
    card: CardMeta,
    moduleModulename: string,
  ): Promise<boolean> {
    let listPage: Page | undefined;
    try {
      listPage = await this.openListViewForCard(card, moduleModulename);
      const listFilterName = await this.getListViewFilterName(card.cardName, listPage);
      const listCount = await this.getListViewTotalCount(listPage);

      if (listCount === null) {
        console.log(
          `Unable to read list view count for filter "${listFilterName}" (dashboard card "${card.cardName}" & ${card.cardCount}) — continuing.`,
        );
        return false;
      }

      if (listCount !== card.cardCount) {
        this.logDashboardListViewMismatch(card.cardName, card.cardCount, listFilterName, listCount);
        return false;
      }

      this.logDashboardListViewMatch(card.cardName, card.cardCount, listFilterName, listCount);
      return true;
    } catch (error) {
      console.log(
        `Skipped card "${card.cardName}" & ${card.cardCount} — ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      if (listPage && listPage !== this.page) {
        await listPage.close().catch(() => {});
        await this.page.bringToFront();
      }
    }
  }

  getFirstCardMeta() {
    return this.firstCardMeta;
  }
}

async function compareModuleDashboardCards(
  page: Page,
  mod: DashboardModule,
  fromKebab: boolean,
  options?: { skipOpenDashboard?: boolean },
) {
  const dashboardcount = new Dashboardcount(page);
  const dashMods = new dashboardModules(page);
  if (!options?.skipOpenDashboard) {
    await dashboardcount.openDashboard();
  }
  await dashboardcount.clearDashboardFilter();

  if (fromKebab) {
    await dashMods.clickKebabModule(mod);
  } else {
    await dashMods.clickBarModule(mod);
  }

  console.log(
    `\n===== Dashboard count: ${mod.label} (MoreMod_${mod.modulename})${fromKebab ? ' [kebab]' : ''} =====`,
  );

  const cardsReady = await dashboardcount.waitForModuleDashboardCards(mod);
  if (!cardsReady) {
    console.log(`No dashboard cards found for module "${mod.label}" — skipping count.`);
    return;
  }

  let cards = await dashboardcount.getAllVisibleCardsMeta(mod);
  if (cards.length === 0) {
    console.log(
      `[dashboard count] No matching cards for "${mod.label}" after tab switch — retrying module click.`,
    );
    if (fromKebab) {
      await dashMods.clickKebabModule(mod);
    } else {
      await dashMods.clickBarModule(mod);
    }
    await dashboardcount.waitForModuleDashboardCards(mod);
    cards = await dashboardcount.getAllVisibleCardsMeta(mod);
  }

  if (cards.length === 0) {
    console.log(`No dashboard cards found for module "${mod.label}" — skipping count.`);
    return;
  }

  const wrongModuleCards = cards.filter((c) =>
    mod.modulename.toLowerCase() === 'enquiry'
      ? c.cardName.toLowerCase().startsWith('leads-')
      : false,
  );
  if (wrongModuleCards.length === cards.length) {
    console.log(
      `[dashboard count] Stale cards for "${mod.label}" (e.g. ${wrongModuleCards[0]?.cardName}) — skipping count.`,
    );
    return;
  }

  for (const card of cards) {
    console.log(
      `Dashboard card header: "${card.cardName}", count: ${card.cardCount} (module: ${mod.label}, cvid: ${card.cvid})`,
    );
    await dashboardcount.compareCardWithListView(card, mod.modulename);
    await dashboardcount.waitForDashboardCards();
  }
}

/** Compare dashboard card counts vs list view for one module only (used in capture-all-modules loop). */
export async function runDashboardcountForModule(
  page: Page,
  mod: DashboardModule,
  fromKebab = false,
  options?: { skipOpenDashboard?: boolean },
) {
  await compareModuleDashboardCards(page, mod, fromKebab, options);
}

export async function runDashboardcount(page: Page) {
  const dashboardcount = new Dashboardcount(page);
  const dashMods = new dashboardModules(page);
  await dashboardcount.openDashboard();

  let moduleIndex = 0;
  await dashMods.forEachDashboardModule(async (mod, { fromKebab }) => {
    if (moduleIndex > 0) {
      await dashboardcount.clearDashboardFilter();
    }
    moduleIndex++;
    await compareModuleDashboardCards(page, mod, fromKebab, {
      skipOpenDashboard: true,
    });
  });
}