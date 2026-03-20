document.addEventListener("DOMContentLoaded", () => {

  /* ============================================================
     HERO SLIDER  — background fade + text/image update
  ============================================================ */
  const heroData = [
    {
      label: "Coming Soon!!",
      title: "Learn AI Without Limits",
      subtitle: "Build skills with AI tools and real projects",
      button: "Start Learning",
      image: "static/images/hero.png",
      link: "/course/1"
    },
    {
      label: "COming Soon!!",
      title: "Master Graphic Design",
      subtitle: "Learn Branding, Flyers, and Modern Design like a Pro",
      button: "Explore Course",
      image: "static/images/graphics 2.png",
      link: "/course/2"
    },
    {
      label: "Welcome to the Academy",
      title: "You belong here",
      subtitle: "Lifetime Access to All Courses",
      button: "Join Now",
      image: "static/images/graphics 3.png",
      link: "/login"
    }
  ];

  const slides    = document.querySelectorAll(".hero-slide");
  const dots      = document.querySelectorAll(".hero-dot");
  const heroTitle    = document.getElementById("hero-title");
  const heroSubtitle = document.getElementById("hero-subtitle");
  const heroBtn      = document.getElementById("hero-btn");
  const heroLabel    = document.getElementById("hero-label");

  let currentSlide = 0;
  let sliderTimer  = null;

  function goToSlide(index) {
    // Remove active from old
    slides[currentSlide]?.classList.remove("active");
    dots[currentSlide]?.classList.remove("active");

    currentSlide = (index + heroData.length) % heroData.length;
    const data = heroData[currentSlide];

    // Activate new background slide
    slides[currentSlide]?.classList.add("active");
    dots[currentSlide]?.classList.add("active");

    // Fade out text then fade back in
    if (heroTitle) {
      heroTitle.style.transition = "opacity 0.4s";
      heroSubtitle.style.transition = "opacity 0.4s";

      heroTitle.style.opacity = "0";
      heroSubtitle.style.opacity = "0";

      setTimeout(() => {
        heroLabel.textContent    = data.label;
        heroTitle.textContent    = data.title;
        heroSubtitle.textContent = data.subtitle;
        heroBtn.textContent      = data.button;
        heroBtn.onclick          = () => { window.location.href = data.link; };

        heroTitle.style.opacity    = "1";
        heroSubtitle.style.opacity = "1";

        // Update mobile hero img tag
        const mobileImg = document.getElementById('hero-mobile-img');
        if (mobileImg) mobileImg.src = data.image;
      }, 400);
    }
  }

  // Dot click navigation
  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      const idx = parseInt(dot.dataset.index);
      goToSlide(idx);
      resetTimer();
    });
  });

  function resetTimer() {
    clearInterval(sliderTimer);
    sliderTimer = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 15000); // 15 seconds as requested
  }

  // Start
  goToSlide(0);
  resetTimer();


  /* ============================================================
     SEARCH — suggestions + filter cards
  ============================================================ */
  const searchInput    = document.querySelector(".search-bar input");
  const searchDropdown = document.querySelector(".search-suggestions");
  const courseCards    = document.querySelectorAll(".course-card");
  const coursesSection = document.querySelector(".courses-section");

  let noResultsMsg = document.getElementById("no-results-message");
  if (!noResultsMsg && coursesSection) {
    noResultsMsg = document.createElement("p");
    noResultsMsg.id = "no-results-message";
    noResultsMsg.style.cssText = "text-align:center;margin-top:24px;color:#6a6f73;font-size:14px;";
    coursesSection.appendChild(noResultsMsg);
  }

  if (searchInput && searchDropdown) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();

      searchDropdown.innerHTML = "";
      let anyVisible = false;

      courseCards.forEach(card => {
        const titleEl = card.querySelector("h3");
        if (!titleEl) return;
        const title = titleEl.textContent;
        const match = title.toLowerCase().includes(query);

        // Show/hide card
        card.closest(".course-link").style.display = (query === "" || match) ? "block" : "none";
        if (query === "" || match) anyVisible = true;

        // Build dropdown suggestions
        if (query.length > 0 && match) {
          const item = document.createElement("div");
          item.textContent = title;
          item.addEventListener("click", () => {
            searchInput.value = title;
            searchDropdown.style.display = "none";
            courseCards.forEach(c => {
              const t = c.querySelector("h3")?.textContent || "";
              c.closest(".course-link").style.display = (t === title) ? "block" : "none";
            });
          });
          searchDropdown.appendChild(item);
        }
      });

      // No results message
      if (noResultsMsg) {
        noResultsMsg.textContent = (query.length > 0 && !anyVisible)
          ? "No courses found for your search."
          : "";
      }

      searchDropdown.style.display = (searchDropdown.children.length > 0) ? "block" : "none";

      // Scroll to courses if typing
      if (query.length > 0 && coursesSection) {
        coursesSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    // Hide dropdown on outside click
    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.style.display = "none";
      }
    });
  }


  /* ============================================================
     TOPICS BAR — filter courses by topic
  ============================================================ */
  const topicLinks = document.querySelectorAll(".topic-link");
  topicLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      topicLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      // You can extend this to filter courses by category
    });
  });


  /* ============================================================
     PAGE ENTRANCE ANIMATION
  ============================================================ */
  const page = document.querySelector(".page-animate");
  if (page) {
    setTimeout(() => page.classList.add("visible"), 80);
  }

});