/* Moinhos Velhos - behaviour. Plain JS, no framework.
   Header states, mobile menu, scroll reveals, hero video, video facades, accordions,
   testimonial scroller, gallery (filters, show more, lightbox), contact form. */
(function () {
  var doc = document, body = doc.body;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || doc).querySelectorAll(s)); };
  var isHome = body.hasAttribute("data-home");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header ---------- */
  var header = $("header");
  var menuOpen = false, scrolled = false;
  var top = header && header.children[0], bar = header && header.children[1];
  var panel = header && header.children[2];
  var contact = top && $('a[href$="contact/"]', top);
  var burger = bar && $('button[aria-label$="menu"]', bar);
  var nm = bar && $("span.font-display", bar), tag = nm && nm.nextElementSibling;
  var nav = bar && $("nav", bar);
  var navLinks = nav ? $$(".nav-link", nav) : [];
  var HDR = [ // [element, normal tokens, transparent tokens]
    [top, ["bg-brand-ink", "text-white/90"], ["bg-transparent", "text-white/85"]],
    [contact, ["border-white/30", "text-white/90", "hover:bg-white/10", "hover:text-white"], ["border-white/40", "text-white", "hover:bg-white/15"]],
    [burger, ["text-brand-ink"], ["text-white"]],
    [nm, ["text-brand-ink"], ["text-white"]],
    [tag, ["text-brand-deep"], ["text-brand"]],
    [nav, ["text-ink"], ["text-white"]]
  ];
  var BAR_SCROLLED = ["bg-white/95", "backdrop-blur", "shadow-[0_8px_30px_-12px_rgba(7,51,73,0.25)]"];
  function tokens(el, add, remove) {
    if (!el) return;
    remove.forEach(function (t) { el.classList.remove(t); });
    add.forEach(function (t) { el.classList.add(t); });
  }
  function paint() {
    var p = isHome && !scrolled && !menuOpen;
    HDR.forEach(function (r) { tokens(r[0], p ? r[2] : r[1], p ? r[1] : r[2]); });
    navLinks.forEach(function (a) { tokens(a, p ? ["hover:text-brand"] : ["hover:text-brand-deep"], p ? ["hover:text-brand-deep"] : ["hover:text-brand"]); });
    if (bar) {
      tokens(bar, p ? ["bg-transparent"] : (scrolled ? BAR_SCROLLED : ["bg-white"]),
             p ? ["bg-white"].concat(BAR_SCROLLED) : (scrolled ? ["bg-white", "bg-transparent"] : ["bg-transparent"].concat(BAR_SCROLLED)));
    }
  }
  function onScroll() { var s = window.scrollY > 8; if (s !== scrolled) { scrolled = s; paint(); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  scrolled = window.scrollY > 8; paint();

  /* mobile menu */
  var ICON_MENU = "M4 6h16M4 12h16M4 18h16", ICON_CLOSE = "M18 6 6 18M6 6l12 12";
  function setMenu(open) {
    menuOpen = open;
    body.style.overflow = open ? "hidden" : "";
    if (burger) {
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      var path = $("path", burger); if (path) path.setAttribute("d", open ? ICON_CLOSE : ICON_MENU);
    }
    if (panel) {
      ["opacity-100", "translate-y-0"].forEach(function (c) { panel.classList.toggle(c, open); });
      ["opacity-0", "-translate-y-3", "pointer-events-none"].forEach(function (c) { panel.classList.toggle(c, !open); });
    }
    paint();
  }
  if (burger) burger.addEventListener("click", function () { setMenu(!menuOpen); });
  if (panel) {
    $$("button", panel).forEach(function (b) {
      b.addEventListener("click", function () {
        var box = b.nextElementSibling, open = box.classList.contains("max-h-0");
        box.classList.toggle("max-h-0", !open); box.classList.toggle("max-h-96", open); box.classList.toggle("pb-3", open);
        var sv = $("svg", b); if (sv) sv.classList.toggle("rotate-180", open);
      });
    });
  }

  /* ---------- scroll reveals ---------- */
  var rv = $$(".reveal, .reveal-left, .reveal-right");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("is-visible"); });

  /* ---------- hero video (desktop / mobile file, fades in once it can play) ---------- */
  var hero = $("[data-video-desktop]");
  if (hero && !reduce) {
    var v = doc.createElement("video");
    v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    v.src = window.matchMedia("(max-width: 767px)").matches ? hero.getAttribute("data-video-mobile") : hero.getAttribute("data-video-desktop");
    v.className = "absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-0";
    v.addEventListener("canplay", function () { v.classList.remove("opacity-0"); v.classList.add("opacity-100"); });
    var poster = $("img", hero); (poster ? poster.nextSibling : hero.firstChild) ; hero.insertBefore(v, poster ? poster.nextSibling : hero.firstChild);
  }

  /* ---------- YouTube facades: poster + play button until clicked ---------- */
  function playIframe(btn, id, title, aspect) {
    var wrap = doc.createElement("div");
    wrap.className = "relative " + aspect;
    var f = doc.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&modestbranding=1";
    f.title = title;
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.allowFullscreen = true;
    f.className = "absolute inset-0 w-full h-full border-0";
    wrap.appendChild(f);
    btn.parentNode.replaceChild(wrap, btn);
  }
  function aspectOf(btn) { return btn.className.replace("group relative block overflow-hidden cursor-pointer", "").trim(); }
  doc.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-video-id]");
    if (!b) return;
    playIframe(b, b.getAttribute("data-video-id"), (b.getAttribute("aria-label") || "").replace(/^Play video: /, ""), aspectOf(b));
  });

  /* ---------- accordions ---------- */
  function setGrid(box, open, openCls, closedCls) {
    openCls.forEach(function (c) { box.classList.toggle(c, open); });
    closedCls.forEach(function (c) { box.classList.toggle(c, !open); });
  }
  // FAQ: each question opens on its own
  $$("h3.m-0 > button[aria-expanded]").forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", open ? "true" : "false");
      var sv = $("svg", b); if (sv) sv.classList.toggle("rotate-180", open);
      setGrid(b.parentNode.nextElementSibling, open, ["grid-rows-[1fr]"], ["grid-rows-[0fr]"]);
    });
  });
  // therapy lists: one item open at a time across the whole block
  var therapy = $$("button[aria-expanded].group.text-left.py-2");
  therapy.forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      therapy.forEach(function (o) { set(o, false); });
      set(b, open);
    });
  });
  function set(b, open) {
    b.setAttribute("aria-expanded", open ? "true" : "false");
    var sv = $("svg:last-child", b); if (sv) { sv.classList.toggle("rotate-180", open); sv.classList.toggle("text-brand-deep", open); sv.classList.toggle("text-ink/40", !open); }
    var label = $("span", b); if (label) {
      label.classList.toggle("text-brand-ink", open); label.classList.toggle("font-semibold", open);
      label.classList.toggle("text-ink/75", !open); label.classList.toggle("group-hover:text-brand-ink", !open);
    }
    var box = b.nextElementSibling;
    setGrid(box, open, ["grid-rows-[1fr]", "opacity-100", "pb-3"], ["grid-rows-[0fr]", "opacity-0"]);
  }
  // "Hear from X": opens a small video
  $$("button[data-vid]").forEach(function (b) {
    var box = b.nextElementSibling, inner = $(".overflow-hidden", box), name = b.getAttribute("data-name");
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", open ? "true" : "false");
      b.firstChild.textContent = open ? "Thanks, " + name : "Hear from " + name;
      var sv = $("svg", b); if (sv) sv.classList.toggle("rotate-180", open);
      setGrid(box, open, ["grid-rows-[1fr]", "opacity-100", "mt-4"], ["grid-rows-[0fr]", "opacity-0"]);
      if (open && !inner.firstChild) {
        var portrait = b.getAttribute("data-portrait") === "true";
        var aspect = portrait ? "aspect-[9/16] w-full" : "aspect-video w-full";
        var title = name + " on Moinhos Velhos";
        var wrap = doc.createElement("div"); wrap.className = portrait ? "max-w-56 mx-auto" : "";
        var card = doc.createElement("div"); card.className = "rounded-xl overflow-hidden bg-brand-ink";
        card.innerHTML = '<button type="button" data-video-id="' + b.getAttribute("data-vid") + '" aria-label="Play video: ' + title + '" class="group relative block overflow-hidden cursor-pointer ' + aspect + '">' +
          '<img src="' + b.getAttribute("data-poster") + '" alt="' + title + '" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"/>' +
          '<span class="absolute inset-0 bg-brand-ink/25 transition-colors duration-300 group-hover:bg-brand-ink/10"></span>' +
          '<span class="absolute inset-0 flex items-center justify-center"><span class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 shadow-[0_16px_40px_-8px_rgba(7,51,73,0.5)] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">' +
          '<svg viewBox="0 0 24 24" class="w-6 h-6 sm:w-8 sm:h-8 text-brand-ink translate-x-0.5" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg></span></span></button>';
        wrap.appendChild(card); inner.appendChild(wrap);
      }
    });
  });

  /* ---------- testimonial scroller ---------- */
  $$('button[aria-label^="Scroll testimonials"]').forEach(function (b) {
    b.addEventListener("click", function () {
      var track = $(".snap-x", b.parentNode);
      if (track) track.scrollBy({ left: (b.getAttribute("aria-label").indexOf("back") > -1 ? -1 : 1) * Math.round(0.7 * track.clientWidth), behavior: "smooth" });
    });
  });

  /* ---------- gallery ---------- */
  var grid = $(".columns-1");
  var photos = grid ? $$("button[data-cat]", grid) : [];
  if (photos.length) {
    var filters = $$("button[data-filter]");
    var more = $$("button").filter(function (b) { return /^Show more photos/.test(b.textContent.trim()); })[0];
    var cat = "all", shown = 24;
    var CATS = { "All": "all", "People & Moments": "people", "Yoga & Workshops": "yoga", "Valley & Grounds": "valley", "Juices & Food": "food", "Beach Trip": "beach" };
    function visible() { return photos.filter(function (p) { return !p.hidden; }); }
    function render() {
      var n = 0, total = 0;
      photos.forEach(function (p) {
        var ok = cat === "all" || p.getAttribute("data-cat") === cat;
        if (ok) total++;
        var show = ok && n < shown; if (show) n++;
        p.hidden = !show;
      });
      filters.forEach(function (f) {
        var on = CATS[f.textContent.trim()] === cat;
        ["bg-brand-deep", "text-white"].forEach(function (c) { f.classList.toggle(c, on); });
        ["bg-mist", "text-brand-ink", "hover:bg-brand-deep/10"].forEach(function (c) { f.classList.toggle(c, !on); });
      });
      if (more) { more.parentNode.hidden = total <= shown; more.textContent = "Show more photos (" + (total - shown) + " more)"; }
    }
    filters.forEach(function (f) {
      f.addEventListener("click", function () {
        var label = f.textContent.trim();
        if (label === "Videos") { var v = doc.getElementById("videos"); if (v) v.scrollIntoView({ behavior: "smooth" }); return; }
        cat = CATS[label] || "all"; shown = 24; render();
      });
    });
    if (more) more.addEventListener("click", function () { shown += 36; render(); });

    /* lightbox */
    var box = null, idx = 0, list = [];
    function show(i) {
      idx = (i + list.length) % list.length;
      var im = $("img", list[idx]);
      $("img", box).src = im.getAttribute("src"); $("img", box).alt = im.alt; $("p", box).textContent = im.alt;
      box.setAttribute("aria-label", im.alt);
    }
    function closeBox() { if (!box) return; box.remove(); box = null; body.style.overflow = ""; doc.removeEventListener("keydown", keys); }
    function keys(e) { if (e.key === "Escape") closeBox(); if (e.key === "ArrowLeft") show(idx - 1); if (e.key === "ArrowRight") show(idx + 1); }
    function open(i) {
      list = visible();
      box = doc.createElement("div");
      box.className = "fixed inset-0 z-[100] bg-brand-ink/95 flex items-center justify-center p-4 sm:p-8";
      box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
      var btn = "text-white/80 hover:text-white p-2 sm:p-3 rounded-full hover:bg-white/10 transition-colors";
      box.innerHTML =
        '<button type="button" aria-label="Close" class="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"><svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>' +
        '<button type="button" data-dir="-1" aria-label="Previous photo" class="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 ' + btn + '"><svg class="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg></button>' +
        '<button type="button" data-dir="1" aria-label="Next photo" class="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 ' + btn + '"><svg class="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button>' +
        '<div class="max-w-5xl max-h-[85vh] w-full"><img class="w-full h-auto max-h-[85vh] object-contain rounded-lg mx-auto" alt=""/><p class="text-white/70 text-sm text-center mt-4"></p></div>';
      box.addEventListener("click", function (e) {
        var d = e.target.closest("[data-dir]");
        if (d) { e.stopPropagation(); show(idx + (+d.getAttribute("data-dir"))); return; }
        if (e.target.closest("button[aria-label=Close]") || !e.target.closest(".max-w-5xl")) closeBox();
      });
      body.appendChild(box); body.style.overflow = "hidden";
      doc.addEventListener("keydown", keys);
      show(i);
    }
    grid.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-cat]"); if (!b) return;
      open(visible().indexOf(b));
    });
  }

  /* ---------- gallery videos: 12 at a time ---------- */
  var moreVid = $$("button").filter(function (b) { return /^Show more videos/.test(b.textContent.trim()); })[0];
  if (moreVid) {
    moreVid.addEventListener("click", function () {
      var hidden = $$("figure[data-more-videos][hidden]");
      hidden.slice(0, 12).forEach(function (f) { f.hidden = false; });
      var left = hidden.length - 12;
      if (left <= 0) moreVid.parentNode.hidden = true; else moreVid.textContent = "Show more videos (" + left + " more)";
    });
  }

  /* ---------- reviews widget (Trustindex, the client's own account) ---------- */
  var ti = $("[data-trustindex]");
  if (ti && !ti.getAttribute("data-ti-loaded")) {
    ti.setAttribute("data-ti-loaded", "1");
    var src = ti.getAttribute("data-trustindex");
    var slot = doc.createElement("div"); slot.setAttribute("data-src", src); ti.appendChild(slot);
    if (window.Trustindex) window.Trustindex.loadWidgetsFromDom();
    else {
      var sc = doc.createElement("script"); sc.src = src; sc.defer = true; sc.async = true;
      sc.setAttribute("data-ti-widget-inited", "true"); ti.appendChild(sc);
    }
  }

  /* ---------- contact form ---------- */
  var form = $("form[data-endpoint]");
  if (form) {
    var submit = $('button[type="submit"]', form), orig = submit.textContent;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var data = { name: f.name.value, email: f.email.value, message: f.message.value, optIn: !!(f.optIn && f.optIn.checked) };
      submit.disabled = true; submit.textContent = "Sending…";
      var ep = form.getAttribute("data-endpoint"), base = ((window.MV_CONFIG && window.MV_CONFIG.apiBase) || "").replace(/\/$/, "");
      fetch(ep.indexOf("/api/") === 0 ? base + ep : ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error("Request failed"); form.hidden = true; var ok = doc.getElementById("contact-sent"); if (ok) ok.hidden = false; form.reset(); })
        .catch(function () { submit.textContent = "Something went wrong - please email detox@moinhos-velhos.com"; setTimeout(function () { submit.textContent = orig; }, 5000); })
        .then(function () { submit.disabled = false; if (submit.textContent === "Sending…") submit.textContent = orig; });
    });
  }
})();

