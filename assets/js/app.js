"use strict";

/* =========================================================
   RETRY IN LIBRARY
   File: assets/js/app.js
   Main website interactions
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeNavigation();
  initializeTheme();
  initializeLanguage();
  initializeSearch();
  initializeCurrentYear();
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
  const themeToggle = document.querySelector("#theme-toggle");
  const savedTheme = getStoredPreference("ril-theme");

  const preferredTheme =
    savedTheme ||
    (window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");

  applyTheme(preferredTheme);

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

  const themeToggle = document.querySelector("#theme-toggle");

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );

    themeToggle.setAttribute("aria-pressed", String(isDark));
  }

  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

/* ---------------------------------------------------------
   3. LANGUAGE MANAGEMENT
--------------------------------------------------------- */

function initializeLanguage() {
  const languageToggle = document.querySelector("#language-toggle");
  const savedLanguage = getStoredPreference("ril-language");

  const initialLanguage =
    savedLanguage === "te" ? "te" : "en";

  applyLanguage(initialLanguage);

  if (!languageToggle) return;

  languageToggle.addEventListener("click", () => {
    const currentLanguage =
      document.body.dataset.language || "en";

    const nextLanguage = currentLanguage === "en" ? "te" : "en";

    applyLanguage(nextLanguage);
    savePreference("ril-language", nextLanguage);
  });
}

function applyLanguage(language) {
  const selectedLanguage = language === "te" ? "te" : "en";

  document.body.dataset.language = selectedLanguage;
  document.documentElement.lang =
    selectedLanguage === "te" ? "te" : "en";

  document.querySelectorAll("[data-en][data-te]").forEach((element) => {
    const translatedText =
      selectedLanguage === "te"
        ? element.dataset.te
        : element.dataset.en;

    if (translatedText !== undefined) {
      element.textContent = translatedText;
    }
  });

  document.querySelectorAll("[data-en-placeholder][data-te-placeholder]").forEach(
    (element) => {
      element.placeholder =
        selectedLanguage === "te"
          ? element.dataset.tePlaceholder
          : element.dataset.enPlaceholder;
    }
  );

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
      searchResults.innerHTML = "";
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
   6. LOCAL PREFERENCE STORAGE
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
