/* ============================================================
   Guide.Ferryman — 中英雙語切換模組（i18n overlay, v5.1）
   ------------------------------------------------------------
   設計原則：完全非侵入式。
   ・不改動任何既有功能與資料流；僅在 EN 模式時，
     以「精確字典比對」置換畫面上的文字節點與屬性。
   ・語言選擇存於 localStorage（gf_lang），全站共用。
   ・MutationObserver 監看動態插入內容（導覽列、頁尾、
     彈窗、會員閘門、投資地圖州別面板、補助表格等）。
   ・資料庫內容（文章、熱門動態、各州盤點資料值）維持原文；
     介面框架（欄位標題、按鈕、說明文字）全數翻譯。
   ============================================================ */
(function () {
  "use strict";
  var KEY = "gf_lang";
  function lang() { try { return localStorage.getItem(KEY) === "en" ? "en" : "zh"; } catch (e) { return "zh"; } }
  window.gfLang = lang;
  window.gfSetLang = function (l) { try { localStorage.setItem(KEY, l === "en" ? "en" : "zh"); } catch (e) {} location.reload(); };
  window.gfToggleLang = function (e) { if (e) e.preventDefault(); window.gfSetLang(lang() === "en" ? "zh" : "en"); };

  /* ---------- ① 精確字典（trim 後全字比對） ---------- */
  var D = {
    /* ===== 導覽列 / 頁尾 ===== */
    "首頁": "Home",
    "服務項目": "Services",
    "產業投資地圖": "Investment Map",
    "台美動態資訊": "Taiwan–US Pulse",
    "關於我們": "About Us",
    "📩 加入會員/訂閱電子報": "📩 Join / Subscribe",
    "預約諮詢": "Book a Consultation",
    "⭐ 會員升級": "⭐ Upgrade",
    "🔑 會員登入": "🔑 Member Login",
    "📈 產業趨勢分析": "📈 Industry Trends",
    "🏛 政府補助資源": "🏛 Grant Resources",
    "👤 我的會員資料": "👤 My Account",
    "🚪 會員登出": "🚪 Log Out",
    "產業顧問諮詢工作室。作為企業跨越太平洋的擺渡人，鏈結台灣政府資源與美國在地網絡，陪伴 AI、機器人、半導體、無人機產業做出更好的決策。":
      "An industry advisory studio. As your ferryman across the Pacific, we connect Taiwan government resources with U.S. local networks — helping AI, robotics, semiconductor and drone companies make better decisions.",
    "快速連結": "Quick Links",
    "聯絡我們": "Contact",
    "諮詢表單": "Consultation Form",
    "Email：guide.ferryman@gmail.com": "Email: guide.ferryman@gmail.com",
    "台灣・台北": "Taipei, Taiwan",
    "管理後台": "Admin",

    /* ===== 分類 ===== */
    "機器人": "Robotics",
    "半導體": "Semiconductors",
    "無人機": "Drones",
    "其他": "Other",
    "全部": "All",
    "台灣": "Taiwan",
    "美國": "United States",

    /* ===== 首頁 Hero ===== */
    "跨越太平洋的": "Your Trans-Pacific",
    "產業": "Industry ",
    "擺渡人": "Ferryman",
    "我們專注 AI、機器人、半導體與無人機四大領域，以深度產業研究為底，鏈結台灣政府資源與美國在地網絡——從趨勢判讀、赴美落地到補助申請，陪企業把每一步走穩。":
      "We focus on four domains — AI, robotics, semiconductors and drones — grounded in deep industry research, connecting Taiwan government resources with on-the-ground U.S. networks. From trend analysis and U.S. market entry to grant applications, we walk every step with you.",
    "📩 訂閱電子報": "📩 Subscribe",
    "閱讀產業洞察": "Read Our Insights",
    "台北 Taipei": "Taipei",
    "產業趨勢": "Trends",
    "赴美佈局": "US Entry",
    "產值評估": "Valuation",
    "政府補助陪跑": "Grant Coaching",

    /* ===== 首頁四大服務 ===== */
    "SERVICES · 四大核心服務": "SERVICES · FOUR CORE SERVICES",
    "從看清趨勢，到真正落地": "From Reading Trends to Landing on the Ground",
    "四項服務彼此串聯：以研究判讀方向、以評估建立底氣、以佈局與補助把策略化為行動。":
      "Our four services interlock: research sets the direction, valuation builds confidence, and expansion plus grants turn strategy into action.",
    "產業趨勢分析": "Industry Trend Analysis",
    "AI、機器人、半導體、無人機四大領域的洞察專欄與客製研究，定期發布高質量產業短評。":
      "Insights columns and custom research across AI, robotics, semiconductors and drones, with regular high-quality industry briefs.",
    "了解更多 →": "Learn more →",
    "企業／產業赴美佈局": "U.S. Market Expansion",
    "熟悉 SelectUSA、CHIPS Act 等法規與投資政策，整合台灣政策資源與跨國在地網絡，化解落地資訊不對稱。":
      "Fluent in SelectUSA, the CHIPS Act and state incentives, we integrate Taiwan policy resources with cross-border local networks to close the information gap of landing in the U.S.",
    "企業／產業產值評估": "Industry & Output Valuation",
    "以透明方法論與數據模型產出具公信力的評估報告，支撐籌資、併購與策略擬定。":
      "Credible valuation reports built on transparent methodology and data models — supporting fundraising, M&A and strategy.",
    "台灣政府補助申請陪跑": "Taiwan Government Grant Coaching",
    "A+、SBIR、CITD、SIIR、TIIP 等計畫的題目設計、計畫書撰寫與審查答詢，全程陪跑。":
      "End-to-end coaching for A+, SBIR, CITD, SIIR and TIIP — topic design, proposal writing and review defense.",

    /* ===== 首頁互動地圖 ===== */
    "INTERACTIVE MAP · 美洲產業地圖": "INTERACTIVE MAP · U.S. INDUSTRY MAP",
    "把游標移到任何一州，看見它的產業輪廓": "Hover Over Any State to See Its Industry Profile",
    "美國 50 州基本產業盤點已全數完成。點擊州別或使用下拉選單，即可查看該州重點產業與台灣供應鏈的連結切點；完整版投資情報請見「美洲產業投資地圖」。":
      "Baseline industry mapping of all 50 U.S. states is complete. Click a state or use the dropdown to see its key industries and Taiwan supply-chain linkages; see the full Investment Map for complete intelligence.",
    "或直接選擇州別": "Or select a state",
    "選擇一州開始探索": "Select a state to explore",
    "滑鼠移動到地圖上可預覽各州重點產業；點擊後在此顯示完整資訊，包含該州產業結構與台灣廠商的切入建議。":
      "Hover over the map to preview each state's key industries; click to display full details here, including industry structure and entry suggestions for Taiwanese companies.",
    "前往完整版：美洲產業投資地圖（50 州）→": "Go to the full version: U.S. Investment Map (50 states) →",
    "— 選擇想了解的州 —": "— Select a state —",
    "— 選擇想了解的州（共 50 州） —": "— Select a state (50 states) —",
    "台灣連結重點": "Taiwan Linkage",
    "該州": "This state",
    "Guide.Ferryman 已完成美國 50 州的基本產業盤點。此州的完整投資情報，請至":
      "Guide.Ferryman has completed baseline industry mapping for all 50 states. For this state's full investment intelligence, visit the ",
    "美洲產業投資地圖": "U.S. Investment Map",
    "查看；若您有特定州的佈局需求，歡迎": "; if you have expansion plans in a specific state, feel free to ",
    "。": ".",
    "地圖元件載入失敗。": "Map components failed to load.",
    "地圖資料載入失敗。": "Map data failed to load.",
    "請改用右側選單選擇州別。": "Please use the dropdown on the right instead.",
    "美國各州互動產業地圖": "Interactive US state industry map",

    /* ===== 首頁動態精選 / 會員 CTA ===== */
    "TAIWAN–US PULSE · 台美動態資訊": "TAIWAN–US PULSE",
    "最新產業動態": "Latest Industry Updates",
    "追蹤台灣與美國在 AI、機器人、半導體、無人機領域的政策與市場動態。":
      "Tracking policy and market developments in AI, robotics, semiconductors and drones across Taiwan and the U.S.",
    "今日熱門動態": "Today's Hot Topics",
    "查看全部動態 →": "View all updates →",
    "閱讀全文 →": "Read more →",
    "閱讀原文 →": "Read the original →",
    "對台灣產業意涵": "Implications for Taiwan",
    "此分類目前尚無文章，敬請期待。": "No articles in this category yet — stay tuned.",
    "MEMBERSHIP · 會員與電子報": "MEMBERSHIP & NEWSLETTER",
    "每週一封，掌握台美產業脈動": "One Email a Week on the Taiwan–US Industry Pulse",
    "免費加入會員，優先收到每週產業動態電子報。訂閱制深度內容（分級研究報告、政策解讀）即將上線。":
      "Join free to receive our weekly industry newsletter first. Tiered premium content (research reports and policy analysis) is coming soon.",
    "免費加入會員": "Join Free",
    "已是會員？電子報將寄送至您的信箱": "Already a member? The newsletter will arrive in your inbox.",

    /* ===== 服務項目頁 ===== */
    "選擇您想了解的服務，查看內容範疇、方法與合作方式。": "Choose a service to see its scope, methodology and engagement model.",
    "① 產業趨勢分析": "① Trend Analysis",
    "② 企業／產業赴美佈局": "② U.S. Expansion",
    "③ 產值評估": "③ Valuation",
    "④ 政府補助申請陪跑": "④ Grant Coaching",
    "以「洞察專欄（Insights）」為核心，定期發布 AI、機器人、半導體、無人機四大領域的高質量產業短評，並提供客製化的深度研究。我們的研究鏈結工研院產科國際所等智庫脈絡，兼顧技術演進與政策動向兩條軸線。":
      "Built around our Insights column, we publish regular high-quality briefs across AI, robotics, semiconductors and drones, plus customized in-depth research. Our work draws on think-tank networks such as ITRI's ISTI, covering both technology evolution and policy trajectories.",
    "洞察專欄": "Insights Column",
    "定期產業短評，追蹤台美兩地的政策、技術與市場訊號，免費會員可透過電子報接收。":
      "Regular industry briefs tracking policy, technology and market signals in Taiwan and the U.S., delivered to free members by newsletter.",
    "客製產業研究": "Custom Research",
    "依企業需求進行專題研究：技術路線圖、競爭者分析、供應鏈盤點、政策影響評估。":
      "Bespoke studies to your needs: technology roadmaps, competitor analysis, supply-chain mapping, policy impact assessment.",
    "四大關注領域": "Four Focus Domains",
    "AI（模型、應用與晶片）": "AI (models, applications, chips)",
    "機器人（人形、AMR、零組件）": "Robotics (humanoids, AMR, components)",
    "半導體（先進製程與封裝）": "Semiconductors (advanced nodes & packaging)",
    "無人機（軍民通用供應鏈）": "Drones (dual-use supply chain)",
    "前往洞察專欄 →": "Go to Insights →",
    "企業海外落地最大的成本是「資訊不對稱」。我們同時掌握": "The biggest cost of going overseas is information asymmetry. We command both ",
    "台灣在地政府政策資源": "Taiwan government policy resources",
    "與": " and ",
    "美國跨國在地資源": "U.S. on-the-ground networks",
    "，熟悉 SelectUSA、CHIPS Act、NSF 補助體系與各州招商激勵方案，協助企業把落地的每個決策建立在完整資訊之上。":
      " — with fluency in SelectUSA, the CHIPS Act, NSF funding and state incentive programs, so every landing decision rests on complete information.",
    "聯邦層資源": "Federal Resources",
    "SelectUSA 投資促進機制": "SelectUSA investment promotion",
    "CHIPS Act 與製造綱領": "CHIPS Act & manufacturing initiatives",
    "ARM Institute 會員網絡": "ARM Institute membership network",
    "州層資源": "State Resources",
    "州經發局資本補貼與稅收抵免": "State EDO capital subsidies & tax credits",
    "MBDP、M2I2、CalCompetes 等案例": "Cases: MBDP, M2I2, CalCompetes",
    "條款設計：就業綁定、存續年限": "Term design: job commitments, retention periods",
    "台灣端配套": "Taiwan-Side Complements",
    "臺美創新研發合作（AI 案最高補助 70%）": "Taiwan–US R&D cooperation (up to 70% funding for AI projects)",
    "國際貿易署海外拓銷與參展補助": "TITA overseas marketing & trade-show subsidies",
    "投資臺灣三大方案回程規劃": "Invest-in-Taiwan reshoring programs",
    "市場與選址評估": "Market & Site Assessment",
    "——以美洲產業地圖為底，比較各州產業聚落、成本與激勵條件。": " — using our Investment Map to compare state clusters, costs and incentives.",
    "資源與補助盤點": "Resource & Grant Mapping",
    "——聯邦、州、地方三層資源疊加試算，估出真實落地成本。": " — stacking federal, state and local resources to estimate your true landing cost.",
    "落地執行陪同": "Execution Support",
    "——公司設立、招商窗口對接、供應鏈與人才在地網絡鏈結。": " — entity setup, EDO liaison, and local supply-chain and talent networks.",
    "雙邊金流整合": "Two-Sided Funding Integration",
    "——同步規劃台灣端補助（如 A+ 國合），讓佈局資金效率最大化。": " — planning Taiwan-side grants (e.g., A+ international cooperation) in parallel to maximize capital efficiency.",
    "評估報告的價值在於「可被檢驗」。我們公開方法論（Methodology）與數據模型邏輯，讓每一份產值評估報告都能支撐籌資、併購或策略擬定時的關鍵對話。":
      "A valuation report is only as good as its verifiability. We disclose our methodology and model logic, so every report can anchor critical conversations in fundraising, M&A or strategy.",
    "方法論框架": "Methodology Framework",
    "由上而下：總體市場規模（TAM/SAM/SOM）推估": "Top-down: TAM/SAM/SOM market sizing",
    "由下而上：產能、單價與滲透率模型": "Bottom-up: capacity, pricing and penetration models",
    "交叉驗證：政策情境與供應鏈約束調整": "Cross-validation: policy scenarios and supply-chain constraints",
    "資料基礎": "Data Foundation",
    "官方統計與海關貿易資料": "Official statistics and customs trade data",
    "智庫與產業研究資料庫": "Think-tank and industry research databases",
    "第一線訪談與供應鏈驗證": "First-hand interviews and supply-chain verification",
    "應用場景": "Use Cases",
    "募資簡報與投資人盡職調查": "Fundraising decks and investor due diligence",
    "併購標的價值評估": "M&A target valuation",
    "新事業與新產線策略擬定": "New business and production-line strategy",
    "台灣針對 AI 與機器人產業的補助資源龐大而分散。我們持續維護補助地圖，從計畫選擇、題目設計、計畫書撰寫到審查答詢全程陪跑，讓補助成為研發策略的一部分，而不是行政負擔。":
      "Taiwan's grant resources for AI and robotics are vast but fragmented. We maintain a living grant map and coach you end-to-end — program selection, topic design, proposal writing and review defense — so grants become part of your R&D strategy, not an administrative burden.",
    "五大旗艦計畫": "Five Flagship Programs",
    "A+ 企業創新研發淬鍊（前瞻補助 40–50%；AI 應用躍昇每案上限 2,000 萬）": "A+ Industrial Innovation R&D (40–50% for frontier tech; AI Application up to NT$20M per case)",
    "SBIR 小型企業創新研發（個案 150–600 萬）": "SBIR Small Business Innovation (NT$1.5–6M per case)",
    "CITD 傳統產業技術開發（個案約 200 萬）": "CITD Traditional Industry Tech Development (~NT$2M per case)",
    "SIIR 服務業創新研發（國際化進階最高 1,200 萬）": "SIIR Service Industry Innovation (up to NT$12M for internationalization)",
    "SITI 臺北市產業獎勵（投資獎勵最高 5,000 萬）": "SITI Taipei City Industry Incentives (investment awards up to NT$50M)",
    "主題式與租稅工具": "Thematic & Tax Tools",
    "TIIP 機器人產業零組件發展應用": "TIIP Robotics Components Development",
    "TIIP 軍民通用無人機能量籌建": "TIIP Dual-Use Drone Capacity Building",
    "產創條例 10 之 1／10 之 2 投資抵減": "Statute for Industrial Innovation Art. 10-1/10-2 tax credits",
    "產業競爭力輔導團 AI 數位轉型": "Industrial Competitiveness Task Force: AI transformation",
    "陪跑內容": "What Coaching Includes",
    "補助適配診斷與計畫組合策略": "Grant-fit diagnosis and program portfolio strategy",
    "計畫書架構與撰寫輔導": "Proposal structuring and writing guidance",
    "審查會答詢演練": "Review committee Q&A rehearsal",
    "核定後執行與查核期陪同": "Post-award execution and audit support",
    "免費初診": "Free Initial Consult",
    "——30 分鐘了解研發題目與公司條件，判斷適合的計畫入口。": " — 30 minutes to understand your R&D topic and company profile, identifying the right program entry.",
    "策略設計": "Strategy Design",
    "——題目定位、金額級距與跨計畫組合規劃。": " — topic positioning, funding tiers and cross-program portfolio planning.",
    "撰寫與送件": "Writing & Submission",
    "——計畫書共筆、預算編列與行政文件備齊。": " — co-writing the proposal, budgeting and preparing administrative documents.",
    "審查與執行": "Review & Execution",
    "——答詢演練、核定後查核陪跑。": " — Q&A rehearsal and post-award audit support.",
    "與我們聊聊您的需求 →": "Tell us what you need →",

    /* ===== 關於我們 ===== */
    "關於 Guide.Ferryman": "About Guide.Ferryman",
    "Guide，是方向；Ferryman，是把人安全送到對岸的人。": "Guide means direction; a Ferryman carries you safely to the other shore.",
    "OUR MISSION · 成立宗旨": "OUR MISSION",
    "做企業跨越太平洋時，": "The most reliable ferryman",
    "最可靠的那位擺渡人": "for your crossing of the Pacific",
    "看得懂趨勢的人很多，": "Many can read the trends;",
    "能陪你把趨勢走成生意的人很少。": "few can walk them into business with you.",
    "Guide.Ferryman Strategic Advisory 是一間產業顧問諮詢工作室。我們相信，台灣企業在 AI、機器人、半導體與無人機的全球賽局中，缺的從來不是實力，而是":
      "Guide.Ferryman Strategic Advisory is an industry advisory studio. We believe that in the global race across AI, robotics, semiconductors and drones, what Taiwanese companies lack has never been capability — it is ",
    "對的資訊、對的資源、對的引路人": "the right information, the right resources, and the right guide",
    "工作室創辦人為長期研究台美產業趨勢與技術發展的產業分析師，深耕工研院產業科技國際策略發展所（產科國際所）的研究脈絡，專注於協助台灣企業有效鏈結美國供應鏈，並結合工研院各所中心的技術能量，做出前瞻的趨勢觀測與產業分析。":
      "Our founder is an industry analyst with long experience in Taiwan–US industry trends and technology development, rooted in the research tradition of ITRI's Industry, Science and Technology International Strategy Center (ISTI). We focus on connecting Taiwanese companies to U.S. supply chains, combining ITRI's technology capacity to deliver forward-looking trend observation and industry analysis.",
    "我們的角色是一座橋：一端鏈結": "Our role is a bridge: one end connects ",
    "台灣政府資源": "Taiwan government resources",
    "——從 A+、SBIR 到 TIIP 的完整補助地圖；另一端鏈結": " — a complete grant map from A+ and SBIR to TIIP; the other end connects ",
    "美國在地網絡": "U.S. local networks",
    "——從 SelectUSA、CHIPS Act 到各州招商激勵的落地實務。企業不必自己在資訊迷霧中摸索，我們把航道畫好。":
      " — landing practice from SelectUSA and the CHIPS Act to state incentives. You don't have to grope through the fog; we chart the course.",
    "🧭 研究為底": "🧭 Research First",
    "每一項建議都有產業研究與數據模型支撐，方法論公開透明。": "Every recommendation is backed by industry research and data models, with transparent methodology.",
    "🌉 雙邊橋樑": "🌉 A Two-Sided Bridge",
    "同時熟悉台灣補助體系與美國聯邦／州層資源，是少數能做「雙邊整合」的顧問團隊。":
      "One of the few advisory teams fluent in both Taiwan's grant system and U.S. federal/state resources — able to integrate both sides.",
    "🤝 全程陪跑": "🤝 End-to-End Coaching",
    "不只給報告——從策略設計、文件撰寫到審查答詢與落地執行，走到成果出現為止。":
      "Not just reports — from strategy design and document writing to review defense and execution, until results appear.",
    "🔬 智庫鏈結": "🔬 Think-Tank Linkage",
    "鏈結工研院各所中心技術能量與產科國際所研究脈絡，掌握第一手技術與政策動向。":
      "Connected to ITRI's technology capacity and ISTI's research network, with first-hand insight into technology and policy.",
    "WHO WE SERVE · 服務對象": "WHO WE SERVE",
    "我們陪伴這些企業": "The Companies We Walk With",
    "成長期科技企業": "Scale-Up Tech Companies",
    "需要以補助放大研發資源、以研究支撐募資故事的 AI／機器人／半導體企業。":
      "AI/robotics/semiconductor companies leveraging grants to amplify R&D and research to back their fundraising story.",
    "零組件與傳產升級廠": "Component & Upgrading Manufacturers",
    "減速器、馬達、機構件等機器人零組件廠，尋求製程升級與切入國際供應鏈。":
      "Makers of reducers, motors and mechanical parts seeking process upgrades and entry into global supply chains.",
    "規劃赴美的企業": "Companies Going to the U.S.",
    "評估在美設廠、設點或合資，需要選址、補助與法規的完整落地方案。":
      "Evaluating U.S. plants, offices or JVs — needing a complete landing plan for site selection, incentives and compliance.",
    "深科技新創": "Deep-Tech Startups",
    "以 SBIR（台灣／美國 NSF）為槓桿，把技術推向市場的早期團隊。":
      "Early teams leveraging SBIR (Taiwan / U.S. NSF) to push technology to market.",
    "預約 30 分鐘免費初談 →": "Book a free 30-minute intro call →",

    /* ===== 預約諮詢 ===== */
    "留下您的需求與期望時間，我們確認排程後將以 Email 回覆確認信與正式諮詢時間。":
      "Tell us your needs and preferred time. Once scheduled, we'll email you a confirmation with the official consultation time.",
    "姓名": "Name",
    "公司／單位": "Company / Organization",
    "想諮詢的服務": "Service of interest",
    "請選擇": "Please select",
    "需求說明": "Describe your needs",
    "請簡述您的產業、目前面臨的問題或想達成的目標": "Briefly describe your industry, current challenges or goals",
    "期望諮詢日期": "Preferred date",
    "期望時段": "Preferred time slot",
    "不指定": "No preference",
    "上午（09:00–12:00）": "Morning (09:00–12:00)",
    "下午（13:30–17:30）": "Afternoon (13:30–17:30)",
    "晚間（19:00–21:00）": "Evening (19:00–21:00)",
    "送出後流程：① 系統將您的需求送達管理後台並以 Email 通知我們 → ② 我們於後台確認排程並同步至 Google 日曆 → ③ 您將收到確認信，載明正式諮詢時間。":
      "After you submit: ① your request reaches our admin console and notifies us by email → ② we confirm the schedule and sync it to Google Calendar → ③ you receive a confirmation email with the official time.",
    "✅ 已收到您的諮詢需求！我們將盡快確認排程，並以 Email 回覆確認信與正式諮詢時間。":
      "✅ We've received your request! We'll confirm the schedule shortly and email you the confirmation with the official consultation time.",
    "送出諮詢需求": "Submit Request",
    "※ 您的資料僅用於本次諮詢排程，不會作其他用途。": "※ Your information is used only to schedule this consultation.",

    /* ===== 台美動態資訊頁 ===== */
    "追蹤台灣與美國在 AI、機器人、半導體、無人機領域的政策、補助與市場動態。加入會員即可每週收到精選電子報。":
      "Tracking policy, grants and market developments in AI, robotics, semiconductors and drones across Taiwan and the U.S. Join to receive our weekly digest.",
    "想每週收到這些整理？": "Want this digest every week?",
    "免費加入會員訂閱電子報": "Join free & subscribe",

    /* ===== 投資地圖頁 ===== */
    "INVESTMENT MAP · 美洲產業投資地圖": "INVESTMENT MAP",
    "美國 50 州產業投資盤點": "US State-by-State Investment Atlas",
    "整合美國 50 州的重點產業、官方招商機構（EDO）、代表性政策補助、稅制條件與台灣鏈結重點。把游標移到任何一州即可預覽；點擊州別或使用下拉選單，查看完整投資情報。":
      "Integrating each state's key industries, official economic development organizations (EDOs), signature incentives, tax conditions and Taiwan linkages. Hover any state to preview; click or use the dropdown for the full profile.",
    "直接選擇州別": "Select a state",
    "HOVER：預覽 ｜ CLICK：完整資訊": "HOVER: preview | CLICK: full profile",
    "選擇一州，展開完整投資情報": "Select a state to open its full investment profile",
    "點擊上方地圖任一州（或使用下拉選單），此處將顯示該州的重點產業、代表性公司、招商機構、政策補助、稅率條件與台灣鏈結重點。":
      "Click any state above (or use the dropdown) to display its key industries, anchor companies, EDOs, incentives, tax conditions and Taiwan linkages.",
    "想評估特定州的落地方案？": "Evaluating a landing plan in a specific state?",
    "各州補助多綁定在地就業、設備存續年限等條件。Guide.Ferryman 以「政策熟悉度 × 在地資源網絡」協助您把州級補助條件轉化為可執行的落地計畫。":
      "State incentives are usually tied to local jobs and equipment retention periods. Guide.Ferryman combines policy fluency with local networks to turn state incentive terms into an executable landing plan.",
    "預約諮詢 →": "Book a Consultation →",
    "重點產業 KEY INDUSTRIES": "KEY INDUSTRIES",
    "代表性公司 ANCHOR COMPANIES": "ANCHOR COMPANIES",
    "與台灣有關之代表企業 TAIWAN-LINKED COMPANIES": "TAIWAN-LINKED COMPANIES",
    "官方招商機構 EDO": "EDO",
    "代表性政策／補助 POLICY & INCENTIVES": "POLICY & INCENTIVES",
    "招商特點（聚落／資源／稅收） LOCATION ADVANTAGES": "LOCATION ADVANTAGES",
    "稅率（企業所得稅／銷售稅） TAX": "TAX (CIT / SALES)",
    "台灣鏈結重點 TAIWAN LINKAGE FOCUS": "TAIWAN LINKAGE FOCUS",
    "重點產業": "Key industries",
    "台灣鏈結": "Taiwan linkage",
    "查無公開來源，待查證——Guide.Ferryman 將於後續盤點更新。":
      "No verified public source yet — pending verification; Guide.Ferryman will update in future reviews.",

    /* ===== 會員專區：趨勢頁 ===== */
    "MEMBERS ONLY · 會員專區": "MEMBERS ONLY",
    "每週更新的台美產業趨勢與政策解讀，聚焦 AI、機器人、半導體、無人機。":
      "Weekly Taiwan–US industry trends and policy analysis, focused on AI, robotics, semiconductors and drones.",
    "📈 每週產業趨勢分析": "📈 Weekly Industry Trends",
    "🏛 政策趨勢分析": "🏛 Policy Trend Analysis",
    "白銀+": "Silver+",
    "黃金": "Gold",
    "全部地區": "All regions",
    "🇹🇼 台灣": "🇹🇼 Taiwan",
    "🇺🇸 美國": "🇺🇸 United States",
    "載入中…": "Loading…",
    "此分類目前尚無文章，將於每週更新後上架。": "No articles in this category yet — new pieces are published weekly.",
    "黃金限定": "Gold only",

    /* ===== 台美電力資源藍圖（Power Atlas，黃金會員限定） ===== */
    "台美電力資源藍圖": "TW–US Power Atlas",
    "POWER ATLAS · 進階研究工具": "POWER ATLAS · ADVANCED RESEARCH TOOL",
    "🥇 黃金會員限定": "🥇 Gold members only",
    "AI 資料中心、半導體廠與機器人產線的選址，最終都會回到「電從哪裡來」。": "For AI data centers, fabs and robotics production lines, site selection ultimately comes down to one question: where does the power come from?",
    "盤點台灣與美國各州的電力供給結構、電網與能源政策動向，協助您在赴美佈局評估中，把電力成本與供電穩定性一併納入決策。": "maps the power supply mix, grid conditions and energy policy trends across Taiwan and the U.S. states — so electricity cost and reliability become part of your U.S. expansion decisions.",
    "本工具為": "This tool is a",
    "專屬研究資源；尚未達等級的訪客，點選後將顯示會員方案說明，或可直接": "exclusive research resource. Visitors below this tier will see the membership plans, or you can",
    "，由顧問為您導讀。": "for a guided walkthrough with our advisors.",
    "開啟 台美電力資源藍圖 →": "Open the TW–US Power Atlas →",
    "已是黃金會員？登入解鎖": "Already a Gold member? Log in to unlock",

    /* ===== 會員專區：補助資源頁 ===== */
    "MEMBERS ONLY · 黃金會員限定": "MEMBERS ONLY · GOLD TIER",
    "政府補助資源": "Government Grant Resources",
    "台灣與美國的機器人／AI 產業補助全景，由 Guide.Ferryman 持續更新維護。":
      "A complete panorama of robotics/AI grants in Taiwan and the U.S., continuously maintained by Guide.Ferryman.",
    "🇹🇼 台灣政府補助資源": "🇹🇼 Taiwan Government Grants",
    "🇺🇸 美國政府補助資源": "🇺🇸 U.S. Government Grants",
    "UPDATES · 最新補助情報": "UPDATES · LATEST GRANT INTEL",
    "補助快訊與申請提醒": "Grant Alerts & Application Reminders",
    "資料來源：《台灣 AI 機器人相關政府補助總表》（2026/6）；工研院產科國際所整理。":
      "Source: Taiwan AI & Robotics Government Grants Master Table (June 2026); compiled by ITRI ISTI.",
    "資料來源：工研院產科國際所；NSF（seedfund.nsf.gov）。": "Sources: ITRI ISTI; NSF (seedfund.nsf.gov).",
    "目前以上方彙整表為主；補助快訊將於後台「進階內容管理」陸續上架。":
      "The summary tables above are the primary reference for now; grant alerts will be published progressively.",

    /* --- 台灣補助表格 --- */
    "五大旗艦計畫：機器人企業最核心的研發補助入口": "Five Flagship Programs: The Core R&D Grant Entry Points for Robotics Companies",
    "計畫（主管機關）": "Program (Agency)",
    "補助金額／級距": "Funding / Tiers",
    "機器人切點與適用對象": "Robotics Angle & Eligibility",
    "A+ 企業創新研發淬鍊": "A+ Industrial Innovation R&D Program",
    "產業技術司": "Dept. of Industrial Technology (DoIT)",
    "前瞻技術補助 40–50%；AI 應用躍昇每案上限 2,000 萬": "Frontier tech: 40–50% funding; AI Application Advancement: up to NT$20M per case",
    "感知／控制／AI 模型、人形機器人零組件；國內企業可聯合或結合研究機構，非陸資、淨值為正。":
      "Perception/control/AI models, humanoid components; domestic companies may apply jointly or with research institutes; non-PRC capital, positive net worth.",
    "SBIR 小型企業創新研發": "SBIR Small Business Innovation Research",
    "中小及新創企業署": "SME & Startup Administration (SMESA)",
    "個案 150–600 萬；跨域聯盟另計": "NT$1.5–6M per case; cross-domain alliances assessed separately",
    "新創與中小企業切入主力；115 跨域主軸含「AI 智慧應用／無人載具／淨零」三選一。":
      "The main entry for startups and SMEs; FY115 cross-domain themes: choose one of AI applications / unmanned vehicles / net zero.",
    "CITD 協助傳統產業技術開發": "CITD Traditional Industry Technology Development",
    "產業發展署": "Industrial Development Administration (IDA)",
    "個案約 200 萬；聯盟可達千萬級": "~NT$2M per case; alliances up to tens of millions",
    "對接機器人零組件傳產廠（減速器、馬達、機構件）製程／材料／新產品升級。":
      "For traditional robotics component makers (reducers, motors, mechanical parts): process/material/new-product upgrades.",
    "SIIR 服務業創新研發": "SIIR Service Industry Innovation Research",
    "商業發展署": "Administration of Commerce",
    "個別 150 萬／合作 500 萬；國際化進階最高 1,200 萬": "NT$1.5M individual / NT$5M joint; up to NT$12M for internationalization",
    "服務型機器人導入餐飲、零售、長照等場域，結合商模創新。":
      "Service robots deployed in F&B, retail and long-term care, combined with business-model innovation.",
    "SITI 臺北市產業發展獎勵": "SITI Taipei City Industry Development Incentives",
    "臺北市產業發展局": "Taipei City Dept. of Economic Development",
    "研發 500 萬／創業 100 萬；投資獎勵最高 5,000 萬": "R&D NT$5M / startup NT$1M; investment awards up to NT$50M",
    "設籍臺北市企業之 AI／機器人研發或創業，須與臺北市場景連結。":
      "AI/robotics R&D or startups registered in Taipei, linked to Taipei use scenarios.",
    "經濟部產業技術司：A+ 體系、業界科專與無人載具": "MOEA DoIT: The A+ Family, Industrial Tech Programs & Unmanned Vehicles",
    "計畫名稱": "Program",
    "補助金額／條件": "Funding / Conditions",
    "內容說明": "Description",
    "A+ 前瞻技術研發計畫": "A+ Frontier Technology R&D",
    "補助比例 40% 以上、最高 50%；隨到隨審": "40%+ funding, up to 50%; rolling review",
    "機器人關鍵技術（感知、控制、AI 模型）前瞻研發主入口。": "Main entry for frontier R&D in key robotics technologies (perception, control, AI models).",
    "A+ AI 應用躍昇計畫": "A+ AI Application Advancement",
    "應用端每案上限 2,000 萬；期程 ≤3 年；聚焦八大關鍵產業": "Up to NT$20M per application case; ≤3 years; eight key industries",
    "建 AI 示範場域，導入機器人智慧應用驗證。": "Build AI demonstration fields and validate intelligent robotics applications.",
    "業界科專－無人機關鍵技術／AI 影像晶片": "Industrial Tech Program: Drone Key Tech / AI Vision Chips",
    "依提案審定；整機、飛導控、酬載、通訊、動力模組業者": "Case-by-case; for makers of complete drones, flight control, payloads, communications and power modules",
    "無人機（空中機器人）關鍵零組件與 AI 影像晶片模組開發。": "Development of key drone (aerial robotics) components and AI vision chip modules.",
    "無人載具科技創新應用－運行驗證": "Unmanned Vehicle Innovation: Operational Validation",
    "依提案審定；產學研於特定場域創新實驗": "Case-by-case; industry-academia experiments in designated fields",
    "自駕車／AMR 等無人載具之沙盒運行與場域驗證補助。": "Sandbox operation and field validation grants for autonomous vehicles/AMRs.",
    "A+ 全球研發創新夥伴計畫": "A+ Global R&D Innovation Partner Program",
    "依辦法；吸引外商在台設研發中心": "Per regulations; attracting foreign R&D centers to Taiwan",
    "引進國際大廠機器人／AI 研發能量，鏈結本土供應鏈。": "Bringing in global players' robotics/AI R&D capacity and linking it to local supply chains.",
    "晶創台灣－IC 設計攻頂補助": "Chip-Innovation Taiwan: IC Design Summit Grants",
    "114 年核定 11 案共 57 億；晶創 10 年挹注 3,000 億": "FY114: 11 cases approved, NT$5.7B total; NT$300B over 10 years",
    "機器人邊緣 AI 晶片／控制 SoC 之上游 IC 設計能量。": "Upstream IC design capacity for robotics edge-AI chips and control SoCs.",
    "中小及新創企業署＋商業發展署：新創研發與服務業導入": "SMESA + Administration of Commerce: Startup R&D & Service Adoption",
    "計畫名稱（機關）": "Program (Agency)",
    "SBIR 跨域研發引領升級轉型": "SBIR Cross-Domain R&D for Upgrade & Transformation",
    "聯盟型依公告；115 主軸 AI 智慧應用／無人載具／淨零三選一": "Alliance-based per announcements; FY115 themes: AI applications / unmanned vehicles / net zero",
    "中小／新創籌組跨域聯盟切入 AI 機器人系統整合。": "SMEs/startups form cross-domain alliances for AI-robotics system integration.",
    "個案 150–600 萬；資本額 ≤1 億或員工 <200，非陸資": "NT$1.5–6M per case; capital ≤NT$100M or <200 employees; non-PRC capital",
    "機器人新創自主研發主力工具。": "The primary tool for robotics startups' independent R&D.",
    "中小型製造業 AI 工具庫補助": "SME Manufacturing AI Toolkit Subsidy",
    "補助點數制": "Point-based subsidy",
    "協助中小製造業低門檻導入 AI／機器人工具。": "Low-barrier AI/robotics tool adoption for SME manufacturers.",
    "個別 150 萬／合作 500 萬／國際化進階 ≤1,200 萬": "NT$1.5M individual / NT$5M joint / ≤NT$12M internationalization",
    "服務型機器人導入餐飲、零售、長照之商模創新。": "Business-model innovation for service robots in F&B, retail and long-term care.",
    "產業發展署：主題式（TIIP）、研發轉型與租稅抵減": "IDA: Thematic Programs (TIIP), R&D Transformation & Tax Credits",
    "TIIP－機器人產業零組件發展應用": "TIIP: Robotics Industry Components Development & Application",
    "總經費 50% 上限；零組件商／整機廠／設計整合商，非陸資": "Up to 50% of total budget; component makers/OEMs/design integrators; non-PRC capital",
    "最直接點名「機器人零組件」之主題式計畫，中心廠帶衛星廠。": "The thematic program that most directly names 'robotics components' — anchor firms leading satellite suppliers.",
    "TIIP－軍民通用無人機能量籌建": "TIIP: Dual-Use Drone Capacity Building",
    "依提案審定；無人機供應鏈業者": "Case-by-case; drone supply-chain companies",
    "建構國產無人機（空中機器人）供應鏈量能。": "Building domestic drone (aerial robotics) supply-chain capacity.",
    "TIIP 四大常態（高值／優化／育成／主題）": "TIIP Four Regular Tracks (High-Value / Optimization / Incubation / Thematic)",
    "總經費 50% 上限": "Up to 50% of total budget",
    "製造業關鍵技術與新產品開發之常態研發補助。": "Regular R&D grants for key manufacturing technologies and new product development.",
    "提升產業競爭力－研發轉型支持（產業聯盟）": "Industrial Competitiveness: R&D Transformation Support (Industry Alliances)",
    "補助比例 ≤ 全案 50%；因應美國關稅之產業聯盟": "≤50% of total; industry alliances responding to U.S. tariffs",
    "受美關稅影響製造業多元跨域合作，發展先進製造／半導體應用。": "Cross-domain cooperation for tariff-affected manufacturers, developing advanced manufacturing/semiconductor applications.",
    "產業競爭力輔導團（AI 數位轉型）": "Industrial Competitiveness Task Force (AI Digital Transformation)",
    "每家最高 42 萬（購 AI 工具＋課程）；後續另有 500 萬、4,000 萬": "Up to NT$420K per company (AI tools + training); follow-on tiers of NT$5M and NT$40M",
    "協助製造業以小額起步導入 AI／機器人。": "Helping manufacturers start small with AI/robotics adoption.",
    "產創條例第 10 之 1／第 10 之 2 租稅抵減": "Statute for Industrial Innovation Art. 10-1 / 10-2 Tax Credits",
    "智慧機械/5G/資安/AI 抵減 5% 或 3%；前瞻設備研發 5%、設備 3%": "Smart machinery/5G/cybersecurity/AI: 5% or 3% credit; frontier R&D 5%, equipment 3%",
    "購置智慧機械／AI 設備與前瞻研發之投資抵減。": "Investment credits for smart machinery/AI equipment purchases and frontier R&D.",
    "海外拓銷、投資促進與國際研發合作（鏈結美國）": "Overseas Marketing, Investment Promotion & International R&D Cooperation (Linking the U.S.)",
    "臺美創新研發合作": "Taiwan–US Innovative R&D Cooperation",
    "產業技術司（A+ 國合）": "DoIT (A+ International Cooperation)",
    "臺方總經費 ≤50%，AI 案可再加碼 20%（共 70%）；須美方共同提案": "Taiwan side ≤50% of total; AI cases +20% (70% total); requires a U.S. co-proposer",
    "與「鏈結美國」最契合之政府研發金流工具。": "The government R&D funding tool most aligned with linking the U.S.",
    "臺加創新研發合作（A+ 國合）": "Taiwan–Canada Innovative R&D Cooperation (A+ Int'l)",
    "臺方 ≤50%，AI 案加碼 20%；須加方共同提案": "Taiwan side ≤50%; AI cases +20%; requires a Canadian co-proposer",
    "北美鏈結之另一研發合作管道（2024 簽署）。": "A second North America R&D channel (signed 2024).",
    "補助分散及開拓海外市場": "Market Diversification & Overseas Expansion Subsidy",
    "國際貿易署": "International Trade Administration (TITA)",
    "單家最高 500 萬／聯盟 2,000 萬": "Up to NT$5M per company / NT$20M per alliance",
    "協助機器人廠商分散市場、開拓海外（含美國）通路。": "Helping robotics companies diversify markets and open overseas (incl. U.S.) channels.",
    "補助參加海外國際展覽／TPPO": "Overseas Trade Show Participation Subsidy / TPPO",
    "實體展每攤 12 萬／每展 ≤16 萬；公協會每展最高 834–904 萬": "NT$120K per booth / ≤NT$160K per show; associations up to NT$8.34–9.04M per show",
    "以國際展會鏈結買主，推廣國產機器人解決方案。": "Connecting with buyers at international shows to promote Taiwan-made robotics solutions.",
    "投資臺灣三大方案／園區優惠": "Three Invest-in-Taiwan Programs / Park Incentives",
    "土地租金優惠、專案貸款利息補貼；園區前 2 年免租金": "Land rent discounts, project loan interest subsidies; first 2 years rent-free in parks",
    "協助機器人廠商在台擴產與設廠之投資誘因。": "Investment incentives for robotics companies expanding capacity and plants in Taiwan.",

    /* --- 美國補助表格 --- */
    "美國機器人聯邦政策時間軸（2025 年川普政府上任後）": "U.S. Federal Robotics Policy Timeline (Since the Trump Administration Took Office in 2025)",
    "時間": "Date",
    "政策／事件": "Policy / Event",
    "重點": "Key Points",
    "EO 14179「移除美國 AI 領導障礙」": "EO 14179 \u201CRemoving Barriers to American AI Leadership\u201D",
    "後續所有 AI（含機器人）政策的母法，基調為去管制（deregulation）。": "The parent order for all subsequent AI (incl. robotics) policy, with deregulation as its keynote.",
    "推動青年 AI 教育、為高薪技術工作做準備，鋪墊機器人技師與自動化人力培訓管道。": "Advancing youth AI education and preparing for high-paying skilled jobs, laying the pipeline for robotics technicians and automation talent.",
    "90 項政策；「次世代製造」主張聯邦投資 AI 與機器人賦能的新製造技術，要求美國「及其信任的盟友（trusted allies）」成為製造者。":
      "90 policy actions; the Next-Generation Manufacturing section calls for federal investment in AI- and robotics-enabled manufacturing, positioning the U.S. and its trusted allies as the makers.",
    "能源部整合式 AI 平台，重點含先進製造、關鍵材料、半導體；2026/7/22 前須盤點聯邦設施中的 AI 導向機器人實驗室。":
      "A DOE-operated integrated AI platform focused on advanced manufacturing, critical materials and semiconductors; robotics labs in federal facilities capable of AI-driven experimentation must be inventoried by 2026/7/22.",
    "National Commission on Robotics Act（H.R.7334）": "National Commission on Robotics Act (H.R.7334)",
    "跨黨派提出，指示商務部成立 18 人專家委員會，職權納入機器人供應鏈風險與境內製造政策。":
      "Bipartisan bill directing Commerce to form an 18-member expert commission covering robotics supply-chain risks and domestic manufacturing policy.",
    "Cotton×Schumer 共同提出，擬禁止聯邦機關採購或操作特定機器人與無人地面載具，禁令涵蓋外包契約；通過後 12 個月緩衝期。":
      "Co-sponsored by Cotton and Schumer; would bar federal agencies from procuring or operating certain robots and UGVs, extending to outsourced contracts; 12-month grace period after passage.",
    "美國機器人聯邦補助兩大類型": "Two Types of U.S. Federal Robotics Funding",
    "項目": "Item",
    "A 類：研究型": "Type A: Research",
    "B 類：產業型": "Type B: Industrial",
    "代表機制": "Representative mechanisms",
    "州政府補助（MBDP、M2I2、CalCompetes）、聯邦製造綱領": "State grants (MBDP, M2I2, CalCompetes); federal manufacturing initiatives",
    "主要出資方": "Primary funders",
    "NSF；國防部（ARM）；AFRL": "NSF; DoD (ARM); AFRL",
    "州經發局；商務部；CHIPS Office": "State EDOs; Commerce; CHIPS Office",
    "目的": "Purpose",
    "推進機器人科學、技術成熟、人才培育": "Advance robotics science, technology maturation and talent",
    "設廠、創造在地就業、製造回流、供應鏈韌性": "Plant siting, local jobs, reshoring, supply-chain resilience",
    "錢的性質": "Nature of funds",
    "研究經費（grant）": "Research grants",
    "資本補貼／稅收抵免／績效現金": "Capital subsidies / tax credits / performance cash",
    "典型範例": "Typical examples",
    "FRR 17.4 萬至 500 萬；SBIR Ph.II 至 180 萬；ARM 單案約百萬級": "FRR $174K–$5M; SBIR Ph.II up to $1.8M; ARM ~$1M per case",
    "MBDP 270 萬（Teradyne 案）；M2I2 至 20 萬；CalCompetes 單輪近 1 億": "MBDP $2.7M (Teradyne); M2I2 up to $200K; CalCompetes near $100M per round",
    "綁定條件": "Attached conditions",
    "學術產出、配比、會員資格、研究安全合規": "Academic output, cost share, membership, research security compliance",
    "在地就業、設備留在州內、存續年限（如賓州 5 年）": "Local jobs, in-state equipment retention, duration terms (e.g., 5 years in PA)",
    "台灣切入路徑": "Taiwan entry paths",
    "與美國大學／實驗室合作研究、技轉；加入 ARM 會員；新創走 SBIR": "Joint research/tech transfer with U.S. universities and labs; ARM membership; startups via SBIR",
    "設組裝廠、合資、零組件供應，以配比補助降低設廠成本": "Assembly plants, JVs, component supply — using matching grants to lower siting costs",
    "研究型補助資源：NSF FRR vs NSF SBIR/STTR": "Research Funding: NSF FRR vs NSF SBIR/STTR",
    "屬性": "Attribute",
    "NSF FRR（學研導向）": "NSF FRR (Academic)",
    "NSF SBIR／STTR（產業導向）": "NSF SBIR/STTR (Industry)",
    "定位": "Positioning",
    "機器人系統基礎研究（感知、移動、人機互動、跨領域）": "Fundamental robotics research (perception, mobility, HRI, interdisciplinary)",
    "中小企業／新創深科技商業化，把研發推向市場": "Deep-tech commercialization for SMEs/startups — pushing R&D to market",
    "主管": "Managed by",
    "NSF CISE 與 ENG 聯合管理": "Jointly by NSF CISE and ENG",
    "NSF 技術創新與夥伴關係理事會（TIP）": "NSF Directorate for Technology, Innovation and Partnerships (TIP)",
    "補助對象": "Eligible recipients",
    "大學、高教機構、NSF 資格非營利研究機構": "Universities, higher-ed institutions, NSF-eligible nonprofits",
    "美國中小企業／新創；STTR 須結合非營利機構": "U.S. small businesses/startups; STTR requires a nonprofit partner",
    "補助金額": "Funding amounts",
    "單案約 17 萬至 500 萬美元": "~$170K–$5M per award",
    "Phase I ≤30.5 萬、Phase II ≤125 萬（單一公司最高約 200 萬）": "Phase I ≤$305K; Phase II ≤$1.25M (~$2M max per company)",
    "申請方式": "How to apply",
    "全年滾動式收件、無固定截止": "Rolling submissions year-round, no fixed deadline",
    "先提 Project Pitch、獲邀後送案；NSF 26-510／26-511，2026/6/2 起": "Project Pitch first, full proposal upon invitation; NSF 26-510/26-511, from 2026/6/2",
    "規模／特點": "Scale / Features",
    "累計 227 項、1.22 億美元；前三州：麻州 $15.1M、賓州 $12.9M、密西根 $12.7M": "227 awards, $122M to date; top states: MA $15.1M, PA $12.9M, MI $12.7M",
    "每年逾 2 億美元、約 400 家新創；NSF 不取股權、保留智財；通過率約 10–20%": "Over $200M/yr, ~400 startups; NSF takes no equity, IP stays with the company; ~10–20% success rate",

    /* ===== 加入會員彈窗 ===== */
    "加入 Guide.Ferryman 會員": "Join Guide.Ferryman",
    "免費加入會員並訂閱電子報，即成為「青銅會員」，每週一收到台美產業動態週報。進階研究內容請見「會員升級」方案（白銀／黃金）。":
      "Join free and subscribe to become a Bronze member, receiving our weekly Taiwan–US industry digest every Monday. For advanced research, see the Silver/Gold upgrade plans.",
    "關注領域": "Areas of interest",
    "我願意收到每週產業動態電子報": "I'd like to receive the weekly industry newsletter",
    "已完成加入！我們將透過 Email 與您聯繫。": "You're in! We'll be in touch by email.",
    "送出": "Submit",
    "送出中…": "Submitting…",
    "已送出": "Submitted",
    "※ 您的資料僅用於產業動態通知與服務聯繫，我們不會對外提供。": "※ Your information is used only for industry updates and service contact; we never share it.",
    "已完成加入並登入為 🥉 青銅會員！每週一將收到台美產業動態週報。": "You've joined and are logged in as 🥉 Bronze! The weekly digest arrives every Monday.",

    /* ===== 會員方案 / 升級 ===== */
    "MEMBERSHIP · 會員分級方案": "MEMBERSHIP · TIERED PLANS",
    "解鎖 Guide.Ferryman 深度研究": "Unlock Guide.Ferryman's In-Depth Research",
    "每週產業趨勢、政策解讀與台美補助資源，為決策者準備的付費情報。":
      "Weekly industry trends, policy analysis and Taiwan–US grant resources — paid intelligence built for decision-makers.",
    "最完整": "Most complete",
    "普通會員": "Basic Member",
    "青銅會員": "Bronze Member",
    "白銀會員": "Silver Member",
    "黃金會員": "Gold Member",
    "白銀": "Silver",
    "⚪ 普通會員": "⚪ Basic Member",
    "🥉 青銅會員": "🥉 Bronze Member",
    "🥈 白銀會員": "🥈 Silver Member",
    "🥇 黃金會員": "🥇 Gold Member",
    "免費": "Free",
    "免費（加入會員＋訂閱）": "Free (join + subscribe)",
    "US$100 / 月（NT$3,200）": "US$100 / mo (NT$3,200)",
    "年繳半價：US$600（NT$19,200）/ 年": "Annual at half price: US$600 (NT$19,200) / yr",
    "US$180 / 月（NT$6,000）": "US$180 / mo (NT$6,000)",
    "年繳半價：US$1,080（NT$36,000）/ 年": "Annual at half price: US$1,080 (NT$36,000) / yr",
    "瀏覽台美動態資訊與每日熱門動態": "Browse Taiwan–US updates and daily hot topics",
    "使用美洲產業地圖": "Use the U.S. industry map",
    "包含普通會員全部權益": "Everything in Basic",
    "每週一收到《台美產業動態週報》": "Weekly Taiwan–US industry digest every Monday",
    "優先取得活動與研究發布通知": "Priority notice of events and research releases",
    "包含青銅會員全部權益": "Everything in Bronze",
    "解鎖【每週產業趨勢分析】隱藏頁": "Unlocks the hidden Weekly Industry Trends page",
    "台灣×美國 · AI／機器人／半導體／無人機 分類深度短評": "Taiwan × U.S. in-depth briefs by category: AI / robotics / semiconductors / drones",
    "包含白銀會員全部權益": "Everything in Silver",
    "解鎖【政策趨勢分析】": "Unlocks Policy Trend Analysis",
    "解鎖【台灣政府補助資源】＋【美國政府補助資源】": "Unlocks Taiwan + U.S. Grant Resources",
    "補助申請重點時程提醒": "Key grant application timeline reminders",
    "免費加入": "Join free",
    "加入並訂閱週報": "Join & subscribe",
    "升級為": "Upgrade to ",
    "資料用途說明": "How we use your data",
    "：以下姓名、Email 與方案選擇，僅供平台": ": the name, email and plan below are used by the platform solely to ",
    "開通會員權限、核對款項與寄送通行碼": "activate membership, verify payment and send your passcode",
    "作業使用，不會用於其他用途。送出後系統會立即以 Email 通知我們的服務團隊。": ", and for nothing else. On submission, our team is notified immediately by email.",
    "續約說明": "Renewal",
    "：會籍依您選擇的週期（月／年）計算，到期前我們將以 Email／LINE 與您確認續約；您可隨時取消，權限保留至當期結束。":
      ": membership runs on your chosen cycle (monthly/annual); we'll confirm renewal by email/LINE before expiry. Cancel anytime — access remains until the end of the current period.",
    "付款幣別": "Currency",
    "台幣 TWD": "TWD (NT$)",
    "美元 USD": "USD",
    "繳費週期": "Billing cycle",
    "月費（每月自動扣款）": "Monthly (auto-charged)",
    "年費（享 12 個月半價優惠）": "Annual (12 months at half price)",
    "備註（選填）": "Notes (optional)",
    "想了解的產業、發票需求…": "Industries of interest, invoice needs…",
    "送出升級申請": "Submit Upgrade Request",
    "✅ 已收到您的升級申請！請立即加入 LINE 官方帳號（": "✅ We've received your upgrade request! Please add our official LINE account (",
    "）由服務人員為您完成付款與開通：": ") — our staff will complete payment and activation with you:",
    "➕ 加入 LINE 官方帳號": "➕ Add our LINE Official Account",
    "台幣付款：藍新信用卡定期定額": "Pay in TWD: NewebPay recurring card",
    "Pay in USD（International）": "Pay in USD (International)",
    "您可直接透過以下連結完成訂閱付款（付款後仍請送出本表單，以便我們開通權限）：":
      "You can complete subscription payment via the links below (please still submit this form after paying so we can activate your access):",
    "交易安全說明": "Payment safety",
    "：因近期網路金流詐騙事件頻傳，為保障您的交易安全，本平台目前採": ": given the recent rise in online payment scams, we currently confirm payments one-on-one via our",
    "LINE 官方帳號專人一對一": " official LINE account ",
    "方式完成付款確認——全程由專人核對身分與款項，": "— a staff member verifies identity and payment throughout, and will ",
    "不會": "never",
    "要求您操作 ATM、提供信用卡完整卡號或任何驗證碼。": " ask you to operate an ATM, or provide a full card number or any verification code.",
    "💬 升級與付款流程如下：": "💬 Upgrade & payment flow:",
    "加入我們的 LINE 官方帳號（ID：": "Add our LINE official account (ID: ",
    "）": ")",
    "加入後，服務人員將與您聯繫確認方案": "After adding, our staff will contact you to confirm the plan",
    "請提供您的 Email，服務人員將提供收款帳號": "Provide your email; staff will share the payment account",
    "確認收款後，平台將以": "Once payment is confirmed, we'll send your",
    "Email＋LINE": " passcode via Email + LINE ",
    "提供您的「會員通行碼」與資格截止期限": "along with your membership expiry date",
    "已是會員？": "Already a member?",
    "🔑 前往會員登入 →": "🔑 Go to member login →",

    /* ===== 會員登入 ===== */
    "MEMBER LOGIN · 會員登入": "MEMBER LOGIN",
    "歡迎回來": "Welcome back",
    "：輸入加入會員時填寫的": ": log in with the",
    "：輸入開通信中的": ": enter the",
    "會員通行碼": "member passcode",
    "（GF-XXXXXX）登入": "(GF-XXXXXX) to log in",
    "Email 或 會員通行碼": "Email or member passcode",
    "還不是會員？": "Not a member yet?",
    "⭐ 查看升級方案": "⭐ See upgrade plans",
    "請輸入 Email 或通行碼": "Please enter your email or passcode",
    "驗證中…": "Verifying…",
    "您已是會員，但尚未訂閱電子報（青銅需訂閱）。": "You're a member but not yet subscribed (Bronze requires subscription). ",
    "點此一鍵訂閱並登入 →": "Subscribe & log in with one click →",
    "❌ 查無此 Email，請先點「加入會員/訂閱電子報」免費加入。": "❌ Email not found — please join free via Join / Subscribe first.",
    "❌ 通行碼無效、已停用或已到期。若您的訂閱剛到期，續費後即可恢復；請聯繫 guide.ferryman@gmail.com":
      "❌ Passcode invalid, disabled or expired. If your subscription just lapsed, renewing restores access; contact guide.ferryman@gmail.com",
    "處理中…": "Processing…",
    "訂閱失敗，請聯繫 guide.ferryman@gmail.com": "Subscription failed — please contact guide.ferryman@gmail.com",

    /* ===== 會員閘門 / 開放橫幅 ===== */
    "免費加入會員並訂閱電子報，登入後即可查看各州完整投資情報。": "Join free and subscribe; once logged in you can view the full state investment profiles.",
    "免費加入會員/訂閱": "Join free / Subscribe",
    "已是會員？登入": "Already a member? Log in",
    "查看方案並升級": "View plans & upgrade",
    "會員登入": "Member Login",
    "政策趨勢分析與台美政府補助資源": "policy trend analysis and Taiwan–US grant resources",
    "每週產業趨勢分析": "weekly industry trend analysis",
    "🎉 全站會員內容": "🎉 All member content is ",
    "限時免費開放中": "FREE for a limited time",
    "・": " · ",

    /* ===== 我的會員資料 ===== */
    "MY ACCOUNT · 我的會員資料": "MY ACCOUNT",
    "繳費方式": "Payment method",
    "開通日期": "Activated on",
    "⏰ 會員資格截止期限": "⏰ Membership expires",
    "會員資格截止期限": "Membership expires",
    "加入日期": "Joined",
    "電子報訂閱": "Newsletter",
    "月費": "Monthly",
    "年費": "Annual",
    "待確認": "To be confirmed",
    "無期限": "No expiry",
    "✅ 訂閱中（每週一發送）": "✅ Subscribed (sent every Monday)",
    "未訂閱": "Not subscribed",
    "免費會員・無期限": "Free member · no expiry",
    "升級白銀／黃金可解鎖每週產業趨勢與台美補助資源。": "Upgrade to Silver/Gold to unlock weekly trends and Taiwan–US grant resources.",
    "💬 聯繫 LINE 官方帳號": "💬 Contact us on LINE",
    "查無資料": "No record found",
    "請先登入會員後查看。": "Please log in first.",

    /* ===== v5.4：首頁痛點區 ===== */
    "SOUND FAMILIAR · 你是不是也正在煩惱": "SOUND FAMILIAR",
    "老闆們最常問我們的四個問題": "The four questions business owners ask us most",
    "如果其中一題正好說中你的處境，點進去看看我們怎麼陪你解。": "If one of these hits home, click through and see how we help you solve it.",
    "「被美國關稅打到，到底該不該去美國設廠？」": "\u201CHit by U.S. tariffs — should we set up a plant in the States or not?\u201D",
    "先把聯邦、州、地方三層補助疊加後的真實落地成本算清楚，再做決定。我們陪你把各州條件攤開來比。": "First calculate your true landed cost with federal, state and local incentives stacked — then decide. We lay out every state's terms side by side with you.",
    "看赴美佈局怎麼做 →": "See how US expansion works →",
    "「想申請 SBIR、A+，但計畫書不知道從哪開始？」": "\u201CWant to apply for SBIR or A+, but no idea where to start the proposal?\u201D",
    "從題目設計、計畫書共筆到審查答詢全程陪跑；先用 30 分鐘免費初診，判斷你適合哪一個計畫入口。": "We coach you end-to-end, from topic design and co-writing to review Q&A — starting with a free 30-minute consult to find your best program entry.",
    "看補助陪跑流程 →": "See the grant coaching process →",
    "「補助計畫這麼多，我的公司到底符合哪一個？」": "\u201CSo many grant programs — which ones does my company actually qualify for?\u201D",
    "加 LINE 告訴我們產業別與研發題目，免費幫你做資格快篩，通常一個工作天內回覆。": "Add us on LINE with your industry and R&D topic for a free eligibility screening — we usually reply within one business day.",
    "加 LINE 免費快篩 →": "Free screening on LINE →",
    "「要籌資、談併購，卻拿不出一份站得住腳的產值報告？」": "\u201CRaising funds or negotiating M&A, but lacking a valuation report that holds up?\u201D",
    "方法論與數據模型全部攤開、可被檢驗，讓報告在投資人與買方面前替你撐住關鍵對話。": "Our methodology and data models are fully transparent and verifiable, so the report holds its ground in front of investors and buyers.",
    "看產值評估方法 →": "See the valuation methodology →",

    /* ===== v5.4：補助陪跑重點數字／準備清單／FAQ ===== */
    "6–10 週": "6–10 weeks",
    "從免費初診到完成送件": "From free consult to submission",
    "2–4 個月": "2–4 months",
    "機關審查至核定（依計畫與梯次）": "Agency review to approval (varies by program)",
    "150 萬–2,000 萬": "NT$1.5M–20M",
    "常見金額級距（SBIR 個案至 A+ 每案上限）": "Typical funding range (SBIR case to A+ cap)",
    "初診免費": "Free consult",
    "固定服務費＋核定成功金的混合收費": "Fixed fee plus success fee upon approval",
    "合作前，你只需要準備三樣東西": "Before we start, you only need three things",
    "公司基本資料（登記資訊與近年財務概況）": "Basic company info (registration and recent financial overview)",
    "研發題目的一頁描述（想做什麼、解決什麼問題）": "A one-page description of your R&D topic (what you want to build and what problem it solves)",
    "預計投入的人力與預算粗估": "A rough estimate of headcount and budget",
    "其餘的計畫書架構、預算編列與行政文件，由我們在陪跑過程中協助補齊。": "We handle the rest — proposal structure, budgeting and administrative documents — throughout the coaching process.",
    "整個申請流程要多久？": "How long does the whole application take?",
    "依計畫而異：從免費初診到完成送件通常約 6–10 週；送件後機關審查至核定約 2–4 個月。A+ 前瞻為隨到隨審，SBIR、CITD 等則依公告梯次收件。若有明確的補助時程目標，建議整體預留半年規劃。": "It varies by program: from free consult to submission usually takes 6–10 weeks; agency review to approval takes another 2–4 months. A+ Frontier accepts rolling submissions, while SBIR and CITD follow announced rounds. If you have a firm timeline, plan for about six months overall.",
    "我的公司符合申請資格嗎？": "Does my company qualify?",
    "各計畫門檻不同，常見條件如：SBIR 需資本額 1 億元以下或員工未滿 200 人；A+ 需為國內企業、非陸資且淨值為正。加 LINE 告訴我們產業別與研發題目，我們免費幫你做資格快篩，通常一個工作天內回覆。": "Thresholds differ by program. Common examples: SBIR requires capital under NT$100M or fewer than 200 employees; A+ requires a domestic company with no PRC capital and positive net worth. Add us on LINE with your industry and R&D topic for a free eligibility screening — we usually reply within one business day.",
    "我需要準備什麼資料？": "What do I need to prepare?",
    "初期只需要三樣：公司基本資料、研發題目的一頁描述、預計投入的人力與預算粗估。計畫書架構、預算編列與各項行政文件，都由我們在陪跑過程中協助完成。": "Just three things to start: basic company info, a one-page description of your R&D topic, and a rough estimate of headcount and budget. We help complete the proposal structure, budgeting and administrative documents during the engagement.",
    "費用怎麼計算？": "How is the fee calculated?",
    "採「固定服務費＋核定成功金」的混合制：初診與資格快篩免費，實際報價依計畫類型與案件複雜度，於初診後提供明確的服務範疇與金額，不會有事後追加的模糊空間。": "We use a hybrid model of fixed service fee plus a success fee upon approval. The initial consult and eligibility screening are free; after the consult we quote a clear scope and price based on program type and case complexity — no vague add-ons later.",
    "如果沒通過怎麼辦？": "What if the application is rejected?",
    "審查意見本身就是資產。我們會陪同解讀委員意見，判斷下一步：修改後於下一梯次重送、轉換更適配的計畫入口（例如由 SBIR 轉 CITD），或重新定位題目。多數案件都有第二次機會。": "Reviewer feedback is itself an asset. We walk through the committee's comments with you and decide the next move: revise and resubmit in the next round, switch to a better-fitting program (e.g. from SBIR to CITD), or reposition the topic. Most cases get a second chance.",
    "可以同時申請多個計畫嗎？": "Can I apply to multiple programs at once?",
    "可以，但同一研發內容不得重複領取政府補助。正確做法是把研發範疇切分——例如零組件開發走 TIIP、應用場域驗證走 A+——這正是「計畫組合策略」能放大的價值。": "Yes — but the same R&D content cannot receive duplicate government funding. The right approach is to split the scope, e.g. component development under TIIP and field validation under A+. That is exactly where a program-portfolio strategy adds value.",
    "LINE 免費諮詢": "Free consult on LINE",
    "開啟選單": "Open menu"
  };

  /* 「登入」依所在元素判斷：按鈕 →「Log in」；說明句尾 →「to log in」 */
  D["登入"] = function (node) {
    var p = node.parentNode;
    return (p && p.closest && p.closest("button,a")) ? "Log in" : " to log in";
  };

  /* ---------- ② 樣式比對（含變數的模板字串） ---------- */
  function trPhrase(s) { var v = D[s]; return (typeof v === "string") ? v : s; }
  var P = [
    [/^今日熱門動態 · (.+)$/, function (m) { return "Today's Hot Topics · " + trPhrase(m[1]); }],
    [/^升級為(.+)$/, function (m) { return "Upgrade to " + trPhrase(m[1]); }],
    [/^您目前的等級：(.+)$/, function (m) { return "Your current tier: " + trPhrase(m[1]); }],
    [/^此區為【(.+)】以上限定$/, function (m) { return "This area requires 【" + trPhrase(m[1]) + "】 or above"; }],
    [/^此頁為【(.+)】以上限定內容$/, function (m) { return "This page is for 【" + trPhrase(m[1]) + "】 and above"; }],
    [/^解鎖後可閱讀完整的(.+)。$/, function (m) { return "Unlock to read the full " + trPhrase(m[1]) + "."; }],
    [/^✅ 已登入 (.+)，頁面即將重新整理…$/, function (m) { return "✅ Logged in as " + trPhrase(m[1]) + " — refreshing…"; }],
    [/^✅ 已訂閱並登入 (.+)，頁面即將重新整理…$/, function (m) { return "✅ Subscribed and logged in as " + trPhrase(m[1]) + " — refreshing…"; }],
    [/^（至 (.+)）$/, function (m) { return "(until " + m[1] + ")"; }],
    [/^📅 申請開始：(.+)$/, function (m) { return "📅 Opens: " + m[1]; }],
    [/^⏰ 截止：(.+)$/, function (m) { return "⏰ Deadline: " + m[1]; }],
    [/^登入失敗：(.+)$/, function (m) { return "Login failed: " + m[1]; }],
    [/^訂閱失敗：(.+)$/, function (m) { return "Subscription failed: " + m[1]; }],
    [/^讀取失敗：(.+)（請重新登入後再試）$/, function (m) { return "Failed to load: " + m[1] + " (please log in again)"; }],
    [/^讀取失敗：(.+)$/, function (m) { return "Failed to load: " + m[1]; }],
    [/^諮詢(.+)佈局 →$/, function () { return "Consult on expansion in this state →"; }],
    [/^續費或方案異動，請透過 LINE 官方帳號（(.+)）或 (.+) 與我們聯繫。$/, function (m) { return "For renewals or plan changes, contact us via LINE (" + m[1] + ") or " + m[2] + "."; }],
    [/^➕ 加入 LINE 官方帳號\s*(\S.*)$/, function (m) { return "➕ Add our LINE Official Account " + m[1]; }],
    /* 州別下拉：「德克薩斯州（Texas）」→「Texas」；限中文名＋純英文括號 */
    [/^([\u4e00-\u9fff][^（）]*)（([A-Za-z][A-Za-z .,'&\-]*)）$/, function (m) { return m[2]; }]
  ];

  /* ---------- ③ 頁面標題 ---------- */
  var TITLES = {
    "Guide.Ferryman Strategic Advisory｜台美產業策略顧問": "Guide.Ferryman Strategic Advisory | Taiwan–US Industry Strategy",
    "服務項目｜赴美佈局・政府補助陪跑・產業趨勢分析｜Guide.Ferryman": "Services | US Expansion · Grant Coaching · Trend Analysis | Guide.Ferryman",
    "關於我們｜Guide.Ferryman Strategic Advisory": "About Us | Guide.Ferryman Strategic Advisory",
    "預約諮詢｜Guide.Ferryman Strategic Advisory": "Book a Consultation | Guide.Ferryman Strategic Advisory",
    "台美動態資訊｜AI・機器人・半導體・無人機產業新聞｜Guide.Ferryman": "Taiwan–US Pulse | AI · Robotics · Semiconductors · Drones | Guide.Ferryman",
    "美洲產業投資地圖｜Guide.Ferryman Strategic Advisory": "US Investment Map | Guide.Ferryman Strategic Advisory",
    "產業趨勢分析｜Guide.Ferryman 會員專區": "Industry Trend Analysis | Guide.Ferryman Members",
    "政府補助資源｜Guide.Ferryman 會員專區": "Government Grant Resources | Guide.Ferryman Members"
  };

  /* ---------- ④ 翻譯引擎 ---------- */
  function tx(s, node) {
    var v = D[s];
    if (typeof v === "string") return v;
    if (typeof v === "function") return v(node);
    for (var i = 0; i < P.length; i++) {
      var m = s.match(P[i][0]);
      if (m) return P[i][1](m);
    }
    return null;
  }
  function trText(node) {
    var raw = node.nodeValue;
    if (!raw) return;
    var p = node.parentNode;
    if (p && (p.nodeName === "SCRIPT" || p.nodeName === "STYLE" || p.nodeName === "TEXTAREA")) return;
    var t = raw.trim();
    if (!t) return;
    var out = tx(t, node);
    if (out != null && out !== t) {
      var lead = raw.match(/^\s*/)[0], tail = raw.match(/\s*$/)[0];
      node.nodeValue = lead + out + tail;
    }
  }
  var ATTRS = ["placeholder", "aria-label", "title", "alt"];
  function trAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (el.hasAttribute && el.hasAttribute(a)) {
        var v = (el.getAttribute(a) || "").trim();
        var out = v && tx(v, null);
        if (out != null && out !== v) el.setAttribute(a, out);
      }
    }
  }
  function translateTree(root) {
    if (!root) return;
    if (root.nodeType === 3) { trText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) trAttrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var n; while ((n = w.nextNode())) trText(n);
    if (root.querySelectorAll) {
      var els = root.querySelectorAll("[placeholder],[aria-label],[title],[alt]");
      for (var i = 0; i < els.length; i++) trAttrs(els[i]);
    }
  }

  /* ---------- ⑤ 語言切換按鈕（注入導覽列） ---------- */
  function injectToggle() {
    var links = document.querySelector(".nav-links");
    if (!links || links.querySelector(".nav-lang")) return;
    var a = document.createElement("a");
    a.href = "#";
    a.className = "nav-lang";
    a.setAttribute("aria-label", lang() === "en" ? "切換為中文" : "Switch to English");
    a.textContent = lang() === "en" ? "🌐 中文" : "🌐 EN";
    a.onclick = window.gfToggleLang;
    var cta = links.querySelector(".nav-cta");
    if (cta) links.insertBefore(a, cta); else links.appendChild(a);
  }

  /* ---------- ⑥ 啟動 ---------- */
  function boot() {
    injectToggle();
    if (lang() !== "en") return;
    try { document.documentElement.lang = "en"; } catch (e) {}
    if (TITLES[document.title]) document.title = TITLES[document.title];
    translateTree(document.body);
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === "characterData") { trText(m.target); continue; }
        if (m.addedNodes) {
          for (var j = 0; j < m.addedNodes.length; j++) translateTree(m.addedNodes[j]);
        }
      }
      injectToggle(); /* 導覽列若被重繪，補回切換鈕 */
    });
    mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  /* 非 EN 模式也要確保切換鈕存在（導覽列由 JS 動態產生） */
  document.addEventListener("DOMContentLoaded", injectToggle);
})();
