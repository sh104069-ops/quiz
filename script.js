'use strict';
/* 剣道合宿 クイズ大会
   ・外部ファイルやネット接続を使わない（オフライン動作）
   ・問題／チーム／得点はブラウザ（localStorage）に自動保存 */
(() => {
const STORE_KEY = 'kendoQuiz.v1';
const LETTERS = ['A', 'B', 'C', 'D'];
const LEVEL_LABEL = { 1: '★ やさしい', 2: '★★ ふつう', 3: '★★★ むずかしい' };
const TYPE_LABEL = { choice: '選択', ox: '○✕', free: '口頭・記述' };

const DEFAULT_SETTINGS = { title: '剣道合宿 クイズ大会', subtitle: '致道館 合宿レクリエーション', timer: 15, sound: true };
const DEFAULT_TEAMS = [
  { name: '赤チーム', color: '#d8342c' },
  { name: '白チーム', color: '#f3efe4' },
  { name: '青チーム', color: '#2f6fdb' },
  { name: '黄チーム', color: '#e3b341' },
];

// Q(形式, ジャンル, 難しさ, 得点, 問題文, 選択肢, 正解, 解説, 要確認)
const Q = (type, cat, level, pts, text, choices, answer, explain = '', check = false) =>
  ({ type, cat, level, pts, text, choices, answer, explain, check });

const DEFAULT_QUESTIONS = [
  // 道場・先生
  Q('choice', '道場・先生', 1, 10, '「ちどうかん」の正しい漢字はどっち？', ['致道館', '到道館'], 0, '正しくは「致道館」。「致」と「到」はよく似ているので要注意！'),
  Q('choice', '道場・先生', 1, 10, '小林義茂先生の利き手は？', ['右手', '左手'], 0, '', true),
  Q('ox', '道場・先生', 1, 10, '小林裕子先生の出身地は、栃木県である。', [], 'o', '', true),
  Q('free', '道場・先生', 2, 10, '上原真守先生の好きな「　　　」は何でしょう？', [], '（出題者が設定してください）', '', true),
  Q('free', '道場・先生', 2, 20, '上原香織先生は広島出身！広島東洋カープの選手を2人答えなさい。', [], '例：菊池涼介、小園海斗、坂倉将吾、森下暢仁、床田寛樹 など', 'OBや監督を正解にするかは出題者が判定します。', true),
  // 剣道
  Q('ox', '剣道', 1, 10, '竹刀《しない》は、4本の竹を組み合わせてできている。', [], 'o', '4本の竹を合わせ、柄革・中結・先革・弦でまとめています。'),
  Q('choice', '剣道', 1, 10, '剣道で一本になる打突部位ではないのは？', ['面', '小手', '胴', '肩'], 3, '打突部位は面・小手・胴・突きの4つです。'),
  Q('choice', '剣道', 1, 10, '剣道の試合の審判《しんぱん》は何人？', ['1人', '2人', '3人', '5人'], 2, '主審1人と副審2人の3人で判定します。'),
  Q('choice', '剣道', 1, 10, '審判が持つ旗の色の組み合わせは？', ['赤と白', '赤と青', '白と黒', '黄と緑'], 0),
  Q('ox', '剣道', 1, 10, '剣道は「礼に始まり、礼に終わる」といわれる。', [], 'o'),
  Q('choice', '剣道', 2, 10, '「蹲踞」の読み方は？', ['そんきょ', 'そんけい', 'しゃがみ', 'うずくまり'], 0, '稽古や試合の始めと終わりに、かかとを上げて腰を落とす姿勢です。'),
  Q('choice', '剣道', 2, 10, '竹刀の先についている革の部分を何という？', ['先革', '柄革', '中結', '弦'], 0, '柄革は握る部分、中結は先から約4分の1の位置の革、弦は竹刀の背側に張る糸です。'),
  Q('ox', '剣道', 2, 10, '試合で同じ選手が反則を2回すると、相手に一本が与えられる。', [], 'o'),
  Q('ox', '剣道', 2, 10, '竹刀の長さや重さには、年齢（学年）ごとに決まりがある。', [], 'o'),
  Q('choice', '剣道', 3, 20, '打ったあとも油断せず、相手の反撃にすぐ備える心と構えを何という？', ['残心', '初心', '平常心', '一心'], 0),
  Q('choice', '剣道', 3, 20, '袴の前側にあるひだの数は？', ['3本', '5本', '7本', '9本'], 1, '前に5本、後ろに2本。前の5本は「仁・義・礼・智・信」を表すともいわれます。'),
  Q('ox', '剣道', 3, 20, '剣道の段位で、現在いちばん上は「十段」である。', [], 'x', '現在の最高段位は八段です。'),
  Q('choice', '剣道', 3, 20, '全日本剣道選手権大会（男子）が毎年行われる会場は？', ['日本武道館', '東京ドーム', '両国国技館', '大阪城ホール'], 0),
  // 武道
  Q('choice', '武道', 1, 10, '次のうち「武道」ではないものは？', ['弓道', '柔道', '相撲', 'フェンシング'], 3, '日本の武道には剣道・柔道・弓道・相撲・空手道・合気道・少林寺拳法・なぎなた・銃剣道があります。'),
  Q('ox', '武道', 1, 10, '宮本武蔵は、刀を2本使う「二刀流」で有名な剣豪である。', [], 'o'),
  Q('choice', '武道', 2, 10, '柔道をつくった人は？', ['嘉納治五郎', '宮本武蔵', '坂本龍馬', '野口英世'], 0),
  Q('ox', '武道', 3, 20, '日本武道館は、1964年の東京オリンピックの柔道会場として建てられた。', [], 'o'),
  // 山梨・甲府
  Q('choice', '山梨・甲府', 1, 10, '山梨県の県庁所在地は？', ['甲府市', '富士吉田市', '笛吹市', '甲斐市'], 0),
  Q('ox', '山梨・甲府', 1, 10, '山梨県は海に面している。', [], 'x', '山梨県は海のない内陸県です。'),
  Q('choice', '山梨・甲府', 1, 10, '「風林火山」の旗で知られる甲斐の戦国武将は？', ['武田信玄', '上杉謙信', '織田信長', '徳川家康'], 0),
  Q('choice', '山梨・甲府', 1, 10, '信玄餅にかけて食べるものは？', ['黒みつ', 'しょうゆ', 'マヨネーズ', 'ケチャップ'], 0, 'きなこをまぶしたお餅に黒みつをかけて食べます。'),
  Q('choice', '山梨・甲府', 1, 10, '太い麺をかぼちゃや野菜とみそで煮込んだ、山梨の郷土料理は？', ['ほうとう', 'きしめん', 'ちゃんぽん', 'わんこそば'], 0),
  Q('choice', '山梨・甲府', 2, 10, '富士山の高さは？', ['3776m', '3677m', '3190m', '2776m'], 0, '「富士山のように、みななろう（3776）」と覚えよう。'),
  Q('choice', '山梨・甲府', 2, 10, '山梨県の生産量が日本一ではない果物は？', ['ぶどう', 'もも', 'すもも', 'りんご'], 3, 'ぶどう・もも・すももは山梨県が日本一。りんごは青森県が日本一です。'),
  Q('choice', '山梨・甲府', 2, 10, '「富士五湖」に入っていない湖は？', ['河口湖', '山中湖', '本栖湖', '芦ノ湖'], 3, '富士五湖は山中湖・河口湖・西湖・精進湖・本栖湖。芦ノ湖は神奈川県の箱根にあります。'),
  Q('choice', '山梨・甲府', 2, 10, '山梨県の「県の鳥」は？', ['うぐいす', 'つる', 'はと', 'からす'], 0),
  Q('ox', '山梨・甲府', 3, 20, '甲府市の武田神社は、武田氏の館（躑躅ヶ崎館）があった場所に建っている。', [], 'o'),
  Q('ox', '山梨・甲府', 3, 20, 'ヴァンフォーレ甲府は、2022年に天皇杯で優勝した。', [], 'o'),
  // スポーツ
  Q('choice', 'スポーツ', 1, 10, '野球で、守備につく1チームの人数は？', ['9人', '10人', '11人', '6人'], 0),
  Q('ox', 'スポーツ', 1, 10, '広島東洋カープのチームカラーは青である。', [], 'x', 'チームカラーは赤です。'),
  Q('choice', 'スポーツ', 2, 10, '大谷翔平選手の出身県は？', ['岩手県', '北海道', '山梨県', '大阪府'], 0),
  Q('choice', 'スポーツ', 3, 20, '2026年サッカーワールドカップの開催国に入っていない国は？', ['アメリカ', 'カナダ', 'メキシコ', 'ブラジル'], 3),
  // エンタメ
  Q('choice', 'エンタメ', 1, 10, 'ドラえもんの大好物は？', ['どら焼き', 'メロンパン', 'たい焼き', 'ラーメン'], 0),
  Q('choice', 'エンタメ', 1, 10, '「鬼滅の刃」の主人公の名前は？', ['竈門炭治郎', '我妻善逸', '嘴平伊之助', '冨岡義勇'], 0),
  Q('ox', 'エンタメ', 1, 10, 'サザエさんの弟の名前は「カツオ」である。', [], 'o'),
  Q('choice', 'エンタメ', 2, 10, 'アンパンマンの作者は？', ['やなせたかし', '手塚治虫', '藤子・F・不二雄', '鳥山明'], 0),
  // ファイナル
  Q('choice', 'ファイナル', 3, 50, '剣道の試合で、相手に向かってする立礼は、およそ何度頭を下げる？', ['15度', '30度', '45度', '90度'], 0, '相手への礼は約15度、神前や上座への礼は約30度です。'),
];

/* ---------- 状態 ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// 「漢字《かな》」をルビに
const fmt = (s) => esc(s).replace(/([\u4E00-\u9FFF々〆ヵヶ]+)《(.+?)》/g, '<ruby>$1<rt>$2</rt></ruby>').replace(/\n/g, '<br>');
// 縦書き（1文字ずつ縦に積む。長音などは回転）
const vstack = (s) => [...String(s)].map((c) => `<span${'ーｰ－-—〜～…（）()「」'.includes(c) ? ' class="rot"' : ''}>${esc(c)}</span>`).join('');
const plain = (s) => String(s ?? '').replace(/《.+?》/g, '');

function normQ(q) {
  const type = ['choice', 'ox', 'free'].includes(q.type) ? q.type : 'choice';
  const choices = Array.isArray(q.choices) ? q.choices.map(String).slice(0, 4) : [];
  let answer = q.answer;
  if (type === 'ox') answer = answer === 'x' ? 'x' : 'o';
  else if (type === 'choice') answer = Math.min(Math.max(0, parseInt(answer, 10) || 0), Math.max(0, choices.length - 1));
  else answer = String(answer ?? '');
  return {
    id: q.id || uid(), enabled: q.enabled !== false, type,
    cat: String(q.cat || 'その他'), level: [1, 2, 3].includes(+q.level) ? +q.level : 1,
    pts: Math.max(0, parseInt(q.pts, 10) || 0), text: String(q.text || ''),
    choices, answer, explain: String(q.explain || ''), check: !!q.check,
  };
}
const normT = (t) => ({ id: t.id || uid(), name: String(t.name || 'チーム'), color: /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : '#888888', score: parseInt(t.score, 10) || 0 });

function factory() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    teams: DEFAULT_TEAMS.map(normT),
    questions: DEFAULT_QUESTIONS.map(normQ),
    pos: 0,
  };
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY));
    if (d && Array.isArray(d.questions) && Array.isArray(d.teams)) {
      return {
        settings: { ...DEFAULT_SETTINGS, ...d.settings },
        teams: d.teams.map(normT), questions: d.questions.map(normQ),
        pos: parseInt(d.pos, 10) || 0,
      };
    }
  } catch (e) { /* 読めないときは初期状態 */ }
  return factory();
}
let S = load();
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* 保存できない環境 */ } }

