'use strict';
/* 剣道合宿 クイズ大会
   ・外部ファイルやネット接続を使わない（オフライン動作）
   ・問題／チーム／得点はブラウザ（localStorage）に自動保存 */
(() => {
const STORE_KEY = 'kendoQuiz.v1';
const LETTERS = ['A', 'B', 'C', 'D'];
const LEVEL_LABEL = { 1: '★ やさしい', 2: '★★ ふつう', 3: '★★★ むずかしい' };
const TYPE_LABEL = { choice: '選択', ox: '○✕', free: '口頭・記述' };

const DATA_VER = 4;
const DEFAULT_SETTINGS = { title: '致道館　レクリエーションクイズ大会', subtitle: '剣道合宿', timer: 15, sound: true, bgm: true, autoMusic: true, speedRates: '100,70,50,30', penalty: 0 };
const GROUPS = { low: '低学年', high: '高学年', jh: '中学生' };
const LEVEL_GROUP = { 1: 'low', 2: 'high', 3: 'jh' };
const DEFAULT_TEAMS = [
  { name: '赤チーム', color: '#d8342c' },
  { name: '白チーム', color: '#f3efe4' },
  { name: '青チーム', color: '#2f6fdb' },
  { name: '黄チーム', color: '#e3b341' },
];

// Q(形式, ジャンル, 難しさ, 得点, 問題文, 選択肢, 正解, 解説, 要確認)
const Q = (type, cat, level, pts, text, choices, answer, explain = '', check = false, memo = '', extra = {}) =>
  ({ type, cat, level, pts, text, choices, answer, explain, check, memo, ...extra });

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


// 音楽クイズ（♪の問題は、出題者が用意した音源を「準備・設定」で登録すると曲を流しながら出題できます）
const MUSIC_QUESTIONS = [
  // 最新の曲（イントロクイズ）
  Q('choice', '音楽（最近の曲）', 1, 10, '♪ 流れている曲のタイトルは？', ['ライラック', 'ケセラセラ', '青と夏', 'インフェルノ'], 0, 'Mrs. GREEN APPLE「ライラック」（2024年）。アニメ『忘却バッテリー』の主題歌です。', true, '登録する音源：Mrs. GREEN APPLE「ライラック」', { mode: 'buzz' }),
  Q('choice', '音楽（最近の曲）', 1, 10, '♪ 流れている曲を歌っているのは？', ['Creepy Nuts', 'YOASOBI', 'King Gnu', 'Vaundy'], 0, 'Creepy Nuts「Bling-Bang-Bang-Born」（2024年）。アニメ『マッシュル』の主題歌です。', true, '登録する音源：Creepy Nuts「Bling-Bang-Bang-Born」', { mode: 'buzz' }),
  Q('choice', '音楽（最近の曲）', 1, 10, '♪ 流れている曲のタイトルは？', ['アイドル', '夜に駆ける', '群青', '怪物'], 0, 'YOASOBI「アイドル」（2023年）。アニメ『【推しの子】』の主題歌です。', true, '登録する音源：YOASOBI「アイドル」', { mode: 'buzz' }),
  // 2000年代（イントロクイズ）
  Q('choice', '音楽（2000年代）', 2, 10, '♪ 流れている曲を歌っているのは？', ['SMAP', '嵐', 'TOKIO', 'V6'], 0, 'SMAP「世界に一つだけの花」（2003年）。', true, '登録する音源：SMAP「世界に一つだけの花」', { mode: 'buzz' }),
  Q('choice', '音楽（2000年代）', 2, 10, '♪ 流れている曲のタイトルは？', ['キセキ', '愛唄', '遥か', '刹那'], 0, 'GReeeeN「キセキ」（2008年）。ドラマ『ROOKIES』の主題歌です。選択肢はすべてGReeeeNの曲でした。', true, '登録する音源：GReeeeN「キセキ」', { mode: 'buzz' }),
  Q('choice', '音楽（2000年代）', 2, 10, '♪ 流れている曲を歌っているのは？', ['一青窈', '平井堅', '大塚愛', '中島美嘉'], 0, '一青窈「ハナミズキ」（2004年）。', true, '登録する音源：一青窈「ハナミズキ」', { mode: 'buzz' }),
  // 90年代（イントロクイズ）
  Q('choice', '音楽（90年代）', 3, 20, '♪ 流れている曲のタイトルは？', ['夜空ノムコウ', 'らいおんハート', 'SHAKE', 'ダイナマイト'], 0, 'SMAP「夜空ノムコウ」（1998年）。選択肢はすべてSMAPの曲でした。', true, '登録する音源：SMAP「夜空ノムコウ」', { mode: 'buzz' }),
  Q('choice', '音楽（90年代）', 3, 20, '♪ 流れている曲を歌っているのは？', ['DREAMS COME TRUE', 'globe', 'TRF', 'Every Little Thing'], 0, 'DREAMS COME TRUE「LOVE LOVE LOVE」（1995年）。', true, '登録する音源：DREAMS COME TRUE「LOVE LOVE LOVE」', { mode: 'buzz' }),
  Q('choice', '音楽（90年代）', 3, 20, '♪ 流れている曲のタイトルは？', ['それが大事', '愛は勝つ', 'どんなときも。', '負けないで'], 0, '大事MANブラザーズバンド「それが大事」（1991年）。', true, '登録する音源：大事MANブラザーズバンド「それが大事」', { mode: 'buzz' }),
  // 音楽の知識（音源なしでOK）
  Q('ox', '音楽', 1, 10, '「Lemon」を歌っているのは米津玄師である。', [], 'o', '米津玄師「Lemon」（2018年）。ドラマ『アンナチュラル』の主題歌です。'),
  Q('choice', '音楽', 1, 10, '「マリーゴールド」を歌っている歌手は？', ['あいみょん', 'aiko', 'miwa', 'YUI'], 0),
  Q('choice', '音楽', 2, 10, 'アニメ『鬼滅の刃』の主題歌「紅蓮華」を歌ったのは？', ['LiSA', 'Ado', 'YOASOBI', 'あいみょん'], 0),
  Q('choice', '音楽', 2, 10, '映画『ONE PIECE FILM RED』の「新時代」を歌った歌手は？', ['Ado', 'LiSA', 'Aimer', 'milet'], 0),
  Q('ox', '音楽', 2, 10, 'Official髭男dismの呼び名は「ヒゲダン」である。', [], 'o'),
  Q('choice', '音楽', 2, 10, 'Mrs. GREEN APPLE「ケセラセラ」が2023年に受賞した賞は？', ['日本レコード大賞', 'グラミー賞', 'アカデミー賞', '芥川賞'], 0),
  Q('choice', '音楽', 3, 20, 'SMAP「世界に一つだけの花」を作詞・作曲したのは？', ['槇原敬之', '小田和正', '桑田佳祐', '中島みゆき'], 0),
  Q('ox', '音楽', 3, 20, '宇多田ヒカルのアルバム「First Love」は1999年に発売された。', [], 'o'),
  Q('choice', '音楽', 3, 20, '安室奈美恵の出身地は？', ['沖縄県', '北海道', '大阪府', '福岡県'], 0),
];

// ポケモン・ちいかわ・すみっコぐらし・アイドル（2026年10月追加）
const B = { mode: 'buzz' }, SP = { mode: 'speed' };
const POP_QUESTIONS = [
  // ポケモン
  Q('choice', 'ポケモン', 1, 10, 'ピカチュウのタイプは？', ['でんき', 'ほのお', 'みず', 'くさ'], 0, '', false, '', SP),
  Q('choice', 'ポケモン', 1, 10, 'ピカチュウが進化すると何になる？', ['ライチュウ', 'ピチュー', 'パチリス', 'エモンガ'], 0, 'ピチュー → ピカチュウ → ライチュウ と進化します。', false, '', SP),
  Q('choice', 'ポケモン', 1, 10, 'ヒントでわかるかな？このポケモンはだれ？', ['カビゴン', 'ヤドン', 'ラッキー', 'ゴンベ'], 0, 'ゴンベはカビゴンの進化前のポケモンです。', false, '', { mode: 'buzz', hints: ['ねむるのが大好き', 'とても大きくて重い', '道の真ん中でねて、通せんぼしていることも'] }),
  Q('choice', 'ポケモン', 2, 10, 'ヒトカゲが最後に進化するポケモンは？', ['リザードン', 'カメックス', 'フシギバナ', 'ギャラドス'], 0, 'ヒトカゲ → リザード → リザードン。', false, '', SP),
  Q('choice', 'ポケモン', 2, 10, '「みず」タイプのポケモンに強いタイプは？', ['くさ', 'ほのお', 'じめん', 'いわ'], 0, 'みずタイプには、くさタイプ・でんきタイプのわざが「こうかはばつぐん」です。', false, '', SP),
  Q('ox', 'ポケモン', 2, 10, 'ポケモン図鑑の1番（No.0001）はフシギダネである。', [], 'o'),
  Q('choice', 'ポケモン', 3, 20, 'イーブイの進化形ではないポケモンは？', ['ライチュウ', 'ブースター', 'シャワーズ', 'サンダース'], 0, 'イーブイはブースター（ほのお）、シャワーズ（みず）、サンダース（でんき）などに進化します。'),
  // ちいかわ
  Q('choice', 'ちいかわ', 1, 10, 'キャラクター当てクイズ！このキャラクターはだれ？', ['ハチワレ', 'ちいかわ', 'うさぎ', 'モモンガ'], 0, '', false, '', { mode: 'buzz', hints: ['ちいかわのなかよし', '顔の上の毛が、左右で色がちがう', '口ぐせは「なんとかなれーッ！」'] }),
  Q('choice', 'ちいかわ', 1, 10, '「ウラ！」「ヤハ！」とさけぶ、元気いっぱいのキャラクターは？', ['うさぎ', 'ハチワレ', 'ちいかわ', 'くりまんじゅう'], 0, '', false, '', SP),
  Q('choice', 'ちいかわ', 2, 10, 'ちいかわたちが合格をめざしてがんばる検定は？', ['草むしり検定', '漢字検定', '英語検定', 'そろばん検定'], 0),
  Q('choice', 'ちいかわ', 2, 10, 'ハチワレが住んでいる場所は？', ['どうくつ', '木の上', '海の中', 'お城'], 0),
  Q('ox', 'ちいかわ', 3, 20, '「ちいかわ」の作者は、ナガノさんである。', [], 'o'),
  // すみっコぐらし
  Q('choice', 'すみっコぐらし', 1, 10, 'キャラクター当てクイズ！このすみっコはだれ？', ['しろくま', 'ぺんぎん？', 'ねこ', 'とかげ'], 0, '', false, '', { mode: 'buzz', hints: ['北からにげてきた', 'とってもさむがり', 'あったかいお茶をすみっこで飲むのが好き'] }),
  Q('choice', 'すみっコぐらし', 1, 10, '「自分はぺんぎんなのかな？」と自信がないすみっコの名前は？', ['ぺんぎん？', 'しろくま', 'とかげ', 'ねこ'], 0, '', false, '', SP),
  Q('choice', 'すみっコぐらし', 2, 10, 'キャラクター当てクイズ！このすみっコはだれ？', ['とんかつ', 'えびふらいのしっぽ', 'たぴおか', 'ざっそう'], 0, '', false, '', { mode: 'buzz', hints: ['すみっこにいると落ち着く', '食べ残された「はじっこ」', 'あぶら99%、にく1%'] }),
  Q('choice', 'すみっコぐらし', 2, 10, '実は恐竜の生き残りで、そのことをかくしているすみっコは？', ['とかげ', 'ぺんぎん？', 'ねこ', 'しろくま'], 0),
  Q('ox', 'すみっコぐらし', 3, 20, '「ふろしき」は、しろくまの荷物である。', [], 'o'),
  Q('choice', 'すみっコぐらし', 3, 20, 'すみっコぐらしを生み出した会社は？', ['サンエックス', 'サンリオ', 'バンダイ', '任天堂'], 0),
  // Snow Man・SixTONES
  Q('choice', 'アイドル', 1, 10, 'Snow Manのメンバーは何人？', ['9人', '6人', '5人', '7人'], 0, '', false, '', SP),
  Q('choice', 'アイドル', 1, 10, 'SixTONES（ストーンズ）のメンバーは何人？', ['6人', '9人', '5人', '4人'], 0, '', false, '', SP),
  Q('ox', 'アイドル', 2, 10, 'Snow ManとSixTONESは、2020年に同じ日にCDデビューした。', [], 'o', '2020年1月22日、2組同時にデビューしました。'),
  Q('choice', 'アイドル', 2, 10, 'Snow Manのデビュー曲は？', ['D.D.', 'Imitation Rain', 'Pretender', '夜に駆ける'], 0, 'SixTONESのデビュー曲は「Imitation Rain」です。'),
  Q('choice', 'アイドル', 3, 20, '気象予報士の資格を持っているSnow Manのメンバーは？', ['阿部亮平', '目黒蓮', 'ラウール', '佐久間大介'], 0),
  Q('choice', 'アイドル', 3, 20, '映画『すずめの戸締まり』で宗像草太の声を担当したSixTONESのメンバーは？', ['松村北斗', 'ジェシー', '京本大我', '田中樹'], 0),
  // 韓流アイドル
  Q('choice', '韓流アイドル', 1, 10, 'BTSはどこの国のグループ？', ['韓国', '日本', '中国', 'アメリカ'], 0, '', false, '', SP),
  Q('choice', '韓流アイドル', 2, 10, '「Dynamite」「Butter」を歌ったグループは？', ['BTS', 'SEVENTEEN', 'NCT', 'BIGBANG'], 0),
  Q('ox', '韓流アイドル', 2, 10, 'BLACKPINKは4人組のグループである。', [], 'o'),
  Q('choice', '韓流アイドル', 2, 10, 'TWICEのメンバーで、日本出身なのは何人？', ['3人', '1人', '5人', '0人'], 0, 'モモ・サナ・ミナの3人です。'),
  Q('choice', '韓流アイドル', 3, 20, 'NiziUが生まれたオーディション番組の名前は？', ['Nizi Project', 'PRODUCE 101', 'I-LAND', 'BOYS PLANET'], 0),
  Q('choice', '韓流アイドル', 3, 20, 'LE SSERAFIMの日本人メンバーの組み合わせは？', ['宮脇咲良・中村一葉', 'モモ・サナ', 'マヤ・リマ', 'ミナ・ジヒョ'], 0),
];

// 名探偵コナン・マインクラフト・ゲーム・なぞなぞ（2026年10月追加）
const FUN_QUESTIONS = [
  // 名探偵コナン
  Q('choice', '名探偵コナン', 1, 10, '江戸川コナンの本当の姿は？', ['工藤新一', '毛利小五郎', '服部平次', '怪盗キッド'], 0, '', false, '', SP),
  Q('choice', '名探偵コナン', 1, 10, 'コナンがいそうろうしている（いっしょに住んでいる）のはどこ？', ['毛利探偵事務所', '阿笠博士の家', '工藤新一の家', '警視庁'], 0),
  Q('choice', '名探偵コナン', 1, 10, 'キャラクター当てクイズ！この人物はだれ？', ['怪盗キッド', 'ジン', '安室透', '赤井秀一'], 0, '', false, '', { mode: 'buzz', hints: ['白いマントとシルクハット', '「月下の奇術師」とよばれる', '宝石をねらう大どろぼう'] }),
  Q('choice', '名探偵コナン', 2, 10, 'コナンが使う「腕時計型」のひみつ道具は？', ['麻酔銃', '懐中電灯', 'カメラ', '電話'], 0, '阿笠博士が発明した道具で、針を飛ばして相手をねむらせます。'),
  Q('choice', '名探偵コナン', 2, 10, '工藤新一を小さくしてしまった薬の名前は？', ['APTX4869', 'ABC1234', 'XYZ999', 'DNA4869'], 0, '「アポトキシン4869」という薬です。'),
  Q('ox', '名探偵コナン', 2, 10, '『名探偵コナン』の作者は、青山剛昌さんである。', [], 'o'),
  Q('choice', '名探偵コナン', 3, 20, '「西の高校生探偵」服部平次の出身地は？', ['大阪', '京都', '東京', '福岡'], 0),
  Q('choice', '名探偵コナン', 3, 20, '「コナン」という名前の由来になった、シャーロック・ホームズの作者は？', ['コナン・ドイル', 'アガサ・クリスティ', '江戸川乱歩', 'エドガー・アラン・ポー'], 0, '名字の「江戸川」は、日本の推理作家・江戸川乱歩から取っています。'),
  // マインクラフト
  Q('choice', 'マインクラフト', 1, 10, '近づくと「シューッ」と音を立てて爆発する、緑色のモンスターは？', ['クリーパー', 'ゾンビ', 'スケルトン', 'エンダーマン'], 0, '', false, '', SP),
  Q('ox', 'マインクラフト', 1, 10, 'マインクラフトのダイヤモンドは、水色をしている。', [], 'o'),
  Q('choice', 'マインクラフト', 2, 10, '作業台を作るのに必要な木材の数は？', ['4個', '2個', '8個', '9個'], 0, '作業の画面で、木材を2×2にならべると作れます。', false, '', SP),
  Q('choice', 'マインクラフト', 2, 10, 'ネザーへ行くゲートを作るときに使うブロックは？', ['黒曜石', '丸石', 'ダイヤモンドブロック', 'ガラス'], 0),
  Q('choice', 'マインクラフト', 2, 10, 'マインクラフトの「ラスボス」とよばれるモンスターは？', ['エンダードラゴン', 'ウィザー', 'ウォーデン', 'ガスト'], 0, 'エンドという世界にいて、たおすとエンディングが流れます。'),
  Q('choice', 'マインクラフト', 3, 20, 'エンダーマンと目を合わせると、どうなる？', ['おそってくる', 'にげていく', '仲間になる', '消えてしまう'], 0),
  Q('ox', 'マインクラフト', 3, 20, '黒曜石は、鉄のツルハシでは掘ることができない。', [], 'o', 'ダイヤモンドかネザライトのツルハシが必要です。'),
  // ゲーム
  Q('choice', 'ゲーム', 1, 10, 'マリオの弟の名前は？', ['ルイージ', 'ワリオ', 'ヨッシー', 'キノピオ'], 0, '', false, '', SP),
  Q('choice', 'ゲーム', 1, 10, '「星のカービィ」のカービィの体の色は？', ['ピンク', '黄色', '水色', '緑'], 0, '', false, '', SP),
  Q('choice', 'ゲーム', 1, 10, 'マリオが大きくなるために取るキノコは？', ['スーパーキノコ', 'どくキノコ', 'シイタケ', 'マツタケ'], 0),
  Q('choice', 'ゲーム', 2, 10, '「スプラトゥーン」で、プレイヤーが変身できる生き物は？', ['イカ', 'カニ', 'クラゲ', 'エビ'], 0),
  Q('choice', 'ゲーム', 2, 10, '「どうぶつの森」シリーズで、案内係をしてくれる犬のキャラクターは？', ['しずえ', 'たぬきち', 'つねきち', 'リセ'], 0),
  Q('ox', 'ゲーム', 2, 10, 'ゲーム機「Nintendo Switch」を作っている会社は任天堂である。', [], 'o'),
  Q('choice', 'ゲーム', 3, 20, '落ちてくるブロックを消していくゲーム「テトリス」が生まれた国は？', ['ソ連（今のロシア）', 'アメリカ', '日本', 'イギリス'], 0),
  Q('choice', 'ゲーム', 3, 20, '「スーパーマリオブラザーズ」が発売されたのは何年？', ['1985年', '1975年', '1995年', '2005年'], 0),
  // なぞなぞ
  Q('choice', 'なぞなぞ', 1, 10, 'パンはパンでも、食べられないパンは？', ['フライパン', '食パン', 'あんパン', 'メロンパン'], 0, '', false, '', B),
  Q('choice', 'なぞなぞ', 1, 10, 'イスはイスでも、冷たくて食べられるイスは？', ['アイス', 'ソファ', 'ベンチ', 'こしかけ'], 0, '', false, '', B),
  Q('free', 'なぞなぞ', 1, 10, 'ふだんは下を向いているのに、雨の日だけ上を向いて開くものは？', [], 'かさ', '', false, '', B),
  Q('free', 'なぞなぞ', 1, 10, '使えば使うほど小さくなっていく、勉強道具は？', [], '消しゴム（えんぴつも正解！）', '', false, '', B),
  Q('choice', 'なぞなぞ', 2, 10, 'さかさまに読むと「軽く」なる動物は？', ['イルカ', 'ネコ', 'ウマ', 'サル'], 0, '「イルカ」をさかさまにすると「カルイ」！', false, '', B),
  Q('choice', 'なぞなぞ', 2, 10, 'お父さんがきらいな果物は？', ['パパイヤ', 'バナナ', 'メロン', 'いちご'], 0, '「パパ・イヤ」！', false, '', B),
  Q('choice', 'なぞなぞ', 2, 10, '上は大水、下は大火事。これなーんだ？', ['お風呂', '火山', 'なべ料理', 'たき火'], 0, '昔のお風呂は、下で火をたいてお湯をわかしていました。', false, '', B),
  Q('choice', 'なぞなぞ', 3, 20, 'たくさん言っても、だれも喜ばない「にく」は？', ['ひにく', 'ぎゅうにく', 'ぶたにく', 'とりにく'], 0, '「皮肉（ひにく）」は、遠回しに相手を悪く言うこと。', false, '', B),
  Q('free', 'なぞなぞ', 3, 20, '朝は4本足、昼は2本足、夕方は3本足。これなーんだ？', [], '人間', '赤ちゃんはハイハイ（4本）、大人は2本足、年をとると杖をついて3本。スフィンクスのなぞなぞです。', false, '', B),
];
// ファイナルの直前に追加の問題を入れる
function insertBeforeFinal(qs, add) {
  const out = [...qs], fi = out.findIndex((q) => q.cat === 'ファイナル');
  out.splice(fi < 0 ? out.length : fi, 0, ...add.map(normQ));
  return out;
}
const withMusic = (qs) => insertBeforeFinal(qs, MUSIC_QUESTIONS);
const defaultQuestions = () => insertBeforeFinal(insertBeforeFinal(withMusic(DEFAULT_QUESTIONS.map(normQ)), POP_QUESTIONS), FUN_QUESTIONS);

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
    choices, answer, explain: String(q.explain || ''), check: !!q.check, memo: String(q.memo || ''),
    audio: q.audio && q.audio.key ? { key: String(q.audio.key), name: String(q.audio.name || '音源') } : null,
    aStart: Math.max(0, parseFloat(q.aStart) || 0), aLen: Math.max(0, parseFloat(q.aLen) || 0),
    mode: ['normal', 'speed', 'buzz'].includes(q.mode) ? q.mode : 'normal',
    target: ['auto', 'low', 'high', 'jh', 'all'].includes(q.target) ? q.target : 'auto',
    hints: Array.isArray(q.hints) ? q.hints.map(String).map((x) => x.trim()).filter(Boolean).slice(0, 5) : [],
  };
}
const names = (v) => (Array.isArray(v) ? v : String(v || '').split(/[、,，\s]+/)).map((x) => String(x).trim()).filter(Boolean);
const normT = (t) => ({
  id: t.id || uid(), name: String(t.name || 'チーム'), color: /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : '#888888', score: parseInt(t.score, 10) || 0,
  members: normMembers(t.members),
});
const MAX_MEMBERS = 10;
// メンバー：[{ name, g }]（最大10名）。前の版の { low:[], high:[], jh:[] } 形式も読みかえる
function normMembers(m) {
  let arr = [];
  if (Array.isArray(m)) arr = m.map((x) => ({ name: String((x && x.name) || '').trim(), g: GROUPS[x && x.g] ? x.g : 'low' }));
  else if (m && typeof m === 'object') arr = Object.keys(GROUPS).flatMap((g) => names(m[g]).map((n) => ({ name: n, g })));
  return arr.slice(0, MAX_MEMBERS);
}

