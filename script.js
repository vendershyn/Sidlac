const $ = (s) => document.querySelector(s),
  sleep = (m) => new Promise((r) => setTimeout(r, m)),
  p2 = (n) => String(n).padStart(2, "0");
let theme = "light",
  layout = "strip",
  cardColor = "pink",
  busy = false,
  ready = false,
  shots = [],
  tick = 0;
const timer = $("#cd");
const vid = document.createElement("video");
vid.playsInline = true;
vid.muted = true;
let cameraStream = null;
const live = $("#live"),
  SZ = { light: [256, 192], dark: [480, 360] },
  SZL = { sony: [256, 192], canon: [320, 240] },
  mobile = matchMedia("(max-width: 640px), (max-height: 640px) and (pointer: coarse)"),
  portrait = mobile;
const TT = {
  light: "Sidlac — Y2K Cam.exe",
  dark: "Sidlac · Est. 1926",
};
const CARD_COLORS = {
  pink: "#f8d7e5",
  lavender: "#e6ddfa",
  mint: "#daf0df",
  sky: "#d8ecf7",
  butter: "#fbf0c8",
};
const q = (v) => Math.round(Math.max(0, Math.min(255, v)) / 17) * 17;
const dstr = () => {
  const t = new Date();
  return p2(t.getMonth() + 1) + "." + p2(t.getDate()) + "." + t.getFullYear();
};

let sensorActive = false,
  sensorPermissionRequested = false;
function setTimerRotation(degrees) {
  timer.style.setProperty("--timer-rotation", degrees + "deg");
}
function updateTimerFromScreen() {
  if (!mobile.matches) {
    setTimerRotation(0);
    return;
  }
  if (sensorActive) return;
  const angle =
    screen.orientation && typeof screen.orientation.angle === "number"
      ? screen.orientation.angle
      : typeof window.orientation === "number"
        ? window.orientation
        : 0;
  setTimerRotation(
    angle === 90 || angle === -270
      ? 90
      : angle === 270 || angle === -90
        ? -90
        : 0,
  );
}
function handleDeviceOrientation(event) {
  if (!mobile.matches) {
    setTimerRotation(0);
    return;
  }
  const beta = event.beta,
    gamma = event.gamma;
  if (typeof beta !== "number" || typeof gamma !== "number") return;
  if (Math.max(Math.abs(beta), Math.abs(gamma)) < 20) return;
  sensorActive = true;
  setTimerRotation(
    Math.abs(gamma) > Math.abs(beta) && Math.abs(gamma) > 35
      ? gamma > 0
        ? 90
        : -90
      : 0,
  );
}
function enableDeviceOrientation() {
  if (
    sensorPermissionRequested ||
    !mobile.matches ||
    !("DeviceOrientationEvent" in window)
  )
    return;
  sensorPermissionRequested = true;
  const requestPermission = DeviceOrientationEvent.requestPermission;
  if (typeof requestPermission === "function") {
    requestPermission
      .call(DeviceOrientationEvent)
      .then((permission) => {
        if (permission === "granted") {
          window.addEventListener("deviceorientation", handleDeviceOrientation);
        } else {
          updateTimerFromScreen();
        }
      })
      .catch(updateTimerFromScreen);
  } else {
    window.addEventListener("deviceorientation", handleDeviceOrientation);
  }
}
timer.style.setProperty("--timer-rotation", "0deg");
if ("DeviceOrientationEvent" in window && !DeviceOrientationEvent.requestPermission) {
  window.addEventListener("deviceorientation", handleDeviceOrientation);
}
updateTimerFromScreen();
screen.orientation?.addEventListener?.("change", updateTimerFromScreen);
window.addEventListener("orientationchange", updateTimerFromScreen);
window.addEventListener("pointerdown", enableDeviceOrientation, { once: true });