const list = () => S.questions.filter((q) => q.enabled);
const cur = () => list()[S.pos];
let screen = 'title';
let phase = 'ready'; // ready / counting / paused / locked / revealing / revealed
let selected = new Set();
const awarded = new Set();

function inkFor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#231a10' : '#ffffff';
}
function kan(n) {
  const d = '〇一二三四五六七八九';
  if (n < 10) return d[n];
  if (n < 100) return (n >= 20 ? d[Math.floor(n / 10)] : '') + '十' + (n % 10 ? d[n % 10] : '');
  return String(n);
}

/* ---------- 効果音（Web Audio・音声ファイル不要） ---------- */
let actx = null;
function ac() {
  if (!S.settings.sound) return null;
  if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; actx = new C(); }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(f, dur, type = 'sine', vol = 0.18, delay = 0) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol, delay = 0, hp = 800) {
  const a = ac(); if (!a) return;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + delay;
  s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(a.destination); s.start(t); s.stop(t + dur);
}
const SFX = {
  tick: () => tone(1000, 0.05, 'square', 0.06),
  last: () => tone(1400, 0.12, 'square', 0.12),
  timeup: () => { tone(440, 0.25, 'sawtooth', 0.15); tone(330, 0.45, 'sawtooth', 0.15, 0.25); },
  drum: (ms) => { const n = Math.floor(ms / 45); for (let i = 0; i < n; i++) noise(0.04, 0.05 + 0.3 * i / n, i * 0.045, 250); },
  cymbal: () => noise(0.9, 0.3, 0, 4000),
  pinpon: () => { tone(1319, 0.3, 'sine', 0.25); tone(1047, 0.6, 'sine', 0.25, 0.25); },
  point: () => { tone(1568, 0.08, 'square', 0.08); tone(2093, 0.14, 'square', 0.08, 0.07); },
  start: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.1, i * 0.1)),
  fanfare: () => {
    let t = 0;
    [[523, .15], [523, .15], [523, .15], [659, .45], [587, .15], [659, .15], [784, .9]].forEach(([f, d]) => {
      tone(f, d, 'triangle', 0.22, t); tone(f / 2, d, 'square', 0.05, t); t += d;
    });
  },
};

