/* ==========================================================================
   LA VOÛTE DES SENS — motion layer
   Everything animates through transform / opacity only.
   Scroll work runs inside a single rAF loop; reveals use IntersectionObserver.
   ========================================================================== */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine    = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------------------------------------------------------- preloader */
  const preloader = $("#preloader");

  let pageRevealed = false;

  const revealPage = () => {
    if (pageRevealed) return;
    pageRevealed = true;
    preloader?.classList.add("is-done");
    document.body.classList.remove("is-locked");
    // let the hero title fire once the curtain starts lifting
    setTimeout(() => document.body.classList.add("is-ready"), 120);

    // the lock resets scroll, so honour a deep link once we are unlocked again
    const target = location.hash && document.querySelector(location.hash);
    if (target) {
      requestAnimationFrame(() =>
        target.scrollIntoView({ behavior: "instant", block: "start" })
      );
    }
  };

  // Only the page that actually has a curtain may lock scrolling — the blog pages
  // have no preloader and must stay scrollable from the first frame.
  if (preloader) document.body.classList.add("is-locked");

  if (reduced || !preloader) {
    revealPage();
  } else {
    const hero = $("#heroImg");
    const minimum = new Promise((r) => setTimeout(r, 450));
    const heroReady = hero && !hero.complete
      ? new Promise((r) => { hero.addEventListener("load", r, { once: true });
                             hero.addEventListener("error", r, { once: true }); })
      : Promise.resolve();
    Promise.all([minimum, heroReady]).then(revealPage);
    // safety net: never trap the page behind a stalled asset
    setTimeout(revealPage, 3000);
  }

  /* ------------------------------------------------------------ reveals */
  const revealTargets = $$(".reveal, .reveal-soft, .curtain, .rule-draw, [data-map]");

  // titles: a .line-mask inside a .reveal is driven by the parent's is-in
  const maskTargets = $$(".line-mask").filter((el) => !el.closest(".reveal, .reveal-soft"));

  if (reduced) {
    [...revealTargets, ...maskTargets].forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    [...revealTargets, ...maskTargets].forEach((el) => io.observe(el));

    // hero masks are not scroll-driven — they play with the preloader
    const heroTitle = $("#heroTitle");
    if (heroTitle) {
      const play = () => $$(".line-mask", heroTitle).forEach((m) => m.classList.add("is-in"));
      preloader ? setTimeout(play, 900) : play();
    }
    $$("#main > section:first-of-type .reveal-soft").forEach((el) => {
      setTimeout(() => el.classList.add("is-in"), 900);
    });
  }

  /* ------------------------------------- scroll: nav, progress, parallax */
  const nav        = $("#navIsland");
  // pages sans photo en tête (nav déjà condensé au chargement) gardent ce style en permanence
  const navAlwaysCondensed = nav?.classList.contains("is-condensed");
  const progress   = $("#progressBar");
  const parallaxEl = $$("[data-parallax]");

  let lastY   = window.scrollY;
  let ticking = false;

  const onFrame = () => {
    const y   = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (nav && !navAlwaysCondensed) {
      nav.classList.toggle("is-condensed", y > 40);
    }

    if (progress && max > 0) {
      progress.style.transform = `scaleX(${Math.min(y / max, 1)})`;
    }

    if (!reduced && window.innerWidth >= 768) {
      parallaxEl.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        const speed  = parseFloat(el.dataset.parallax) || 0;
        const centre = rect.top + rect.height / 2 - window.innerHeight / 2;
        el.style.transform = `translate3d(0, ${(-centre * speed).toFixed(2)}px, 0)`;
      });
    }

    lastY = y;
    ticking = false;
  };

  const requestFrame = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onFrame);
  };

  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame, { passive: true });
  onFrame();

  /* --------------------------------------------------------------- menu */
  const menuBtn     = $("#menuBtn");
  const menuOverlay = $("#menuOverlay");

  const setMenu = (open) => {
    if (!menuBtn || !menuOverlay) return;
    menuBtn.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menuOverlay.classList.toggle("is-open", open);
    document.body.classList.toggle("is-locked", open);
  };

  menuBtn?.addEventListener("click", () =>
    setMenu(!menuOverlay.classList.contains("is-open"))
  );
  $$("[data-menu-link]").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ----------------------------------------------------------- lightbox */
  const lightbox = $("#lightbox");
  const lbImg    = $("#lbImg");
  const lbCap    = $("#lbCaption");
  const triggers = $$("[data-lightbox]");
  let lbIndex    = 0;

  const showSlide = (i) => {
    if (!triggers.length) return;
    lbIndex = (i + triggers.length) % triggers.length;
    const source = $("img", triggers[lbIndex]);
    lbImg.src = source.getAttribute("src");
    lbImg.alt = source.getAttribute("alt") || "";
    lbCap.textContent = triggers[lbIndex].dataset.caption || "";
  };

  const openLightbox = (i) => {
    showSlide(i);
    lightbox.classList.add("is-open");
    document.body.classList.add("is-locked");
    $("#lbClose")?.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  };

  triggers.forEach((t, i) => t.addEventListener("click", () => openLightbox(i)));
  $("#lbClose")?.addEventListener("click", closeLightbox);
  $("#lbPrev") ?.addEventListener("click", () => showSlide(lbIndex - 1));
  $("#lbNext") ?.addEventListener("click", () => showSlide(lbIndex + 1));
  lightbox?.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeLightbox(); setMenu(false); }
    if (!lightbox?.classList.contains("is-open")) return;
    if (e.key === "ArrowLeft")  showSlide(lbIndex - 1);
    if (e.key === "ArrowRight") showSlide(lbIndex + 1);
  });

  /* ------------------------------------------------------------- cursor */
  if (fine && !reduced) {
    const dot  = $("#cursorDot");
    const ring = $("#cursorRing");
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      if (dot)  dot.style.transform  = `translate3d(${mx}px, ${my}px, 0)`;
      if (ring) ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`;
      requestAnimationFrame(loop);
    })();

    const hot = "a, button, [data-cursor='grow'], .gal-item";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hot)) document.body.classList.add("cursor-active");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hot)) document.body.classList.remove("cursor-active");
    });
  }

  /* ------------------------------------------------- booking engine frame */
  const bookingFrame = $("[data-booking-frame]");
  if (bookingFrame) {
    const skeleton = $("[data-skeleton]");
    const reveal = () => {
      bookingFrame.classList.add("is-loaded");
      skeleton?.classList.add("is-gone");
    };
    bookingFrame.addEventListener("load", reveal, { once: true });
    // filet : on ne laisse jamais le voile bloquer la vue
    setTimeout(reveal, 6000);
  }

  /* ------------------------------------------------------------ carousels */
  $$("[data-carousel]").forEach((car) => {
    const track = $("[data-track]", car);
    const prev  = $("[data-prev]", car);
    const next  = $("[data-next]", car);
    const dots  = $$("[data-dots] .carousel__dot", car);
    const count = $$(".carousel__slide", track).length;
    if (!track || count < 2) {
      [prev, next].forEach((b) => b?.remove());
      $("[data-dots]", car)?.remove();
      return;
    }

    const index = () => Math.round(track.scrollLeft / track.clientWidth);
    const goTo  = (i) => track.scrollTo({ left: Math.max(0, Math.min(i, count - 1)) * track.clientWidth,
                                          behavior: reduced ? "auto" : "smooth" });

    const sync = () => {
      const i = index();
      dots.forEach((d, n) => d.classList.toggle("is-active", n === i));
      if (prev) prev.disabled = i <= 0;
      if (next) next.disabled = i >= count - 1;
    };

    prev?.addEventListener("click", () => goTo(index() - 1));
    next?.addEventListener("click", () => goTo(index() + 1));
    dots.forEach((d) => d.addEventListener("click", () => goTo(Number(d.dataset.go))));

    // flèches du clavier quand le carrousel a le focus
    track.tabIndex = 0;
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); goTo(index() - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index() + 1); }
    });

    let raf;
    track.addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    }, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    sync();
  });

  /* ------------------------------------------------------ whatsapp float */
  // Ne s'affiche qu'une fois le hero dépassé, pour ne pas troubler l'entrée.
  const wa = $("#waFloat");
  if (wa) {
    const showAfter = () => {
      const trigger = document.querySelector("#main > section") ? window.innerHeight * 0.75 : 240;
      wa.classList.toggle("is-visible", window.scrollY > trigger);
    };
    window.addEventListener("scroll", showAfter, { passive: true });
    showAfter();
  }

  /* --------------------------------------------------- consentement RGPD */
  // Google Analytics ne se charge qu'après un choix explicite : « Tout accepter »,
  // ou la case « Mesure d'audience » activée dans « Personnaliser ». Refuser est
  // aussi simple qu'accepter (un clic, même taille). Le choix est mémorisé 6 mois
  // puis redemandé, et peut être modifié à tout moment via « Gérer les cookies ».
  const GA_ID = "G-WS5KTZE0ZB";
  const CLE_CONSENTEMENT = "lvds_consentement";
  const CLE_DATE = "lvds_consentement_date";
  const VALIDITE_MS = 182 * 24 * 3600 * 1000;   // ~6 mois
  const COOKIE_GA_SECONDES = 395 * 24 * 3600;   // 13 mois, plafond recommandé par la CNIL

  // racine du site déduite de l'emplacement de ce script (pages à 0, 1 ou 2 niveaux)
  const racine = (() => {
    try { return new URL("../", document.currentScript.src).pathname; }
    catch (e) { return "/"; }
  })();

  const T = document.documentElement.lang === "en" ? {
    titre: "Help us improve the site?",
    texte: "With your consent, we measure how it is used to fix what gets in the way. No advertising, no resale of data.",
    plus: "Learn more",
    refuser: "Reject all", perso: "Customize", accepter: "Accept all",
    prefs: "Your preferences",
    necessaires: "Necessary cookies", toujours: "Always on",
    necessairesTxt: "They keep the site, the booking calendar and the payment working, and remember this choice. They measure nothing.",
    audience: "Audience measurement",
    audienceTxt: "Google Analytics: pages viewed, journey, clicks on “Book” or WhatsApp. Cookies kept 13 months at most. No advertising, no resale.",
    enregistrer: "Save my choices", retour: "Back", gerer: "Cookie settings"
  } : {
    titre: "Vous nous aidez à améliorer le site ?",
    texte: "Avec votre accord, nous mesurons comment il est utilisé pour corriger ce qui bloque. Aucune publicité, aucune revente de données.",
    plus: "En savoir plus",
    refuser: "Tout refuser", perso: "Personnaliser", accepter: "Tout accepter",
    prefs: "Vos préférences",
    necessaires: "Cookies nécessaires", toujours: "Toujours actifs",
    necessairesTxt: "Ils font fonctionner le site, le calendrier de réservation et le paiement, et mémorisent ce choix. Ils ne mesurent rien.",
    audience: "Mesure d'audience",
    audienceTxt: "Google Analytics : pages vues, parcours, clics sur « Réserver » ou WhatsApp. Cookies conservés 13 mois au plus. Aucune publicité, aucune revente.",
    enregistrer: "Enregistrer mes choix", retour: "Retour", gerer: "Gérer les cookies"
  };

  const stockage = {
    lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* navigation privée */ } }
  };

  const chargerGA = () => {
    window["ga-disable-" + GA_ID] = false;
    const options = { cookie_expires: COOKIE_GA_SECONDES };
    if (window.gtag) { window.gtag("config", GA_ID, options); return; }
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, options);
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  };

  // retrait du consentement : on coupe la mesure et on efface les cookies déjà déposés
  const retirerGA = () => {
    window["ga-disable-" + GA_ID] = true;
    const hote = location.hostname;
    const domaines = ["", `; domain=${hote}`, `; domain=.${hote}`, `; domain=.${hote.split(".").slice(-2).join(".")}`];
    document.cookie.split(";").map((c) => c.split("=")[0].trim())
      .filter((n) => n === "_ga" || n === "_gid" || n.startsWith("_ga_") || n.startsWith("_gat"))
      .forEach((n) => domaines.forEach((d) => {
        document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d}`;
      }));
  };

  // choix mémorisé et encore valable, sinon null (jamais répondu, ou plus de 6 mois)
  const choixValide = () => {
    const choix = stockage.lire(CLE_CONSENTEMENT);
    if (choix !== "accepte" && choix !== "refuse") return null;
    const date = Number(stockage.lire(CLE_DATE));
    if (!date) { stockage.ecrire(CLE_DATE, String(Date.now())); return choix; } // réponses d'avant la date
    return Date.now() - date > VALIDITE_MS ? null : choix;
  };

  let carte = null;
  let declencheur = null;

  const fermer = () => {
    if (!carte) return;
    const c = carte;
    carte = null;
    c.classList.remove("is-visible");
    setTimeout(() => c.remove(), 600);
    if (declencheur && document.contains(declencheur)) declencheur.focus();
    declencheur = null;
  };

  const enregistrer = (accepte) => {
    stockage.ecrire(CLE_CONSENTEMENT, accepte ? "accepte" : "refuse");
    stockage.ecrire(CLE_DATE, String(Date.now()));
    if (accepte) chargerGA(); else retirerGA();
    fermer();
  };

  const ouvrir = (manuel) => {
    if (carte) { carte.focus(); return; }
    const actuel = choixValide();
    declencheur = manuel ? document.activeElement : null;

    const c = document.createElement("div");
    c.className = "cc";
    c.setAttribute("role", "dialog");
    c.setAttribute("aria-modal", "false");
    c.setAttribute("aria-labelledby", "cc-titre");
    c.tabIndex = -1;
    c.innerHTML = `
      <div data-vue="accueil">
        <p class="cc__texte"><strong id="cc-titre">${T.titre}</strong> ${T.texte}
          <a href="${racine}legal/cookies.html">${T.plus}</a></p>
        <div class="cc__actions">
          <button type="button" class="cc__btn" data-cc="refuser">${T.refuser}</button>
          <button type="button" class="cc__btn" data-cc="perso">${T.perso}</button>
          <button type="button" class="cc__btn cc__btn--plein" data-cc="accepter">${T.accepter}</button>
        </div>
      </div>
      <div data-vue="prefs" hidden>
        <p class="cc__titre">${T.prefs}</p>
        <div class="cc__ligne">
          <div>
            <p class="cc__ligne-titre">${T.necessaires}</p>
            <p class="cc__ligne-texte">${T.necessairesTxt}</p>
          </div>
          <span class="cc__etat">${T.toujours}</span>
        </div>
        <div class="cc__ligne">
          <div>
            <p class="cc__ligne-titre" id="cc-audience">${T.audience}</p>
            <p class="cc__ligne-texte">${T.audienceTxt}</p>
          </div>
          <button type="button" class="cc__switch" role="switch" aria-labelledby="cc-audience" data-cc="audience"><span></span></button>
        </div>
        <div class="cc__actions">
          <button type="button" class="cc__btn" data-cc="retour">${T.retour}</button>
          <button type="button" class="cc__btn cc__btn--plein" data-cc="enregistrer">${T.enregistrer}</button>
        </div>
      </div>`;
    document.body.appendChild(c);
    carte = c;

    const vueAccueil = c.querySelector('[data-vue="accueil"]');
    const vuePrefs = c.querySelector('[data-vue="prefs"]');
    const interrupteur = c.querySelector('[data-cc="audience"]');
    interrupteur.setAttribute("aria-checked", actuel === "accepte" ? "true" : "false");

    const montrerPrefs = (oui) => { vueAccueil.hidden = oui; vuePrefs.hidden = !oui; };

    c.addEventListener("click", (e) => {
      const el = e.target.closest("[data-cc]");
      if (!el) return;
      const action = el.dataset.cc;
      if (action === "accepter") enregistrer(true);
      else if (action === "refuser") enregistrer(false);
      else if (action === "perso") { montrerPrefs(true); interrupteur.focus(); }
      else if (action === "retour") { montrerPrefs(false); c.querySelector('[data-cc="perso"]').focus(); }
      else if (action === "audience") interrupteur.setAttribute("aria-checked", String(interrupteur.getAttribute("aria-checked") !== "true"));
      else if (action === "enregistrer") enregistrer(interrupteur.getAttribute("aria-checked") === "true");
    });

    // Échap ferme la carte seulement quand on la rouvre, jamais comme choix implicite
    c.addEventListener("keydown", (e) => { if (e.key === "Escape" && actuel) fermer(); });

    requestAnimationFrame(() => {
      c.classList.add("is-visible");
      if (manuel) c.focus();
    });
  };

  // tout élément [data-cookie-settings] rouvre la carte (pied de page, page cookies)
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-cookie-settings]")) return;
    e.preventDefault();
    ouvrir(true);
  });

  const mentionPied = $("#year")?.parentElement;
  if (mentionPied) {
    const lien = document.createElement("button");
    lien.type = "button";
    lien.className = "cc-gerer";
    lien.setAttribute("data-cookie-settings", "");
    lien.textContent = T.gerer;
    mentionPied.append(" · ", lien);
  }

  const choixInitial = choixValide();
  if (choixInitial === "accepte") chargerGA();
  else if (choixInitial === null) ouvrir(false);

  /* ------------------------------------------------- suivi des intentions */
  // Chaque clic utile est poussé au dataLayer et remonté à GA4 (si consenti).
  window.dataLayer = window.dataLayer || [];

  const pister = (evenement, details) => {
    window.dataLayer.push({ event: evenement, ...details, page: location.pathname });
    if (typeof window.gtag === "function") window.gtag("event", evenement, details);
    if (typeof window.plausible === "function") window.plausible(evenement, { props: details });
  };

  const CIBLES = [
    { test: (h) => h.startsWith("https://wa.me/"),        nom: "contact_whatsapp" },
    { test: (h) => h.startsWith("tel:"),                  nom: "contact_telephone" },
    { test: (h) => h.startsWith("mailto:"),               nom: "contact_email" },
    { test: (h) => h.includes("buy.stripe.com"),          nom: "bon_cadeau_paiement" },
    { test: (h) => h.includes("reserver.html"),           nom: "clic_reserver" },
    { test: (h) => h.includes("bons-cadeaux.html"),       nom: "clic_bons_cadeaux" },
    { test: (h) => h.includes("temoignages.html"),        nom: "clic_temoignages" },
    { test: (h) => h.includes("instagram.com"),           nom: "clic_instagram" },
    { test: (h) => h.includes("/blog/"),                  nom: "clic_article" },
  ];

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const cible = CIBLES.find((c) => c.test(href));
    if (cible) pister(cible.nom, { lien: href, libelle: (a.innerText || "").trim().slice(0, 60) });
  }, { capture: true, passive: true });

  // le moteur de réservation est affiché : compté comme une intention forte
  if ($("[data-booking-frame]")) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { pister("moteur_reservation_vu", {}); io2.disconnect(); }
      });
    }, { threshold: 0.4 });
    io2.observe($("[data-booking-frame]"));
  }

  // profondeur de lecture : 25 / 50 / 75 / 100 %
  const paliers = [25, 50, 75, 100];
  let atteints = 0;
  window.addEventListener("scroll", () => {
    const h = document.documentElement;
    const pct = Math.round(((h.scrollTop + innerHeight) / h.scrollHeight) * 100);
    while (atteints < paliers.length && pct >= paliers[atteints]) {
      pister("lecture", { profondeur: paliers[atteints] });
      atteints++;
    }
  }, { passive: true });

  /* --------------------------------------------------------------- misc */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // placeholders that are not wired yet should not jump the page to the top
  $$("[data-todo]").forEach((a) =>
    a.addEventListener("click", (e) => e.preventDefault())
  );
})();
