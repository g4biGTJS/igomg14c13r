document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.querySelector(".dropdown");
  const dropdownBtn = document.getElementById("downloadBtn");
  const dropdownContent = document.getElementById("dropdownContent");
  const discordBtn = document.getElementById("discordBtn");

  // Toggle dropdown
  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("active");
  });

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });

  // Handle dropdown item clicks
  document.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (item.classList.contains("disabled")) {
        e.preventDefault();
        item.classList.add("shake");
        setTimeout(() => item.classList.remove("shake"), 500);
      } else {
        alert(`Downloading: ${item.dataset.version}`);
      }
    });
  });

  // Discord button ripple effect
  discordBtn.addEventListener("click", (e) => {
    const circle = document.createElement("span");
    circle.classList.add("ripple");
    const rect = discordBtn.getBoundingClientRect();
    circle.style.left = `${e.clientX - rect.left}px`;
    circle.style.top = `${e.clientY - rect.top}px`;
    discordBtn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
    window.open("https://discord.gg/YOUR_INVITE_CODE", "_blank");
  });
});
