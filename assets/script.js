const demoVideoUrl = "";

const header = document.querySelector("[data-header]");
const demoFrame = document.querySelector("[data-demo-frame]");
const scrollTimelines = [...document.querySelectorAll("[data-scroll-timeline]")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let timelineRaf = null;
let timelineActive = false;

const setHeaderState = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

const toEmbedUrl = (url) => {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    }

    if (host.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (host.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }

    if (host.includes("loom.com")) {
      return url.replace("/share/", "/embed/");
    }

    return url;
  } catch {
    return "";
  }
};

const mountDemoVideo = () => {
  const embedUrl = toEmbedUrl(demoVideoUrl);
  if (!embedUrl || !demoFrame) return;

  demoFrame.innerHTML = `<iframe title="Samenspraak demo video" src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const updateScrollTimelines = () => {
  timelineRaf = null;
  if (prefersReducedMotion.matches) return;

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const thresholds = [0, 0.24, 0.5, 0.76, 0.98];

  scrollTimelines.forEach((timeline) => {
    const rect = timeline.getBoundingClientRect();
    const scrollableDistance = Math.max(1, rect.height - viewportHeight);
    const rawProgress = clamp((viewportHeight * 0.36 - rect.top) / scrollableDistance, 0, 1);
    const progress = Number(rawProgress.toFixed(4));
    const phases = [...timeline.querySelectorAll(".timeline-phase")];
    let activeStep = 0;

    thresholds.forEach((threshold, index) => {
      if (progress + 0.025 >= threshold) activeStep = index;
    });

    timeline.style.setProperty("--timeline-progress", progress);
    timeline.dataset.activeStep = String(activeStep + 1);

    phases.forEach((phase, index) => {
      const revealed = progress + 0.025 >= thresholds[index];
      const active = revealed && index === activeStep;
      const boundaryPhase = index === 0 || index === phases.length - 1;

      phase.classList.toggle("is-revealed", revealed);
      phase.classList.toggle("is-active", active);
      phase.classList.toggle("is-muted", revealed && boundaryPhase && !active);
    });
  });
};

const requestTimelineUpdate = () => {
  if (!timelineActive || timelineRaf || prefersReducedMotion.matches) return;
  timelineRaf = window.requestAnimationFrame(updateScrollTimelines);
};

const initializeScrollTimelines = () => {
  if (!scrollTimelines.length) return;

  if (prefersReducedMotion.matches) {
    scrollTimelines.forEach((timeline) => {
      timeline.style.setProperty("--timeline-progress", 1);
      timeline.querySelectorAll(".timeline-phase").forEach((phase) => {
        phase.classList.add("is-revealed");
      });
    });
    return;
  }

  const timelineObserver = new IntersectionObserver((entries) => {
    timelineActive = entries.some((entry) => entry.isIntersecting);
    requestTimelineUpdate();
  }, {
    rootMargin: "40% 0px 40% 0px",
    threshold: 0
  });

  scrollTimelines.forEach((timeline) => timelineObserver.observe(timeline));
  updateScrollTimelines();
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: "0px 0px -32px 0px"
});

window.addEventListener("scroll", setHeaderState, { passive: true });
window.addEventListener("scroll", requestTimelineUpdate, { passive: true });
window.addEventListener("resize", requestTimelineUpdate);
setHeaderState();
mountDemoVideo();
initializeScrollTimelines();
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
