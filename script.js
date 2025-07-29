const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const captureBtn = document.getElementById("capture");
const countdownEl = document.getElementById("countdown");
const filterSelect = document.getElementById("filter");
const snapSound = document.getElementById("snapSound");
const downloadBtn = document.getElementById("download");
const stripContainer = document.getElementById("strip-container");
const stickerArea = document.getElementById("sticker-area");

let currentFilter = 'none';
let images = [];
let stickerImages = [];

// Webcam stream
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.play();
  })
  .catch(err => console.error("Webcam error:", err));

// Apply filter live
filterSelect.addEventListener("change", () => {
  currentFilter = filterSelect.value;
  video.style.filter = currentFilter;
});

// Countdown before capture
function countdownAndCapture() {
  let seconds = 3;
  countdownEl.textContent = seconds;

  const interval = setInterval(() => {
    seconds--;
    countdownEl.textContent = seconds;
    if (seconds === 0) {
      clearInterval(interval);
      countdownEl.textContent = "";
      snapSound.play();
      captureImage();
    }
  }, 1000);
}

// Drag-and-drop sticker logic
function enableStickerDrag(sticker) {
  sticker.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", e.target.src);
  });
}

canvas.addEventListener("dragover", e => {
  e.preventDefault();
});

canvas.addEventListener("drop", e => {
  e.preventDefault();
  const src = e.dataTransfer.getData("text/plain");
  const img = new Image();
  img.src = src;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  img.onload = () => {
    ctx.drawImage(img, x - 25, y - 25, 50, 50); // Draw sticker on canvas
    stickerImages.push({ src, x: x - 25, y: y - 25 }); // Save for strip
  };
});

// Capture photo
function captureImage() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = currentFilter;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  stickerImages.forEach(sticker => {
    const img = new Image();
    img.src = sticker.src;
    img.onload = () => {
      ctx.drawImage(img, sticker.x, sticker.y, 50, 50);
    };
  });

  // Wait a bit for stickers to draw
  setTimeout(() => {
    const dataURL = canvas.toDataURL("image/png");
    images.push({ src: dataURL, stickers: [...stickerImages] });
    displayInStrip(dataURL);

    if (images.length === 3) {
      createPhotoStrip();
    }
  }, 200);
}

// Display single image preview
function displayInStrip(dataUrl) {
  const img = document.createElement("img");
  img.src = dataUrl;
  img.classList.add("strip-image");
  stripContainer.appendChild(img);
}

// Create vertical strip with borders and stickers
function createPhotoStrip() {
  const width = canvas.width;
  const height = canvas.height;
  const border = 20;
  const stripCanvas = document.createElement("canvas");
  const stripCtx = stripCanvas.getContext("2d");

  stripCanvas.width = width + border * 2;
  stripCanvas.height = (height + border * 2) * 3;

  let loaded = 0;
  images.forEach((data, index) => {
    const img = new Image();
    img.src = data.src;

    img.onload = () => {
      const y = index * (height + border * 2);
      stripCtx.fillStyle = "#ffffff"; // White border
      stripCtx.fillRect(0, y, stripCanvas.width, height + border * 2);
      stripCtx.drawImage(img, border, y + border, width, height);

      loaded++;
      if (loaded === 3) {
        const finalData = stripCanvas.toDataURL("image/png");
        downloadBtn.href = finalData;
        downloadBtn.download = "photo_strip.png";
        downloadBtn.style.display = "inline-block";
      }
    };
  });
}

// Attach drag to all stickers inside stickerArea
document.querySelectorAll(".sticker").forEach(sticker => {
  enableStickerDrag(sticker);
});

captureBtn.addEventListener("click", countdownAndCapture);
