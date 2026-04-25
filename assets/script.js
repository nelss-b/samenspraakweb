const demoVideoUrl = "";

const header = document.querySelector("[data-header]");
const demoFrame = document.querySelector("[data-demo-frame]");

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
setHeaderState();
mountDemoVideo();
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
