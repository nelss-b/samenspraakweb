const demoVideoUrl = "";

const header = document.querySelector("[data-header]");
const demoFrame = document.querySelector("[data-demo-frame]");
const scrollTimelines = [...document.querySelectorAll("[data-scroll-timeline]")];
const solutionStories = [...document.querySelectorAll("[data-solution-story]")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let timelineRaf = null;
let solutionStoryRaf = null;
let solutionStoryActive = false;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const startAtTop = () => {
  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  window.scrollTo(0, 0);
};

startAtTop();
window.addEventListener("pageshow", startAtTop);

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

  if (!scrollTimelines.length) return;

  if (prefersReducedMotion.matches) {
    scrollTimelines.forEach((timeline) => {
      timeline.classList.add("is-static");
      timeline.style.setProperty("--timeline-progress", 1);
      timeline.querySelectorAll(".timeline-phase").forEach((phase) => {
        phase.classList.add("is-revealed");
      });
    });
    return;
  }

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  scrollTimelines.forEach((timeline) => {
    timeline.classList.remove("is-static");
    const rect = timeline.getBoundingClientRect();
    const phases = [...timeline.querySelectorAll(".timeline-phase")];
    const progress = clamp((viewportHeight * 0.55 - rect.top) / Math.max(1, rect.height), 0, 1);
    const activeIndex = Math.min(phases.length - 1, Math.round(progress * (phases.length - 1)));

    timeline.style.setProperty("--timeline-progress", progress.toFixed(4));

    phases.forEach((phase, index) => {
      const revealThreshold = phases.length <= 1 ? 0 : index / (phases.length - 1);

      phase.classList.toggle("is-revealed", progress + 0.04 >= revealThreshold);
      phase.classList.toggle("is-active", index === activeIndex);
    });
  });
};

const requestTimelineUpdate = () => {
  if (timelineRaf) return;
  timelineRaf = window.requestAnimationFrame(updateScrollTimelines);
};

const updateSolutionStories = () => {
  solutionStoryRaf = null;
  if (prefersReducedMotion.matches) return;

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const thresholds = [0, 0.3, 0.6, 0.86];

  solutionStories.forEach((story) => {
    const rect = story.getBoundingClientRect();
    const scrollableDistance = Math.max(1, rect.height - viewportHeight);
    const rawProgress = clamp((viewportHeight * 0.42 - rect.top) / scrollableDistance, 0, 1);
    const progress = Number(rawProgress.toFixed(4));
    const steps = [...story.querySelectorAll(".story-step")];
    let activeStep = 0;

    thresholds.forEach((threshold, index) => {
      if (progress + 0.035 >= threshold) activeStep = index;
    });

    story.style.setProperty("--story-progress", progress);
    story.dataset.activeStep = String(activeStep);

    steps.forEach((step, index) => {
      step.classList.toggle("is-active", index === activeStep);
    });
  });
};

const requestSolutionStoryUpdate = () => {
  if (!solutionStoryActive || solutionStoryRaf || prefersReducedMotion.matches) return;
  solutionStoryRaf = window.requestAnimationFrame(updateSolutionStories);
};

const initializeSolutionStories = () => {
  if (!solutionStories.length) return;

  if (prefersReducedMotion.matches) {
    solutionStories.forEach((story) => {
      story.style.setProperty("--story-progress", 1);
      story.dataset.activeStep = "3";
      story.querySelectorAll(".story-step").forEach((step) => {
        step.classList.add("is-active");
      });
    });
    return;
  }

  const storyObserver = new IntersectionObserver((entries) => {
    solutionStoryActive = entries.some((entry) => entry.isIntersecting);
    requestSolutionStoryUpdate();
  }, {
    rootMargin: "40% 0px 40% 0px",
    threshold: 0
  });

  solutionStories.forEach((story) => storyObserver.observe(story));
  updateSolutionStories();
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
window.addEventListener("scroll", requestSolutionStoryUpdate, { passive: true });
window.addEventListener("resize", () => {
  requestTimelineUpdate();
  requestSolutionStoryUpdate();
});
setHeaderState();
mountDemoVideo();
updateScrollTimelines();
initializeSolutionStories();
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