function factory() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    teams: DEFAULT_TEAMS.map(normT),
    questions: defaultQuestions(),
    pos: 0, ver: DATA_VER,
  };
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY));
    if (d && Array.isArray(d.questions) && Array.isArray(d.teams)) {
      const st = {
        settings: { ...DEFAULT_SETTINGS, ...d.settings },
        teams: d.teams.map(normT), questions: d.questions.map(normQ),
        pos: parseInt(d.pos, 10) || 0, ver: DATA_VER,
      };
      if ((d.ver || 1) < 2) { // 前の版からの引きつぎ：タイトル変更と音楽クイズの追加
        if (st.settings.title === '剣道合宿 クイズ大会') st.settings.title = DEFAULT_SETTINGS.title;
        if (st.settings.subtitle === '致道館 合宿レクリエーション') st.settings.subtitle = DEFAULT_SETTINGS.subtitle;
        st.questions = withMusic(st.questions);
      }
      if ((d.ver || 1) < 3) { // 早押し・ポケモンなどの追加
        st.questions.forEach((q) => { if (/^登録する音源/.test(q.memo) && q.mode === 'normal') q.mode = 'buzz'; });
        st.questions = insertBeforeFinal(st.questions, POP_QUESTIONS);
      }
      if ((d.ver || 1) < 4) st.questions = insertBeforeFinal(st.questions, FUN_QUESTIONS); // コナン・マイクラ・ゲーム・なぞなぞ
      return st;
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
  buzz: () => { tone(1175, 0.12, 'square', 0.22); tone(1568, 0.35, 'square', 0.22, 0.1); },
  wrong: () => { tone(196, 0.5, 'sawtooth', 0.2); tone(147, 0.6, 'sawtooth', 0.18, 0.12); },
  start: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.1, i * 0.1)),
  fanfare: () => {
    let t = 0;
    [[523, .15], [523, .15], [523, .15], [659, .45], [587, .15], [659, .15], [784, .9]].forEach(([f, d]) => {
      tone(f, d, 'triangle', 0.22, t); tone(f / 2, d, 'square', 0.05, t); t += d;
    });
  },
};


