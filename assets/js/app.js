"use strict";

/* =========================================================
   RETRY IN LIBRARY
   File: assets/js/app.js
   Main website application
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeNavigation();
  initializeTheme();
  initializeLanguage();
  initializeSearch();
  initializeCurrentYear();
  registerServiceWorker();
});

/* ---------------------------------------------------------
   1. MOBILE NAVIGATION
--------------------------------------------------------- */

function initializeNavigation() {
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".primary-navigation");

  if (!menuToggle || !navigation) return;

  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");

  menuToggle.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("active");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      navigation.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    }
  });
}

/* ---------------------------------------------------------
   2. THEME MANAGEMENT
--------------------------------------------------------- */

function initializeTheme() {
  const savedTheme = getStoredPreference("ril-theme");

  const preferredTheme =
    savedTheme ||
    (window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");

  applyTheme(preferredTheme);

  const themeToggle = document.querySelector("#theme-toggle");

  if (!themeToggle) return;

  themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark-mode")
      ? "light"
      : "dark";

    applyTheme(nextTheme);
    savePreference("ril-theme", nextTheme);
  });
}

function applyTheme(theme) {
  const isDark = theme === "dark";

  document.body.classList.toggle("dark-mode", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";

  const themeToggle = document.querySelector("#theme-toggle");

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );

    themeToggle.setAttribute("aria-pressed", String(isDark));
  }
}

/* ---------------------------------------------------------
   3. LANGUAGE MANAGEMENT
--------------------------------------------------------- */

function initializeLanguage() {
  const savedLanguage = getStoredPreference("ril-language");

  applyLanguage(savedLanguage === "te" ? "te" : "en");

  const languageToggle = document.querySelector("#language-toggle");

  if (!languageToggle) return;

  languageToggle.addEventListener("click", () => {
    const currentLanguage = document.body.dataset.language || "en";
    const nextLanguage = currentLanguage === "en" ? "te" : "en";

    applyLanguage(nextLanguage);
    savePreference("ril-language", nextLanguage);
  });
}

function applyLanguage(language) {
  const selectedLanguage = language === "te" ? "te" : "en";

  document.body.dataset.language = selectedLanguage;
  document.documentElement.lang = selectedLanguage;

  document.querySelectorAll("[data-en][data-te]").forEach((element) => {
    const translatedText =
      selectedLanguage === "te"
        ? element.dataset.te
        : element.dataset.en;

    if (translatedText !== undefined) {
      element.textContent = translatedText;
    }
  });

  document.querySelectorAll(
    "[data-en-placeholder][data-te-placeholder]"
  ).forEach((element) => {
    element.placeholder =
      selectedLanguage === "te"
        ? element.dataset.tePlaceholder
        : element.dataset.enPlaceholder;
  });

  const languageToggle = document.querySelector("#language-toggle");

  if (languageToggle) {
    languageToggle.textContent =
      selectedLanguage === "te" ? "English" : "తెలుగు";

    languageToggle.setAttribute(
      "aria-label",
      selectedLanguage === "te"
        ? "Switch language to English"
        : "భాషను తెలుగులోకి మార్చండి"
    );

    languageToggle.setAttribute(
      "aria-pressed",
      String(selectedLanguage === "te")
    );
  }
}

/* ---------------------------------------------------------
   4. WEBSITE SEARCH
--------------------------------------------------------- */

function initializeSearch() {
  const searchForm = document.querySelector("#global-search");
  const searchInput = document.querySelector("#search-input");
  const searchResults = document.querySelector("#search-results");

  if (!searchForm || !searchInput || !searchResults) return;

  const searchableItems = Array.from(
    document.querySelectorAll(
      "[data-searchable], .exam-card, .subject-card"
    )
  );

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    performSearch(
      searchInput.value,
      searchableItems,
      searchResults
    );
  });

  searchInput.addEventListener("input", () => {
    if (!searchInput.value.trim()) {
      searchResults.replaceChildren();
      searchResults.hidden = true;
    }
  });
}

function performSearch(query, items, resultsContainer) {
  const normalizedQuery = normalizeSearchText(query);

  resultsContainer.replaceChildren();

  if (!normalizedQuery) {
    resultsContainer.hidden = true;
    return;
  }

  const matches = items.filter((item) => {
    const searchText = normalizeSearchText(
      [
        item.textContent,
        item.dataset.searchable || "",
        item.dataset.keywords || "",
        item.dataset.en || "",
        item.dataset.te || ""
      ].join(" ")
    );

    return searchText.includes(normalizedQuery);
  });

  if (matches.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No matching study materials found.";

    resultsContainer.appendChild(message);
    resultsContainer.hidden = false;
    return;
  }

  const heading = document.createElement("p");
  heading.textContent = `${matches.length} result(s) found`;
  resultsContainer.appendChild(heading);

  matches.slice(0, 15).forEach((item) => {
    const link = document.createElement("a");

    link.href = getSafeItemLink(item);
    link.textContent =
      item.dataset.searchable ||
      item.querySelector("h2, h3, h4")?.textContent?.trim() ||
      item.textContent.trim().slice(0, 100) ||
      "Study material";

    resultsContainer.appendChild(link);
  });

  resultsContainer.hidden = false;
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLocaleLowerCase()
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

function getSafeItemLink(item) {
  const link = item.matches("a")
    ? item
    : item.querySelector("a[href]");

  if (!link) return "#";

  const href = link.getAttribute("href");

  if (!href || href.startsWith("javascript:")) {
    return "#";
  }

  return href;
}

/* ---------------------------------------------------------
   5. CURRENT YEAR
--------------------------------------------------------- */

function initializeCurrentYear() {
  const yearElement = document.querySelector("#current-year");

  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
}

/* ---------------------------------------------------------
   6. PWA SERVICE WORKER REGISTRATION
--------------------------------------------------------- */

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.info("Service Workers are not supported in this browser.");
    return;
  }

  if (!window.isSecureContext) {
    console.info("Service Worker requires a secure context such as HTTPS.");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "./sw.js",
        { scope: "./" }
      );

      console.info(
        "RETRY IN LIBRARY Service Worker registered:",
        registration.scope
      );

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.info("A new website version is available.");
          }
        });
      });
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  });
}

/* ---------------------------------------------------------
   7. LOCAL PREFERENCE STORAGE
--------------------------------------------------------- */

function getStoredPreference(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn("Local preference storage is unavailable.", error);
    return null;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Could not save local preference.", error);
  }
}
