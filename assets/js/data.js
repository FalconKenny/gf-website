/* ============================================================
   Guide.Ferryman — 網站資料層
   說明：
   1. 這裡是「種子資料」。後台（admin/articles.html）新增/編輯的文章
      會存放於瀏覽器 localStorage，並與此處種子資料合併顯示。
   2. 未來串接 Supabase 等資料庫後，只需改寫 GF_getArticles()
      即可全站生效（前台/後台皆呼叫此函式）。
   ============================================================ */

const GF_CATEGORIES = ["AI", "機器人", "半導體", "無人機", "其他"];

/* ---------- 洞察／動態文章（種子） ---------- */
const GF_SEED_ARTICLES = [
  {
    id: "s1", cat: "機器人", date: "2026-06-15",
    title: "美國《American Security Robotics Act》進入委員會審議：台廠的風險與機會",
    summary: "由參議員 Tom Cotton 與 Chuck Schumer 跨黨派提出，擬禁止聯邦行政機關採購或操作特定機器人與無人地面載具系統，並涵蓋外包契約。法案通過後將有 12 個月緩衝期。",
    body: "2026 年 3 月 26 日，美國參議院由共和黨參議員 Tom Cotton 與民主黨參議員 Chuck Schumer 共同提出《American Security Robotics Act》，目前已進入國土安全與政府事務委員會審議。\n\n法案重點：\n・擬禁止聯邦行政機關採購或操作特定的機器人與無人地面載具系統。\n・禁令效力涵蓋外包契約——聯邦機構不得透過服務合約等方式，聘用第三方操作不合規載具。\n・法案通過後將給予 12 個月緩衝期。\n\n對台灣廠商的意涵：\n供應鏈「信任盟友（trusted allies）」地位在美國政策語境中的價值持續上升。台灣機器人零組件與整機廠商，可將『非紅供應鏈』定位轉化為切入聯邦與州政府採購體系的差異化優勢。建議關注委員會審議進度與合規名單的認定機制。\n\n（本文由 Guide.Ferryman 產業研究整理，資料來源：工研院產科國際所）"
  },
  {
    id: "s2", cat: "機器人", date: "2026-05-20",
    title: "H.R.7334《National Robotics Commission Act》：美國機器人供應鏈政策的下一步",
    summary: "跨黨派法案指示商務部成立 18 人專家委員會，職權明確納入機器人全球與國內供應鏈風險，以及增加美國境內機器人製造的政策方向。",
    body: "2026 年 2 月 3 日，美國國會跨黨派提出 H.R.7334《National Commission on Robotics Act》，指示商務部成立 18 人專家委員會。\n\n委員會職權明確納入：\n・機器人全球與國內供應鏈風險評估。\n・增加美國境內機器人製造的政策建議。\n\n觀察重點：此委員會的成立象徵美國正把機器人視為與半導體同等級的戰略產業。對規劃赴美佈局的台灣廠商而言，供應鏈在地化（組裝、零組件供應）將是進入美國市場的重要籌碼。\n\n（資料來源：工研院產科國際所）"
  },
  {
    id: "s3", cat: "機器人", date: "2026-04-10",
    title: "從 EO 14179 到 Genesis Mission：川普政府的 AI／機器人政策地圖",
    summary: "2025 年以來，美國聯邦以「去管制」為基調推進 AI 與機器人政策：從 EO 14179、America's AI Action Plan 的次世代製造，到能源部 Genesis Mission 的機器人實驗室盤點。",
    body: "自 2025 年 1 月川普上任以來，美國聯邦機器人相關政策脈絡如下：\n\n・2025/1/23　EO 14179「移除美國 AI 領導障礙」：後續所有 AI（含機器人）政策的母法，基調為去管制（deregulation）。\n・2025/4/23　EO 14277、EO 14278：推動美國青年 AI 教育、為未來高薪技術工作做準備，鋪墊機器人技師與自動化人力培訓管道。\n・2025/7/23　America's AI Action Plan：90 項政策，「次世代製造」一節主張聯邦投資 AI 與機器人賦能的新製造技術，要求美國「及其信任的盟友」成為製造者。\n・2025/11/24　Genesis Mission：建立能源部營運的整合式 AI 平台，重點領域含先進製造、關鍵材料、半導體；2026/7/22 前須盤點聯邦設施中能進行 AI 導向實驗與製造的機器人實驗室。\n\n台灣視角：政策語言中反覆出現的 trusted allies，正是台灣供應鏈的切入點。\n\n（資料來源：工研院產科國際所）"
  },
  {
    id: "s4", cat: "機器人", date: "2026-06-01",
    title: "美國機器人聯邦補助兩大類型：研究型 vs 產業型，台廠怎麼切？",
    summary: "A 類研究型（NSF FRR、SBIR/STTR、ARM Institute）與 B 類產業型（州政府 MBDP、M2I2、CalCompetes）補助邏輯完全不同——台灣廠商的切入路徑也不同。",
    body: "美國機器人聯邦補助可分為兩大類：\n\n【A 類：研究型】\n・代表機制：NSF FRR、NSF SBIR/STTR、ARM Institute。\n・金額級距：FRR 單案約 17.4 萬至 500 萬美元；SBIR Phase II 至 180 萬美元；ARM 單案約百萬美元級。\n・台灣切入路徑：與美國大學／實驗室合作研究、技轉；加入 ARM 會員；新創走 SBIR。\n\n【B 類：產業型】\n・代表機制：州政府補助（MBDP、M2I2、CalCompetes）、聯邦製造綱領。\n・性質：資本補貼／稅收抵免／績效現金，綁定在地就業、設備留在州內與存續年限（如賓州 5 年）。\n・典型案例：MBDP 270 萬美元（Teradyne 案）；CalCompetes 單輪近 1 億美元。\n・台灣切入路徑：設組裝廠、合資、零組件供應，以配比補助降低設廠成本。\n\nNSF FRR 累計補助最多的前三州為麻州（$15.1M）、賓州（$12.9M）、密西根（$12.7M）——這也是台灣學研合作的優先地圖。\n\n（資料來源：NSF、工研院產科國際所）"
  },
  {
    id: "s5", cat: "AI", date: "2026-06-10",
    title: "台灣 A+ AI 應用躍昇計畫：每案上限 2,000 萬的示範場域機會",
    summary: "經濟部產業技術司 A+ 體系中，AI 應用躍昇計畫聚焦八大關鍵產業，每案上限 2,000 萬元、期程三年內，是企業建置 AI／機器人示範場域的主要金流。",
    body: "台灣企業導入 AI 與機器人應用，最核心的研發補助入口之一是經濟部產業技術司的 A+ 企業創新研發淬鍊計畫：\n\n・A+ 前瞻技術研發計畫：補助比例 40% 以上、最高 50%，隨到隨審。適合機器人關鍵技術（感知、控制、AI 模型）的前瞻研發。\n・A+ AI 應用躍昇計畫：應用端每案上限 2,000 萬元、期程三年內，聚焦八大關鍵產業，可建 AI 示範場域、導入機器人智慧應用驗證。\n\n申請重點：國內企業可聯合提案或結合研究機構，須為非陸資、淨值為正。\n\nGuide.Ferryman 提供從題目設計、計畫書撰寫到審查答詢的全程陪跑服務。\n\n（資料來源：《台灣 AI 機器人相關政府補助總表》2026/6，工研院產科國際所整理）"
  },
  {
    id: "s6", cat: "半導體", date: "2026-05-28",
    title: "晶創台灣 × 機器人邊緣 AI 晶片：10 年 3,000 億的上游能量",
    summary: "晶創台灣方案 114 年度核定 IC 設計攻頂補助 11 案共 57 億元，10 年將挹注 3,000 億元——機器人邊緣 AI 晶片與控制 SoC 是重要方向。",
    body: "機器人產業的上游是晶片。台灣「晶創台灣」方案中的 IC 設計攻頂補助，114 年度核定 11 案、共 57 億元，整體方案 10 年將挹注 3,000 億元。\n\n對機器人產業的意義：\n・機器人邊緣 AI 晶片、控制 SoC 的上游 IC 設計能量，是台灣切入全球機器人供應鏈的獨特優勢。\n・搭配產創條例第 10 之 1／10 之 2 租稅抵減（智慧機械／5G／資安／AI 抵減 5% 或 3%），企業可同時取得研發補助與投資抵減。\n\n（資料來源：《台灣 AI 機器人相關政府補助總表》2026/6）"
  },
  {
    id: "s7", cat: "無人機", date: "2026-05-15",
    title: "軍民通用無人機能量籌建（TIIP）：國產無人機供應鏈的政策風口",
    summary: "經濟部產業發展署 TIIP 主題式計畫直接點名「軍民通用無人機能量籌建」，搭配業界科專的無人機關鍵技術與 AI 影像晶片項目，形成完整補助鏈。",
    body: "無人機（空中機器人）是台灣政府補助明確點名的重點：\n\n・TIIP－軍民通用無人機能量籌建：依提案審定，對象為無人機供應鏈業者，目標是建構國產無人機供應鏈量能。\n・業界科專－無人機關鍵技術／AI 影像晶片：對象為整機、飛導控、酬載、通訊、動力模組業者。\n・無人載具科技創新應用－運行驗證：自駕車／AMR 等無人載具的沙盒運行與場域驗證補助。\n\n美國市場端：在美中科技戰背景下，非中製無人機供應鏈（NDAA 合規）需求持續放大，台灣廠商同時具備政策補助與市場拉力。\n\n（資料來源：《台灣 AI 機器人相關政府補助總表》2026/6）"
  },
  {
    id: "s8", cat: "其他", date: "2026-06-05",
    title: "臺美創新研發合作（A+ 國合）：AI 案最高可補助 70% 的跨國金流工具",
    summary: "臺方總經費補助上限 50%，AI 案可再加碼 20%（合計 70%），但須有美方共同提案——這是「鏈結美國」最直接的政府研發金流。",
    body: "想同時取得台灣政府補助並建立美國合作網絡的企業，「臺美創新研發合作」（產業技術司 A+ 國合）是最契合的工具：\n\n・臺方總經費補助上限 50%，AI 案可再加碼 20%，合計最高 70%。\n・條件：須有美方共同提案夥伴。\n・另有「臺加創新研發合作」（2024 簽署）作為北美鏈結的第二管道。\n\n配套資源：\n・國際貿易署「補助分散及開拓海外市場」：單家最高 500 萬、聯盟 2,000 萬元。\n・海外參展補助（TPPO）：實體展每攤 12 萬、每展上限 16 萬元。\n\nGuide.Ferryman 可協助企業媒合美方共同提案夥伴，並規劃補助組合策略。\n\n（資料來源：《台灣 AI 機器人相關政府補助總表》2026/6）"
  },
  {
    id: "s9", cat: "AI", date: "2026-04-22",
    title: "NSF SBIR/STTR：台灣新創進入美國深科技體系的低成本入口",
    summary: "NSF SBIR 每年投入逾 2 億美元、支持約 400 家新創，不取股權、智財保留於公司。Phase I 上限 30.5 萬、Phase II 上限 125 萬美元。",
    body: "對在美設立實體的台灣新創而言，NSF SBIR/STTR 是進入美國深科技體系最重要的非稀釋性資金：\n\n・Phase I ≤ 30.5 萬美元；Phase II ≤ 125 萬美元（單一公司最高約 200 萬美元）。\n・每年投入逾 2 億美元、支持約 400 家新創；NSF 不取股權、智財保留於公司；通過率約 10–20%。\n・申請程序：先提 Project Pitch，獲邀後送正式提案（NSF 26-510／26-511，2026/6/2 起收件）。\n・STTR 須結合非營利研究機構。\n\n注意：申請主體須為美國中小企業，這也是「赴美佈局」與「補助申請」需要整體規劃的原因。\n\n（資料來源：NSF、seedfund.nsf.gov）"
  },
  {
    id: "s10", cat: "半導體", date: "2026-03-30",
    title: "從 CHIPS 到州補助：台灣半導體供應鏈赴美落地的三層資源",
    summary: "聯邦（CHIPS Office）、州政府（經發局資本補貼／稅收抵免）、地方（園區與公用設施配套）三層資源疊加，決定落地成本的真實水位。",
    body: "台灣半導體與設備供應鏈評估赴美設點時，應以三層架構盤點資源：\n\n1. 聯邦層：CHIPS Office 相關製造綱領、聯邦稅收抵免。\n2. 州層：各州經濟發展局的資本補貼、績效現金與稅收抵免（如加州 CalCompetes 單輪近 1 億美元規模）。\n3. 地方層：園區土地、公用設施、人才培訓配套。\n\n關鍵提醒：州補助多綁定在地就業人數、設備留在州內與存續年限等條件，簽約前的條款設計直接影響未來營運彈性。\n\nGuide.Ferryman 以「政策熟悉度 × 在地資源網絡」協助企業把補助條件轉化為可執行的落地計畫。"
  }
];