/* ---------- newsletter: band above the footer + one-time pop-up (Richard, 30-10-2026) ----------
   Signs people up to the Moinhos Velhos Mailchimp audience through its embedded form's JSONP endpoint,
   so the visitor never leaves the page. The 5% code (WELCOME5) goes out in Mailchimp's welcome email.
   Not shown on the booking pages, so nothing interrupts a booking. */
(function () {
  var doc = document, path = location.pathname;
  if (/\/book(\/|$)/.test(path)) return;
  var footer = doc.querySelector("footer");
  if (!footer) return;

  var MC = "https://moinhos-velhos.us12.list-manage.com/subscribe/post-json?u=7231362f0011a6405e818c5c6&id=a61427e01a&f_id=00378ae3f0";
  var TRAP = "b_7231362f0011a6405e818c5c6_a61427e01a";
  var COPY = {
    eyebrow: "A little something for your first retreat",
    title: "Enjoy 5% off your first retreat",
    lead: "Join our newsletter and we'll email you a 5% code to use on your first booking.",
    button: "Get my 5% discount",
    small: "By signing up you agree to receive our emails. You can unsubscribe at any time."
  };
  var KEY = "mv-newsletter"; // "joined" for good, or the time the pop-up was closed
  var store = {
    get: function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set: function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  };
  var site = (function () {
    var s = doc.querySelector('script[src*="js/site.js"]');
    return s ? s.src.replace(/js\/site\.js.*$/, "") : "/";
  })();

  var css = ""
    + ".mv-nl{background:var(--mist);padding:56px 16px}"
    + ".mv-nl__inner{max-width:72rem;margin:0 auto;display:grid;gap:28px;align-items:center}"
    + "@media(min-width:64rem){.mv-nl{padding:72px 32px}.mv-nl__inner{grid-template-columns:1fr 1fr;gap:56px}}"
    + ".mv-nl__eyebrow{font-size:16px;font-style:italic;font-weight:600;color:var(--brand-deep);margin:0 0 10px}"
    + ".mv-nl__title{font-size:34px;line-height:1.1;font-weight:600;color:var(--brand-ink);margin:0}"
    + "@media(min-width:40rem){.mv-nl__title{font-size:42px}}"
    + ".mv-nl__lead{font-size:17px;line-height:1.6;color:rgba(16,34,46,.75);margin:14px 0 0}"
    + ".mv-nl__row{display:grid;gap:12px}"
    + "@media(min-width:40rem){.mv-nl__row{grid-template-columns:1fr 1fr}}"
    + ".mv-nl__field{display:block}"
    + ".mv-nl__label{display:block;font-size:16px;font-weight:600;color:var(--brand-ink);margin-bottom:6px}"
    + ".mv-nl__input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:13px 16px;border:1.5px solid rgba(16,34,46,.18);border-radius:12px;background:#fff;color:var(--ink)}"
    + ".mv-nl__input:focus{outline:none;border-color:var(--brand-deep);box-shadow:0 0 0 3px rgba(12,124,171,.18)}"
    + ".mv-nl__btn{margin-top:14px;width:100%;justify-content:center;border:0;cursor:pointer;font-size:16px}"
    + ".mv-nl__btn[disabled]{opacity:.7;cursor:wait}"
    + ".mv-nl__msg{font-size:16px;line-height:1.5;margin:12px 0 0;min-height:1px}"
    + ".mv-nl__msg.is-ok{color:var(--leaf-deep);font-weight:600}.mv-nl__msg.is-err{color:#b42318}"
    + ".mv-nl__small{font-size:16px;line-height:1.5;color:rgba(16,34,46,.6);margin:12px 0 0}"
    + ".mv-nl__trap{position:absolute;left:-5000px}"
    + ".mv-pop{position:fixed;inset:0;z-index:100;display:flex;align-items:flex-end;justify-content:center;background:rgba(7,51,73,.55);padding:0}"
    + "@media(min-width:40rem){.mv-pop{align-items:center;padding:24px}}"
    + ".mv-pop[hidden]{display:none}"
    + ".mv-pop__card{position:relative;width:100%;max-width:520px;max-height:92vh;overflow:auto;background:#fff;border-radius:24px 24px 0 0;box-shadow:0 32px 64px -24px rgba(7,51,73,.5)}"
    + "@media(min-width:40rem){.mv-pop__card{border-radius:24px}}"
    + ".mv-pop__img{display:block;width:100%;height:140px;object-fit:cover}"
    + "@media(min-width:40rem){.mv-pop__img{height:180px}}"
    + ".mv-pop__body .mv-nl__form{margin-top:20px}"
    + ".mv-pop__body{padding:24px 24px 28px}"
    + ".mv-pop__body .mv-nl__title{font-size:30px}"
    + ".mv-pop__close{position:absolute;top:12px;right:12px;width:44px;height:44px;border-radius:999px;border:0;background:rgba(255,255,255,.95);color:var(--brand-ink);font-size:26px;line-height:1;cursor:pointer;box-shadow:0 6px 16px -6px rgba(7,51,73,.4)}"
    + ".mv-pop__close:focus-visible{outline:3px solid var(--brand-deep);outline-offset:2px}"
    /* phones get a small bar instead of the pop-up: it never locks the page or covers it */
    + ".mv-bar{position:fixed;left:12px;right:12px;bottom:calc(88px + env(safe-area-inset-bottom));z-index:45;display:flex;align-items:center;gap:10px;padding:10px 6px 10px 18px;background:var(--brand-ink);color:#fff;border-radius:18px;box-shadow:0 16px 40px -12px rgba(7,51,73,.6);transition:transform .35s,opacity .35s}"
    + ".mv-nl .mv-nl__form{scroll-margin-top:96px}"
    + ".mv-bar.is-off{transform:translateY(24px);opacity:0;pointer-events:none}"
    + ".mv-bar__text{flex:1;margin:0;font-size:16px;line-height:1.3;font-weight:600}"
    + ".mv-bar__go{flex:none;border:0;border-radius:999px;background:var(--leaf);color:#fff;font:inherit;font-size:16px;font-weight:600;padding:10px 18px;cursor:pointer}"
    + ".mv-bar__x{flex:none;width:44px;height:44px;border:0;background:transparent;color:#fff;font-size:26px;line-height:1;cursor:pointer}"
    + ".mv-bar button:focus-visible{outline:3px solid #fff;outline-offset:2px}";
  var st = doc.createElement("style"); st.textContent = css; doc.head.appendChild(st);

  var uid = 0;
  function formHtml() {
    uid++;
    return '<form class="mv-nl__form" novalidate>'
      + '<div class="mv-nl__row">'
      + '<label class="mv-nl__field"><span class="mv-nl__label">First name</span><input class="mv-nl__input" type="text" name="FNAME" autocomplete="given-name" id="mv-nl-n' + uid + '"></label>'
      + '<label class="mv-nl__field"><span class="mv-nl__label">Email</span><input class="mv-nl__input" type="email" name="EMAIL" autocomplete="email" required id="mv-nl-e' + uid + '"></label>'
      + '</div>'
      + '<div class="mv-nl__trap" aria-hidden="true"><input type="text" name="' + TRAP + '" tabindex="-1" value=""></div>'
      + '<button type="submit" class="mv-nl__btn inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-wider px-7 py-3.5 rounded-full transition-all duration-300 bg-leaf text-white hover:bg-leaf-deep">' + COPY.button + '</button>'
      + '<p class="mv-nl__msg" role="status" aria-live="polite"></p>'
      + '<p class="mv-nl__small">' + COPY.small + '</p>'
      + '</form>';
  }
  function copyHtml(tag, id) {
    return '<p class="mv-nl__eyebrow">' + COPY.eyebrow + '</p>'
      + '<' + tag + ' class="mv-nl__title font-display" id="' + id + '">' + COPY.title + '</' + tag + '>'
      + '<p class="mv-nl__lead">' + COPY.lead + '</p>';
  }

  function joined() {
    store.set("joined");
    var p = doc.querySelector(".mv-pop"); if (p && !p.hidden) setTimeout(closePop, 2600);
    var b = doc.querySelector(".mv-bar"); if (b) b.remove();
  }

  function bind(form) {
    var btn = form.querySelector("button"), msg = form.querySelector(".mv-nl__msg"), label = btn.textContent;
    function say(text, ok) { msg.textContent = text; msg.className = "mv-nl__msg " + (ok ? "is-ok" : "is-err"); }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = form.EMAIL.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say("Please enter a valid email address.", false); form.EMAIL.focus(); return; }
      if (form[TRAP].value) return;
      btn.disabled = true; btn.textContent = "Signing you up…"; say("", true);
      var cb = "mvNl" + Date.now(), s = doc.createElement("script"), done = false;
      var timer = setTimeout(function () { finish({ result: "error", msg: "" }); }, 12000);
      function finish(r) {
        if (done) return; done = true; clearTimeout(timer);
        try { delete window[cb]; } catch (x) { window[cb] = undefined; }
        if (s.parentNode) s.parentNode.removeChild(s);
        btn.disabled = false; btn.textContent = label;
        var m = String(r && r.msg || "").toLowerCase();
        if (r && r.result === "success") {
          say(m.indexOf("confirm") > -1
            ? "Almost done! Please check your inbox and confirm your email address."
            : "Thank you for joining! Look out for your 5% code in your inbox.", true);
          form.reset(); joined();
        } else if (m.indexOf("already subscribed") > -1) {
          say("You're already on our list. Thank you!", true); joined();
        } else if (m.indexOf("too many") > -1) {
          say("Thanks! That address was signed up recently, so please check your inbox.", true);
        } else if (/^\d+ - /.test(m) || m.indexOf("email address") > -1) { // Mailchimp field errors, e.g. "0 - An email address must contain a single @."
          say("Please check your email address and try again.", false);
        } else {
          say("Sorry, that didn't go through. Please try again in a moment.", false);
        }
      }
      window[cb] = finish;
      s.onerror = function () { finish({ result: "error", msg: "" }); };
      s.src = MC + "&c=" + cb + "&EMAIL=" + encodeURIComponent(email) + "&FNAME=" + encodeURIComponent(form.FNAME.value.trim()) + "&" + TRAP + "=";
      doc.body.appendChild(s);
    });
  }

  /* the band, on every page above the footer */
  var band = doc.createElement("section");
  band.className = "mv-nl"; band.setAttribute("aria-labelledby", "mv-nl-title");
  band.innerHTML = '<div class="mv-nl__inner"><div>' + copyHtml("h2", "mv-nl-title") + "</div>" + formHtml() + "</div>";
  footer.parentNode.insertBefore(band, footer);
  bind(band.querySelector("form"));

  /* the pop-up: once per visitor, after a short delay or half a page of scrolling; quiet for 60 days if closed */
  var seen = store.get();
  if (seen === "joined" || (seen && Date.now() - Number(seen) < 60 * 864e5)) return;
  var pop, lastFocus;
  function closePop() {
    if (!pop || pop.hidden) return;
    pop.hidden = true; doc.documentElement.style.overflow = "";
    if (store.get() !== "joined") store.set(String(Date.now()));
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openBar() {
    var bar = doc.createElement("div");
    bar.className = "mv-bar is-off"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Newsletter offer");
    bar.innerHTML = '<p class="mv-bar__text">Get 5% off your first retreat</p>'
      + '<button type="button" class="mv-bar__go">Sign up</button>'
      + '<button type="button" class="mv-bar__x" aria-label="Close">&times;</button>';
    doc.body.appendChild(bar);
    function done() { if (store.get() !== "joined") store.set(String(Date.now())); bar.remove(); }
    bar.querySelector(".mv-bar__x").addEventListener("click", done);
    bar.querySelector(".mv-bar__go").addEventListener("click", function () {
      done();
      band.querySelector("input[name=FNAME]").focus({ preventScroll: true }); // inside the tap, so the phone keyboard opens
      band.querySelector("form").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    // step aside while the sign-up band itself is on screen
    var r = band.getBoundingClientRect(), near = r.top < window.innerHeight && r.bottom > 0;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { near = en[0].isIntersecting; bar.classList.toggle("is-off", near); }).observe(band);
    setTimeout(function () { if (!near) bar.classList.remove("is-off"); }, 60); // a beat later, so it slides in
  }
  function openPop() {
    if (pop || store.get() === "joined") return;
    var bandForm = band.querySelector("form");
    if (bandForm && bandForm.contains(doc.activeElement)) return; // already signing up below
    if (window.matchMedia("(max-width: 39.99rem)").matches) { pop = true; openBar(); return; }
    pop = doc.createElement("div");
    pop.className = "mv-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-modal", "true"); pop.setAttribute("aria-labelledby", "mv-pop-title");
    pop.innerHTML = '<div class="mv-pop__card"><button type="button" class="mv-pop__close" aria-label="Close">&times;</button>'
      + '<img class="mv-pop__img" src="' + site + 'images/hero-poster-w640.webp" alt="" width="640" height="360">'
      + '<div class="mv-pop__body">' + copyHtml("h2", "mv-pop-title") + formHtml() + "</div></div>";
    doc.body.appendChild(pop);
    lastFocus = doc.activeElement; doc.documentElement.style.overflow = "hidden";
    bind(pop.querySelector("form"));
    pop.querySelector(".mv-pop__close").addEventListener("click", closePop);
    pop.addEventListener("click", function (e) { if (e.target === pop) closePop(); });
    doc.addEventListener("keydown", function (e) {
      if (pop.hidden) return;
      if (e.key === "Escape") { closePop(); return; }
      if (e.key === "Tab") { // keep focus inside the dialog
        var f = [].slice.call(pop.querySelectorAll("button,input:not([tabindex='-1'])")), a = f[0], z = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    // focus the close button, not a field, so a phone keyboard does not jump up uninvited
    setTimeout(function () { pop.querySelector(".mv-pop__close").focus({ preventScroll: true }); }, 50);
  }
  var t = setTimeout(openPop, 15000);
  function onScroll() {
    var h = doc.documentElement;
    if (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) > 0.5) { clearTimeout(t); window.removeEventListener("scroll", onScroll); openPop(); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
})();
