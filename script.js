const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const statusEl = document.getElementById("status");
const gallery = document.getElementById("gallery");
const btnStart = document.getElementById("btnStart");
const btnCapture = document.getElementById("btnCapture");

let stream = null;

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

function canUseCamera() {
  return Boolean(window.isSecureContext && navigator.mediaDevices?.getUserMedia);
}

async function startCamera() {
  if (!canUseCamera()) {
    setStatus(
      "Kamera ishlamaydi. Faqat shu linkni oching: http://localhost:3000 (IP manzil emas).",
      true
    );
    return;
  }

  btnStart.disabled = true;
  setStatus("Kamera ruxsati so‘ralmoqda...");

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });

    video.srcObject = stream;
    await video.play();

    // Kadr tayyor bo‘lishini kutamiz
    if (video.readyState < 2) {
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("Kamera tayyor bo‘lmadi")), 10000);
        video.addEventListener(
          "loadeddata",
          () => {
            clearTimeout(t);
            resolve();
          },
          { once: true }
        );
      });
    }

    btnCapture.disabled = false;
    setStatus("Kamera ishlayapti. Rasm olinmoqda...");

    await wait(500);
    await capturePhoto();
  } catch (err) {
    console.error(err);
    btnStart.disabled = false;
    btnCapture.disabled = true;

    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      setStatus(
        "Ruxsat berilmadi. Manzil satridagi kamera belgisidan Allow bosing, keyin sahifani yangilang.",
        true
      );
    } else if (err.name === "NotFoundError") {
      setStatus("Kamera topilmadi. Kompyuterda kamera borligini tekshiring.", true);
    } else {
      setStatus("Xato: " + (err.message || err.name), true);
    }
  }
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function capturePhoto() {
  if (!video.videoWidth) {
    setStatus("Video hali tayyor emas. Yana bosing.", true);
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  // Ko‘zgu effekti (selfie)
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const fileName = "rasm-" + Date.now() + ".jpg";

  addToGallery(dataUrl, fileName);
  setStatus("Rasm olindi! Pastgi galereyada ko‘ring. Yana olish uchun «Rasm olish» ni bosing.");
}

function addToGallery(dataUrl, fileName) {
  const figure = document.createElement("figure");

  const img = document.createElement("img");
  img.src = dataUrl;
  img.alt = fileName;

  const caption = document.createElement("figcaption");
  caption.textContent = fileName;

  const downloadBtn = document.createElement("a");
  downloadBtn.href = dataUrl;
  downloadBtn.download = fileName;
  downloadBtn.textContent = "Yuklab olish";
  downloadBtn.className = "download-link";

  figure.appendChild(img);
  figure.appendChild(caption);
  figure.appendChild(downloadBtn);
  gallery.prepend(figure);
}

btnStart.addEventListener("click", startCamera);
btnCapture.addEventListener("click", capturePhoto);

// Agar localhost bo‘lsa — avtomatik urinish
if (canUseCamera()) {
  setStatus("Kamerani yoqish uchun pastdagi tugmani bosing.");
} else {
  setStatus(
    "Kamera uchun oching: http://localhost:3000  (hozirgi manzil xavfsiz emas)",
    true
  );
  btnStart.disabled = true;
}