/* ---------- 音源の保存（IndexedDB：大きな音声ファイルもこの端末に保存） ---------- */
const IDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      if (!window.indexedDB) { rej(new Error('IndexedDBが使えません')); return; }
      const r = indexedDB.open('kendoQuizAudio', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files');
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('files', mode), req = fn(t.objectStore('files'));
      t.oncomplete = () => res(req ? req.result : undefined);
      t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  },
  get(k) { return this.tx('readonly', (st) => st.get(k)); },
  put(k, v) { return this.tx('readwrite', (st) => st.put(v, k)); },
  del(k) { return this.tx('readwrite', (st) => st.delete(k)).catch(() => {}); },
  clear() { return this.tx('readwrite', (st) => st.clear()).catch(() => {}); },
};

/* ---------- 曲の再生 ---------- */
const player = new Audio();
player.preload = 'auto';
let playerUrl = null, playerKey = null, stopAt = 0, fadeT = null;
function setSrc(blob, key) {
  if (playerKey === key && player.src) return;
  if (playerUrl) URL.revokeObjectURL(playerUrl);
  playerUrl = URL.createObjectURL(blob); playerKey = key;
  player.src = playerUrl; player.load();
}
async function prepareMusic(q) {
  if (!q || !q.audio) return false;
  try {
    const blob = await IDB.get(q.audio.key);
    if (!blob) return false;
    setSrc(blob, q.audio.key); return true;
  } catch (e) { return false; }
}
function playFrom(start, len, resume) {
  clearInterval(fadeT); player.volume = 1;
  if (!(resume && player.currentTime > start && !player.ended)) {
    try { player.currentTime = start; } catch (e) { /* 読み込み前 */ }
    const seek = () => { if (Math.abs(player.currentTime - start) > 0.5) player.currentTime = start; };
    player.addEventListener('loadedmetadata', seek, { once: true });
  }
  stopAt = len ? start + len : 0;
  const p = player.play();
  if (p && p.catch) p.catch(() => toast('曲を再生できませんでした。「♪ 曲を流す」をもう一度押してください'));
  setMusicUI();
}
function playQ(q, resume) {
  if (!q || !q.audio) return;
  if (playerKey !== q.audio.key) {
    toast('曲を読み込み中です。少し待ってからもう一度押してください');
    prepareMusic(q); return;
  }
  playFrom(q.aStart, q.aLen, resume);
}
function stopMusic(fade) {
  clearInterval(fadeT);
  if (player.paused) { setMusicUI(); return; }
  if (!fade) { player.pause(); setMusicUI(); return; }
  fadeT = setInterval(() => {
    const v = player.volume - 0.1;
    if (v <= 0.05) { clearInterval(fadeT); player.pause(); player.volume = 1; setMusicUI(); } else player.volume = v;
  }, 60);
}
player.addEventListener('timeupdate', () => { if (stopAt && player.currentTime >= stopAt && !player.paused) stopMusic(true); });
['play', 'pause', 'ended'].forEach((ev) => player.addEventListener(ev, setMusicUI));
function setMusicUI() {
  const on = !player.paused && !player.ended;
  const bar = $('#musicBar'); if (!bar) return;
  bar.classList.toggle('playing', on);
  $('#btnMusic').textContent = on ? '■ 曲を止める' : (phase === 'revealed' ? '♪ もう一度流す' : '♪ 曲を流す');
  const pv = $('#fAudioPlay'); if (pv) pv.textContent = on ? '■ 止める' : '▶ 試聴';
}