/* ---------- 共通UI ---------- */
let toastT = null;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600);
}
let spT = null;
function splash(html, ms) {
  const el = $('#splash'); el.innerHTML = html; el.classList.add('show');
  clearTimeout(spT); if (ms) spT = setTimeout(hideSplash, ms);
}
function hideSplash() { $('#splash').classList.remove('show'); }
$('#splash').addEventListener('click', hideSplash);

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#d8342c', '#2f6fdb', '#2e9e5b', '#e3b341', '#efe8d8'];
  for (let i = 0; i < 110; i++) {
    const p = document.createElement('div');
    p.className = 'cf';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 2.5 + Math.random() * 2.5 + 's';
    p.style.animationDelay = Math.random() * 0.8 + 's';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 6500);
  }
}

function go(name) {
  if (screen === 'question' && name !== 'question') pauseTimer();
  screen = name;
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
  $$('.nav [data-go]').forEach((b) => { if (b.dataset.go === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  if (name === 'title') renderTitle();
  if (name === 'question') {
    if (!list().length) { toast('出題する問題がありません。「準備・設定」で問題を選んでください'); go('admin'); return; }
    if (S.pos >= list().length) S.pos = list().length - 1;
    showQuestion(S.pos, true);
  }
  if (name === 'score') renderScore();
  if (name === 'result') prepareResult();
  if (name === 'admin') renderAdmin();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (b) go(b.dataset.go);
});

function applyTitle() {
  document.title = S.settings.title;
  $('#brandTitle').textContent = S.settings.title;
}
function sw(t) { return `<span class="chip" style="--c:${t.color};--ink:${inkFor(t.color)}"><span class="dot"></span>${esc(t.name)}</span>`; }
function renderTitle() {
  applyTitle();
  $('#tTitle').textContent = S.settings.title;
  $('#tSub').textContent = S.settings.subtitle;
  const n = list().length;
  $('#tMeta').textContent = `全${n}問　／　${S.teams.length}チーム対抗`;
  $('#tTeams').innerHTML = S.teams.map(sw).join('');
  const r = $('#btnResume');
  r.classList.toggle('hidden', !(S.pos > 0 && S.pos < n));
  r.textContent = `続きから（第${S.pos + 1}問）`;
}
$('#btnStart').addEventListener('click', () => { S.pos = 0; awarded.clear(); save(); ac(); SFX.start(); go('question'); });
$('#btnResume').addEventListener('click', () => { ac(); go('question'); });

$('#btnSound').addEventListener('click', () => {
  S.settings.sound = !S.settings.sound; save(); syncSound();
  if (S.settings.sound) SFX.point();
});
function syncSound() {
  const b = $('#btnSound'); b.textContent = S.settings.sound ? '🔊' : '🔇';
  b.setAttribute('aria-pressed', String(S.settings.sound));
}
$('#btnFull').addEventListener('click', () => {
  const d = document;
  if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  else {
    const el = d.documentElement, fn = el.requestFullscreen || el.webkitRequestFullscreen;
    if (fn) fn.call(el); else toast('この端末では全画面表示が使えません');
  }
});

/* ---------- 問題画面 ---------- */
let tInt = null, tLeft = 0, tTotal = 15, lastSec = 0;

function showQuestion(i, keepPhase) {
  const L = list();
  if (!L.length) return;
  if (i < 0) i = 0;
  if (i >= L.length) {
    S.pos = L.length - 1; save(); stopTimer();
    toast('全問終了！得点を確認して結果発表へ');
    go('score'); return;
  }
  const same = keepPhase && i === S.pos && phase !== 'ready' && $('#qText').dataset.qid === L[i].id;
  S.pos = i; save();
  if (same) { renderStrip(); updateControls(); return; }
  stopTimer();
  const q = L[i];
  phase = 'ready'; selected = new Set();
  const isLast = i === L.length - 1;

  const plaque = $('#plaque');
  plaque.innerHTML = vstack(isLast ? '最終問題' : `第${kan(i + 1)}問`);
  plaque.classList.toggle('final', isLast);
  plaque.classList.remove('enter'); void plaque.offsetWidth; plaque.classList.add('enter');

  $('#qCat').textContent = q.cat;
  $('#qLevel').textContent = LEVEL_LABEL[q.level];
  $('#qType').textContent = TYPE_LABEL[q.type];
  $('#qPts').textContent = `${q.pts}点`;
  $('#qCount').textContent = `${i + 1} / ${L.length}`;

  const qt = $('#qText');
  qt.innerHTML = fmt(q.text); qt.dataset.qid = q.id;
  qt.classList.remove('enter'); void qt.offsetWidth; qt.classList.add('enter');

  const A = $('#answers');
  if (q.type === 'ox') {
    A.innerHTML = '<div class="ans ox o" data-k="o">○</div><div class="ans ox x" data-k="x">✕</div>';
  } else if (q.type === 'choice') {
    A.innerHTML = q.choices.map((c, k) => `<div class="ans c${k}" data-k="${k}"><span class="lt">${LETTERS[k]}</span><span>${fmt(c)}</span></div>`).join('');
  } else {
    A.innerHTML = '<div class="ans free"><span class="q-mark">？</span><small>早押し・口頭・ボードで答えよう</small></div>';
  }
  $('#revealBox').classList.add('hidden');
  tTotal = Math.max(3, parseInt(S.settings.timer, 10) || 15);
  tLeft = tTotal; drawTimer();
  renderStrip(); updateControls();
}

function drawTimer() {
  $('#timerNum').textContent = Math.ceil(tLeft);
  $('#timerFill').style.transform = `scaleX(${tLeft / tTotal})`;
  const warn = tLeft <= 5 && tLeft > 0 && phase === 'counting';
  $('#timerNum').classList.toggle('warn', warn);
  $('#timeBar').classList.toggle('warn', tLeft <= 5);
}
function stopTimer() { clearInterval(tInt); tInt = null; }
function pauseTimer() { if (phase === 'counting') { stopTimer(); phase = 'paused'; updateControls(); } }
function toggleTimer() {
  if (phase === 'revealing' || phase === 'revealed') return;
  if (phase === 'counting') { pauseTimer(); return; }
  if (phase === 'locked' || tLeft <= 0) tLeft = tTotal;
  ac();
  phase = 'counting'; updateControls();
  lastSec = Math.ceil(tLeft);
  const t0 = performance.now(), from = tLeft;
  tInt = setInterval(() => {
    tLeft = Math.max(0, from - (performance.now() - t0) / 1000);
    drawTimer();
    const s = Math.ceil(tLeft);
    if (s !== lastSec) { lastSec = s; if (s > 0) (s <= 5 ? SFX.last : SFX.tick)(); }
    if (tLeft <= 0) {
      stopTimer(); phase = 'locked'; updateControls(); drawTimer();
      SFX.timeup(); splash('<div class="sp-timeup">タイムアップ！</div>', 1300);
    }
  }, 100);
}

function answerSplash(q) {
  if (q.type === 'ox') return q.answer === 'o' ? '<div class="sp-o">○</div>' : '<div class="sp-x">✕</div>';
  if (q.type === 'choice') return `<div class="sp-choice"><span class="lt c${q.answer}">${LETTERS[q.answer]}</span><span>${fmt(q.choices[q.answer])}</span></div>`;
  return `<div><div class="sp-lead" style="animation:none">正解は</div><div class="sp-free-a">${fmt(q.answer)}</div></div>`;
}
function answerText(q) {
  if (q.type === 'ox') return q.answer === 'o' ? '○' : '✕';
  if (q.type === 'choice') return `${LETTERS[q.answer]}　${fmt(q.choices[q.answer])}`;
  return fmt(q.answer);
}
function reveal() {
  if (phase === 'revealing' || phase === 'revealed') return;
  const q = cur(); if (!q) return;
  stopTimer(); phase = 'revealing'; updateControls();
  splash('<div class="sp-lead">正解は…</div>');
  SFX.drum(1400);
  setTimeout(() => {
    SFX.cymbal(); SFX.pinpon();
    splash(answerSplash(q), 1900);
    $$('#answers .ans').forEach((el) => {
      if (q.type === 'free') { el.classList.add('correct'); el.innerHTML = `<span class="q-mark" style="font-size:clamp(1.8rem,5vw,3.6rem)">${fmt(q.answer)}</span>`; return; }
      const ok = String(el.dataset.k) === String(q.answer);
      el.classList.toggle('correct', ok); el.classList.toggle('dim', !ok);
    });
    const rb = $('#revealBox');
    rb.innerHTML = `<b>正解</b>${answerText(q)}${q.explain ? `<p>${fmt(q.explain)}</p>` : ''}`;
    rb.classList.remove('hidden');
    phase = 'revealed'; renderStrip(); updateControls();
  }, 1450);
}

function renderStrip() {
  const judging = phase === 'revealed';
  $('#strip').classList.toggle('judging', judging);
  $('#stripHint').classList.toggle('hidden', !judging);
  $('#chips').innerHTML = S.teams.map((t, i) =>
    `<button type="button" class="chip${selected.has(t.id) ? ' on' : ''}" data-id="${t.id}" style="--c:${t.color};--ink:${inkFor(t.color)}" ${judging ? '' : 'tabindex="-1"'} aria-pressed="${selected.has(t.id)}" title="${judging ? (i + 1) + 'キーでも選べます' : ''}"><span class="dot"></span><span>${esc(t.name)}</span><span class="sc">${t.score}</span></button>`
  ).join('');
}
$('#chips').addEventListener('click', (e) => {
  const c = e.target.closest('.chip'); if (!c || phase !== 'revealed') return;
  toggleTeam(c.dataset.id);
});
function toggleTeam(id) {
  if (selected.has(id)) selected.delete(id); else { selected.add(id); SFX.tick(); }
  renderStrip(); updateControls();
}
function updateControls() {
  const rev = phase === 'revealed', ing = phase === 'revealing';
  const q = cur();
  $('#btnTimer').classList.toggle('hidden', rev || ing);
  $('#btnReveal').classList.toggle('hidden', rev);
  $('#btnReveal').disabled = ing;
  $('#btnAward').classList.toggle('hidden', !rev);
  $('#btnNext').classList.toggle('hidden', rev);
  $('#btnPrev').disabled = S.pos <= 0 || ing;
  $('#btnTimer').textContent = phase === 'counting' ? '⏸ ストップ' : phase === 'paused' ? '▶ 再開' : '⏱ カウント開始';
  if (q) {
    const isLast = S.pos >= list().length - 1;
    $('#btnAward').textContent = selected.size
      ? `選んだチームに＋${q.pts}点${isLast ? '（得点ボードへ）' : 'して次へ'}`
      : (isLast ? '得点ボードへ' : '次の問題へ');
  }
}
function award() {
  const q = cur(); if (!q || phase !== 'revealed') return;
  if (selected.size) {
    if (awarded.has(q.id) && !confirm('この問題はすでに得点を加算しています。もう一度加算しますか？')) return;
    S.teams.forEach((t) => { if (selected.has(t.id)) t.score += q.pts; });
    awarded.add(q.id); save(); SFX.point(); renderStrip();
    selected.forEach((id) => {
      const chip = $(`#chips .chip[data-id="${id}"]`);
      if (chip) { const f = document.createElement('span'); f.className = 'float'; f.textContent = `+${q.pts}`; chip.appendChild(f); }
    });
    selected.forEach((id) => { const c = $(`#chips .chip[data-id="${id}"]`); if (c) c.classList.remove('on'); });
    setTimeout(() => showQuestion(S.pos + 1), 900);
  } else {
    showQuestion(S.pos + 1);
  }
}
$('#btnTimer').addEventListener('click', toggleTimer);
$('#btnReveal').addEventListener('click', () => { ac(); reveal(); });
$('#btnAward').addEventListener('click', award);
$('#btnNext').addEventListener('click', () => showQuestion(S.pos + 1));
$('#btnPrev').addEventListener('click', () => showQuestion(S.pos - 1));

document.addEventListener('keydown', (e) => {
  if ($('#editDialog').open || screen !== 'question') return;
  const tag = e.target.tagName;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
  if ((e.key === ' ' || e.key === 'Enter') && tag === 'BUTTON') return; // ボタン自体の操作を優先
  if (e.key === ' ') { e.preventDefault(); toggleTimer(); }
  else if (e.key === 'Enter') { e.preventDefault(); if (phase === 'revealed') award(); else { ac(); reveal(); } }
  else if (e.key === 'ArrowRight' && phase !== 'revealing') showQuestion(S.pos + 1);
  else if (e.key === 'ArrowLeft' && phase !== 'revealing') showQuestion(S.pos - 1);
  else if (/^[1-8]$/.test(e.key) && phase === 'revealed') { const t = S.teams[+e.key - 1]; if (t) toggleTeam(t.id); }
});

/* ---------- 得点ボード ---------- */
function ranks() {
  return S.teams.map((t) => ({ id: t.id, rank: 1 + S.teams.filter((o) => o.score > t.score).length }));
}
function renderScore(bumpId) {
  const R = Object.fromEntries(ranks().map((r) => [r.id, r.rank]));
  const anyScore = S.teams.some((t) => t.score !== 0);
  $('#kakeban').innerHTML = S.teams.map((t) => `
    <div class="plate${R[t.id] === 1 && anyScore ? ' top' : ''}${bumpId === t.id ? ' bump' : ''}" data-id="${t.id}">
      <div class="rk">${anyScore ? (R[t.id] === 1 ? '👑 ' : '') + R[t.id] + '位' : ''}</div>
      <div class="wood vs" style="--c:${t.color}">${vstack(t.name)}</div>
      <div class="ps">${t.score}<small>点</small></div>
      <div class="adj">
        <button type="button" class="btn sm" data-d="-10" aria-label="${esc(t.name)}を10点減らす">−10</button>
        <button type="button" class="btn sm" data-d="-1" aria-label="${esc(t.name)}を1点減らす">−1</button>
        <button type="button" class="btn sm" data-d="1" aria-label="${esc(t.name)}に1点足す">＋1</button>
        <button type="button" class="btn sm gold" data-d="10" aria-label="${esc(t.name)}に10点足す">＋10</button>
      </div>
    </div>`).join('');
}
$('#kakeban').addEventListener('click', (e) => {
  const b = e.target.closest('[data-d]'); if (!b) return;
  const id = b.closest('.plate').dataset.id, t = S.teams.find((x) => x.id === id);
  t.score += +b.dataset.d; save(); SFX.point(); renderScore(id);
});

/* ---------- 結果発表（下位から順に） ---------- */
let resOrder = [], resShown = 0;
function prepareResult() {
  const R = Object.fromEntries(ranks().map((r) => [r.id, r.rank]));
  resOrder = [...S.teams].sort((a, b) => b.score - a.score).map((t) => ({ ...t, rank: R[t.id] }));
  resShown = 0; renderResult();
}
function renderResult(justShown) {
  const n = resOrder.length;
  $('#resultList').innerHTML = resOrder.map((t, i) => {
    const shown = i >= n - resShown;
    if (!shown) return `<li class="veil"><span class="r-rank">？位</span><span>？？？</span><span class="r-score">？点</span></li>`;
    return `<li class="${i === justShown ? 'shown ' : ''}${t.rank === 1 ? 'champ' : ''}" style="--c:${t.color}"><span class="r-rank">${t.rank === 1 ? '👑 ' : ''}${t.rank}位</span><span>${esc(t.name)}</span><span class="r-score">${t.score}点</span></li>`;
  }).join('');
  const b = $('#btnRank');
  if (resShown >= n) b.textContent = 'もう一度はじめから発表';
  else { const next = resOrder[n - resShown - 1]; b.textContent = next.rank === 1 ? '🏆 優勝チームを発表！' : `${next.rank}位を発表`; }
}
$('#btnRank').addEventListener('click', () => {
  const n = resOrder.length, b = $('#btnRank');
  if (resShown >= n) { prepareResult(); return; }
  ac(); b.disabled = true;
  const isFirst = resOrder[n - resShown - 1].rank === 1;
  SFX.drum(isFirst ? 2000 : 1100);
  setTimeout(() => {
    resShown++;
    // 同点1位はまとめて発表
    if (isFirst) resShown = n;
    renderResult(n - resShown); SFX.cymbal();
    if (isFirst) { SFX.fanfare(); confetti(); }
    b.disabled = false;
  }, isFirst ? 2050 : 1150);
});

/* ---------- 準備・設定 ---------- */
$$('.tabs [data-tab]').forEach((b) => b.addEventListener('click', () => {
  $$('.tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  $$('.tab-pane').forEach((p) => p.classList.toggle('hidden', p.id !== 'tab-' + b.dataset.tab));
}));
function renderAdmin() { renderQList(); renderTeams(); renderSettings(); }

function renderQList() {
  const on = list().length, chk = S.questions.filter((q) => q.check && q.enabled).length;
  $('#qSummary').textContent = `登録 ${S.questions.length}問 ／ 出題する問題 ${on}問` + (chk ? ` ／ 要確認 ${chk}問（正解を決めてから出題してください）` : '');
  let n = 0;
  $('#qList').innerHTML = S.questions.map((q, i) => {
    const no = q.enabled ? ++n : '−';
    return `<li class="qi${q.enabled ? '' : ' off'}" data-i="${i}">
      <input type="checkbox" class="switch" data-act="toggle" ${q.enabled ? 'checked' : ''} aria-label="出題する">
      <span class="qi-no">${no}</span>
      <span class="tag ${q.type}">${TYPE_LABEL[q.type]}</span>
      <span class="qi-lv">${'★'.repeat(q.level)}</span>
      <span class="qi-text"><span class="cat">${esc(q.cat)}</span>${esc(plain(q.text))}${q.check ? '<span class="warn">要確認</span>' : ''}</span>
      <span class="qi-pts">${q.pts}点</span>
      <span class="qi-act">
        <button type="button" class="btn sm" data-act="up" aria-label="上へ" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" class="btn sm" data-act="down" aria-label="下へ" ${i === S.questions.length - 1 ? 'disabled' : ''}>↓</button>
        <button type="button" class="btn sm gold" data-act="edit">編集</button>
        <button type="button" class="btn sm" data-act="dup">複製</button>
        <button type="button" class="btn sm" data-act="del">削除</button>
      </span></li>`;
  }).join('');
}
$('#qList').addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const i = +el.closest('.qi').dataset.i, Qs = S.questions, act = el.dataset.act;
  if (act === 'toggle') Qs[i].enabled = el.checked;
  else if (act === 'up' && i > 0) [Qs[i - 1], Qs[i]] = [Qs[i], Qs[i - 1]];
  else if (act === 'down' && i < Qs.length - 1) [Qs[i + 1], Qs[i]] = [Qs[i], Qs[i + 1]];
  else if (act === 'edit') { openEditor(i); return; }
  else if (act === 'dup') Qs.splice(i + 1, 0, normQ({ ...Qs[i], id: uid(), choices: [...Qs[i].choices] }));
  else if (act === 'del') { if (!confirm(`「${plain(Qs[i].text).slice(0, 30)}」を削除しますか？`)) return; Qs.splice(i, 1); }
  save(); renderQList();
});
$('#btnAddQ').addEventListener('click', () => openEditor(-1));
$('#bulkSel').addEventListener('change', (e) => {
  const v = e.target.value; if (!v) return;
  S.questions.forEach((q) => { q.enabled = v === 'all' ? true : v === 'none' ? false : v === 'l1' ? q.level === 1 : q.level <= 2; });
  e.target.value = ''; save(); renderQList();
});
$('#btnShuffle').addEventListener('click', () => {
  if (!confirm('問題の順番をシャッフルします。「ファイナル」ジャンルの問題は最後に残します。よろしいですか？')) return;
  const fin = S.questions.filter((q) => q.cat === 'ファイナル'), rest = S.questions.filter((q) => q.cat !== 'ファイナル');
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  S.questions = [...rest, ...fin]; S.pos = 0; save(); renderQList(); toast('シャッフルしました（第1問から始まります）');
});
$('#btnResetQ').addEventListener('click', () => {
  if (!confirm('問題を最初に入っていた内容に戻します。追加・編集した問題は消えます。よろしいですか？')) return;
  S.questions = DEFAULT_QUESTIONS.map(normQ); S.pos = 0; save(); renderQList(); toast('問題を最初の内容に戻しました');
});
$('#btnExport').addEventListener('click', () => {
  const data = { app: 'kendo-quiz', version: 1, settings: S.settings, teams: S.teams, questions: S.questions };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const d = new Date(), stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  a.href = URL.createObjectURL(blob); a.download = `kendo-quiz-${stamp}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('データを書き出しました');
});
$('#fileImport').addEventListener('change', (e) => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      const qs = Array.isArray(d) ? d : d.questions;
      if (!Array.isArray(qs)) throw new Error();
      S.questions = qs.map(normQ);
      if (!Array.isArray(d) && Array.isArray(d.teams) && d.teams.length) S.teams = d.teams.map(normT);
      if (!Array.isArray(d) && d.settings) S.settings = { ...DEFAULT_SETTINGS, ...d.settings };
      S.pos = 0; save(); renderAdmin(); applyTitle(); syncSound();
      toast(`${S.questions.length}問を読み込みました`);
    } catch (err) { toast('読み込めませんでした。このアプリで書き出したJSONファイルを選んでください'); }
    e.target.value = '';
  };
  r.readAsText(f);
});

/* 問題の編集 */
let editIndex = -1;
const dlg = $('#editDialog');
function showBlocks() {
  const t = $('#fType').value;
  $('#blkChoice').classList.toggle('hidden', t !== 'choice');
  $('#blkOx').classList.toggle('hidden', t !== 'ox');
  $('#blkFree').classList.toggle('hidden', t !== 'free');
}
$('#fType').addEventListener('change', showBlocks);
function openEditor(i) {
  editIndex = i;
  const q = i >= 0 ? S.questions[i] : normQ({ type: 'choice', cat: '剣道', level: 1, pts: 10, choices: ['', '', '', ''], answer: 0 });
  $('#dlgTitle').textContent = i >= 0 ? '問題の編集' : '問題の追加';
  $('#fType').value = q.type; $('#fCat').value = q.cat; $('#fLevel').value = q.level; $('#fPts').value = q.pts;
  $('#fText').value = q.text; $('#fExplain').value = q.explain;
  $('#fEnabled').checked = q.enabled; $('#fCheck').checked = q.check;
  for (let k = 0; k < 4; k++) $('#fC' + k).value = q.type === 'choice' ? (q.choices[k] || '') : '';
  $$('input[name=fAns]').forEach((r) => { r.checked = q.type === 'choice' && +r.value === q.answer; });
  if (q.type !== 'choice') $$('input[name=fAns]')[0].checked = true;
  $$('input[name=fOx]').forEach((r) => { r.checked = r.value === (q.type === 'ox' ? q.answer : 'o'); });
  $('#fFree').value = q.type === 'free' ? q.answer : '';
  $('#catList').innerHTML = [...new Set(S.questions.map((x) => x.cat))].map((c) => `<option value="${esc(c)}">`).join('');
  $('#fErr').textContent = '';
  showBlocks();
  dlg.showModal();
  $('#fText').focus();
}
$('#btnCancel').addEventListener('click', () => dlg.close());
$('#editForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const type = $('#fType').value, text = $('#fText').value.trim();
  const err = (m) => { $('#fErr').textContent = m; };
  if (!text) return err('問題文を入力してください。');
  const q = {
    id: editIndex >= 0 ? S.questions[editIndex].id : uid(), type, text,
    cat: $('#fCat').value.trim() || 'その他', level: +$('#fLevel').value,
    pts: Math.max(0, parseInt($('#fPts').value, 10) || 0), explain: $('#fExplain').value.trim(),
    enabled: $('#fEnabled').checked, check: $('#fCheck').checked, choices: [],
  };
  if (type === 'choice') {
    const sel = +(($$('input[name=fAns]').find((r) => r.checked) || {}).value ?? -1);
    const rows = [0, 1, 2, 3].map((k) => ({ k, t: $('#fC' + k).value.trim() })).filter((r) => r.t);
    if (rows.length < 2) return err('選択肢を2つ以上入力してください。');
    const idx = rows.findIndex((r) => r.k === sel);
    if (idx < 0) return err('正解の選択肢に●をつけてください（空欄の選択肢は正解にできません）。');
    q.choices = rows.map((r) => r.t); q.answer = idx;
  } else if (type === 'ox') {
    q.answer = ($$('input[name=fOx]').find((r) => r.checked) || { value: 'o' }).value;
  } else {
    q.answer = $('#fFree').value.trim();
    if (!q.answer) return err('正解・模範解答を入力してください。');
  }
  const nq = normQ(q);
  if (editIndex >= 0) S.questions[editIndex] = nq; else S.questions.push(nq);
  save(); dlg.close(); renderQList(); toast('保存しました');
});

/* チーム */
function renderTeams() {
  $('#teamList').innerHTML = S.teams.map((t, i) => `
    <div class="team-row" data-i="${i}">
      <input type="color" value="${t.color}" data-f="color" aria-label="チームの色">
      <input type="text" value="${esc(t.name)}" data-f="name" aria-label="チーム名">
      <input type="number" value="${t.score}" data-f="score" aria-label="得点">
      <button type="button" class="btn sm" data-act="del" ${S.teams.length <= 1 ? 'disabled' : ''}>削除</button>
    </div>`).join('');
}
$('#teamList').addEventListener('input', (e) => {
  const f = e.target.dataset.f; if (!f) return;
  const t = S.teams[+e.target.closest('.team-row').dataset.i];
  t[f] = f === 'score' ? (parseInt(e.target.value, 10) || 0) : e.target.value;
  save();
});
$('#teamList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act=del]'); if (!b) return;
  const i = +b.closest('.team-row').dataset.i;
  if (!confirm(`「${S.teams[i].name}」を削除しますか？`)) return;
  S.teams.splice(i, 1); save(); renderTeams();
});
$('#btnAddTeam').addEventListener('click', () => {
  if (S.teams.length >= 8) { toast('チームは8つまでです'); return; }
  const palette = ['#2e9e5b', '#8a4fd8', '#ef7d22', '#1aa3a3', '#e05a9c', '#7a7a7a'];
  S.teams.push(normT({ name: `チーム${S.teams.length + 1}`, color: palette[S.teams.length % palette.length] }));
  save(); renderTeams();
});
$('#btnResetScore').addEventListener('click', () => {
  if (!confirm('すべてのチームの得点を0にします。よろしいですか？')) return;
  S.teams.forEach((t) => { t.score = 0; }); awarded.clear(); save(); renderTeams(); toast('得点を0にしました');
});

/* 全体設定 */
function renderSettings() {
  $('#setTitle').value = S.settings.title; $('#setSub').value = S.settings.subtitle;
  $('#setTimer').value = S.settings.timer; $('#setSound').checked = S.settings.sound;
}
$('#setTitle').addEventListener('input', (e) => { S.settings.title = e.target.value; save(); applyTitle(); });
$('#setSub').addEventListener('input', (e) => { S.settings.subtitle = e.target.value; save(); });
$('#setTimer').addEventListener('change', (e) => { S.settings.timer = Math.min(120, Math.max(3, parseInt(e.target.value, 10) || 15)); e.target.value = S.settings.timer; save(); });
$('#setSound').addEventListener('change', (e) => { S.settings.sound = e.target.checked; save(); syncSound(); });
$('#btnRewind').addEventListener('click', () => { S.pos = 0; awarded.clear(); save(); toast('第1問にもどしました'); });
$('#btnFactory').addEventListener('click', () => {
  if (!confirm('問題・チーム・得点・設定をすべて初期状態に戻します。よろしいですか？')) return;
  S = factory(); awarded.clear(); save(); renderAdmin(); applyTitle(); syncSound(); toast('初期状態に戻しました');
});

/* ---------- 起動 ---------- */
syncSound();
go('title');
})();