function render(cv) {
  const portraitMode = portrait.matches,
    L = theme === "light",
    sk = document.documentElement.dataset.skin,
    [baseW, baseH] = L ? SZL[sk] : SZ.dark,
    [w, h] = portraitMode ? [baseH, baseW] : [baseW, baseH];
  if (cv.width !== w || cv.height !== h) {
    cv.width = w;
    cv.height = h;
  }
  const c = cv.getContext("2d", { willReadFrequently: true }),
    vw = vid.videoWidth,
    vh = vid.videoHeight;
  const rotate = portraitMode ? vw > vh : !mobile.matches && vh > vw,
    sourceWidth = rotate ? vh : vw,
    sourceHeight = rotate ? vw : vh;
  let cropWidth = sourceWidth,
    cropHeight = sourceHeight;
  if (cropWidth / cropHeight > w / h) {
    cropWidth = cropHeight * (w / h);
  } else {
    cropHeight = cropWidth / (w / h);
  }
  const sourceCropWidth = rotate ? cropHeight : cropWidth,
    sourceCropHeight = rotate ? cropWidth : cropHeight,
    sx = (vw - sourceCropWidth) / 2,
    sy = (vh - sourceCropHeight) / 2;
  c.save();
  c.translate(w, 0);
  c.scale(-1, 1);
  if (rotate) {
    if (portraitMode) {
      c.translate(w, 0);
      c.rotate(Math.PI / 2);
    } else {
      c.translate(0, h);
      c.rotate(-Math.PI / 2);
    }
    c.drawImage(vid, sx, sy, sourceCropWidth, sourceCropHeight, 0, 0, h, w);
  } else {
    c.drawImage(vid, sx, sy, sourceCropWidth, sourceCropHeight, 0, 0, w, h);
  }
  c.restore();
  const im = c.getImageData(0, 0, w, h),
    d = im.data;
  if (L) {
    // 2003-06 phone-cam: low-res, punchy saturation, warm/green cast, 16-level colour
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i],
        g = d[i + 1],
        b = d[i + 2],
        l = 0.3 * r + 0.59 * g + 0.11 * b,
        n = (Math.random() - 0.5) * 20;
      if (sk === "canon") {
        d[i] = (l + (r - l) * 1.25 - 128) * 1.3 + 156 + n / 3;
        d[i + 1] = (l + (g - l) * 1.25 - 128) * 1.3 + 150 + n / 3;
        d[i + 2] = (l + (b - l) * 1.25 - 128) * 1.3 + 160 + n / 3;
      } else {
        d[i] = q((l + (r - l) * 1.5 - 128) * 1.15 + 140 + n);
        d[i + 1] = q((l + (g - l) * 1.5 - 128) * 1.15 + 136 + n);
        d[i + 2] = q((l + (b - l) * 1.5 - 128) * 1.15 + 112 + n);
      }
    }
  } else {
    // old-film: grayscale, hard contrast, grain
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2],
        v = (l - 128) * 1.3 + 138 + (Math.random() - 0.5) * 36;
      d[i] = v * 1.04;
      d[i + 1] = v;
      d[i + 2] = v * 0.9;
    }
  }
  c.putImageData(im, 0, 0);
  if (L) {
    const t = new Date(),
      s =
        p2(t.getMonth() + 1) +
        " " +
        p2(t.getDate()) +
        " ’" +
        String(t.getFullYear()).slice(2);
    c.textAlign = "right";
    if (sk === "sony") {
      c.font = "16px VT323,monospace";
      c.fillStyle = "#000";
      c.fillText(s, w - 7, h - 7);
      c.fillStyle = "#ff8a1f";
      c.fillText(s, w - 8, h - 8);
    } else if (sk === "canon") {
      c.font = "22px VT323,monospace";
      c.fillStyle = "#ffd23f";
      c.fillText(
        t.getFullYear() + " " + p2(t.getMonth() + 1) + " " + p2(t.getDate()),
        w - 10,
        h - 10,
      );
    } else {
      c.font = "11px Tahoma,sans-serif";
      c.fillStyle = "#fff";
      c.fillText(p2(t.getHours()) + ":" + p2(t.getMinutes()), w - 6, h - 6);
      c.textAlign = "left";
      c.fillStyle = "#e5322d";
      c.fillText("● LIVE", 6, h - 6);
    }
  } else {
    const g = c.createRadialGradient(
      w / 2,
      h / 2,
      h * 0.35,
      w / 2,
      h / 2,
      h * 0.85,
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.72)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    if (Math.random() < 0.2) {
      c.fillStyle = "rgba(255,255,255,.28)";
      c.fillRect(Math.random() * w, 0, 1, h);
    }
  }
}
function loop(ts) {
  requestAnimationFrame(loop);
  if (!ready || ts - tick < 40 || $("#camView").hidden) return;
  tick = ts;
  render(live);
}
async function init() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API unavailable");
    }
    const s = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    cameraStream = s;
    vid.srcObject = s;
    await vid.play();
    ready = true;
    $("#err").hidden = true;
    $("#shut").disabled = false;
    $("#hint").textContent = HINT;
  } catch (e) {
    ready = false;
    $("#shut").disabled = true;
    $("#err").hidden = false;
    $("#hint").textContent =
      e && e.name === "NotAllowedError"
        ? "Camera access was denied. Allow it, then choose Retry."
        : "Camera unavailable. Check the device or browser permissions.";
  }
}
function thumbs() {
  $("#th").innerHTML = '<b class="th"></b>'.repeat(layout === "grid" ? 4 : 3);
}
async function run() {
  if (busy || !ready) return;
  busy = true;
  $("#shut").disabled = true;
  shots = [];
  thumbs();
  $(".cam").classList.add("busy");
  const n = layout === "grid" ? 4 : 3,
    cd = $("#cd"),
    fl = $("#flash");
  for (let i = 0; i < n; i++) {
    $("#lbl").textContent = i + 1 + " / " + n;
    $("#sc").textContent = $("#sd").textContent = i + 1 + "/" + n;
    $("#th").children[i].classList.add("a");
    $("#hint").textContent =
      "Shot " + (i + 1) + " of " + n + " — look at the lens!";
    for (let k = 3; k > 0; k--) {
      cd.textContent = k;
      cd.style.animation = "none";
      void cd.offsetWidth;
      cd.style.animation = "cdp .9s";
      await sleep(900);
    }
    cd.textContent = "";
    fl.classList.remove("go");
    void fl.offsetWidth;
    fl.classList.add("go");
    const cv = document.createElement("canvas");
    render(cv);
    shots.push(cv);
    $("#th").children[i].style.backgroundImage = "url(" + cv.toDataURL() + ")";
    $("#th").children[i].classList.replace("a", "f");
    await sleep(800);
  }
  $("#lbl").textContent = "SNAP";
  $("#sc").textContent = "★ AUTO";
  $("#sd").textContent = "ISO 800";
  $(".cam").classList.remove("busy");
  $("#hint").textContent = "Done! Download your strip or start a new session.";
  try {
    await compose();
  } finally {
    busy = false;
    $("#shut").disabled = false;
  }
}
async function compose() {
  try {
    await Promise.all([
      document.fonts.load("40px VT323"),
      document.fonts.load('italic 700 40px "Playfair Display"'),
      document.fonts.load('18px "Special Elite"'),
    ]);
  } catch (e) {}
  const L = theme === "light",
    G = layout === "grid",
    portraitMode = portrait.matches,
    [frameW, frameH] = G ? [400, 300] : [480, 360],
    pw = portraitMode ? frameH : frameW,
    ph = portraitMode ? frameW : frameH,
    cols = G ? 2 : 1,
    rows = G ? 2 : 3,
    g = 22,
    px = L ? 40 : 70,
    py = L ? 40 : 50,
    fh = L ? 110 : 120;
  const W = px * 2 + cols * pw + (cols - 1) * g,
    fy = py + rows * ph + (rows - 1) * g,
    H = fy + fh,
    o = $("#out"),
    c = o.getContext("2d");
  o.width = W;
  o.height = H;
  c.textAlign = "center";
  c.textBaseline = "alphabetic";
  const pos = (i) => [
    px + (i % cols) * (pw + g),
    py + Math.floor(i / cols) * (ph + g),
  ];
  if (L) {
    c.fillStyle = CARD_COLORS[cardColor];
    c.fillRect(0, 0, W, H);
    const cl = ["#ff6ec7", "#7aa8ff", "#ffe14d", "#ffffff"];
    for (let i = 0; i < 46; i++) {
      c.fillStyle = cl[i % 4];
      c.font = 12 + ((i * 7) % 22) + "px sans-serif";
      c.fillText(i % 3 ? "★" : "✦", (i * 137) % W, (i * 263) % H);
    }
    shots.forEach((s, i) => {
      const [x, y] = pos(i);
      c.shadowColor = "rgba(80,60,160,.4)";
      c.shadowBlur = 12;
      c.fillStyle = "#fff";
      c.fillRect(x - 6, y - 6, pw + 12, ph + 12);
      c.shadowBlur = 0;
      c.imageSmoothingEnabled =
        document.documentElement.dataset.skin !== "sony";
      c.drawImage(s, x, y, pw, ph);
    });
    c.font = "46px VT323,monospace";
    c.fillStyle = "#3b4fd8";
    c.fillText("✦ Y2K BOOTH ✦", W / 2, fy + 52);
    c.font = "28px VT323,monospace";
    c.fillStyle = "#d63fa4";
    c.fillText(dstr(), W / 2, fy + 88);
  } else {
    c.fillStyle = CARD_COLORS[cardColor];
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#746f68";
    for (let y = 14; y < H - 10; y += 46) {
      c.fillRect(20, y, 26, 30);
      c.fillRect(W - 46, y, 26, 30);
    }
    shots.forEach((s, i) => {
      const [x, y] = pos(i);
      c.drawImage(s, x, y, pw, ph);
      c.font = '15px "Special Elite",monospace';
      c.textAlign = "right";
      c.fillStyle = "#746f68";
      c.fillText("▸ " + (21 + i), x + pw, y - 7);
    });
    c.save();
    c.translate(58, H / 2);
    c.rotate(Math.PI / 2);
    c.textAlign = "center";
    c.font = '13px "Special Elite",monospace';
    c.fillStyle = "#746f68";
    c.fillText("WY-1999-1126", 0, 0);
    c.restore();
    c.textAlign = "center";
    c.font = 'italic 700 44px "Playfair Display",Georgia,serif';
    c.fillStyle = "#292521";
    c.fillText("Sidlac", W / 2, fy + 56);
    c.font = '17px "Special Elite",monospace';
    c.fillStyle = "#625c54";
    c.fillText("WY-1999-1126 · " + dstr(), W / 2, fy + 92);
  }
  $("#camView").hidden = true;
  $("#res").hidden = false;
  o.classList.remove("go");
  void o.offsetWidth;
  o.classList.add("go");
}
function save(b, n) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(b);
  a.href = url;
  a.download = n;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("#dl").onclick = () =>
  $("#out").toBlob(
    (b) => b && save(b, "sidlac-" + theme + "-" + Date.now() + ".png"),
    "image/png",
  );