/* ---------- 每日熱門動態（各類別；後台可覆寫，未來可接自動更新） ---------- */
const GF_SEED_HOT = {
  "AI":    ["America's AI Action Plan 90 項政策追蹤", "台灣 A+ AI 應用躍昇計畫受理中", "Genesis Mission 平台進度更新"],
  "機器人": ["American Security Robotics Act 委員會審議中", "H.R.7334 機器人委員會人選傳聞", "NSF FRR 全年滾動收件"],
  "半導體": ["晶創台灣 IC 設計攻頂補助核定 11 案", "CHIPS 先進封裝補助新動態", "產創條例智慧機械投資抵減適用中"],
  "無人機": ["TIIP 軍民通用無人機能量籌建", "NDAA 合規供應鏈需求上升", "無人載具沙盒運行驗證開放申請"],
  "其他":  ["臺美創新研發合作（A+ 國合）AI 案加碼 20%", "國際貿易署海外拓銷補助（單家最高 500 萬）", "投資臺灣三大方案園區前 2 年免租金"]
};

/* ---------- 美國各州產業資料（首頁互動地圖） ----------
   fips 對應 us-atlas 州代碼；industries = 重點產業；
   note = 台灣連結重點；已建置 15 州，其餘顯示「資料建置中」。 */
const GF_STATES = {
  "48": { name: "德克薩斯州", en: "Texas", coord: "31.0°N 99.0°W", industries: ["半導體製造（Samsung 泰勒廠、TI）", "能源與資料中心", "航太與無人機測試走廊", "電動車（Tesla）"], note: "無州所得稅、對台招商積極；半導體與資料中心供應鏈落地首選之一。" },
  "06": { name: "加利福尼亞州", en: "California", coord: "36.7°N 119.4°W", industries: ["AI 與軟體（矽谷）", "機器人新創聚落", "半導體設計", "航太（南加州）"], note: "CalCompetes 稅收抵免單輪規模近 1 億美元；AI／機器人新創與創投最密集。" },
  "04": { name: "亞利桑那州", en: "Arizona", coord: "34.0°N 111.1°W", industries: ["先進半導體製造（台積電鳳凰城）", "半導體供應鏈聚落", "航太國防"], note: "台積電效應帶動台灣供應鏈群聚，州府設有專責台灣招商窗口。" },
  "25": { name: "麻薩諸塞州", en: "Massachusetts", coord: "42.4°N 71.4°W", industries: ["機器人研發重鎮（波士頓）", "生技醫療", "AI 學研（MIT、Harvard）"], note: "NSF FRR 機器人補助累計第一州（$15.1M）；MBDP 曾補助 Teradyne 270 萬美元。" },
  "42": { name: "賓夕法尼亞州", en: "Pennsylvania", coord: "41.2°N 77.2°W", industries: ["機器人（匹茲堡 CMU 聚落）", "先進製造", "能源"], note: "NSF FRR 累計第二州（$12.9M）；ARM Institute 總部所在地，州補助綁 5 年存續條件。" },
  "26": { name: "密西根州", en: "Michigan", coord: "44.3°N 85.6°W", industries: ["汽車與自駕載具", "機器人與自動化", "先進製造"], note: "NSF FRR 累計第三州（$12.7M）；M2I2 補助支持製造創新導入。" },
  "36": { name: "紐約州", en: "New York", coord: "43.0°N 75.0°W", industries: ["半導體（GlobalFoundries、Micron 投資）", "金融科技與 AI", "光電"], note: "州層級半導體激勵方案完善，Albany 奈米科技聚落成熟。" },
  "53": { name: "華盛頓州", en: "Washington", coord: "47.4°N 120.7°W", industries: ["雲端與 AI（Microsoft、Amazon）", "航太（Boeing）", "無人機與太空"], note: "雲端資料中心與航太供應鏈需求穩定，適合軟硬整合型台廠。" },
  "13": { name: "喬治亞州", en: "Georgia", coord: "32.6°N 83.4°W", industries: ["電動車與電池（Hyundai、SK）", "物流自動化（亞特蘭大）", "先進製造"], note: "東南部製造回流熱區，物流機器人（AMR）導入需求成長快。" },
  "37": { name: "北卡羅來納州", en: "North Carolina", coord: "35.6°N 79.0°W", industries: ["生技與研究三角園區", "半導體（Wolfspeed SiC）", "航太"], note: "SiC 化合物半導體重鎮，與台灣第三代半導體供應鏈互補。" },
  "47": { name: "田納西州", en: "Tennessee", coord: "35.7°N 86.7°W", industries: ["電動車（Ford BlueOval City）", "先進製造", "物流"], note: "南方汽車帶核心，工資與土地成本相對低。" },
  "39": { name: "俄亥俄州", en: "Ohio", coord: "40.4°N 82.9°W", industries: ["半導體（Intel 新廠計畫）", "航太（NASA Glenn）", "汽車零組件"], note: "Intel 投資帶動中西部半導體走廊，供應鏈缺口即台廠機會。" },
  "35": { name: "新墨西哥州", en: "New Mexico", coord: "34.5°N 106.0°W", industries: ["半導體（Intel Rio Rancho）", "國家實驗室（Sandia、LANL）", "太空與無人機測試"], note: "聯邦實驗室密度高，適合研究型合作與技轉切入。" },
  "32": { name: "內華達州", en: "Nevada", coord: "38.8°N 116.4°W", industries: ["電池與儲能（Tesla Gigafactory）", "資料中心", "無人機物流試點"], note: "稅制友善，物流與儲能供應鏈成長中。" },
  "12": { name: "佛羅里達州", en: "Florida", coord: "27.6°N 81.5°W", industries: ["太空（Cape Canaveral）", "航太與 MRO", "國防電子"], note: "商業太空發射與國防供應鏈聚落，無人機法規測試環境友善。" }
};

