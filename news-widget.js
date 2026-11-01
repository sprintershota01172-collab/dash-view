// ニュースウィジェット（Scriptable用）・写真付き
// Museが30分おきに更新する news.json（見出し＋記事写真）を読み込んで表示します。
// 見出しや写真をタップすると記事が開きます。

const DATA_URL = "https://sprintershota01172-collab.github.io/dash-view/news.json";

const DARK = new Color("#1c2b22");
const GRAY = new Color("#7a8a80");
const BG = new Color("#ffffff");
const PLACEHOLDER = new Color("#e8efe a".replace(" ", ""), 1);

function ago(iso) {
if (!iso) return "";
const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
if (min < 60) return min + "分前";
const h = Math.round(min / 60);
if (h < 24) return h + "時間前";
return Math.round(h / 24) + "日前";
}

async function loadImage(url) {
if (!url) return null;
try {
const req = new Request(url);
req.timeoutInterval = 10;
return await req.loadImage();
} catch (e) {
return null;
}
}

async function main() {
const family = config.widgetFamily || "large";
const w = new ListWidget();
w.backgroundColor = BG;
w.url = "https://news.google.com/?hl=ja&gl=JP&ceid=JP:ja";
w.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 30);
w.setPadding(12, 14, 10, 14);

let data = null;
try {
const req = new Request(DATA_URL + "?t=" + Date.now());
req.timeoutInterval = 12;
data = await req.loadJSON();
} catch (e) {}

const head = w.addStack();
const h = head.addText("📰 ニュース");
h.font = Font.boldSystemFont(13);
h.textColor = DARK;
head.addSpacer();
if (data && data.updatedLabel) {
const upd = head.addText(data.updatedLabel + " 更新");
upd.font = Font.systemFont(9);
upd.textColor = GRAY;
}

if (!data ||!data.items || data.items.length === 0) {
w.addSpacer(8);
const err = w.addText("ニュースを読み込めませんでした");
err.font = Font.systemFont(11);
err.textColor = GRAY;
finish(w, family);
return;
}

const items = data.items;
const images = await Promise.all(items.slice(0, 5).map((it) => loadImage(it.imageLarge || it.image)));

if (family === "small") {
w.addSpacer(6);
if (images[0]) {
const im = w.addImage(images[0]);
im.imageSize = new Size(150, 74);
im.cornerRadius = 8;
im.url = items[0].link;
w.addSpacer(5);
}
const t = w.addText("" + items[0].title);
t.font = Font.systemFont(11);
t.textColor = DARK;
t.lineLimit = 3;
t.url = items[0].link;
finish(w, family);
return;
}

// 先頭は大きな写真で
w.addSpacer(7);
const hero = items[0];
if (images[0]) {
const im = w.addImage(images[0]);
im.imageSize = new Size(family === "large"? 336: 336, family === "large"? 104: 84);
im.cornerRadius = 10;
im.url = hero.link;
w.addSpacer(5);
}
const ht = w.addText("" + hero.title);
ht.font = Font.boldSystemFont(13);
ht.textColor = DARK;
ht.lineLimit = 2;
ht.url = hero.link;
const hm = w.addText((hero.source || "") + " ・ " + ago(hero.pubDate));
hm.font = Font.systemFont(9);
hm.textColor = GRAY;

// 残りは写真＋見出しの行で
const rowCount = family === "large"? 3: 2;
for (let i = 1; i <= rowCount && i < items.length; i++) {
const it = items[i];
w.addSpacer(8);
const row = w.addStack();
row.centerAlignContent();
if (images[i]) {
const th = row.addImage(images[i]);
th.imageSize = new Size(52, 52);
th.cornerRadius = 7;
th.url = it.link;
row.addSpacer(8);
}
const col = row.addStack();
col.layoutVertically();
const t = col.addText("" + it.title);
t.font = Font.systemFont(11);
t.textColor = DARK;
t.lineLimit = 2;
t.url = it.link;
const meta = col.addText((it.source || "") + " ・ " + ago(it.pubDate));
meta.font = Font.systemFont(9);
meta.textColor = GRAY;
}

finish(w, family);
}

function finish(w, family) {
if (config.runsInWidget) {
Script.setWidget(w);
} else if (family === "medium") {
w.presentMedium();
} else if (family === "small") {
w.presentSmall();
} else {
w.presentLarge();
}
Script.complete();
}

await main();