/* ---------- 考えタイムBGM（オリジナルのリズム。音源のない問題で流れる） ---------- */
let bgmT = null, bgmStep = 0, bgmNext = 0;
const BGM_BASS = [0, 0, 7, 0, 5, 0, 7, 10];
function startBgm() {
  const a = ac(); if (!a || bgmT || !S.settings.bgm) return;
  const spb = 60 / 132 / 2; // 8分音符
  bgmStep = 0; bgmNext = a.currentTime + 0.05;
  bgmT = setInterval(() => {
    while (bgmNext < a.currentTime + 0.25) {
      const st = bgmStep % 16, d = bgmNext - a.currentTime;
      const hurry = phase === 'counting' && tLeft <= 5;
      if (st % 2 === 0) tone(110 * Math.pow(2, BGM_BASS[(st / 2) % 8] / 12), spb * 0.85, 'triangle', 0.1, d);
      noise(0.03, st % 2 ? 0.02 : 0.035, d, 7000);
      if (st % 8 === 4) noise(0.1, 0.07, d, 1500);
      if (hurry && st % 2 === 0) tone(880, 0.05, 'square', 0.03, d);
      bgmStep++; bgmNext += hurry ? spb * 0.8 : spb;
    }
  }, 50);
}
function stopBgm() { clearInterval(bgmT); bgmT = null; }
function stopAllMusic(fade) { stopBgm(); stopMusic(fade); }

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
$('#splash').addEventListener('click', (e) => { if (e.target.closest('.nom-panel') || $('#splash .roulette:not(.done)')) return; hideSplash(); });

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
  if (screen === 'question' && name !== 'question') { pauseTimer(); stopAllMusic(false); }
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
function sw(t) { return `<span class="chip" style="--c:${t.color};--ink:${inkFor(t.color)}"><span class="dot"></span>${esc(t.name)}${t.members.length ? `<small class="cnt">${t.members.length}名</small>` : ''}</span>`; }
function renderTitle() {
  applyTitle();
  const tp = S.settings.title.split(/[　]+/);
  $('#tTitle').innerHTML = tp.length > 1 ? `<span class="t-top">${esc(tp[0])}</span>${esc(tp.slice(1).join('　'))}` : esc(S.settings.title);
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
  S.settings.sound = !S.settings.sound; save(); syncSound(); if (!S.settings.sound) stopBgm();
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
let order = [];            // 早い順：答えた順番（チームID）
let lockout = new Set();   // 早押し：お手つきのチーム
let buzzTeam = null, buzzWinner = null, buzzWasCounting = false;
let hintShown = 0;
const MODE_LABEL = { normal: '通常', speed: '早い順に高得点', buzz: '早押し' };
const MODE_NEXT = { normal: 'speed', speed: 'buzz', buzz: 'normal' };
const qGroup = (q) => (q.target && q.target !== 'auto' ? q.target : LEVEL_GROUP[q.level]);
function rates() {
  const r = String(S.settings.speedRates || '').split(/[,、，\s]+/).map((x) => parseFloat(x)).filter((x) => x >= 0);
  return r.length ? r : [100, 70, 50, 30];
}
function speedGains(q, ids) {
  const r = rates();
  const ordered = [...order.filter((id) => ids.has(id)), ...S.teams.map((t) => t.id).filter((id) => ids.has(id) && !order.includes(id))];
  const g = new Map();
  ordered.forEach((id, i) => g.set(id, Math.round(q.pts * r[Math.min(i, r.length - 1)] / 100)));
  return g;
}

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
  phase = 'ready'; selected = new Set(); order = []; lockout = new Set();
  buzzTeam = null; buzzWinner = null; hintShown = 0;
  const isLast = i === L.length - 1;

  const plaque = $('#plaque');
  plaque.innerHTML = vstack(isLast ? '最終問題' : `第${kan(i + 1)}問`);
  plaque.classList.toggle('final', isLast);
  plaque.classList.toggle('long', plaque.children.length > 4);
  plaque.classList.remove('enter'); void plaque.offsetWidth; plaque.classList.add('enter');

  $('#qCat').textContent = q.cat;
  $('#qLevel').textContent = LEVEL_LABEL[q.level];
  $('#qTarget').textContent = `対象：${q.target === 'all' ? '全員' : GROUPS[qGroup(q)]}`;
  $('#qType').textContent = TYPE_LABEL[q.type];
  $('#qPts').textContent = `${q.pts}点`;
  renderModePill(q);
  $('#qCount').textContent = `${i + 1} / ${L.length}`;
  $('#nominee').classList.add('hidden'); $('#nominee').innerHTML = '';

  const qt = $('#qText');
  qt.innerHTML = fmt(q.text) + (q.hints.length
    ? `<ol class="hints">${q.hints.map((h, k) => `<li class="hidden"><b>ヒント${'①②③④⑤'[k]}</b>${fmt(h)}</li>`).join('')}</ol>` : '');
  qt.dataset.qid = q.id;
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
  stopAllMusic(false);
  $('#musicBar').classList.toggle('hidden', !q.audio);
  if (q.audio) prepareMusic(q).then((ok) => { if (!ok) toast('この問題の音源が見つかりません。「準備・設定」で登録し直してください'); });
  tTotal = Math.max(3, parseInt(S.settings.timer, 10) || 15);
  tLeft = tTotal; drawTimer();
  renderStrip(); updateControls();
}
function renderModePill(q) {
  const m = $('#qMode');
  m.textContent = (q.mode === 'buzz' ? '🔔 ' : q.mode === 'speed' ? '⚡ ' : '') + MODE_LABEL[q.mode];
  m.className = 'pill mode m-' + q.mode;
}
$('#qMode').addEventListener('click', () => {
  const q = cur(); if (!q || phase === 'revealing' || phase === 'revealed' || phase === 'buzzed') return;
  q.mode = MODE_NEXT[q.mode]; save(); order = []; lockout = new Set();
  renderModePill(q); renderStrip(); updateControls();
  toast(`得点方式を「${MODE_LABEL[q.mode]}」にしました`);
});
function showHint() {
  const q = cur(); if (!q || hintShown >= q.hints.length) return;
  const li = $$('#qText .hints li')[hintShown];
  if (li) { li.classList.remove('hidden'); li.classList.add('pop'); }
  hintShown++; SFX.point(); updateControls();
}