$("#again").onclick = () => {
  $("#hint").textContent = HINT;
  shots = [];
  $("#out").width = 1;
  $("#res").hidden = true;
  $("#camView").hidden = false;
  thumbs();
};
$("#shut").onclick = run;
$("#retry").onclick = init;
const toggleTheme = () => {
  theme = theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  $("#ttl").textContent = TT[theme];
  const px = document.createElement("div");
  px.className = "px";
  px.style.setProperty("--c", theme === "dark" ? "#000" : "#fff");
  document.body.appendChild(px);
  setTimeout(() => px.remove(), 700);
};
$("#tg").onclick = toggleTheme;
$("#tg-mobile").onclick = toggleTheme;
const mobileMenuToggle = $("#mobile-menu-toggle");
mobileMenuToggle.onclick = () => {
  const panel = $("#mobile-menu-panel");
  const open = panel.hidden;
  panel.hidden = !open;
  mobileMenuToggle.setAttribute("aria-expanded", String(open));
  mobileMenuToggle.setAttribute("aria-label", open ? "Close camera settings" : "Open camera settings");
  mobileMenuToggle.classList.toggle("on", open);
};
document.querySelectorAll("[data-l]").forEach(
  (b) =>
    (b.onclick = () => {
      if (busy) return;
      layout = b.dataset.l;
      document
        .querySelectorAll("[data-l]")
        .forEach((x) => x.classList.toggle("on", x.dataset.l === layout));
      thumbs();
    }),
);
document.querySelectorAll("[data-color]").forEach(
  (b) =>
    (b.onclick = () => {
      cardColor = b.dataset.color;
      document.querySelectorAll("[data-color]").forEach((option) => {
        const selected = option === b;
        option.classList.toggle("on", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
      if (shots.length && !$("#res").hidden) compose();
    }),
);
document.querySelectorAll("[data-s]").forEach(
  (b) =>
    (b.onclick = () => {
      document.documentElement.dataset.skin = b.dataset.s;
      $("#hint").textContent = {
        sony: "Slim cam · 2004 phone-cam filter",
        canon: "Classic cam · flash digicam filter",
      }[b.dataset.s];
      document
        .querySelectorAll("[data-s]")
        .forEach((x) => x.classList.toggle("on", x.dataset.s === b.dataset.s));
    }),
);
const HINT =
  "Ready — press the pink shutter button or hit Space. Shots fire 3 seconds apart.";
addEventListener("keydown", (e) => {
  if (
    e.code === "Space" &&
    e.target.tagName !== "BUTTON" &&
    !$("#camView").hidden
  ) {
    e.preventDefault();
    run();
  }
});
const clk = () => {
  $("#clk").textContent = new Date().toTimeString().slice(0, 5);
};
clk();
setInterval(clk, 10000);
$("#hint").textContent = HINT;
addEventListener("pointermove", (e) => {
  if (
    Math.random() > 0.3 ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const s = document.createElement("span");
  s.className = "sp";
  s.textContent = theme === "light" ? "✦" : "•";
  s.style.left = e.clientX + "px";
  s.style.top = e.clientY + "px";
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 900);
});
$("#ttl").textContent = TT.light;
thumbs();
init();
requestAnimationFrame(loop);
