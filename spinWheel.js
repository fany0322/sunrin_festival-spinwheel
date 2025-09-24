const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const resultDiv = document.getElementById('result');
const prank = document.getElementById('prank-img');
const prankText = document.getElementById('prank-text');

// 원시 확률 데이터
const probsRaw = [
  { label: "1등", weight: 3 },
  { label: "2등", weight: 11 },
  { label: "3등", weight: 12 },
  { label: "3등", weight: 12 },
  { label: "4등", weight: 25 },
  { label: "4등", weight: 10 },
  { label: "2등", weight: 11 },
  { label: "4등", weight: 8 }
];

const colorMap = {
  "1등": "#ff4d4d",
  "2등": "#ffb84d",
  "3등": "#4db2ff",
  "4등": "#7dff4d"
};

// 전체 weight 합
const total = probsRaw.reduce((a, b) => a + b.weight, 0);

function reorderNoAdjSame(arr) {
  const inArr = [...arr], out = [];
  while (inArr.length) {
    let placed = false;
    for (let i = 0; i < inArr.length; i++) {
      if (out.length === 0 || out[out.length - 1].label !== inArr[i].label) {
        out.push(inArr[i]);
        inArr.splice(i, 1);
        placed = true;
        break;
      }
    }
    if (!placed && out.length >= 2) {
      const last = inArr.shift();
      const t = out[out.length - 1];
      out[out.length - 1] = out[out.length - 2];
      out[out.length - 2] = t;
      out.push(last);
    }
  }
  return out;
}
const probs = reorderNoAdjSame(probsRaw);

function makeWheelGradient() {
  let start = 0, stops = [];
  for (let i = 0; i < probs.length; i++) {
    const arc = probs[i].weight / total * 360;
    const end = start + arc;
    const color = colorMap[probs[i].label];
    stops.push(`${color} ${start}deg ${end}deg`);
    probs[i].start = start;
    probs[i].end = end;
    probs[i].mid = (start + end) / 2;
    start = end;
  }
  probs[probs.length - 1].end = 360;
  wheel.style.background = `conic-gradient(from -90deg, ${stops.join(",")})`;
}
makeWheelGradient();

function placeLabels() {
  let labels = document.getElementById("labels");
  if (!labels) {
    labels = document.createElement("div");
    labels.id = "labels";
    labels.className = "labels";
    wheel.parentElement.appendChild(labels);
  }
  labels.innerHTML = "";
  for (const p of probs) {
    const span = document.createElement("span");
    span.textContent = p.label;
    const midTop = p.mid - 90;
    span.style.transform =
      `translate(-50%,-50%) rotate(${midTop}deg) translateY(-28vh)`;
    labels.appendChild(span);
    p.el = span;
  }
}
placeLabels();

// 상태
let spinning = false, angle = 0, raf = null, targetAngle = 0, chosen = null;
let currentEase = 0.04;

// 실제 확률 기반 추첨
function pickResult() {
  const r = Math.random() * 100;
  let label;
  if (r < 20) label = "1등";       // 5%
  else if (r < 35) label = "2등"; // 20%
  else if (r < 50) label = "3등"; // 35%
  else label = "4등";             // 40%
  const candidates = probs.filter(p => p.label === label);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function animateToTarget() {
  const delta = targetAngle - angle;
  angle += delta * currentEase;
  wheel.style.transform = `rotate(${angle}deg)`;
  if (Math.abs(delta) < 0.5) {
    angle = targetAngle;
    wheel.style.transform = `rotate(${angle}deg)`;
    finish();
  } else {
    raf = requestAnimationFrame(animateToTarget);
  }
}

function finish() {
  if (raf) cancelAnimationFrame(raf);

  if (chosen.label === "1등") {
    prank.style.display = "block";
    prank.classList.add("hit-left");
    if (typeof prankText !== "undefined") prankText.style.display = "block";

    prank.addEventListener("animationend", () => {
      prank.style.display = "none";
      prank.classList.remove("hit-left");
      if (typeof prankText !== "undefined") prankText.style.display = "none";

      const candidates = probs.filter(
        p => (p.label === "2등" && p.weight === 11) ||
             (p.label === "4등" && p.weight === 10)
      );
      chosen = candidates[Math.floor(Math.random() * candidates.length)];

      const mid = (chosen.start + chosen.end) / 2;
      const corrected = (mid + 270) % 360;

      let diff = (360 - corrected) - (angle % 360);
      diff = ((diff + 540) % 360) - 180;
      targetAngle = angle + diff;

      currentEase = 0.02;
      raf = requestAnimationFrame(animateToTarget);
    }, { once: true });
    return;
  }

  resultDiv.textContent = "결과: " + chosen.label;
  resultDiv.style.display = 'block';

  probs.forEach(p => p.el.classList.remove("selected"));
  chosen.el.classList.add("selected");

  // 폭죽
  if (chosen.label !== "1등") {
    launchConfetti();
  }

  // 중앙 텍스트 (2/3/4등)
  if (chosen.label !== "1등") {
    const msg = document.createElement("div");
    msg.className = "result-text";
    msg.textContent = `${chosen.label}`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
  }

  spinning = false;
  spinBtn.textContent = "다시 돌리기";
}

spinBtn.addEventListener("click", () => {
  if (spinning) return;

  spinning = true;
  resultDiv.textContent = "돌리는 중...";
  resultDiv.style.display = 'block';
  spinBtn.textContent = "";

  chosen = pickResult();
  const mid = (chosen.start + chosen.end) / 2;
  const corrected = (mid + 270) % 360;

  targetAngle = 360 * 15 + (360 - corrected);
  currentEase = 0.01;

  angle = 0;
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(animateToTarget);
});

// 폭죽
function launchConfetti() {
  const colors = ["#ff4d4d", "#ffb84d", "#4db2ff", "#7dff4d", "#fff"];
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  for (let i = 0; i < 60; i++) { // 폭죽 개수 살짝 증가
    const conf = document.createElement("div");
    conf.className = "confetti";
    conf.style.background = colors[Math.floor(Math.random() * colors.length)];
    conf.style.left = `${centerX}px`;
    conf.style.top = `${centerY}px`;

    // 🔥 각도 범위를 전체 360도로 확장 → 좌/우 양쪽 발사
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const distance = 300 + Math.random() * 200; // 멀리 퍼지게
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    conf.style.setProperty("--dx", `${dx}px`);
    conf.style.setProperty("--dy", `${dy}px`);

    document.body.appendChild(conf);
    setTimeout(() => conf.remove(), 1200);
  }
}
