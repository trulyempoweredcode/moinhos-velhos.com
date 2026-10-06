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
      fetch(form.getAttribute("data-endpoint"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error("Request failed"); form.hidden = true; var ok = doc.getElementById("contact-sent"); if (ok) ok.hidden = false; form.reset(); })
        .catch(function () { submit.textContent = "Something went wrong - please email detox@moinhos-velhos.com"; setTimeout(function () { submit.textContent = orig; }, 5000); })
        .then(function () { submit.disabled = false; if (submit.textContent === "Sending…") submit.textContent = orig; });
    });
  }
})();
