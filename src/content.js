console.log("content.js started");

// Run and keep watching for dynamic content using a MutationObserver.
// Debounce to avoid running too often when many nodes are added at once.
const debounce = (fn, wait = 120) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

const accessibilityText = "Feed posts";

let definedFeedHolder = false;

/**
 * Find and mark the feed holder element for the given language.
 * @param {string} lang
 * @returns {Element|null}
 */
const findFeedHolder = (lang) => {
  console.log("findFeedHolder called with lang:", lang);
  if (definedFeedHolder) {
    const newsFeedHolder = window.document.getElementsByClassName(
      "defined-feed-holder"
    );
    if (newsFeedHolder.length > 0) {
      const exisintgHolder = newsFeedHolder[0];
      console.log("Returning existing defined-feed-holder");
      // console.log(exisintgHolder);
      return exisintgHolder;
    }
    definedFeedHolder = false;
    console.warn("Couldnt find defined-feed-holder, trying again");
  }

  // Helper to compare header text with localized string
  /**
   * Check whether a DOM element's innerHTML matches an expected string, case-insensitively.
   *
   * Returns true only when both `header` and `expected` are truthy and the element's
   * `innerHTML` string equals `expected` when both are converted to lower case.
   * If either argument is falsy, the function returns false.
   *
   * Note: comparison is case-insensitive but does not perform trimming or HTML normalization.
   *
   * @param {?HTMLElement} header - The DOM element whose innerHTML will be compared. May be null or undefined.
   * @param {?string} expected - The expected string to compare against. May be null or undefined.
   * @returns {boolean} True if `header.innerHTML` equals `expected` case-insensitively; otherwise false.
   */
  const matchesHeader = (header, expected) => {
    if (!header || !expected) return false;
    const text = header.innerText;
    // console.log("matchesHeader: header innerText:", text);
    return text.toLowerCase() === expected.toLowerCase();
  };

  // Try multiple DOM shapes which Facebook (or similar) might use.
  for (let feedHeader of window.document.querySelectorAll('h3[dir="auto"]')) {
    if (!matchesHeader(feedHeader, accessibilityText)) continue;
    console.log("contentCleaner: try main finder - 1");
    const parent = feedHeader.parentNode;
    if (parent instanceof Element && parent.children.length > 3) {
      definedFeedHolder = true;
      parent.classList.add("defined-feed-holder");
      return parent;
    }
  }

  for (let feedHeader of window.document.querySelectorAll('h3[dir="auto"]')) {
    if (!matchesHeader(feedHeader, accessibilityText)) continue;
    console.log("contentCleaner: try main finder - 2");
    const parent = feedHeader.parentNode;
    if (parent instanceof Element && parent.children.length === 2) {
      if (
        parent.children[0].tagName !== "H3" ||
        parent.children[1].tagName !== "DIV"
      )
        continue;
      definedFeedHolder = true;
      parent.children[1].classList.add("defined-feed-holder");
      return parent.children[1];
    }
  }

  for (let feedHeader of window.document.querySelectorAll('h3[dir="auto"]')) {
    if (!matchesHeader(feedHeader, accessibilityText)) continue;
    console.log("contentCleaner: try main finder - 3");
    const parent = feedHeader.parentNode;
    if (parent instanceof Element && parent.children.length === 3) {
      if (
        parent.children[0].tagName !== "H3" ||
        parent.children[1].tagName !== "DIV" ||
        parent.children[2].tagName !== "DIV" ||
        parent.children[2].children.length === 0
      )
        continue;
      definedFeedHolder = true;
      parent.children[2].classList.add("defined-feed-holder");
      return parent.children[2];
    }
  }

  for (let feedHeader of window.document.querySelectorAll('h2[dir="auto"]')) {
    if (!matchesHeader(feedHeader, accessibilityText)) continue;
    console.log("contentCleaner: try main finder - 4");
    const parent = feedHeader.parentNode;
    if (parent instanceof Element && parent.children.length === 2) {
      if (
        parent.children[0].tagName !== "H2" ||
        parent.children[1].tagName !== "DIV" ||
        parent.children[1].children.length === 0
      )
        continue;
      definedFeedHolder = true;
      parent.children[1].classList.add("defined-feed-holder");
      return parent.children[1];
    }
  }

  return null;
};