/* ============================================================
   資料存取層（未來換成 Supabase 只需改這裡）
   ============================================================ */
function GF_getLocal(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}
function GF_setLocal(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

/* 文章 = 種子 + 後台新增（後台可隱藏種子文章） */
function GF_getArticles() {
  const custom = GF_getLocal("gf_articles", []);
  const hidden = GF_getLocal("gf_hidden_seeds", []);
  const seeds = GF_SEED_ARTICLES.filter(a => !hidden.includes(a.id));
  const overrides = GF_getLocal("gf_seed_overrides", {});
  const merged = seeds.map(a => overrides[a.id] ? Object.assign({}, a, overrides[a.id]) : a);
  return custom.concat(merged).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}
function GF_getHot() {
  return Object.assign({}, GF_SEED_HOT, GF_getLocal("gf_hot", {}));
}

/* ---------- Supabase 雲端讀取（連線失敗時自動退回本地資料） ---------- */
async function GF_fetchArticles() {
  if (typeof GF_SB_ENABLED !== "undefined" && GF_SB_ENABLED) {
    try {
      /* visible=false 的文章不在前台顯示(後台可勾選控制;舊資料 visible 為空值視同顯示) */
      const rows = await gfSbSelect("articles", "&visible=not.is.false&order=date.desc,created_at.desc");
      if (Array.isArray(rows)) return rows;
    } catch (e) { console.warn("Supabase 文章讀取失敗，改用本地資料：", e.message); }
  }
  return GF_getArticles();
}
async function GF_fetchHot() {
  if (typeof GF_SB_ENABLED !== "undefined" && GF_SB_ENABLED) {
    try {
      const rows = await gfSbSelect("hot_topics", "");
      if (Array.isArray(rows) && rows.length) {
        const hot = {};
        rows.forEach(r => { hot[r.cat] = Array.isArray(r.items) ? r.items : []; });
        const hasAny = Object.keys(hot).some(k => hot[k].length);
        if (hasAny) return hot;
      }
    } catch (e) { console.warn("Supabase 熱門動態讀取失敗，改用本地資料：", e.message); }
  }
  return GF_getHot();
}
