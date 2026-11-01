// 家計簿ウィジェット（Scriptable用）
// GitHub Pages の data.json を読み込んで、今月の残りと出張手当を表示します。
// タップすると家計簿ページが開きます。

const DATA_URL = "https://sprintershota01172-collab.github.io/dash-view/data.json";
const PAGE_URL = "https://sprintershota01172-collab.github.io/dash-view/space-2.html";

const GREEN = new Color("#1f9d63");
const DARK = new Color("#173526");
const GRAY = new Color("#7a8a80");
const BG = new Color("#ffffff");

function yen(n) {
  return "¥" + Number(n).toLocaleString("ja-JP");
}

async function main() {
  const w = new ListWidget();
  w.backgroundColor = BG;
  w.url = PAGE_URL;
  // 30分後に再読み込み
  w.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 30);
  w.setPadding(14, 16, 12, 16);

  try {
    const req = new Request(DATA_URL + "?t=" + Date.now());
    req.timeoutInterval = 10;
    const d = await req.loadJSON();

    const head = w.addStack();
    const title = head.addText("📒 家計簿 " + d.monthLabel);
    title.font = Font.boldSystemFont(13);
    title.textColor = DARK;
    w.addSpacer(6);

    const label = w.addText("あと使える");
    label.font = Font.systemFont(11);
    label.textColor = GRAY;

    const big = w.addText(yen(d.remaining));
    big.font = Font.boldSystemFont(30);
    big.textColor = GREEN;
    w.addSpacer(4);

    const sub = w.addText("使った " + yen(d.spent) + " / 予算 " + yen(d.budget));
    sub.font = Font.systemFont(11);
    sub.textColor = DARK;

    if (d.trip && d.trip.active) {
      w.addSpacer(6);
      const trip = w.addText("✈️ 出張手当の残り " + yen(d.trip.remaining));
      trip.font = Font.systemFont(12);
      trip.textColor = DARK;
    }

    w.addSpacer();
    const foot = w.addText("更新 " + d.updatedLabel);
    foot.font = Font.systemFont(9);
    foot.textColor = GRAY;
  } catch (e) {
    const err = w.addText("データを読み込めませんでした");
    err.font = Font.systemFont(12);
    err.textColor = GRAY;
  }

  if (config.runsInWidget) {
    Script.setWidget(w);
  } else {
    w.presentMedium();
  }
  Script.complete();
}

await main();