const limitFeedSize = () => {
  // Return early if current route is not the root ("/")
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.pathname !== "/"
  ) {
    console.log("Not root route, skipping limitFeedSize");
    definedFeedHolder = false;
    return;
  }
  const feedHolder = findFeedHolder("");
  if (!feedHolder) return;

  const maxItems = 15; // show this many children
  // Convert to array of Element children only
  const items = Array.from(feedHolder.children).filter(
    (c) => c instanceof Element
  );

  // If there are not more than maxItems, clear any previously-set limiting styles
  if (items.length <= maxItems) {
    if (feedHolder.style.height || feedHolder.style.overflow) {
      feedHolder.style.height = "";
      feedHolder.style.overflow = "";
      console.log("Feed holder height/overflow reset");
    }
    return;
  }

  // We want the bottom of the nth child (index maxItems-1) relative to the top of the feed holder
  const nth = items[maxItems - 1];
  if (!nth) return;

  const holderRect = feedHolder.getBoundingClientRect();
  const nthRect = nth.getBoundingClientRect();

  // target height is distance from top of holder to bottom of nth child
  const targetHeight = Math.max(0, nthRect.bottom - holderRect.top);

  // Apply the style to visually limit the feed
  feedHolder.style.height = `${Math.ceil(targetHeight)}px`;
  feedHolder.style.overflow = "hidden";
  console.log(
    `Feed limited to ${maxItems} items; height set to ${feedHolder.style.height}`
  );
};

const hideReels = () => {
  // Return early if current route is not the root ("/")
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.pathname !== "/"
  ) {
    console.log("Not root route, skipping hideReels");
    return;
  }
  const elms = document.querySelectorAll(
    "[href*='/reel/'][aria-label='reel'] "
  );
  elms.forEach((elm) => {
    let parent = elm.parentElement;
    while (
      parent &&
      !parent.classList.contains("x1lliihq") &&
      parent.tagName !== "BODY"
    ) {
      parent = parent.parentElement;
    }
    if (parent.tagName !== "BODY") {
      if (parent.style.display !== "none") {
        parent.style.display = "none";
        console.log("Reel block hidden");
      }
      elm.remove();
    } else if (elm.parentElement) {
      elm.parentElement.style.display = "none";
      console.log("Reel item hidden");
      elm.remove();
    }
  });
};

const hideVideoRecommendations = () => {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return;
  }
  const path = window.location.pathname || "";
  const search = window.location.search || "";
  const onWatchRoute =
    (path === "/watch" || path === "/watch/") && /[?&]v=/.test(search);
  if (!onWatchRoute) {
    console.log("Not a /watch?v=... route, skipping hideVideoRecommendations");
    return;
  }

  // find logic
  const grandParentContainer = document.getElementById("watch_feed");
  if (!grandParentContainer) {
    console.log("No watch_feed container found");
    return;
  }

  const uselessParent = grandParentContainer.firstChild;
  if (!uselessParent || !(uselessParent instanceof Element)) {
    console.log("No uselessParent found inside watch_feed");
    return;
  }

  const siblings = uselessParent.children;

  if (!siblings || siblings.length < 2) {
    console.log("Not enough siblings to hide recommendations");
  }

  const recommendationsContainer = siblings[siblings.length - 1];
  if (
    !recommendationsContainer ||
    !(recommendationsContainer instanceof Element)
  ) {
    console.log("No recommendationsContainer found");
    return;
  }

  recommendationsContainer.style.display = "none";
  console.log("Video recommendations hidden on /watch route");
};

const hideReelsDebounced = debounce(() => {
  try {
    hideReels();
  } catch (e) {
    // Defensive: don't let errors stop the observer
    console.error("hideReels error", e);
  }
}, 120);

