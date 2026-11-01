// ニュースウィジェット（Scriptable用）
// Googleニュースの見出しを「総合・株・テック」の3ジャンルから集めて表示します。
// 見出しをタップすると記事が開きます。

const FEEDS = [
{ tag: "総合", url: "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja"},
{ tag: "株", url: "https://news.google.com/rss/search?q=%E6%A0%AA%E5%BC%8F%20%E3%83%9E%E3%83%BC%E3%82%B1%E3%83%83%E3%83%88&hl=ja&gl=JP&ceid=JP:ja"},
{ tag: "テック", url: "https://news.google.com/rss/search?q=%E3%83%86%E3%82%AF%E3%83%8E%E3%83%AD%E3%82%B8%E3%83%BC%20%E3%82%AC%E3%82%B8%E3%82%A7%E3%83%83%E3%83%88&hl=ja&gl=JP&ceid=JP:ja"},
];

const DARK = new Color("#1c2b22");
const GRAY = new Color("#7a8a80");
const ACCENT = new Color("#1f9d63");
const TAGCOLOR = new Color("#2f6fd0");
const BG = new Color("#ffffff");

function decode(s) {
return s
.replace(/&amp;/g, "&")
.replace(/&lt;/g, "<")
.replace(/&gt;/g, ">")
.replace(/&quot;/g, '"')
.replace(/&#39;/g, "'")
.replace(/<!\[CDATA\[|\]\]>/g, "");
}

function tagText(block, name) {
const m = block.match(new RegExp("<" + name + "[^>]*>([\\s\\S]*?)</" + name + ">"));
return m? decode(m[1].trim()): "";
}

function parseItems(xml, tag) {
const items = [];
const re = /<item>([\s\S]*?)<\/item>/g;
let m;
while ((m = re.exec(xml))!== null) {
const b = m[1];
let title = tagText(b, "title");
const source = tagText(b, "source");
if (source && title.endsWith(" - " + source)) {
title = title.slice(0, title.length - source.length - 3);
}
const link = tagText(b, "link");
const date = new Date(tagText(b, "pubDate"));
if (title && link) items.push({ tag, title, link, source, date});
}
return items;
}

function ago(d) {
const min = Math.max(1, Math.round((Date.now() - d.getTime()) / 60000));
if (min < 60) return min + "分前";
const h = Math.round(min / 60);
if (h < 24) return h + "時間前";
return Math.round(h / 24) + "日前";
}

async function loadAll() {
const results = await Promise.all(
FEEDS.map(async (f) => {
try {
const req = new Request(f.url);
req.timeoutInterval = 12;
const xml = await req.loadString();
return parseItems(xml, f.tag).slice(0, 8);
} catch (e) {
return [];
}
})
);
let all = results.flat();
// 重複タイトルを除いて新しい順
const seen = new Set();
all = all.filter((it) => {
const key = it.title.slice(0, 24);
if (seen.has(key)) return false;
seen.add(key);
return true;
});
all.sort((a, b) => b.date - a.date);
// ジャンルが偏らないよう上位を交互に拾う
const picked = [];
const pools = { "総合": [], "株": [], "テック": []};
all.forEach((it) => pools[it.tag] && pools[it.tag].push(it));
const order = ["総合", "株", "総合", "テック", "株", "総合", "テック"];
order.forEach((t) => {
const it = pools[t] && pools[t].shift();
if (it) picked.push(it);
});
return picked;
}

async function main() {
const family = config.widgetFamily || "large";
const counts = { small: 2, medium: 4, large: 7};
const limit = counts[family] || 7;

const w = new ListWidget();
w.backgroundColor = BG;
w.url = "https://news.google.com/?hl=ja&gl=JP&ceid=JP:ja";
w.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 30);
w.setPadding(12, 14, 10, 14);

const head = w.addStack();
const h = head.addText("📰 ニュース");
h.font = Font.boldSystemFont(13);
h.textColor = DARK;
head.addSpacer();
const now = new Date();
const upd = head.addText(now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0") + " 更新");
upd.font = Font.systemFont(9);
upd.textColor = GRAY;
w.addSpacer(6);

try {
const items = (await loadAll()).slice(0, limit);
if (items.length === 0) throw new Error("empty");
items.forEach((it, i) => {
const row = w.addStack();
row.layoutVertically();
const t = row.addText("" + it.title);
t.font = Font.systemFont(family === "large"? 12: 11);
t.textColor = DARK;
t.lineLimit = 2;
t.url = it.link;
if (family!== "small") {
const meta = row.addText((it.source || "") + " ・ " + ago(it.date));
meta.font = Font.systemFont(9);
meta.textColor = GRAY;
}
if (i < items.length - 1) w.addSpacer(family === "large"? 7: 5);
});
} catch (e) {
const err = w.addText("ニュースを読み込めませんでした");
err.font = Font.systemFont(11);
err.textColor = GRAY;
}

if (config.runsInWidget) {
Script.setWidget(w);
} else {
w.presentLarge();
}
Script.complete();
}

await main();
