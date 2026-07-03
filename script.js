/* =========================================================
   INNOVA ALPHA — Interactions v2
   Lenis + GSAP + ScrollTrigger + Cursor + Tilt + Magnetic
   ========================================================= */
(function () {
  "use strict";

  /* ── PRELOADER ─────────────────────────────────────── */
  window.addEventListener("load", () => {
    setTimeout(() => {
      const pl = document.getElementById("preloader");
      if (pl) {
        pl.classList.add("out");
        pl.addEventListener("transitionend", () => pl.remove(), { once: true });
      }
      initAll();
    }, 1600);
  });

  function initAll() {
    initLenis();
    initGSAP();
    initCursor();
    initNav();
    initHero();
    initReveal();
    initStagger();
    initTilt();
    initMagnetic();
    initCounters();
    initMobileMenu();
    initScrollProgress();
  }

  /* ── LENIS SMOOTH SCROLL ───────────────────────────── */
  let lenis;
  function initLenis() {
    if (typeof Lenis === "undefined") return;
    lenis = new Lenis({
      duration: 1.3,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    if (typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ── GSAP SETUP ────────────────────────────────────── */
  function initGSAP() {
    if (typeof gsap === "undefined") return;
    if (typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }
  }

  /* ── CUSTOM CURSOR ─────────────────────────────────── */
  function initCursor() {
    const dot = document.getElementById("cursorDot");
    const ring = document.getElementById("cursorRing");
    if (!dot || !ring || window.matchMedia("(pointer: coarse)").matches) return;

    let mx = -100, my = -100, rx = -100, ry = -100;

    document.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top = my + "px";
    });

    (function loopRing() {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(loopRing);
    })();

    const hoverEls = document.querySelectorAll("a, button, .service-card, .work-media, .tilt");
    hoverEls.forEach((el) => {
      el.addEventListener("mouseenter", () => { dot.classList.add("active"); ring.classList.add("active"); });
      el.addEventListener("mouseleave", () => { dot.classList.remove("active"); ring.classList.remove("active"); });
    });
  }

  /* ── NAV SCROLL EFFECT ─────────────────────────────── */
  function initNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ── SCROLL PROGRESS BAR ───────────────────────────── */
  function initScrollProgress() {
    const bar = document.getElementById("scrollProgressBar");
    if (!bar) return;
    const update = () => {
      const s = document.documentElement;
      const pct = (window.scrollY / (s.scrollHeight - s.clientHeight)) * 100;
      bar.style.width = Math.min(pct, 100) + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ── HERO ANIMATION ────────────────────────────────── */
  function initHero() {
    if (typeof gsap === "undefined") {
      document.querySelectorAll(".h-line, .hero-badge, .hero-sub, .hero-actions, .scroll-cue")
        .forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.to("#heroBadge", { opacity: 1, y: 0, duration: 0.7 }, 0)
      .to(".h-line", {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.12,
      }, 0.2)
      .to("#heroSub", { opacity: 1, y: 0, duration: 0.8 }, 0.7)
      .to("#heroActions", { opacity: 1, y: 0, duration: 0.7 }, 0.95);
  }

  /* ── SCROLL REVEAL ─────────────────────────────────── */
  function initReveal() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      document.querySelectorAll(".reveal").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }
    document.querySelectorAll(".reveal").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true,
        },
      });
    });
  }

  /* ── STAGGER GROUPS ────────────────────────────────── */
  function initStagger() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      document.querySelectorAll(".stagger-item").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }
    document.querySelectorAll(".stagger-group").forEach((group) => {
      const items = group.querySelectorAll(".stagger-item");
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.75,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: group,
          start: "top 82%",
          once: true,
        },
      });
    });
  }

  /* ── 3D CARD TILT ──────────────────────────────────── */
  function initTilt() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotX = ((y - cy) / cy) * -10;
        const rotY = ((x - cx) / cx) * 10;
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
        card.style.transition = "transform 0.05s";
        const mx = (x / rect.width) * 100;
        const my = (y / rect.height) * 100;
        card.style.setProperty("--mx", mx + "%");
        card.style.setProperty("--my", my + "%");
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale(1)";
        card.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
      });
    });
  }

  /* ── MAGNETIC BUTTONS ──────────────────────────────── */
  function initMagnetic() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.28;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.28;
        btn.style.transform = `translate(${x}px, ${y}px)`;
        btn.style.transition = "transform 0.08s";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translate(0, 0)";
        btn.style.transition = "transform 0.55s cubic-bezier(0.23, 1, 0.32, 1)";
      });
    });
  }

  /* ── ANIMATED COUNTERS ─────────────────────────────── */
  function initCounters() {
    const counters = document.querySelectorAll("[data-target]");
    if (!counters.length) return;

    const animate = (el) => {
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || "";
      const duration = 1800;
      const start = performance.now();

      (function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = Math.floor(eased * target);
        el.textContent = val + (progress < 1 ? "" : suffix);
        if (progress < 1) requestAnimationFrame(tick);
      })(start);
    };

    if (typeof IntersectionObserver !== "undefined") {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animate(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach((c) => obs.observe(c));
    } else {
      counters.forEach(animate);
    }
  }

  /* ── MOBILE MENU ───────────────────────────────────── */
  function initMobileMenu() {
    const burger = document.getElementById("navBurger");
    const mobileNav = document.getElementById("mobileNav");
    if (!burger || !mobileNav) return;

    let open = false;
    const toggle = () => {
      open = !open;
      burger.classList.toggle("open", open);
      mobileNav.classList.toggle("open", open);
      mobileNav.setAttribute("aria-hidden", !open);
      burger.setAttribute("aria-expanded", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (lenis) open ? lenis.stop() : lenis.start();
    };

    burger.addEventListener("click", toggle);
    mobileNav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => { if (open) toggle(); });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) toggle();
    });
  }

})();
