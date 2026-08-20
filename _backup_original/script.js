const button = document.getElementById("noButton");
const footer = document.querySelector(".footer-area");

// Gift image touch functionality for mobile
const giftImages = document.querySelectorAll('.gift-img');
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Add touch events for gift images on mobile devices
if (isTouchDevice) {
    giftImages.forEach(img => {
        img.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // Remove touched class from all gift images
            giftImages.forEach(gift => gift.classList.remove('touched'));
            // Add touched class to current image
            img.classList.add('touched');
        });
        
        // Optional: Add click event as fallback
        img.addEventListener('click', (e) => {
            e.preventDefault();
            giftImages.forEach(gift => gift.classList.remove('touched'));
            img.classList.add('touched');
        });
    });
}

// Handle both mouse and touch events for mobile compatibility
const moveButtonOnInteraction = () => {
  const footerRect = footer.getBoundingClientRect();
  const btnRect = button.getBoundingClientRect();

  // Calculate max available space inside footer
  const maxX = footer.clientWidth - btnRect.width;
  const maxY = footer.clientHeight - btnRect.height;

  // Generate random new position inside the footer
  const newX = Math.random() * maxX;
  const newY = Math.random() * maxY;

  // Move button with absolute positioning
  button.style.position = 'absolute';
  button.style.left = `${newX}px`;
  button.style.top = `${newY}px`;
};

button.addEventListener("mouseover", moveButtonOnInteraction);
button.addEventListener("touchstart", moveButtonOnInteraction);

button.addEventListener("click", (e) => {
    e.preventDefault(); // block real click
    moveButtonOnInteraction();
});

const yesButton = document.getElementById("btn-yes");
const noButton = document.getElementById("btn-no");

yesButton.addEventListener("click", () => {
  var confettiElement = document.getElementById("confetti-canvas");
  var confettiSettings = {
    target: confettiElement,
    max: 1920,
    size: 1,
    animate: true,
    props: ["circle", "square", "triangle", "line"],
    colors: [
      [165, 104, 246],
      [230, 61, 135],
      [0, 199, 228],
      [253, 214, 126],
    ],
    clock: 25,
    rotate: true,
    start_from_edge: true,
    respawn: true,
  };

  yesButton.style.display = "none";
  noButton.style.display = "none";

  // Style canvas
  confettiElement.style.position = "absolute";
  confettiElement.style.top = "0";
  confettiElement.style.left = "0";
  confettiElement.style.width = "100%";
  confettiElement.style.height = "100%";
  confettiElement.style.zIndex = "1000";

    const confetti = new ConfettiGenerator(confettiSettings);
    confetti.render();

  let p = document.createElement("p");
  p.innerText = "Отличный выбор 🎉 \n😉";
  p.style.background = "#2ecc71";
  p.style.color = "#fff";
  p.style.padding = "20px";
  p.style.borderRadius = "10px";
  p.style.fontSize = "2rem";
  p.style.fontWeight = "bold";
  p.style.textAlign = "center";
  p.style.position = "absolute";
  p.style.top = "50%";
  p.style.left = "50%";
  p.style.transform = "translate(-50%, -50%)";
  document.body.appendChild(p);
});

