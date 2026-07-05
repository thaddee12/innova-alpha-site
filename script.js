/* =========================================================
   INNOVA ALPHA — Interactions v2
   Lenis + GSAP + ScrollTrigger + Cursor + Tilt + Magnetic
   ========================================================= */
(function () {
  "use strict";

  /* ── THEME (init avant tout pour éviter le flash) ──── */
  const savedTheme = (() => { try { return localStorage.getItem("ia-theme"); } catch(e) { return null; } })();
  document.documentElement.setAttribute("data-theme", savedTheme === "light" ? "light" : "dark");

  /* ── PRELOADER ─────────────────────────────────────── */
  window.addEventListener("load", () => {
    const pl = document.getElementById("preloader");
    if (pl) {
      /* Page d'accueil : attendre la durée du preloader */
      setTimeout(() => {
        pl.classList.add("out");
        pl.addEventListener("transitionend", () => pl.remove(), { once: true });
        initAll();
      }, 1200);
    } else {
      /* Pages secondaires : init immédiate, pas de flash */
      initAll();
    }
  });

  function initAll() {
    initSpiderWeb();
    initLenis();
    initGSAP();
    initCursor();
    initNav();
    initThemeToggle();
    initHero();
    initReveal();
    initStagger();
    initTilt();
    initMagnetic();
    initCounters();
    initMobileMenu();
    initScrollProgress();
    /* Lucide icons sur pages secondaires v1 */
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  /* ── LENIS SMOOTH SCROLL ───────────────────────────── */
  let lenis;
  function initLenis() {
    if (typeof Lenis === "undefined") return;
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      /* GSAP ticker uniquement — pas de RAF en double */
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      /* Fallback sans GSAP */
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
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

  /* ── CANVAS SPIDER WEB ─────────────────────────────── */
  function initSpiderWeb() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, particles, animId;

    /* Lecture de la couleur violet selon le thème courant */
    function getColor() {
      const isDark = document.documentElement.getAttribute("data-theme") !== "light";
      return isDark ? "91,45,232" : "91,45,232";
    }

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function makeParticle() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 1.8 + 0.8,
      };
    }

    function initParticles() {
      const count = Math.min(Math.floor((W * H) / 9000), 100);
      particles = Array.from({ length: count }, makeParticle);
    }

    const LINK_DIST = 155;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const rgb = getColor();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        /* Mouvement */
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        /* Dot */
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, 0.8)`;
        ctx.fill();

        /* Lignes vers voisins */
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }

    function start() {
      if (animId) cancelAnimationFrame(animId);
      resize();
      initParticles();
      draw();
    }

    start();
    window.addEventListener("resize", () => { resize(); initParticles(); }, { passive: true });

    /* Pause quand le hero n'est plus à l'écran (économie CPU) */
    if (typeof IntersectionObserver !== "undefined") {
      const hero = canvas.closest(".hero");
      if (hero) {
        new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            if (!animId) draw();
          } else {
            cancelAnimationFrame(animId);
            animId = null;
          }
        }, { threshold: 0.1 }).observe(hero);
      }
    }
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

  /* ── THEME TOGGLE ──────────────────────────────────── */
  function initThemeToggle() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    const apply = (theme) => {
      document.documentElement.setAttribute("data-theme", theme);
      try { localStorage.setItem("ia-theme", theme); } catch(e) {}
    };
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      apply(current === "light" ? "dark" : "light");
    });
  }

  /* ── HERO ANIMATION ────────────────────────────────── */
  function initHero() {
    if (typeof gsap === "undefined") return;

    /* GSAP gère l'état initial — pas le CSS */
    gsap.set("#heroBadge", { opacity: 0, y: 20 });
    gsap.set(".h-line", { opacity: 0, y: 50 });
    gsap.set("#heroSub", { opacity: 0, y: 20 });
    gsap.set("#heroActions", { opacity: 0, y: 20 });

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to("#heroBadge", { opacity: 1, y: 0, duration: 0.7 }, 0)
      .to(".h-line", { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.2)
      .to("#heroSub", { opacity: 1, y: 0, duration: 0.8 }, 0.7)
      .to("#heroActions", { opacity: 1, y: 0, duration: 0.7 }, 0.95);
  }

  /* ── SCROLL REVEAL ─────────────────────────────────── */
  function initReveal() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    document.querySelectorAll(".reveal").forEach((el) => {
      /* GSAP fixe l'état initial ici, pas dans le CSS */
      gsap.set(el, { opacity: 0, y: 40 });
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          once: true,
        },
      });
    });
  }

  /* ── STAGGER GROUPS ────────────────────────────────── */
  function initStagger() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    document.querySelectorAll(".stagger-group").forEach((group) => {
      const items = group.querySelectorAll(".stagger-item");
      gsap.set(items, { opacity: 0, y: 30 });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.09,
        ease: "power3.out",
        scrollTrigger: {
          trigger: group,
          start: "top 88%",
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
    /* Support IDs v1 (navToggle/mobileMenu) et v2 (navBurger/mobileNav) */
    const burger = document.getElementById("navBurger") || document.getElementById("navToggle");
    const mobileNav = document.getElementById("mobileNav") || document.getElementById("mobileMenu");
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
