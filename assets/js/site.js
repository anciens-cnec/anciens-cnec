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

  var serie = [], rang = -1;
  function legende(img) {
    var cap = img.dataset.caption;
    if (!cap) {
      var fig = img.closest("figure");
      var fc = fig && fig.querySelector("figcaption");
      cap = fc ? fc.textContent.trim() : img.alt;
    }
    return cap;
  }
  function openLightbox(src, alt, caption) {
    lbImg.src = src; lbImg.alt = alt || "";
    var compte = serie.length > 1 ? "  ·  " + (rang + 1) + " / " + serie.length : "";
    lbCap.textContent = (caption || "") + compte; lbCap.hidden = !(caption || compte);
    var p = document.getElementById("lb-prev"), n = document.getElementById("lb-next");
    if (p) p.hidden = serie.length < 2;
    if (n) n.hidden = serie.length < 2;
    lb.hidden = false;
    document.getElementById("lb-close").focus();
  }
  function aller(pas) {
    if (serie.length < 2) return;
    rang = (rang + pas + serie.length) % serie.length;
    var img = serie[rang];
    openLightbox(img.currentSrc || img.src, img.alt, legende(img));
  }
  function closeLightbox() {
    lb.hidden = true; lbImg.src = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (lb) {
    document.addEventListener("click", function (e) {
      if (e.target.closest("#lightbox")) {
        if (e.target.closest("#lb-prev")) return aller(-1);
        if (e.target.closest("#lb-next")) return aller(1);
        if (e.target.closest("#lb-close") || !e.target.closest(".frame")) closeLightbox();
        return;
      }
      var trigger = e.target.closest(".prodphoto, .photo img, .sitephoto, .gal img");
      if (!trigger) return;
      lastFocus = document.activeElement;
      var img = trigger.tagName === "IMG" ? trigger : trigger.querySelector("img");
      if (!img) return;
      var cap = trigger.dataset.caption || legende(img);
      var album = img.closest(".album");
      serie = album ? Array.prototype.slice.call(document.querySelectorAll(".album img")) : [];
      rang = serie.indexOf(img);
      openLightbox(img.currentSrc || img.src, img.alt, cap);
    });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") aller(-1);
      else if (e.key === "ArrowRight") aller(1);
    });
  }

  /* ---- afficher ou masquer un mot de passe ----
     Ajoute un oeil au bout de chaque champ de mot de passe de la page.
     Vaut pour l'espace membres, l'administration et la page des delegues. */
  var OEIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.8 12S5.5 5 12 5s10.2 7 10.2 7-3.7 7-10.2 7S1.8 12 1.8 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  var OEIL_BARRE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10.2 7 10.2 7a18 18 0 0 1-2.8 3.6M6.3 6.8A18 18 0 0 0 1.8 12S5.5 19 12 19a9.8 9.8 0 0 0 4-.8"/><path d="m9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m3 3 18 18"/></svg>';

  document.querySelectorAll('input[type="password"]').forEach(function (champ) {
    if (champ.dataset.oeil) return;
    champ.dataset.oeil = "1";

    var enveloppe = document.createElement("span");
    enveloppe.className = "mdp-hote";
    champ.parentNode.insertBefore(enveloppe, champ);
    enveloppe.appendChild(champ);

    var b = document.createElement("button");
    b.type = "button";
    b.className = "voir-mdp";
    b.innerHTML = OEIL;
    b.setAttribute("aria-label", "Afficher le mot de passe");
    b.title = "Afficher le mot de passe";

    b.addEventListener("click", function () {
      var masque = champ.type === "password";
      champ.type = masque ? "text" : "password";
      b.innerHTML = masque ? OEIL_BARRE : OEIL;
      var texte = masque ? "Masquer le mot de passe" : "Afficher le mot de passe";
      b.setAttribute("aria-label", texte);
      b.title = texte;
      champ.focus();
    });

    enveloppe.appendChild(b);
  });
})();
