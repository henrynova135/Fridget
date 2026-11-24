// ===== TEAM DATA (corrected to match HTML) =====
const teamMembers = [
  {
    name: "Kris",
    rollNumber: "001",
    role: "backend developer / database designer",
    contribution:
      "Designed the nav bar, wrote about us page content, implemented the backend logic, and integrated the database. Ensuring the smooth communication between the frontend and backend.",
    img: imageBase + "Kris.jpg",
  },
  {
    name: "SlacktivistHustler",
    rollNumber: "002",
    role: "Frontend Developer / Communication Manager",
    contribution:
      "Wrote the homepage content and maintain the frontend codebase. Also, ensuring the communication between members",
    img: imageBase + "SlacktivistHustler.jpg",
  },
  {
    name: "EiNandar",
    rollNumber: "003",
    role: "Frontend Developer/ Researcher",
    contribution: "Wrote recipes page content and implemented the frontend design. And also, researched recipes and provided the content for the recipes page.",
    img: imageBase + "EiNandar.jpg",
  },
  {
    name: "Shun Lei",
    rollNumber: "004",
    role: "Frontend Developer/ Adviser",
    contribution:
      "Wrote the account page content and implemented the frontend design. And also, provided guidance and advice to the team throughout the project.",
    img: imageBase + "ShunLei.jpg"
  }
];

// ===== DOM Elements =====
const header = document.querySelector(".head");
const title = document.querySelector(".gradient-text");
const cards = document.querySelectorAll(".glass-card");
const teamGrid = document.querySelector(".team-grid");
const overlay = document.getElementById("modalOverlay");
const modalImage = document.getElementById("modalImage");
const modalName = document.getElementById("modalName");
const modalRollNo = document.getElementById("modalRollNo");
const modalPosition = document.getElementById("modalPosition");
const modalContribution = document.getElementById("modalContribution");
const closeBtn = document.getElementById("closeModalBtn");

// ===== Header Scroll Animation (Transform → Fixed) =====
const SCROLL_DISTANCE = 600; // pixels to shrink
const START_SCALE = 1;
const END_SCALE = 0.45;

let headerFixed = false;
let headerHeight = 0;
function updateHeader() {
  const scrollY = window.scrollY;
  const progress = Math.min(scrollY / SCROLL_DISTANCE, 1);
  const vh = window.innerHeight / 100;
  const translateY = progress * (-45 * vh);

  if (scrollY <= SCROLL_DISTANCE) {
    const scale = START_SCALE - progress * (START_SCALE - END_SCALE);
    title.style.transform = `translateY(${translateY}px) scale(${scale})`;
  }
}
window.addEventListener("scroll", updateHeader);
window.addEventListener("resize", () => {
  if (headerFixed) {
    headerHeight = header.offsetHeight;
    teamGrid.style.marginTop = headerHeight + "px";
  }
});
updateHeader(); // initial
// ===== Staggered Card Reveal =====
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        setTimeout(() => {
          card.classList.add("revealed");
        }, index * 50);
        observer.unobserve(card);
      }
    });
  },
  { threshold: 0.2, rootMargin: "0px 0px -50px 0px" },
);

cards.forEach((card) => observer.observe(card));

// ===== Modal Functions =====
function openModal(index) {
    const member = teamMembers[index];

    modalName.textContent = member.name;
    modalRollNo.textContent = member.rollNumber;
    modalPosition.textContent = member.role;
    modalContribution.textContent = member.contribution;

    modalImage.src = member.img;
    modalImage.alt = `Profile photo of ${member.name}`;

    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
}

cards.forEach((card, idx) => {
  card.addEventListener("click", () => openModal(idx));
});

closeBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overlay.style.display === "none") closeModal();
});
const Links = document.querySelectorAll(".socials a");

Links.forEach(link => {
  link.addEventListener("click", function(e) {
    e.stopPropagation(); // Prevent card click
  });
});
// Slider toggle
const button = document.getElementById("btnTool");
const slider = document.getElementById("slider");

if (button && slider) {
  button.addEventListener("click", () => {
    slider.classList.toggle("slide");
  });
}
