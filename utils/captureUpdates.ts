import { Page,TestInfo } from "@playwright/test";
export async function captureTimelineUpdates(
    page: Page,
    testInfo: TestInfo,
    attachmentName: string
) {
    const timelineCards = page.locator("li.appendli");
    const timelineData = [];

    await timelineCards.first().waitFor({ state: "visible" });

    const count = await timelineCards.count();

    for (let i = 0; i < count; i++) {
        const cardText = await timelineCards.nth(i).innerText();

        const lines = cardText
            .split("\n")
            .map(line => line.trim())
            .filter(line => line !== "");

        timelineData.push({
            dateTime: lines[0] || "",
            timeAgo: (lines[1] || "").replace("(", "").replace(")", ""),
            title: lines[2] || "",
            details: lines.slice(3)
        });    
    }

    const jsonData = JSON.stringify(timelineData, null, 2);

    await testInfo.attach(attachmentName, {
        body: jsonData,
        contentType: "application/json"
    });

    return timelineData;
}