function drawTimer() {
  $('#timerNum').textContent = Math.ceil(tLeft);
  $('#timerFill').style.transform = `scaleX(${tLeft / tTotal})`;
  const warn = tLeft <= 5 && tLeft > 0 && phase === 'counting';
  $('#timerNum').classList.toggle('warn', warn);
  $('#timeBar').classList.toggle('warn', tLeft <= 5);
}
function stopTimer() { clearInterval(tInt); tInt = null; }
function pauseTimer() { if (phase === 'counting') { stopTimer(); stopAllMusic(true); phase = 'paused'; updateControls(); } }
function toggleTimer() {
  if (phase === 'revealing' || phase === 'revealed' || phase === 'buzzed') return;
  if (phase === 'counting') { pauseTimer(); return; }
  if (phase === 'locked' || tLeft <= 0) tLeft = tTotal;
  ac();
  const resume = phase === 'paused';
  phase = 'counting'; updateControls();
  const cq = cur();
  if (cq && cq.audio) { if (S.settings.autoMusic) playQ(cq, resume); } else startBgm();
  lastSec = Math.ceil(tLeft);
  const t0 = performance.now(), from = tLeft;
  tInt = setInterval(() => {
    tLeft = Math.max(0, from - (performance.now() - t0) / 1000);
    drawTimer();
    const s = Math.ceil(tLeft);
    if (s !== lastSec) { lastSec = s; if (s > 0) (s <= 5 ? SFX.last : SFX.tick)(); }
    if (tLeft <= 0) {
      stopTimer(); stopAllMusic(true); phase = 'locked'; updateControls(); drawTimer();
      SFX.timeup(); splash('<div class="sp-timeup">タイムアップ！</div>', 1300);
    }
  }, 100);
}

