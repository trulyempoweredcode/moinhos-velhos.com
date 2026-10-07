/* Runs the booking wizard on /book/.
   The wizard itself is the original page code in js/booking/wizard.js (React). This file only stands in for the
   framework that code expected: a tiny module loader, an <img> for next/image, and the address of the booking API. */
(function () {
  var cfg = window.MV_CONFIG || {};
  var API = (cfg.apiBase || "").replace(/\/$/, "");
  // testing only: on localhost, ?api=http://localhost:8150 points the wizard at a local booking server (remembered for the session)
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    try { var q = new URLSearchParams(location.search).get("api"); if (q) { sessionStorage.setItem("mv_api", q); } var o = sessionStorage.getItem("mv_api"); if (o) { API = o.replace(/\/$/, ""); } } catch (e) {}
  }
  var mount = document.getElementById("booking-app");
  if (!mount || !window.React || !window.ReactDOM) { return; }
  var React = window.React;
  // path to the site root from this page (the page is /book/, so one level up)
  var ROOT = (function () {
    var s = document.currentScript || document.querySelector('script[src$="js/booking.js"]');
    var src = s ? s.getAttribute("src") : "../js/booking.js";
    return src.replace(/js\/booking\.js.*$/, "");
  })();
  var assetUrl = function (u) { return typeof u === "string" && u.charAt(0) === "/" && u.charAt(1) !== "/" ? ROOT + u.slice(1) : u; };

  // /api/... calls go to the booking server
  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (u, o) { return nativeFetch(typeof u === "string" && u.indexOf("/api/") === 0 ? API + u : u, o); };

  // ---- module registry from the original chunks
  var factories = {}, cache = {};
  (window.TURBOPACK || []).forEach(function (entry) {
    for (var i = 1; i + 1 < entry.length; i += 2) { if (typeof entry[i] === "number" && typeof entry[i + 1] === "function") { factories[entry[i]] = entry[i + 1]; } }
  });

  var jsx = function (type, props, key) { if (key != null) { props = Object.assign({ key: key }, props); } return React.createElement(type, props); };
  function Img(p) {
    var style = p.fill ? { position: "absolute", height: "100%", width: "100%", left: 0, top: 0, right: 0, bottom: 0, color: "transparent" } : undefined;
    return React.createElement("img", { src: assetUrl(p.src), alt: p.alt || "", className: p.className, width: p.width, height: p.height, sizes: p.sizes, style: style, loading: p.priority ? "eager" : "lazy", decoding: "async" });
  }
  var shims = {
    43476: { jsx: jsx, jsxs: jsx, Fragment: React.Fragment },
    71645: React,
    57688: { default: Img }
  };

  function load(id) {
    if (shims[id]) { return shims[id]; }
    if (cache[id]) { return cache[id].exports; }
    if (!factories[id]) { throw new Error("booking: missing module " + id); }
    var m = cache[id] = { exports: {} };
    var e = function () {};
    e.i = e.r = load;
    e.s = function (arr) {
      for (var i = 0; i < arr.length;) {
        if (typeof arr[i] !== "string") { break; }
        var name = arr[i];
        if (arr[i + 1] === 0) { m.exports[name] = arr[i + 2]; i += 3; }
        else { (function (n, g) { Object.defineProperty(m.exports, n, { enumerable: true, get: g }); })(name, arr[i + 1]); i += 2; }
      }
    };
    factories[id](e, m, m.exports);
    return m.exports;
  }

  // 27657 is the wizard module
  var Wizard = load(27657).default;
  window.ReactDOM.createRoot(mount).render(React.createElement(Wizard));

  // links inside the wizard are written as /terms etc: make them work from any base path
  function fixLinks() {
    var as = mount.querySelectorAll('a[href^="/"]');
    for (var i = 0; i < as.length; i++) {
      var h = as[i].getAttribute("href");
      if (h.charAt(1) !== "/") { as[i].setAttribute("href", ROOT + h.slice(1).replace(/\/?$/, "/")); }
    }
  }
  new MutationObserver(fixLinks).observe(mount, { childList: true, subtree: true });
})();
