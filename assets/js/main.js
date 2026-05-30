// =========================================
// AOS INIT
// =========================================

AOS.init({
  duration: 900,
  easing: "ease-out",
  once: true,
  offset: 80,
});

// =========================================
// ELEMENTS
// =========================================

const header = document.querySelector(".site-header");
const backToTopButton = document.getElementById("backToTop");

// =========================================
// SCROLL EFFECTS
// =========================================

window.addEventListener("scroll", () => {
  if (header) {
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  if (backToTopButton) {
    if (window.scrollY > 500) {
      backToTopButton.classList.add("show");
    } else {
      backToTopButton.classList.remove("show");
    }
  }
});

// =========================================
// SMOOTH SCROLL
// =========================================

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");

    if (targetId === "#") return;

    const target = document.querySelector(targetId);

    if (!target) return;

    e.preventDefault();

    const headerOffset = 90;

    const targetPosition =
      target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });

    const navbar = document.querySelector(".navbar-collapse");

    if (navbar && navbar.classList.contains("show")) {
      new bootstrap.Collapse(navbar).hide();
    }
  });
});

// =========================================
// BACK TO TOP
// =========================================

if (backToTopButton) {
  backToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

// =========================================
// THEME TOGGLE
// =========================================

const themeToggle = document.getElementById("themeToggle");

const currentTheme = localStorage.getItem("theme") || "light";

document.documentElement.setAttribute("data-theme", currentTheme);

updateThemeIcon(currentTheme);

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");

  const next = current === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", next);

  localStorage.setItem("theme", next);

  updateThemeIcon(next);
});

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector("i");

  if (theme === "dark") {
    icon.className = "bi bi-sun";
  } else {
    icon.className = "bi bi-moon-stars";
  }
}
