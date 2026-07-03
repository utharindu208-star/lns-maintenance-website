/* LNS Maintenance — static site interactions (no dependencies) */
(function () {
  "use strict";

  // Current year in footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu toggle
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Animated stat counters
  function runCounter(el) {
    var to = parseFloat(el.getAttribute("data-to"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (reduceMotion) { el.textContent = to.toFixed(decimals); return; }
    var dur = 1500, start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      // easeOutExpo
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = (to * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = to.toFixed(decimals);
    }
    requestAnimationFrame(frame);
  }

  // Scroll reveal + trigger counters when their stat reveals
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        entry.target.querySelectorAll(".count").forEach(runCounter);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    // Fallback: show everything, set final counter values
    reveals.forEach(function (el) { el.classList.add("in"); });
    document.querySelectorAll(".count").forEach(function (el) {
      var to = parseFloat(el.getAttribute("data-to"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      el.textContent = to.toFixed(decimals);
    });
  }
})();