/* 早押し（解答権は出題者がチームをタップして決める） */
function buzzIn(id) {
  const t = S.teams.find((x) => x.id === id); if (!t) return;
  buzzWasCounting = phase === 'counting';
  stopTimer(); stopAllMusic(false); stopBgm();
  if (phase === 'counting') phase = 'paused';
  phase = 'buzzed'; buzzTeam = id;
  SFX.buzz();
  splash(`<div class="sp-buzz" style="--c:${t.color};--ink:${inkFor(t.color)}"><small>解答権</small>${esc(t.name)}</div>`, 1500);
  renderStrip(); updateControls();
}
function buzzJudge(ok) {
  const q = cur(); if (!q || phase !== 'buzzed') return;
  const t = S.teams.find((x) => x.id === buzzTeam);
  if (ok) {
    t.score += q.pts; awarded.add(q.id); save();
    buzzWinner = buzzTeam; buzzTeam = null;
    phase = 'paused'; reveal();
    return;
  }
  SFX.wrong();
  const pen = Math.max(0, parseInt(S.settings.penalty, 10) || 0);
  if (pen) t.score -= pen;
  lockout.add(buzzTeam); save();
  splash(`<div class="sp-otetsuki">お手つき！${pen ? `<small>${esc(t.name)} −${pen}点</small>` : ''}</div>`, 1200);
  buzzTeam = null; phase = 'paused';
  renderStrip(); updateControls();
  if (lockout.size >= S.teams.length) { toast('全チームお手つき！正解を発表しましょう'); return; }
  if (buzzWasCounting) setTimeout(() => { if (phase === 'paused') toggleTimer(); }, 1250);
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
  if (phase === 'revealing' || phase === 'revealed' || phase === 'buzzed') return;
  const q = cur(); if (!q) return;
  stopTimer(); stopAllMusic(true); phase = 'revealing'; updateControls();
  const winner = buzzWinner && S.teams.find((x) => x.id === buzzWinner);
  splash(winner ? `<div class="sp-lead" style="animation:none">${esc(winner.name)}の答えは…</div>` : '<div class="sp-lead">正解は…</div>');
  SFX.drum(winner ? 900 : 1400);
  setTimeout(() => {
    SFX.cymbal(); SFX.pinpon();
    splash(winner ? `<div>${answerSplash(q)}<div class="sp-win" style="--c:${winner.color};--ink:${inkFor(winner.color)}">${esc(winner.name)} 正解！ ＋${q.pts}点</div></div>` : answerSplash(q), 2100);
    if (winner) setTimeout(() => SFX.fanfare(), 300);
    if (q.audio) setTimeout(() => { if (phase === 'revealed' && cur() === q) playQ(q); }, 2100); // 答え合わせでもう一度流す
    $$('#answers .ans').forEach((el) => {
      if (q.type === 'free') { el.classList.add('correct'); el.innerHTML = `<span class="q-mark" style="font-size:clamp(1.8rem,5vw,3.6rem)">${fmt(q.answer)}</span>`; return; }
      const ok = String(el.dataset.k) === String(q.answer);
      el.classList.toggle('correct', ok); el.classList.toggle('dim', !ok);
    });
    $$('#qText .hints li').forEach((li) => li.classList.remove('hidden'));
    const rb = $('#revealBox');
    rb.innerHTML = `${winner ? `<span class="win-tag" style="--c:${winner.color};--ink:${inkFor(winner.color)}">${esc(winner.name)} 正解 ＋${q.pts}点</span>` : ''}<b>正解</b>${answerText(q)}${q.explain ? `<p>${fmt(q.explain)}</p>` : ''}`;
    rb.classList.remove('hidden');
    setTimeout(() => rb.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
    phase = 'revealed'; renderStrip(); updateControls();
    if (winner) {
      const chip = $(`#chips .chip[data-id="${winner.id}"]`);
      if (chip) { const f = document.createElement('span'); f.className = 'float'; f.textContent = `+${q.pts}`; chip.appendChild(f); }
    }
  }, winner ? 950 : 1450);
}

function stripMode() {
  const q = cur(); if (!q) return 'none';
  if (phase === 'revealing') return 'none';
  if (phase === 'revealed') return q.mode === 'buzz' ? 'none' : 'judge';
  if (q.mode === 'speed') return 'order';
  if (q.mode === 'buzz') return phase === 'buzzed' ? 'none' : 'buzz';
  return 'none';
}
const STRIP_HINT = {
  judge: '正解したチームをタップしてください',
  order: '⚡ 答えた（ボードを上げた）順にチームをタップ → 早いほど高得点',
  buzz: '🔔 早押し：手を挙げた（ボタンを押した）チームをタップすると解答権',
};
function renderStrip() {
  const q = cur(), sm = stripMode();
  $('#strip').classList.toggle('judging', sm !== 'none');
  $('#stripHint').classList.toggle('hidden', sm === 'none');
  $('#stripHint').textContent = STRIP_HINT[sm] || '';
  const gains = q && q.mode === 'speed' && phase === 'revealed' ? speedGains(q, selected) : null;
  $('#chips').innerHTML = S.teams.map((t, i) => {
    const oi = order.indexOf(t.id);
    const cls = ['chip'];
    if (selected.has(t.id)) cls.push('on');
    if (lockout.has(t.id)) cls.push('out');
    if (buzzTeam === t.id || buzzWinner === t.id) cls.push('buzz');
    const badge = oi >= 0 && q && q.mode === 'speed' ? `<span class="ord">${oi + 1}</span>` : '';
    const g = gains && gains.has(t.id) ? `<span class="gain">+${gains.get(t.id)}</span>` : '';
    return `<button type="button" class="${cls.join(' ')}" data-id="${t.id}" style="--c:${t.color};--ink:${inkFor(t.color)}" ${sm === 'none' ? 'tabindex="-1"' : ''} aria-pressed="${selected.has(t.id)}" title="${sm !== 'none' ? (i + 1) + 'キーでも選べます' : ''}">${badge}<span class="dot"></span><span>${esc(t.name)}</span><span class="sc">${t.score}</span>${g}</button>`;
  }).join('');
}
function chipAction(id) {
  const sm = stripMode();
  if (sm === 'judge') toggleTeam(id);
  else if (sm === 'order') {
    const k = order.indexOf(id);
    if (k >= 0) order.splice(k, 1); else { order.push(id); SFX.tick(); }
    renderStrip();
  } else if (sm === 'buzz' && !lockout.has(id)) buzzIn(id);
}
$('#chips').addEventListener('click', (e) => {
  const c = e.target.closest('.chip'); if (c) chipAction(c.dataset.id);
});
function toggleTeam(id) {
  if (selected.has(id)) selected.delete(id); else { selected.add(id); SFX.tick(); }
  renderStrip(); updateControls();
}
function updateControls() {
  const rev = phase === 'revealed', ing = phase === 'revealing', bz = phase === 'buzzed';
  const q = cur();
  $('#btnTimer').classList.toggle('hidden', rev || ing || bz);
  $('#btnReveal').classList.toggle('hidden', rev || bz);
  $('#btnReveal').disabled = ing;
  $('#btnBuzzOk').classList.toggle('hidden', !bz);
  $('#btnBuzzNg').classList.toggle('hidden', !bz);
  $('#btnHint').classList.toggle('hidden', !q || !q.hints.length || rev || ing || hintShown >= q.hints.length);
  if (q && q.hints.length) $('#btnHint').textContent = `💡 ヒント（${hintShown + 1}/${q.hints.length}）`;
  $('#btnNominate').disabled = ing;
  $('#btnAward').classList.toggle('hidden', !rev);
  $('#btnNext').classList.toggle('hidden', rev || bz);
  $('#btnPrev').disabled = S.pos <= 0 || ing || bz;
  setMusicUI();
  $('#btnTimer').textContent = phase === 'counting' ? '⏸ ストップ' : phase === 'paused' ? '▶ 再開' : '⏱ カウント開始';
  if (q) {
    const isLast = S.pos >= list().length - 1, tail = isLast ? '（得点ボードへ）' : 'して次へ';
    let label = isLast ? '得点ボードへ' : '次の問題へ';
    if (q.mode !== 'buzz' && selected.size) label = q.mode === 'speed' ? `早い順に得点を加算${tail}` : `選んだチームに＋${q.pts}点${tail}`;
    $('#btnAward').textContent = label;
  }
}
function award() {
  const q = cur(); if (!q || phase !== 'revealed') return;
  if (q.mode === 'buzz' || !selected.size) { showQuestion(S.pos + 1); return; }
  if (awarded.has(q.id) && !confirm('この問題はすでに得点を加算しています。もう一度加算しますか？')) return;
  const gains = q.mode === 'speed' ? speedGains(q, selected) : new Map([...selected].map((id) => [id, q.pts]));
  S.teams.forEach((t) => { if (gains.has(t.id)) t.score += gains.get(t.id); });
  awarded.add(q.id); save(); SFX.point();
  selected = new Set(); renderStrip();
  gains.forEach((v, id) => {
    const chip = $(`#chips .chip[data-id="${id}"]`);
    if (chip) { const f = document.createElement('span'); f.className = 'float'; f.textContent = `+${v}`; chip.appendChild(f); }
  });
  setTimeout(() => showQuestion(S.pos + 1), 1000);
}

/* 回答者の指名（ルーレット） */
const used = new Set(); // 一度指名された人は、全員が当たるまで選ばれにくくする
function pool(team, group) {
  const list = team.members.map((m, i) => ({ team, name: m.name, g: m.g, no: i + 1 }))
    .filter((c) => group === 'all' || c.g === group);
  return list.length ? list : [{ team, name: null, g: group, no: 0 }];
}
function pickFair(cands) {
  const key = (c) => `${c.team.id}:${c.no}`;
  let free = cands.filter((c) => !used.has(key(c)));
  if (!free.length) { cands.forEach((c) => used.delete(key(c))); free = cands; }
  const c = free[Math.floor(Math.random() * free.length)];
  used.add(key(c)); return c;
}
function label(c) {
  if (c.no) return `${c.name ? esc(c.name) : c.no + '番の人'}<small>（${GROUPS[c.g] || ''}）</small>`;
  return c.g === 'all' ? 'だれか1人' : `${GROUPS[c.g]}のだれか1人`;
}
function openNominate() {
  const q = cur(); if (!q) return;
  const def = q.target === 'all' ? 'all' : qGroup(q);
  const opts = [['low', '低学年'], ['high', '高学年'], ['jh', '中学生'], ['all', '全員']];
  splash(`<div class="nom-panel">
    <h3>回答者を指名</h3>
    <div class="seg" role="radiogroup" aria-label="対象">${opts.map(([k, v]) => `<button type="button" class="seg-b${k === def ? ' on' : ''}" data-g="${k}">${v}</button>`).join('')}</div>
    <div class="nom-acts">
      <button type="button" class="btn big gold" data-nom="each">各チームから1人ずつ</button>
      <button type="button" class="btn big primary" data-nom="one">全体から1人だけ</button>
    </div>
    <button type="button" class="btn ghost" data-nom="close">閉じる</button>
  </div>`);
}
$('#splash').addEventListener('click', (e) => {
  const seg = e.target.closest('.seg-b');
  if (seg) { $$('#splash .seg-b').forEach((b) => b.classList.toggle('on', b === seg)); return; }
  const b = e.target.closest('[data-nom]'); if (!b) return;
  if (b.dataset.nom === 'close') { hideSplash(); return; }
  const g = ($('#splash .seg-b.on') || {}).dataset?.g || 'all';
  runRoulette(g, b.dataset.nom === 'each');
});
function runRoulette(group, each) {
  ac();
  const teams = S.teams;
  const finals = each ? teams.map((t) => pickFair(pool(t, group)))
    : [pickFair(teams.flatMap((t) => pool(t, group)))];
  const rows = (arr) => arr.map((c) => `<div class="rl-row" style="--c:${c.team.color};--ink:${inkFor(c.team.color)}"><span class="rl-team">${esc(c.team.name)}</span><span class="rl-name">${label(c)}</span></div>`).join('');
  const all = each ? null : teams.flatMap((t) => pool(t, group));
  let delay = 50, elapsed = 0;
  const step = () => {
    const tmp = each ? teams.map((t) => { const p = pool(t, group); return p[Math.floor(Math.random() * p.length)]; })
      : [all[Math.floor(Math.random() * all.length)]];
    splash(`<div class="roulette"><p class="rl-title">だれかな…？</p>${rows(tmp)}</div>`);
    SFX.tick();
    elapsed += delay; delay = Math.min(260, delay * 1.12);
    if (elapsed < 2200) setTimeout(step, delay);
    else setTimeout(() => {
      splash(`<div class="roulette done"><p class="rl-title">${each ? '各チームの回答者' : 'あなたです！'}</p>${rows(finals)}<p class="rl-tap">タップで閉じる</p></div>`);
      SFX.pinpon();
      const nm = $('#nominee');
      nm.innerHTML = `<span class="nm-lead">🎯 回答者</span>` + finals.map((c) => `<span class="nm-chip" style="--c:${c.team.color};--ink:${inkFor(c.team.color)}">${esc(c.team.name)}：${label(c)}</span>`).join('');
      nm.classList.remove('hidden');
    }, 250);
  };
  step();
}
$('#btnNominate').addEventListener('click', openNominate);
$('#btnHint').addEventListener('click', showHint);
$('#btnBuzzOk').addEventListener('click', () => { ac(); buzzJudge(true); });
$('#btnBuzzNg').addEventListener('click', () => { ac(); buzzJudge(false); });

$('#btnTimer').addEventListener('click', toggleTimer);
$('#btnMusic').addEventListener('click', () => {
  const q = cur(); if (!q || !q.audio) return;
  if (!player.paused) { stopMusic(true); return; }
  stopBgm(); playQ(q, true);
});
$('#btnReveal').addEventListener('click', () => { ac(); reveal(); });
$('#btnAward').addEventListener('click', award);
$('#btnNext').addEventListener('click', () => showQuestion(S.pos + 1));
$('#btnPrev').addEventListener('click', () => showQuestion(S.pos - 1));

document.addEventListener('keydown', (e) => {
  if ($('#editDialog').open || screen !== 'question') return;
  const tag = e.target.tagName;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
  if ((e.key === ' ' || e.key === 'Enter') && tag === 'BUTTON') return; // ボタン自体の操作を優先
  if (phase === 'buzzed') {
    if (e.key === 'o' || e.key === 'Enter') { e.preventDefault(); buzzJudge(true); }
    else if (e.key === 'x') buzzJudge(false);
    return;
  }
  if (e.key === ' ') { e.preventDefault(); toggleTimer(); }
  else if (e.key === 'Enter') { e.preventDefault(); if (phase === 'revealed') award(); else { ac(); reveal(); } }
  else if (e.key === 'ArrowRight' && phase !== 'revealing') showQuestion(S.pos + 1);
  else if (e.key === 'ArrowLeft' && phase !== 'revealing') showQuestion(S.pos - 1);
  else if (e.key === 'h') showHint();
  else if (e.key === 'n') openNominate();
  else if (/^[1-8]$/.test(e.key)) { const t = S.teams[+e.key - 1]; if (t) chipAction(t.id); }
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
      <span class="qi-text"><span class="cat">${esc(q.cat)}</span>${q.audio ? '<span class="tag audio" title="音源あり">♪ 音源あり</span> ' : ''}${q.mode !== 'normal' ? `<span class="tag mode-${q.mode}">${MODE_LABEL[q.mode]}</span> ` : ''}${q.hints.length ? '<span class="tag hint">ヒント</span> ' : ''}${esc(plain(q.text))}${q.check ? '<span class="warn">要確認</span>' : ''}${q.memo ? `<span class="memo">${esc(q.memo)}</span>` : ''}</span>
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
  else if (act === 'dup') {
    const nid = uid(), src = Qs[i];
    Qs.splice(i + 1, 0, normQ({ ...src, id: nid, choices: [...src.choices], audio: null }));
    if (src.audio) IDB.get(src.audio.key).then((b) => { if (!b) return; return IDB.put(nid, b).then(() => { const n = S.questions.find((x) => x.id === nid); if (n) { n.audio = { key: nid, name: src.audio.name }; save(); renderQList(); } }); }).catch(() => {});
  }
  else if (act === 'del') { if (!confirm(`「${plain(Qs[i].text).slice(0, 30)}」を削除しますか？`)) return; if (Qs[i].audio) IDB.del(Qs[i].audio.key); Qs.splice(i, 1); }
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
  if (!confirm('問題を最初に入っていた内容に戻します。追加・編集した問題と、登録した音源は消えます。よろしいですか？')) return;
  IDB.clear(); S.questions = defaultQuestions(); S.pos = 0; save(); renderQList(); toast('問題を最初の内容に戻しました（登録した音源も消えました）');
});
const blobToDataURL = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
$('#btnExport').addEventListener('click', async () => {
  let qs = S.questions;
  const withAudio = qs.some((q) => q.audio) && confirm('登録した音源もファイルに含めますか？\n（含めると別の端末でも曲が流せます。ファイルは大きくなります）');
  if (withAudio) {
    toast('音源をまとめています…');
    qs = await Promise.all(qs.map(async (q) => {
      if (!q.audio) return q;
      try { const b = await IDB.get(q.audio.key); return b ? { ...q, audioData: await blobToDataURL(b) } : q; } catch (e) { return q; }
    }));
  }
  const data = { app: 'kendo-quiz', version: DATA_VER, settings: S.settings, teams: S.teams, questions: qs };
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
  r.onload = async () => {
    try {
      const d = JSON.parse(r.result);
      const qs = Array.isArray(d) ? d : d.questions;
      if (!Array.isArray(qs)) throw new Error();
      toast('読み込み中です…');
      S.questions = await Promise.all(qs.map(async (raw) => {
        const q = normQ(raw);
        if (typeof raw.audioData === 'string' && raw.audioData.startsWith('data:')) {
          try {
            const b = await (await fetch(raw.audioData)).blob();
            await IDB.put(q.id, b); q.audio = { key: q.id, name: (raw.audio && raw.audio.name) || '音源' };
          } catch (e2) { q.audio = null; }
        }
        return q;
      }));
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
let edAudio = null, edRemove = false, edExisting = null;
function showAudioName() {
  const n = edAudio ? edAudio.name : (!edRemove && edExisting ? edExisting.name : '');
  $('#fAudioName').textContent = n ? `♪ ${n}` : '音源なし';
  $('#fAudioDel').disabled = !n; $('#fAudioPlay').disabled = !n;
}
$('#fAudioFile').addEventListener('change', (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (f.size > 60 * 1024 * 1024) toast('ファイルが大きいため、保存に時間がかかることがあります');
  edAudio = { blob: f, name: f.name }; edRemove = false; stopMusic(false); showAudioName();
});
$('#fAudioDel').addEventListener('click', () => { edAudio = null; edRemove = true; stopMusic(false); showAudioName(); });
$('#fAudioPlay').addEventListener('click', async () => {
  if (!player.paused) { stopMusic(true); return; }
  try {
    if (edAudio) setSrc(edAudio.blob, 'edit:' + edAudio.name + edAudio.blob.size);
    else if (edExisting && !edRemove) { const b = await IDB.get(edExisting.key); if (!b) { toast('音源が見つかりません'); return; } setSrc(b, edExisting.key); }
    else return;
    playFrom(Math.max(0, parseFloat($('#fAStart').value) || 0), Math.max(0, parseFloat($('#fALen').value) || 0));
  } catch (e) { toast('試聴できませんでした'); }
});
dlg.addEventListener('close', () => stopMusic(false));
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
  $('#fMemo').value = q.memo; $('#fAStart').value = q.aStart; $('#fALen').value = q.aLen;
  $('#fMode').value = q.mode; $('#fTarget').value = q.target; $('#fHints').value = q.hints.join('\n');
  edAudio = null; edRemove = false; edExisting = q.audio; showAudioName();
  $('#catList').innerHTML = [...new Set(S.questions.map((x) => x.cat))].map((c) => `<option value="${esc(c)}">`).join('');
  $('#fErr').textContent = '';
  showBlocks();
  dlg.showModal();
  $('#fText').focus();
}
$('#btnCancel').addEventListener('click', () => dlg.close());
$('#editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = $('#fType').value, text = $('#fText').value.trim();
  const err = (m) => { $('#fErr').textContent = m; };
  if (!text) return err('問題文を入力してください。');
  const q = {
    id: editIndex >= 0 ? S.questions[editIndex].id : uid(), type, text,
    cat: $('#fCat').value.trim() || 'その他', level: +$('#fLevel').value,
    pts: Math.max(0, parseInt($('#fPts').value, 10) || 0), explain: $('#fExplain').value.trim(),
    enabled: $('#fEnabled').checked, check: $('#fCheck').checked, choices: [],
    memo: $('#fMemo').value.trim(), aStart: $('#fAStart').value, aLen: $('#fALen').value,
    mode: $('#fMode').value, target: $('#fTarget').value, hints: $('#fHints').value.split('\n'),
    audio: edRemove ? null : edExisting,
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
  try {
    if (edAudio) {
      $('#btnSaveQ').disabled = true; err('音源を保存しています…');
      await IDB.put(nq.id, edAudio.blob);
      nq.audio = { key: nq.id, name: edAudio.name };
    } else if (edRemove && edExisting) await IDB.del(edExisting.key);
  } catch (e2) {
    $('#btnSaveQ').disabled = false;
    return err('音源を保存できませんでした。端末の空き容量を確認するか、短い音源にしてください。');
  }
  $('#btnSaveQ').disabled = false;
  playerKey = null; // 次回の再生で読み込み直す
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
      <div class="members">
        <div class="mem-head">
          <label class="inline">人数
            <select data-size aria-label="${esc(t.name)}の人数">${Array.from({ length: MAX_MEMBERS + 1 }, (_, n) => `<option value="${n}"${n === t.members.length ? ' selected' : ''}>${n ? n + '名' : '登録しない'}</option>`).join('')}</select>
          </label>
          <span class="mem-sum">${memberSummary(t)}</span>
        </div>
        <ol class="mem-list">
          ${t.members.map((m, k) => `<li data-k="${k}">
            <span class="mem-no">${k + 1}</span>
            <input type="text" data-mn value="${esc(m.name)}" placeholder="名前（空欄なら「${k + 1}番の人」）" aria-label="${k + 1}番の名前">
            <select data-mg aria-label="${k + 1}番の区分">${Object.entries(GROUPS).map(([g, gl]) => `<option value="${g}"${g === m.g ? ' selected' : ''}>${gl}</option>`).join('')}</select>
          </li>`).join('')}
        </ol>
      </div>
    </div>`).join('');
}
function memberSummary(t) {
  if (!t.members.length) return '指名は「低学年のだれか1人」のように表示されます';
  const c = Object.keys(GROUPS).map((g) => `${GROUPS[g]} ${t.members.filter((m) => m.g === g).length}名`);
  return `${t.members.length}名（${c.join('・')}）`;
}
function teamOf(el) { return S.teams[+el.closest('.team-row').dataset.i]; }
$('#teamList').addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('[data-size]')) {
    const t = teamOf(el), n = Math.min(MAX_MEMBERS, Math.max(0, +el.value));
    const lastG = t.members.length ? t.members[t.members.length - 1].g : 'low';
    while (t.members.length < n) t.members.push({ name: '', g: lastG });
    if (t.members.length > n) {
      const cut = t.members.slice(n).filter((m) => m.name).length;
      if (cut && !confirm(`名前が入っている${cut}名が消えます。よろしいですか？`)) { el.value = t.members.length; return; }
      t.members.length = n;
    }
    used.clear(); save(); renderTeams();
  } else if (el.matches('[data-mg]')) {
    const t = teamOf(el); t.members[+el.closest('li').dataset.k].g = el.value; used.clear(); save();
    el.closest('.members').querySelector('.mem-sum').textContent = memberSummary(t);
  }
});
$('#teamList').addEventListener('input', (e) => {
  if (e.target.matches('[data-mn]')) {
    teamOf(e.target).members[+e.target.closest('li').dataset.k].name = e.target.value.trim(); save(); return;
  }
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
  $('#setBgm').checked = S.settings.bgm; $('#setAutoMusic').checked = S.settings.autoMusic;
  $('#setRates').value = S.settings.speedRates; $('#setPenalty').value = S.settings.penalty;
}
$('#setTitle').addEventListener('input', (e) => { S.settings.title = e.target.value; save(); applyTitle(); });
$('#setSub').addEventListener('input', (e) => { S.settings.subtitle = e.target.value; save(); });
$('#setTimer').addEventListener('change', (e) => { S.settings.timer = Math.min(120, Math.max(3, parseInt(e.target.value, 10) || 15)); e.target.value = S.settings.timer; save(); });
$('#setSound').addEventListener('change', (e) => { S.settings.sound = e.target.checked; save(); syncSound(); });
$('#setRates').addEventListener('change', (e) => { S.settings.speedRates = String(e.target.value); S.settings.speedRates = rates().join(','); e.target.value = S.settings.speedRates; save(); });
$('#setPenalty').addEventListener('change', (e) => { S.settings.penalty = Math.max(0, parseInt(e.target.value, 10) || 0); e.target.value = S.settings.penalty; save(); });
$('#setBgm').addEventListener('change', (e) => { S.settings.bgm = e.target.checked; save(); });
$('#setAutoMusic').addEventListener('change', (e) => { S.settings.autoMusic = e.target.checked; save(); });
$('#btnRewind').addEventListener('click', () => { S.pos = 0; awarded.clear(); save(); toast('第1問にもどしました'); });
$('#btnFactory').addEventListener('click', () => {
  if (!confirm('問題・チーム・得点・設定・登録した音源をすべて初期状態に戻します。よろしいですか？')) return;
  IDB.clear(); S = factory(); awarded.clear(); save(); renderAdmin(); applyTitle(); syncSound(); toast('初期状態に戻しました');
});

/* ---------- 起動 ---------- */
syncSound();
go('title');
})();