// Debounced wrapper so we don't recalc too often while SPA injects nodes
const limitFeedSizeDebounced = debounce(() => {
  try {
    limitFeedSize();
  } catch (e) {
    console.error("limitFeedSize error", e);
  }
}, 120);

const hideVideoRecommendationsDebounced = debounce(() => {
  try {
    hideVideoRecommendations();
  } catch (e) {
    console.error("hideVideoRecommendations error", e);
  }
}, 120);

// Run once immediately (or on DOMContentLoaded)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    hideReelsDebounced();
    limitFeedSizeDebounced();
  });
} else {
  hideReelsDebounced();
  limitFeedSizeDebounced();
}

// Observe the body for new nodes (SPAs typically inject feed items dynamically)
const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.addedNodes && m.addedNodes.length > 0) {
      hideReelsDebounced();
      limitFeedSizeDebounced();
      hideVideoRecommendationsDebounced();
      break;
    }
  }
});

// Some pages may not have body immediately, fall back to documentElement
const observeTarget = document.body || document.documentElement;
if (observeTarget) {
  observer.observe(observeTarget, { childList: true, subtree: true });
}

// Optional: to stop observing later call observer.disconnect();

// -------------------------
// Route watcher to block infinite reel navigation
// -------------------------
(() => {
  // Keep track of the last seen reel id while on a /reel/ route.
  let lastReelId = null;
  let lastPath = window.location && window.location.pathname;

  const getReelIdFromPath = (path) => {
    if (!path) return null;
    // Matches /reel or /reel/ or /reel/<id> and captures <id>
    const m = path.match(/^\/reel(?:\/(.*))?$/);
    if (!m) return null;
    return m[1] || "__reel_root__"; // treat /reel and /reel/<id>
  };

  const onLocationChange = () => {
    try {
      const path = window.location && window.location.pathname;
      if (path === lastPath) return;
      lastPath = path;

      const reelId = getReelIdFromPath(path);
      if (!reelId) {
        // left reel area - reset tracking
        lastReelId = null;
        return;
      }

      // now on a reel route
      if (lastReelId === null) {
        // first reel visit - remember it and allow
        lastReelId = reelId;
        console.log("routeWatcher: first reel seen", reelId);
        return;
      }

      if (reelId !== lastReelId) {
        // user navigated to a different reel -> kick them back to root
        console.log(
          "routeWatcher: reel changed",
          lastReelId,
          "->",
          reelId,
          "redirecting to /"
        );

        // Use replaceState to avoid leaving the reel in history, then dispatch a locationchange
        try {
          window.location.href = "/";
        } catch (e) {
          console.error("routeWatcher: error forcing root navigation", e);
          // fallback
          window.location.href = "/";
        }
        // Reset tracking after redirect
        lastReelId = null;
      }
    } catch (e) {
      console.error("routeWatcher error", e);
    }
  };

  // Wrap history methods so we can detect SPA navigations
  (function () {
    const _wr = (type) => {
      const orig = history[type];
      return function () {
        const rv = orig.apply(this, arguments);
        try {
          window.dispatchEvent(new Event("locationchange"));
        } catch (e) {
          console.error("routeWatcher: failed to dispatch locationchange", e);
        }
        return rv;
      };
    };
    history.pushState = _wr("pushState");
    history.replaceState = _wr("replaceState");
  })();

  // Listen for popstate/locationchange
  window.addEventListener("popstate", onLocationChange);
  window.addEventListener("locationchange", onLocationChange);

  // Periodic fallback in case other navigation methods are used
  const interval = setInterval(() => {
    try {
      const path = window.location && window.location.pathname;
      if (path !== lastPath) onLocationChange();
    } catch (e) {
      console.error("routeWatcher interval error", e);
    }
  }, 250);

  // Stop the interval if the page is being unloaded
  window.addEventListener("beforeunload", () => clearInterval(interval));

  // Run once to initialize state
  try {
    onLocationChange();
  } catch (e) {
    console.error("routeWatcher init error", e);
  }
})();
