/* Dates & prices page.
   1) Upcoming retreats: read live from the booking system (MV_CONFIG.apiBase + /api/retreats),
      so a retreat added, closed or put on sale in the booking admin shows here by itself.
      Whole months are shown open until at least OPEN_MIN retreats are on view; later months
      are folded, one per month, so a month's count is always its real count.
   2) 2027 prices: each [data-eb-full] holds the full price (the client edits it on the page).
      When the table carries data-eb-percent, the full price is shown crossed out with the
      Early Bird price under it, rounded to whole euros exactly as the booking system rounds
      a sale (Pricing::salePrice). Remove data-eb-percent and the table shows full prices only. */
(function () {
  "use strict";

  var OPEN_MIN = 8;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function euro(n) { return "€" + Math.round(n).toLocaleString("en-GB"); }
  function ymd(iso) { var d = new Date(iso); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() }; }
  function day(p) { return p.d + " " + MON[p.m]; }

  var ARROW = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';
  var CHEVRON = '<svg class="w-4 h-4 text-brand-deep shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>';
  var SPARKLE = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c.6 4.2 2 6.4 6 7-4 .6-5.4 2.8-6 7-.6-4.2-2-6.4-6-7 4-.6 5.4-2.8 6-7Z"></path><path d="M19 15c.3 1.8.9 2.7 2.5 3-1.6.3-2.2 1.2-2.5 3-.3-1.8-.9-2.7-2.5-3 1.6-.3 2.2-1.2 2.5-3Z"></path></svg>';
  var PILL = "inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold rounded-full px-2.5 py-1";
  var BTN = "inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-wider px-7 py-3.5 rounded-full transition-all duration-300 hover:-translate-y-0.5 bg-leaf text-white hover:bg-leaf-deep hover:shadow-[0_12px_28px_-8px_rgba(4,120,87,0.6)] !px-5 !py-2.5";

  function row(r) {
    var s = ymd(r.startDate), e = ymd(r.endDate);
    var nights = r.nights + " nights" + (r.allowSeven ? " · 7-night option" : "");
    var full = r.freeBeds <= 0;
    var pills = "";
    if (r.salePercent && !full) {
      pills += '<span class="' + PILL + ' bg-gold/15 text-[#9a6d1c]">' + SPARKLE + esc(r.saleLabel || "Special offer") + " · " + esc(r.salePercent) + "% off</span>";
    }
    if (full) {
      pills += '<span class="' + PILL + ' bg-mist text-brand-deep">Fully booked</span>';
    } else if (r.freeBeds <= 3) {
      pills += '<span class="' + PILL + ' bg-mist text-brand-deep">' + (r.freeBeds === 1 ? "1 place left" : r.freeBeds + " places left") + "</span>";
    }
    var price = r.salePercent && r.fromBase > r.fromPrice
      ? '<span class="inline-flex items-center gap-2"><span class="text-sm text-ink/55 line-through">' + euro(r.fromBase) + '</span><span class="text-base font-bold text-brand-deep whitespace-nowrap">from ' + euro(r.fromPrice) + "</span></span>"
        : '<span class="text-base font-bold text-brand-deep whitespace-nowrap">from ' + euro(r.fromPrice) + "</span>";
    var cta = full ? "Join waitlist" : "Book";
    var note = r.salePercent && !full ? '<p class="text-base text-ink/65 mt-2 sm:ml-44">Discount applied automatically at booking.</p>' : "";
    return '<div class="py-4"><div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">' +
      '<div class="sm:w-44 shrink-0"><p class="font-semibold text-brand-ink">' + day(s) + " – " + day(e) + '</p><p class="text-base text-ink/65 mt-0.5">' + nights + "</p></div>" +
      '<div class="flex flex-wrap items-center gap-2 flex-1">' + pills + "</div>" +
      '<div class="shrink-0 sm:text-right">' + price + "</div>" +
      '<div class="shrink-0"><a class="' + BTN + '" href="../book/">' + cta + ARROW + "</a></div>" +
      "</div>" + note + "</div>";
  }

  function month(g, open) {
    var n = g.items.length;
    return '<details class="group bg-white rounded-2xl border border-ink/5 open:border-brand/40 transition-colors"' + (open ? " open" : "") + ">" +
      '<summary class="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 [&amp;::-webkit-details-marker]:hidden">' +
      '<span class="flex items-center gap-3"><span class="font-display text-2xl font-semibold text-brand-ink">' + MONTHS[g.m] + " " + g.y + "</span>" +
      '<span class="text-[11px] uppercase tracking-wider font-bold rounded-full px-2.5 py-1 bg-mist text-brand-deep">' + n + (n === 1 ? " retreat" : " retreats") + "</span></span>" +
      CHEVRON + "</summary>" +
      '<div class="px-6 pb-2 border-t border-ink/5 divide-y divide-ink/5">' + g.items.map(row).join("") + "</div></details>";
  }

  function renderDates(box, list) {
    var groups = [], last = null;
    list.slice().sort(function (a, b) { return a.startDate < b.startDate ? -1 : 1; }).forEach(function (r) {
      var p = ymd(r.startDate), key = p.y * 12 + p.m;
      if (!last || last.key !== key) { last = { key: key, y: p.y, m: p.m, items: [] }; groups.push(last); }
      last.items.push(r);
    });
    if (!groups.length) {
      box.innerHTML = '<p class="text-base text-ink/65">New dates are on their way. <a href="../contact/" class="text-brand-deep font-semibold underline underline-offset-2">Ask us</a> and we will let you know when they open.</p>';
      return;
    }
    var html = "", shown = 0, folded = false;
    groups.forEach(function (g) {
      var open = shown < OPEN_MIN;
      if (!open && !folded) {
        folded = true;
        html += '<h3 class="text-xs uppercase tracking-[0.2em] text-brand-deep font-semibold pt-6">More dates</h3>';
      }
      html += month(g, open);
      if (open) { shown += g.items.length; }
    });
    box.innerHTML = html;
  }

  function loadDates() {
    var box = document.getElementById("mv-dates");
    if (!box) { return; }
    var base = (window.MV_CONFIG && window.MV_CONFIG.apiBase) || "https://book.moinhos-velhos.com";
    var failed = function () {
      box.innerHTML = '<p class="text-base text-ink/65">The dates could not load just now. <a href="../book/" class="text-brand-deep font-semibold underline underline-offset-2">See every date on the booking page</a>.</p>';
    };
    if (!window.fetch) { failed(); return; }
    fetch(base + "/api/retreats", { headers: { Accept: "application/json" } })
      .then(function (res) { if (!res.ok) { throw new Error(res.status); } return res.json(); })
      .then(function (d) { renderDates(box, (d && d.retreats) || []); })
      .catch(failed);
  }

  function earlyBird() {
    var tables = document.querySelectorAll("[data-eb-percent]");
    Array.prototype.forEach.call(tables, function (t) {
      var pct = parseInt(t.getAttribute("data-eb-percent"), 10);
      if (!(pct > 0 && pct < 100)) { return; }
      var paint = function () {
        Array.prototype.forEach.call(t.querySelectorAll("[data-eb-full]"), function (el) {
          var n = parseInt((el.textContent || "").replace(/[^0-9]/g, ""), 10);
          var out = el.parentNode.querySelector("[data-eb-calc]");
          if (!out) {
            out = document.createElement("span");
            out.setAttribute("data-eb-calc", "");
            out.className = "block font-display text-lg font-semibold text-brand-ink";
            el.parentNode.appendChild(out);
            el.className = "block text-sm sm:text-base font-normal text-ink/55 line-through";
          }
          out.textContent = n > 0 ? euro(Math.round(n * (100 - pct) / 100)) : "";
        });
      };
      paint();
      t.addEventListener("input", paint);
    });
  }

  function start() { loadDates(); earlyBird(); }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); } else { start(); }
})();
