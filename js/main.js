(() => {
  "use strict";

  /* ---------- Mobile navigation ---------- */

  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector("#main-nav");
  const navLinks = document.querySelectorAll("#main-nav a");

  function setMenu(open) {
    if (!menuToggle || !mainNav) return;
    mainNav.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  }

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    navLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));

    document.addEventListener("click", (event) => {
      if (!mainNav.contains(event.target) && !menuToggle.contains(event.target)) {
        setMenu(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mainNav.classList.contains("open")) {
        setMenu(false);
        menuToggle.focus();
      }
    });

    // Close the mobile menu if the window grows to the desktop layout.
    window.matchMedia("(min-width: 721px)").addEventListener("change", (event) => {
      if (event.matches) setMenu(false);
    });
  }

  /* ---------- Scroll reveal and active nav link ---------- */

  if ("IntersectionObserver" in window) {
    const revealElements = document.querySelectorAll(".reveal");

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    // Only enable hidden-until-visible styling once the observer is ready.
    document.documentElement.classList.add("js-enabled");
    revealElements.forEach((element) => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("is-active", isActive);
          if (isActive) {
            link.setAttribute("aria-current", "true");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px" });

    document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- Footer year ---------- */

  const yearElement = document.querySelector("#year");
  if (yearElement) yearElement.textContent = String(new Date().getFullYear());

  /* ---------- Contact form ----------
     If the form has a Formspree endpoint in data-endpoint, the message is sent
     straight from the page. Without one, it falls back to opening a prepared
     email in the visitor's mail app, which is how the site worked before. */

  const contactForm = document.querySelector("#contact-form");
  const formNote = document.querySelector("#form-note");
  const submitButton = contactForm ? contactForm.querySelector('[type="submit"]') : null;
  const contactEmail = "dylanjerome95@gmail.com";

  function showNote(text, state) {
    if (!formNote) return;
    formNote.textContent = text;
    formNote.classList.toggle("is-success", state === "success");
    formNote.classList.toggle("is-error", state === "error");
  }

  if (contactForm) {
    const endpoint = (contactForm.dataset.endpoint || "").trim();
    const defaultLabel = submitButton ? submitButton.innerHTML : "";

    if (!endpoint && submitButton) {
      submitButton.innerHTML = 'Prepare Email <span aria-hidden="true">↗</span>';
      showNote("This form opens a prepared email in your email application.");
    }

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;

      const data = new FormData(contactForm);

      // Bots fill the hidden field; people never see it.
      if (String(data.get("_gotcha") || "")) return;

      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const service = String(data.get("service") || "").trim();
      const message = String(data.get("message") || "").trim();
      const subject = `Portfolio inquiry: ${service}`;

      if (!endpoint) {
        const body = [
          `Name: ${name}`,
          `Reply email: ${email}`,
          `Project type: ${service}`,
          "",
          "Project details:",
          message
        ].join("\n");

        showNote("Opening your email application. Review the draft and press Send.");
        window.location.href =
          `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        return;
      }

      data.set("_subject", subject);

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending…";
      }
      showNote("");

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" }
        });

        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

        contactForm.reset();
        showNote("Thanks, your message has been sent. I'll get back to you soon.", "success");
      } catch (error) {
        showNote(`Sorry, that didn't go through. Please email me directly at ${contactEmail}.`, "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = defaultLabel;
        }
      }
    });
  }
})();
