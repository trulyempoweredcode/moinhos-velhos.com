/* The guest health, diet and travel form (/book/guest/?t=...). Builds itself from the booking server's form
   definition, so the questions are changed in one place (the server) and the admin sheet always matches. */
(function () {
  var root = document.getElementById("guest-app");
  if (!root) { return; }
  var cfg = window.MV_CONFIG || {};
  var API = (cfg.apiBase || "").replace(/\/$/, "");
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {   // testing only: ?api=http://localhost:8150 (remembered for the session)
    try { var q = new URLSearchParams(location.search).get("api"); if (q) { sessionStorage.setItem("mv_api", q); } var o = sessionStorage.getItem("mv_api"); if (o) { API = o.replace(/\/$/, ""); } } catch (e) {}
  }
  var token = new URLSearchParams(location.search).get("t") || "";
  var LABEL = "block text-xs font-semibold uppercase tracking-wider text-ink/55 mb-1.5";
  var INPUT = "w-full rounded-xl border border-ink/15 px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-shadow";
  var BTN = "inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-wider px-7 py-3.5 rounded-full transition-all duration-300 hover:-translate-y-0.5 bg-leaf text-white hover:bg-leaf-deep hover:shadow-[0_12px_28px_-8px_rgba(4,120,87,0.6)] disabled:opacity-60 disabled:cursor-not-allowed";

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text != null) { e.textContent = text; } return e; }
  function say(msg, bad) { root.innerHTML = ""; root.appendChild(el("p", bad ? "text-[#c0392b]" : "text-ink/70", msg)); }

  if (!/^[0-9a-f]{32}$/.test(token)) { say("This link does not look right. Please use the link in your confirmation email, or contact us.", true); return; }

  Promise.all([
    fetch(API + "/api/guest/" + token).then(function (r) { return r.json().then(function (j) { if (!r.ok) { throw new Error(j.error || "Not found"); } return j; }); }),
    fetch(API + "/api/guest-form").then(function (r) { return r.json(); })
  ]).then(function (res) { build(res[0], res[1]); }).catch(function (e) { say(e.message === "Failed to fetch" ? "We could not reach the booking system. Please try again in a moment." : e.message, true); });

  function build(info, def) {
    root.innerHTML = "";
    var intro = el("div", "mb-8");
    intro.appendChild(el("h2", "font-display text-3xl font-semibold text-brand-ink mb-2", "Hello " + info.firstName));
    intro.appendChild(el("p", "text-ink/70 text-sm", info.dates + " · " + info.roomName + " · " + info.reference));
    intro.appendChild(el("p", "text-ink/70 text-sm mt-3", info.submitted ? "You have already sent your details. You can send them again if anything has changed." : "Please take a few minutes to tell us about your health, diet and travel. We use this to look after you properly during your stay."));
    root.appendChild(intro);

    var form = el("form", "space-y-12");
    form.noValidate = true;
    var inputs = {};
    def.sections.forEach(function (s) {
      var sec = el("section", "space-y-5");
      sec.appendChild(el("h3", "font-display text-2xl font-semibold text-brand-ink", s.title));
      if (s.note) { sec.appendChild(el("p", "text-ink/60 text-sm", s.note)); }
      var grid = el("div", "grid sm:grid-cols-2 gap-5");
      s.fields.forEach(function (f) {
        var wrap = el("label", "block");
        var full = f.type === "textarea" || f.type === "checks" || f.type === "radio";
        if (full) { wrap.className = "block sm:col-span-2"; }
        wrap.appendChild(el("span", LABEL, f.label));
        var node;
        if (f.type === "textarea") { node = el("textarea", INPUT); node.rows = 3; }
        else if (f.type === "select") { node = el("select", INPUT); node.appendChild(new Option("Choose…", "")); f.options.forEach(function (op) { node.appendChild(new Option(op, op)); }); }
        else if (f.type === "radio") {
          node = el("div", "grid sm:grid-cols-3 gap-3"); inputs[f.key] = { radios: [] };
          f.options.forEach(function (op) {
            var l = el("label", "flex items-start gap-3 rounded-xl border border-ink/15 px-4 py-3 text-sm cursor-pointer");
            var r = document.createElement("input"); r.type = "radio"; r.name = f.key; r.value = op.value; r.className = "mt-1 accent-[#047857]";
            var t = el("span", ""); t.appendChild(el("span", "block font-semibold text-brand-ink", op.label)); t.appendChild(el("span", "block text-xs text-ink/55", op.sub || ""));
            l.appendChild(r); l.appendChild(t); node.appendChild(l); inputs[f.key].radios.push(r);
          });
        } else if (f.type === "checks") {
          node = el("div", "grid sm:grid-cols-2 gap-2"); inputs[f.key] = { checks: [] };
          f.options.forEach(function (op) {
            var l = el("label", "flex items-center gap-3 text-sm text-ink/80"); var c = document.createElement("input"); c.type = "checkbox"; c.value = op; c.className = "accent-[#047857]";
            l.appendChild(c); l.appendChild(document.createTextNode(op)); node.appendChild(l); inputs[f.key].checks.push(c);
          });
        } else { node = el("input", INPUT); node.type = f.type === "date" ? "date" : "text"; if (f.sensitive) { node.autocomplete = "off"; } }
        if (!inputs[f.key]) { inputs[f.key] = { input: node }; }
        wrap.appendChild(node); grid.appendChild(wrap);
      });
      sec.appendChild(grid); form.appendChild(sec);
    });

    // consent and signature
    var cs = el("section", "space-y-5");
    cs.appendChild(el("h3", "font-display text-2xl font-semibold text-brand-ink", "Consent & signature"));
    def.consent.forEach(function (p) { cs.appendChild(el("p", "text-ink/70 text-sm leading-relaxed", p)); });
    var nameWrap = el("label", "block"); nameWrap.appendChild(el("span", LABEL, "Your full name")); var nameIn = el("input", INPUT); nameIn.type = "text"; nameIn.autocomplete = "name"; nameWrap.appendChild(nameIn); cs.appendChild(nameWrap);
    var sigWrap = el("div", ""); sigWrap.appendChild(el("span", LABEL, "Signature"));
    var canvas = document.createElement("canvas"); canvas.width = 700; canvas.height = 200; canvas.className = "w-full rounded-xl border border-dashed border-ink/25 bg-white touch-none"; canvas.style.height = "150px";
    sigWrap.appendChild(canvas); sigWrap.appendChild(el("p", "text-[11px] text-ink/45 mt-1", "Sign above with your finger or mouse."));
    var clear = el("button", "text-xs font-semibold uppercase tracking-wider text-brand-deep mt-1", "Clear"); clear.type = "button"; sigWrap.appendChild(clear); cs.appendChild(sigWrap);
    var ctx = canvas.getContext("2d"); ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#102a37"; var drawing = false, signed = false;
    function pos(e) { var r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height]; }
    canvas.addEventListener("pointerdown", function (e) { drawing = true; var p = pos(e); ctx.beginPath(); ctx.moveTo(p[0], p[1]); canvas.setPointerCapture(e.pointerId); e.preventDefault(); });
    canvas.addEventListener("pointermove", function (e) { if (!drawing) { return; } var p = pos(e); ctx.lineTo(p[0], p[1]); ctx.stroke(); signed = true; });
    ["pointerup", "pointercancel"].forEach(function (n) { canvas.addEventListener(n, function () { drawing = false; }); });
    clear.addEventListener("click", function () { ctx.clearRect(0, 0, canvas.width, canvas.height); signed = false; });
    var agreeWrap = el("label", "flex items-start gap-3 text-sm text-ink/80"); var agree = document.createElement("input"); agree.type = "checkbox"; agree.className = "mt-1 accent-[#047857]";
    agreeWrap.appendChild(agree); agreeWrap.appendChild(el("span", "", "I have read and agree to the above.")); cs.appendChild(agreeWrap);
    form.appendChild(cs);

    var err = el("p", "text-[#c0392b] text-sm hidden"); form.appendChild(err);
    var submit = el("button", BTN, "Save my details"); submit.type = "submit"; form.appendChild(submit);
    root.appendChild(form);

    form.addEventListener("submit", function (e) {
      e.preventDefault(); err.classList.add("hidden");
      if (!agree.checked || !nameIn.value.trim() || !signed) { err.textContent = "Please tick the box, type your full name and sign above."; err.classList.remove("hidden"); return; }
      var data = { consent: true, fullName: nameIn.value.trim(), signature: canvas.toDataURL("image/png") };
      Object.keys(inputs).forEach(function (k) {
        var i = inputs[k];
        if (i.checks) { data[k] = i.checks.filter(function (c) { return c.checked; }).map(function (c) { return c.value; }); }
        else if (i.radios) { var on = i.radios.filter(function (r) { return r.checked; })[0]; if (on) { data[k] = on.value; } }
        else { data[k] = i.input.value; }
      });
      submit.disabled = true; submit.textContent = "Saving…";
      fetch(API + "/api/guest/" + token, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) { throw new Error(j.error || "Something went wrong."); } return j; }); })
        .then(function () {
          root.innerHTML = "";
          var ok = el("div", "rounded-2xl bg-leaf/10 border border-leaf/20 p-8 text-center");
          ok.appendChild(el("p", "font-display text-2xl font-semibold text-brand-ink", "Thank you, " + info.firstName));
          ok.appendChild(el("p", "text-sm text-ink/65 mt-2 max-w-sm mx-auto", "Your details have been saved. We look forward to welcoming you."));
          root.appendChild(ok); window.scrollTo({ top: 0, behavior: "smooth" });
        })
        .catch(function (x) { err.textContent = x.message === "Failed to fetch" ? "We could not reach the booking system. Please try again." : x.message; err.classList.remove("hidden"); submit.disabled = false; submit.textContent = "Save my details"; });
    });
  }
})();
