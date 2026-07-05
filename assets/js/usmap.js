/* Guide.Ferryman — 美洲產業地圖（美國本土州級互動）
   使用本地 vendor 檔案（d3 / topojson / us-atlas），無需外部連線。 */

(function () {
  const mount = document.getElementById("usmapBox");
  if (!mount) return;
  const path = location.pathname.includes("/admin/") ? "../" : "";

  function fallback(msg) {
    mount.innerHTML = `<p style="color:#C4D2DE;font-size:14px;padding:20px">${msg}<br>請改用右側選單選擇州別。</p>`;
    buildSelector();
  }

  function buildSelector() {
    const sel = document.getElementById("stateSelect");
    if (!sel) return;
    const opts = Object.entries(GF_STATES)
      .sort((a, b) => a[1].name.localeCompare(b[1].name, "zh-Hant"))
      .map(([fips, s]) => `<option value="${fips}">${s.name}（${s.en}）</option>`).join("");
    sel.innerHTML = `<option value="">— 選擇想了解的州 —</option>` + opts;
    sel.addEventListener("change", () => { if (sel.value) showState(sel.value); });
  }

  window.showState = function (fips, nameFromMap) {
    const panel = document.getElementById("statePanel");
    const s = GF_STATES[fips];
    document.querySelectorAll("#usmap .state.selected").forEach(el => el.classList.remove("selected"));
    const pathEl = document.querySelector(`#usmap .state[data-fips="${fips}"]`);
    if (pathEl) pathEl.classList.add("selected");

    if (!s) {
      panel.innerHTML = `
        <p class="coord">STATE PROFILE</p>
        <h3>${nameFromMap || "該州"}</h3>
        <p class="empty">此州的產業資料建置中。<br><br>Guide.Ferryman 已針對 15 個重點州完成產業盤點，其餘州別資料將陸續上線。若您有特定州的佈局需求，歡迎<a href="contact.html">預約諮詢</a>。</p>`;
      return;
    }
    panel.innerHTML = `
      <p class="coord">${s.coord} · STATE PROFILE</p>
      <h3>${s.name}</h3>
      <p class="en-name">${s.en}</p>
      <ul>${s.industries.map(i => `<li>${i}</li>`).join("")}</ul>
      <div class="chip-row"><span class="chip">台灣連結重點</span></div>
      <p style="font-size:14px;color:#33475C;margin-top:10px">${s.note}</p>
      <div style="margin-top:20px"><a class="btn btn-teal" style="padding:10px 20px;font-size:14px" href="contact.html">諮詢${s.name}佈局 →</a></div>`;
  };


  /* 各州英文縮寫（地圖標籤用） */
  const GF_ABBR = {"Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE","District of Columbia":"DC","Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY","Puerto Rico":"PR"};

  /* 每州不同深淺：以州名產生穩定色階（重點州更亮，與「深色州別＝已有資料」說明一致） */
  function stateShade(d) {
    let h = 0;
    const n = d.properties.name;
    for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 997;
    const t = h / 997; // 0–1 穩定亂數
    return GF_STATES[d.id]
      ? d3.interpolateRgb("#1E5A96", "#3F86C8")(t)   // 15 個重點州：較亮的藍
      : d3.interpolateRgb("#10294A", "#1B4573")(t);  // 其他州：較深的藍
  }

  if (typeof d3 === "undefined" || typeof topojson === "undefined") {
    return fallback("地圖元件載入失敗。");
  }

  d3.json(path + "assets/vendor/states-albers-10m.json").then(us => {
    const states = topojson.feature(us, us.objects.states);
    const svg = d3.select("#usmapBox").append("svg")
      .attr("id", "usmap").attr("viewBox", "0 0 975 610")
      .attr("role", "img").attr("aria-label", "美國各州互動產業地圖");

    const tip = document.getElementById("mapTip");
    const geoPath = d3.geoPath();

    svg.append("g").selectAll("path")
      .data(states.features).join("path")
      .attr("d", geoPath)
      .attr("class", d => "state" + (GF_STATES[d.id] ? " has-data" : ""))
      .attr("fill", stateShade)
      .attr("data-fips", d => d.id)
      .attr("tabindex", 0)
      .attr("aria-label", d => (GF_STATES[d.id] ? GF_STATES[d.id].name : d.properties.name))
      .on("mousemove", function (event, d) {
        const box = mount.getBoundingClientRect();
        tip.style.opacity = 1;
        tip.style.left = (event.clientX - box.left) + "px";
        tip.style.top = (event.clientY - box.top) + "px";
        const s = GF_STATES[d.id];
        tip.textContent = s ? `${s.name} · ${s.industries[0]}` : d.properties.name + "（資料建置中）";
      })
      .on("mouseleave", () => { tip.style.opacity = 0; })
      .on("click", (event, d) => showState(d.id, d.properties.name))
      .on("keydown", (event, d) => { if (event.key === "Enter") showState(d.id, d.properties.name); });

    // 州界線
    svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
      .attr("fill", "none").attr("stroke", "#0A1C30").attr("stroke-width", 1)
      .attr("d", geoPath);

    // 每州名稱標籤（縮寫，置於各州幾何中心；過小的州縮小字級）
    svg.append("g").selectAll("text")
      .data(states.features).join("text")
      .attr("class", "state-label")
      .attr("transform", d => `translate(${geoPath.centroid(d)})`)
      .attr("dy", "0.35em")
      .style("font-size", d => geoPath.area(d) < 900 ? "7px" : (geoPath.area(d) < 2600 ? "9px" : "11px"))
      .text(d => GF_ABBR[d.properties.name] || "");

    buildSelector();
  }).catch(() => fallback("地圖資料載入失敗。"));
})();
