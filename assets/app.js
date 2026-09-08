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
  // GA4 ne se charge qu'après acceptation explicite du visiteur.
  const GA_ID = "G-WS5KTZE0ZB";
  const CLE_CONSENTEMENT = "lvds_consentement";

  const chargerGA = () => {
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  };

  const initConsentement = () => {
    const choix = localStorage.getItem(CLE_CONSENTEMENT);
    if (choix === "accepte") { chargerGA(); return; }
    if (choix === "refuse") return;

    const bandeau = document.createElement("div");
    bandeau.className = "cookie-bandeau";
    bandeau.innerHTML = `
      <p class="cookie-bandeau__texte">
        Ce site utilise des cookies de mesure d'audience pour comprendre comment vous le parcourez.
        <a href="${location.pathname.includes("/blog/") || location.pathname.includes("/legal/") || location.pathname.includes("/en/") ? "../" : ""}legal/cookies.html">En savoir plus</a>
      </p>
      <div class="cookie-bandeau__actions">
        <button type="button" class="btn btn--ghost" data-cookie-refuser>Refuser</button>
        <button type="button" class="btn btn--solid" data-cookie-accepter>Accepter</button>
      </div>`;
    document.body.appendChild(bandeau);
    requestAnimationFrame(() => bandeau.classList.add("is-visible"));

    const fermer = (choixFait) => {
      localStorage.setItem(CLE_CONSENTEMENT, choixFait);
      bandeau.classList.remove("is-visible");
      setTimeout(() => bandeau.remove(), 500);
      if (choixFait === "accepte") chargerGA();
    };
    bandeau.querySelector("[data-cookie-accepter]").addEventListener("click", () => fermer("accepte"));
    bandeau.querySelector("[data-cookie-refuser]").addEventListener("click", () => fermer("refuse"));
  };
  initConsentement();

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
