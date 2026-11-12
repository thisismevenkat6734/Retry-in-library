"use strict";

/**
 * RETRY IN LIBRARY
 * File: assets/js/app.js
 * Main application controller
 *
 * Features:
 * - Mobile navigation
 * - Telugu / English language preference
 * - Light / dark theme preference
 * - Homepage content search
 * - Service worker registration
 * - Accessible interaction handling
 */

(() => {
  const STORAGE_KEYS = Object.freeze({
    language: "ril_language",
    theme: "ril_theme"
  });

  const DEFAULT_LANGUAGE = "en";
  const DEFAULT_THEME = "light";

  const SELECTORS = Object.freeze({
    menuToggle: ".menu-toggle",
    navigation: ".primary-navigation",
    languageToggle: "#language-toggle, [data-language-toggle]",
    themeToggle: "#theme-toggle, [data-theme-toggle]",
    searchForm: "#global-search",
    searchInput: "#search-input",
    searchResults: "#search-results"
  });

  const state = {
    language: DEFAULT_LANGUAGE,
    theme: DEFAULT_THEME,
    searchItems: [],
    searchTimer: null
  };

  /**
   * Safely read a value from localStorage.
   */
  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("Local storage is unavailable:", error);
      return null;
    }
  }

  /**
   * Safely save a value to localStorage.
   */
  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("Could not save preference:", error);
      return false;
    }
  }

  /**
   * Normalize text for search.
   * Supports English and Telugu Unicode text.
   */
  function normalizeText(value) {
    return String(value || "")
      .normalize("NFC")
      .toLocaleLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Initialize the mobile navigation.
   */
  function initializeNavigation() {
    const menuToggle = document.querySelector(
      SELECTORS.menuToggle
    );

    const navigation = document.querySelector(
      SELECTORS.navigation
    );

    if (!menuToggle || !navigation) {
      return;
    }

    function setMenuOpen(isOpen) {
      menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      navigation.classList.toggle("active", isOpen);

      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
      );
    }

    setMenuOpen(false);

    menuToggle.addEventListener("click", () => {
      const isOpen =
        menuToggle.getAttribute("aria-expanded") === "true";

      setMenuOpen(!isOpen);
    });

    navigation.addEventListener("click", (event) => {
      const link = event.target.closest("a");

      if (link) {
        setMenuOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    });

    document.addEventListener("click", (event) => {
      const clickedInside =
        navigation.contains(event.target) ||
        menuToggle.contains(event.target);

      if (!clickedInside) {
        setMenuOpen(false);
      }
    });
  }

  /**
   * Apply the selected language to elements
   * containing data-en and data-te attributes.
   */
  function applyLanguage(language) {
    const selectedLanguage =
      language === "te" ? "te" : "en";

    state.language = selectedLanguage;

    document.documentElement.lang = selectedLanguage;

    document.querySelectorAll("[data-en][data-te]").forEach(
      (element) => {
        const translatedText =
          selectedLanguage === "te"
            ? element.getAttribute("data-te")
            : element.getAttribute("data-en");

        if (translatedText !== null) {
          element.textContent = translatedText;
        }
      }
    );

    document
      .querySelectorAll("[data-en-placeholder][data-te-placeholder]")
      .forEach((element) => {
        const placeholder =
          selectedLanguage === "te"
            ? element.getAttribute("data-te-placeholder")
            : element.getAttribute("data-en-placeholder");

        if (placeholder !== null) {
          element.setAttribute("placeholder", placeholder);
        }
      });

    document
      .querySelectorAll("[data-en-aria-label][data-te-aria-label]")
      .forEach((element) => {
        const label =
          selectedLanguage === "te"
            ? element.getAttribute("data-te-aria-label")
            : element.getAttribute("data-en-aria-label");

        if (label !== null) {
          element.setAttribute("aria-label", label);
        }
      });

    const languageToggle = document.querySelector(
      SELECTORS.languageToggle
    );

    if (languageToggle) {
      languageToggle.setAttribute(
        "aria-label",
        selectedLanguage === "en"
          ? "Switch language to Telugu"
          : "భాషను English కు మార్చండి"
      );

      languageToggle.setAttribute(
        "aria-pressed",
        String(selectedLanguage === "te")
      );

      languageToggle.setAttribute(
        "title",
        selectedLanguage === "en"
          ? "తెలుగులో చూడండి"
          : "View in English"
      );

      const visibleLabel =
        languageToggle.querySelector(".language-label");

      if (visibleLabel) {
        visibleLabel.textContent =
          selectedLanguage === "en" ? "తెలుగు" : "English";
      }
    }

    writeStorage(STORAGE_KEYS.language, selectedLanguage);
  }

  /**
   * Initialize language switching.
   */
  function initializeLanguage() {
    const savedLanguage = readStorage(STORAGE_KEYS.language);

    const initialLanguage =
      savedLanguage === "te" || savedLanguage === "en"
        ? savedLanguage
        : DEFAULT_LANGUAGE;

    applyLanguage(initialLanguage);

    const languageToggle = document.querySelector(
      SELECTORS.languageToggle
    );

    if (!languageToggle) {
      return;
    }

    languageToggle.addEventListener("click", () => {
      const nextLanguage =
        state.language === "en" ? "te" : "en";

      applyLanguage(nextLanguage);
    });
  }

  /**
   * Apply the selected visual theme.
   */
  function applyTheme(theme) {
    const selectedTheme =
      theme === "dark" ? "dark" : "light";

    state.theme = selectedTheme;

    document.body.classList.toggle(
      "dark-mode",
      selectedTheme === "dark"
    );

    document.documentElement.dataset.theme = selectedTheme;

    const themeToggle = document.querySelector(
      SELECTORS.themeToggle
    );

    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-pressed",
        String(selectedTheme === "dark")
      );

      themeToggle.setAttribute(
        "aria-label",
        selectedTheme === "dark"
          ? "Switch to light theme"
          : "Switch to dark theme"
      );

      themeToggle.setAttribute(
        "title",
        selectedTheme === "dark"
          ? "Light mode"
          : "Dark mode"
      );
    }

    writeStorage(STORAGE_KEYS.theme, selectedTheme);
  }

  /**
   * Initialize theme switching.
   */
  function initializeTheme() {
    const savedTheme = readStorage(STORAGE_KEYS.theme);

    const initialTheme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : DEFAULT_THEME;

    applyTheme(initialTheme);

    const themeToggle = document.querySelector(
      SELECTORS.themeToggle
    );

    if (!themeToggle) {
      return;
    }

    themeToggle.addEventListener("click", () => {
      const nextTheme =
        state.theme === "light" ? "dark" : "light";

      applyTheme(nextTheme);
    });
  }

  /**
   * Collect searchable content from homepage cards.
   */
  function collectSearchItems() {
    const searchableSelectors = [
      ".exam-card",
      ".subject-card",
      ".state-card",
      ".practice-card",
      ".current-affairs-card"
    ];

    const elements = document.querySelectorAll(
      searchableSelectors.join(",")
    );

    return Array.from(elements)
      .map((element) => {
        const link = element.matches("a")
          ? element
          : element.querySelector("a[href]");

        if (!link) {
          return null;
        }

        const href = link.getAttribute("href");

        if (
          !href ||
          href.startsWith("#") ||
          href.startsWith("javascript:")
        ) {
          return null;
        }

        return {
          element,
          title: normalizeText(element.textContent),
          href,
          originalTitle:
            link.textContent.trim() ||
            element.textContent.trim()
        };
      })
      .filter(Boolean);
  }

  /**
   * Clear search results safely.
   */
  function clearSearchResults(container) {
    if (!container) {
      return;
    }

    container.replaceChildren();
    container.hidden = true;
  }

  /**
   * Display search results without using innerHTML.
   */
  function displaySearchResults(results, container, query) {
    if (!container) {
      return;
    }

    container.replaceChildren();

    if (!query) {
      container.hidden = true;
      return;
    }

    container.hidden = false;

    if (results.length === 0) {
      const message = document.createElement("p");

      message.textContent =
        state.language === "te"
          ? "ఫలితాలు కనబడలేదు. వేరే పదంతో వెతకండి."
          : "No results found. Try another search term.";

      message.className = "search-empty-message";

      container.appendChild(message);
      return;
    }

    const heading = document.createElement("p");

    heading.className = "search-results-heading";

    heading.textContent =
      state.language === "te"
        ? `${results.length} ఫలితాలు కనుగొనబడ్డాయి`
        : `${results.length} result(s) found`;

    container.appendChild(heading);

    const resultList = document.createElement("div");

    resultList.className = "search-results-list";

    results.forEach((item) => {
      const resultLink = document.createElement("a");

      resultLink.className = "search-result-item";
      resultLink.href = item.href;
      resultLink.textContent = item.originalTitle;

      resultList.appendChild(resultLink);
    });

    container.appendChild(resultList);
  }

  /**
   * Search homepage cards.
   */
  function performSearch(query, container) {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      clearSearchResults(container);
      return;
    }

    const results = state.searchItems
      .filter((item) => {
        return item.title.includes(normalizedQuery);
      })
      .slice(0, 20);

    displaySearchResults(
      results,
      container,
      normalizedQuery
    );
  }

  /**
   * Initialize homepage search.
   */
  function initializeSearch() {
    const searchForm = document.querySelector(
      SELECTORS.searchForm
    );

    const searchInput = document.querySelector(
      SELECTORS.searchInput
    );

    const searchResults = document.querySelector(
      SELECTORS.searchResults
    );

    if (!searchForm || !searchInput || !searchResults) {
      return;
    }

    state.searchItems = collectSearchItems();

    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (state.searchTimer) {
        window.clearTimeout(state.searchTimer);
      }

      performSearch(searchInput.value, searchResults);
    });

    searchInput.addEventListener("input", () => {
      if (state.searchTimer) {
        window.clearTimeout(state.searchTimer);
      }

      state.searchTimer = window.setTimeout(() => {
        performSearch(searchInput.value, searchResults);
      }, 180);
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        searchInput.value = "";
        clearSearchResults(searchResults);
      }
    });

    document.addEventListener("click", (event) => {
      const clickedSearchArea =
        searchForm.contains(event.target) ||
        searchResults.contains(event.target);

      if (!clickedSearchArea) {
        clearSearchResults(searchResults);
      }
    });
  }

  /**
   * Register the service worker.
   *
   * The sw.js file must exist before offline caching
   * can work. Registration failures do not break the site.
   */
  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (!window.isSecureContext) {
      return;
    }

    try {
      const registration =
        await navigator.serviceWorker.register("./sw.js", {
          scope: "./"
        });

      console.info(
        "RETRY IN LIBRARY service worker registered:",
        registration.scope
      );
    } catch (error) {
      console.warn(
        "Service worker registration failed:",
        error
      );
    }
  }

  /**
   * Set the current year in elements that request it.
   */
  function initializeCurrentYear() {
    const currentYear = String(new Date().getFullYear());

    document
      .querySelectorAll("[data-current-year]")
      .forEach((element) => {
        element.textContent = currentYear;
      });
  }

  /**
   * Prevent empty placeholder links from jumping to page top.
   * Only links explicitly marked data-placeholder-link are affected.
   */
  function initializePlaceholderLinkProtection() {
    document
      .querySelectorAll('a[data-placeholder-link="true"]')
      .forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
        });
      });
  }

  /**
   * Start the application.
   */
  function initializeApp() {
    try {
      initializeNavigation();
      initializeLanguage();
      initializeTheme();
      initializeSearch();
      initializeCurrentYear();
      initializePlaceholderLinkProtection();

      registerServiceWorker();
    } catch (error) {
      console.error(
        "RETRY IN LIBRARY initialization error:",
        error
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeApp,
      { once: true }
    );
  } else {
    initializeApp();
  }
})();
