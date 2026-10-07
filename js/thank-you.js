/* /book/thank-you/?ref=MV-XXXXXX : after card payment, waits for the payment to be confirmed. */
(function () {
  var root = document.getElementById("thanks-app");
  if (!root) { return; }
  var cfg = window.MV_CONFIG || {};
  var API = (cfg.apiBase || "").replace(/\/$/, "");
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {   // testing only: ?api=http://localhost:8150 (remembered for the session)
    try { var q = new URLSearchParams(location.search).get("api"); if (q) { sessionStorage.setItem("mv_api", q); } var o = sessionStorage.getItem("mv_api"); if (o) { API = o.replace(/\/$/, ""); } } catch (e) {}
  }
  var refs = (new URLSearchParams(location.search).get("ref") || "").split(",").filter(function (r) { return /^MV-[A-Z0-9]{6}$/.test(r); });
  var title = document.getElementById("thanks-title"), text = document.getElementById("thanks-text");
  if (!refs.length) { title.textContent = "Booking"; text.textContent = "We could not find your booking reference. If you have just paid, you will receive a confirmation email shortly."; return; }
  var tries = 0;
  function check() {
    Promise.all(refs.map(function (r) { return fetch(API + "/api/bookings/status?ref=" + r).then(function (x) { return x.json(); }); })).then(function (list) {
      var paid = list.every(function (b) { return b.status === "paid"; });
      var name = list[0].firstName;
      if (paid) {
        title.textContent = "Thank you, " + name;
        text.textContent = "Your deposit has been received and your place is secured. We have emailed you a confirmation with a link to tell us about your health, diet and travel. If it has not arrived within a few minutes, please check your spam folder or contact us.";
      } else if (++tries < 20) {
        title.textContent = "Confirming your payment…";
        text.textContent = "This usually takes a few seconds. Please keep this page open.";
        setTimeout(check, 3000);
      } else {
        title.textContent = "We are still confirming your payment";
        text.textContent = "If you have paid, your confirmation email will arrive shortly. If you have any questions, please contact us.";
      }
    }).catch(function () { if (++tries < 20) { setTimeout(check, 4000); } });
  }
  check();
})();
