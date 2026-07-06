/* ============================================================
   Guide.Ferryman — 美洲產業投資地圖（invest-map.html）
   資料來源：assets/js/investmap-data.js（GF_INVEST，鍵值 = FIPS）
   地圖：本地 vendor（d3 / topojson / us-atlas states-albers-10m.json）
   ============================================================ */

(function () {
  const mount = document.getElementById("imMapBox");
  if (!mount) return;

  const ABBR = {"Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE","District of Columbia":"DC","Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY","Puerto Rico":"PR"};

  const PENDING = /查無公開來源|待查證/;
  const esc = s => String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const shortInd = s => esc(String(s || "").split(/[、;；]/).slice(0, 3).join("、"));

  /* 每州穩定色階：已查證台商投資州 → 琥珀；一般州 → 藍階 */
  function stateShade(d) {
    let h = 0; const n = d.properties.name;
    for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 997;
    const t = h / 997;
    return d3.interpolateRgb("#10294A", "#3F86C8")(t);
  }

  /* ---------- 下拉選單 ---------- */
  function buildSelector() {
    const sel = document.getElementById("imStateSelect");
    if (!sel) return;
    const opts = Object.entries(GF_INVEST)
      .sort((a, b) => a[1].en.localeCompare(b[1].en))
      .map(([f, s]) => `<option value="${f}">${s.name}（${s.en}）</option>`).join("");
    sel.innerHTML = `<option value="">— 選擇想了解的州（共 50 州） —</option>` + opts;
    sel.addEventListener("change", () => { if (sel.value) showProfile(sel.value, true); });
  }

  /* ---------- 完整資訊面板 ---------- */
  function cell(title, val, opts) {
    opts = opts || {};
    const pending = PENDING.test(val || "");
    const body = pending
      ? `<p class="pending">查無公開來源，待查證——Guide.Ferryman 將於後續盤點更新。</p>`
      : `<p>${esc(val)}</p>`;
    return `<div class="im-cell${opts.full ? " full" : ""}"><h4>${title}</h4>${body}</div>`;
  }

  function showProfile(fips, fromSelect) {
    const s = GF_INVEST[fips];
    const box = document.getElementById("imProfile");
    if (!s || !box) return;

    d3.selectAll("#imMap .state.selected").classed("selected", false);
    d3.select(`#imMap .state[data-fips="${fips}"]`).classed("selected", true);
    if (!fromSelect) {
      const sel = document.getElementById("imStateSelect");
      if (sel) sel.value = fips;
    }

    box.innerHTML = `
      <p class="coord mono">FIPS ${fips} · STATE INVESTMENT PROFILE</p>
      <h2>${esc(s.name)}</h2>
      <p class="en-name">${esc(s.en)}</p>
      <div class="im-grid">
        ${cell("重點產業 KEY INDUSTRIES", s.industries, { full: true })}
        ${cell("代表性公司 ANCHOR COMPANIES", s.companies)}
        ${cell("與台灣有關之代表企業 TAIWAN-LINKED COMPANIES", s.twCompanies)}
        ${cell("官方招商機構 EDO", s.edo)}
        ${cell("代表性政策／補助 POLICY & INCENTIVES", s.policy)}
        ${cell("招商特點（聚落／資源／稅收） LOCATION ADVANTAGES", s.features, { full: true })}
        ${cell("稅率（企業所得稅／銷售稅） TAX", s.tax)}
        ${cell("台灣鏈結重點 TAIWAN LINKAGE FOCUS", s.twLink, { full: true })}
      </div>
      <div class="im-cta-row">
        <a class="btn btn-teal" style="padding:11px 22px;font-size:14px" href="contact.html">諮詢${esc(s.name)}佈局 →</a>
      </div>`;

    document.getElementById("im-profile-section").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- 動態浮框 ---------- */
  function tipHTML(s, fallbackName) {
    if (!s) return `<div class="t-head"><span class="t-name">${esc(fallbackName)}</span></div>
      <div class="t-row">資料建置中</div>`;
    return `
      <div class="t-head">
        <span class="t-name">${esc(s.name)}</span>
        <span class="t-abbr">${esc(ABBR[s.en] || "")} · ${esc(s.en)}</span>
      </div>
      <div class="t-row"><b>重點產業</b>：${shortInd(s.industries)}</div>
      <div class="t-row"><b>台灣鏈結</b>：${esc(s.twLink)}</div>
      <div class="t-more">CLICK → 完整投資情報</div>`;
  }

  function moveTip(tip, event) {
    const box = mount.getBoundingClientRect();
    let x = event.clientX - box.left, y = event.clientY - box.top;
    const w = tip.offsetWidth || 290, h = tip.offsetHeight || 140;
    x = (x + 18 + w > box.width) ? x - w - 18 : x + 18;   // 靠右自動翻左
    y = (y - h - 12 < 0) ? y + 20 : y - h - 12;            // 靠上自動翻下
    tip.style.left = Math.max(6, x) + "px";
    tip.style.top = Math.max(6, y) + "px";
  }

  /* ---------- 繪圖 ---------- */
  if (typeof d3 === "undefined" || typeof topojson === "undefined") {
    mount.innerHTML = `<p style="color:#C4D2DE;font-size:14px;padding:20px">地圖元件載入失敗，請改用上方選單選擇州別。</p>`;
    buildSelector();
    return;
  }

  d3.json("assets/vendor/states-albers-10m.json").then(us => {
    const states = topojson.feature(us, us.objects.states);
    const svg = d3.select("#imMapBox").append("svg")
      .attr("id", "imMap").attr("viewBox", "0 0 975 610")
      .attr("role", "img").attr("aria-label", "美國 50 州產業投資互動地圖");

    const tip = document.getElementById("imTip");
    const geoPath = d3.geoPath();

    svg.append("g").selectAll("path")
      .data(states.features).join("path")
      .attr("d", geoPath)
      .attr("class", "state")
      .attr("fill", stateShade)
      .attr("data-fips", d => d.id)
      .attr("tabindex", 0)
      .attr("aria-label", d => (GF_INVEST[d.id] ? GF_INVEST[d.id].name : d.properties.name))
      .on("mousemove", function (event, d) {
        tip.innerHTML = tipHTML(GF_INVEST[d.id], d.properties.name);
        tip.style.opacity = 1;
        tip.setAttribute("aria-hidden", "false");
        moveTip(tip, event);
      })
      .on("mouseleave", () => { tip.style.opacity = 0; tip.setAttribute("aria-hidden", "true"); })
      .on("click", (event, d) => showProfile(d.id))
      .on("keydown", (event, d) => { if (event.key === "Enter") showProfile(d.id); });

    // 州界線
    svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
      .attr("fill", "none").attr("stroke", "#0A1C30").attr("stroke-width", 1)
      .attr("d", geoPath);

    // 各州英文縮寫標籤
    svg.append("g").selectAll("text")
      .data(states.features).join("text")
      .attr("class", "state-label")
      .attr("transform", d => `translate(${geoPath.centroid(d)})`)
      .attr("dy", "0.35em")
      .style("font-size", d => geoPath.area(d) < 900 ? "7px" : (geoPath.area(d) < 2600 ? "9px" : "11px"))
      .text(d => ABBR[d.properties.name] || "");

    buildSelector();

    // 支援 invest-map.html?state=04 直接開啟指定州
    const q = new URLSearchParams(location.search).get("state");
    if (q && GF_INVEST[q]) showProfile(q);
  }).catch(() => {
    mount.innerHTML = `<p style="color:#C4D2DE;font-size:14px;padding:20px">地圖資料載入失敗，請改用上方選單選擇州別。</p>`;
    buildSelector();
  });
})();
