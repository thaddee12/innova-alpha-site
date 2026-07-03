/* =========================================================
   INNOVA ALPHA — interactions
   ========================================================= */
(function () {
  "use strict";

  /* ---- Theme (Jour / Nuit) ---- */
  const root = document.documentElement;
  const stored = (function () {
    try { return localStorage.getItem("ia-theme"); } catch (e) { return null; }
  })();
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("ia-theme", theme); } catch (e) {}
    document.querySelectorAll("#themeToggle, #themeToggleMobile").forEach((btn) => {
      btn.innerHTML = theme === "light"
        ? '<i data-lucide="moon"></i>'
        : '<i data-lucide="sun"></i>';
      btn.setAttribute("aria-label", theme === "light" ? "Passer en mode Nuit" : "Passer en mode Jour");
    });
    renderIcons();
  }
  // initial (default = dark / nuit)
  root.setAttribute("data-theme", stored === "light" ? "light" : "dark");

  /* ---- Lucide icons ---- */
  function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", renderIcons);

  function init() {
    renderIcons();
    applyTheme(root.getAttribute("data-theme"));
    document.querySelectorAll("#themeToggle, #themeToggleMobile").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
        applyTheme(next);
      });
    });
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Nav: scrolled state ---- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("is-open");
      const open = menu.classList.contains("is-open");
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      toggle.innerHTML = open ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
      document.body.style.overflow = open ? "hidden" : "";
      renderIcons();
    });
    menu.querySelectorAll("[data-close]").forEach((a) => {
      a.addEventListener("click", () => {
        menu.classList.remove("is-open");
        document.body.style.overflow = "";
        toggle.innerHTML = '<i data-lucide="menu"></i>';
        renderIcons();
      });
    });
  }

  /* ---- Scroll reveal ---- */
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---- Card spotlight (follow cursor) ---- */
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ---- Hero particles (subtle, performant) ---- */
  const canvas = document.getElementById("hero-canvas");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, particles, raf;
    const VIOLET = "91, 45, 232";

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const hero = canvas.parentElement;
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function build() {
      const count = Math.min(64, Math.floor((w * h) / 26000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.5,
        a: Math.random() * 0.5 + 0.2,
      }));
    }

    const LINK = 130;
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK) {
            ctx.strokeStyle = `rgba(${VIOLET}, ${(1 - dist / LINK) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(${VIOLET}, ${p.a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      size();
      build();
      cancelAnimationFrame(raf);
      frame();
    }

    start();
    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(start, 200);
    });

    // Pause when hero off-screen
    if ("IntersectionObserver" in window) {
      const heroIO = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) frame();
          else cancelAnimationFrame(raf);
        });
      });
      heroIO.observe(canvas.parentElement);
    }
  }

  /* ---- Active nav link on scroll ---- */
  const sections = ["services", "why", "process", "work", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const links = new Map(
    Array.from(document.querySelectorAll(".nav-links a")).map((a) => [
      a.getAttribute("href").slice(1),
      a,
    ])
  );
  if (sections.length && "IntersectionObserver" in window) {
    const navIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = links.get(entry.target.id);
          if (link && entry.isIntersecting) {
            links.forEach((l) => (l.style.color = ""));
            link.style.color = "var(--text)";
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => navIO.observe(s));
  }
})();
