/* Site de l'Amicale des anciens du 1er Bataillon de choc et du C.N.E.C. */
(function () {
  "use strict";

  /* ---- menu déroulant « L'association » ---- */
  function closeMenus() {
    document.querySelectorAll(".menu").forEach(function (m) { m.hidden = true; });
    document.querySelectorAll("[data-menu]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-menu]");
    if (t) {
      var panel = document.getElementById("menu-" + t.dataset.menu);
      var open = !panel.hidden;
      closeMenus();
      panel.hidden = open;
      t.setAttribute("aria-expanded", String(!open));
      return;
    }
    if (!e.target.closest(".menu")) closeMenus();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenus(); });

  /* ---- menu mobile ---- */
  var burger = document.getElementById("burger");
  if (burger) burger.addEventListener("click", function () {
    var open = document.body.classList.toggle("menuopen");
    burger.setAttribute("aria-expanded", String(open));
  });

  /* ---- filet sous l'en-tête au défilement ---- */
  var hdr = document.getElementById("hdr");
  if (hdr) window.addEventListener("scroll", function () {
    hdr.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });

  /* ---- filtres (galerie, actualités) ---- */
  function bindFilter(attr, itemsSel) {
    document.querySelectorAll("[" + attr + "]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var scope = btn.closest("main") || document;
        scope.querySelectorAll("[" + attr + "]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        var val = btn.getAttribute(attr);
        scope.querySelectorAll(itemsSel).forEach(function (it) {
          it.hidden = !(val === "tous" || it.dataset.cat === val);
        });
      });
    });
  }
  bindFilter("data-galfilter", ".gal figure");
  bindFilter("data-newsfilter", ".news article");

  /* ---- visionneuse ---- */
  var lb = document.getElementById("lightbox"),
      lbImg = document.getElementById("lb-img"),
      lbCap = document.getElementById("lb-cap"),
      lastFocus = null;

  function openLightbox(src, alt, caption) {
    lbImg.src = src; lbImg.alt = alt || "";
    lbCap.textContent = caption || ""; lbCap.hidden = !caption;
    lb.hidden = false;
    document.getElementById("lb-close").focus();
  }
  function closeLightbox() {
    lb.hidden = true; lbImg.src = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (lb) {
    document.addEventListener("click", function (e) {
      if (e.target.closest("#lightbox")) {
        if (e.target.closest("#lb-close") || !e.target.closest(".frame")) closeLightbox();
        return;
      }
      var trigger = e.target.closest(".prodphoto, .photo img, .sitephoto, .gal img");
      if (!trigger) return;
      lastFocus = document.activeElement;
      var img = trigger.tagName === "IMG" ? trigger : trigger.querySelector("img");
      if (!img) return;
      var cap = trigger.dataset.caption;
      if (!cap) {
        var fig = trigger.closest("figure");
        var fc = fig && fig.querySelector("figcaption");
        cap = fc ? fc.textContent.trim() : img.alt;
      }
      openLightbox(img.currentSrc || img.src, img.alt, cap);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lb.hidden) closeLightbox();
    });
  }
})();
