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

// 색상 맵
const colorMap = {
  "1등": "#ff4d4d",
  "2등": "#ffb84d",
  "3등": "#4db2ff",
  "4등": "#7dff4d"
};

// 전체 weight 합
const total = probsRaw.reduce((a, b) => a + b.weight, 0);

// 같은 등수 연속 배치 방지
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

// 배경 그리기
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

// 라벨 배치
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

// 상태 변수
let spinning = false, angle = 0, raf = null, targetAngle = 0, chosen = null;
let currentEase = 0.04;

// 추첨 (무조건 1등 반환, 테스트용)
function pickResult() {
  return probs.find(p => p.label === "1등");
}

// 애니메이션
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

// 최종 처리
 function finish() {
  if (raf) cancelAnimationFrame(raf);

  if (chosen.label === "1등") {
    console.log("[finish] 1등 걸림 → prank 발동");

    prank.style.display = "block";
    prank.classList.add("hit-left");
    if (typeof prankText !== "undefined") prankText.style.display = "block";

    prank.addEventListener("animationend", () => {
      console.log("[finish] prank 끝 → weight=11 2등 or weight=10 4등으로 이동");

      prank.style.display = "none";
      prank.classList.remove("hit-left");
      if (typeof prankText !== "undefined") prankText.style.display = "none";

      // ✅ 후보 = weight=11 2등 + weight=10 4등
      const candidates = probs.filter(
        p => (p.label === "2등" && p.weight === 11) ||
             (p.label === "4등" && p.weight === 10)
      );

      // 무조건 둘 중 하나 랜덤
      chosen = candidates[Math.floor(Math.random() * candidates.length)];

      // 중앙각 계산
      const mid = (chosen.start + chosen.end) / 2;
      const corrected = (mid + 270) % 360;

      // ✅ 현재 angle에서 가장 가까운 방향으로 조금만 이동
      let diff = (360 - corrected) - (angle % 360);
      diff = ((diff + 540) % 360) - 180; // -180~+180 중 최소 이동
      targetAngle = angle + diff;

      currentEase = 0.02; // 천천히 수렴
      raf = requestAnimationFrame(animateToTarget);
    }, { once: true });

    return;
  }

  // ✅ 정상 결과 출력
  console.log("[finish] 최종 결과:", chosen.label);
  resultDiv.textContent = "결과: " + chosen.label;
  resultDiv.style.display = 'block';

  probs.forEach(p => p.el.classList.remove("selected"));
  chosen.el.classList.add("selected");

  spinning = false;
  spinBtn.textContent = "다시 돌리기";
}


// 버튼
spinBtn.addEventListener("click", () => {
  if (spinning) return;

  spinning = true;
  resultDiv.textContent = "돌리는 중...";
  resultDiv.style.display = 'block';
  spinBtn.textContent = "";

  chosen = pickResult();

  const mid = (chosen.start + chosen.end) / 2;
  const corrected = (mid + 270) % 360;

  // 🔹 처음은 6바퀴 돌리고 약간 느리게
  targetAngle = 360 * 6 + (360 - corrected);
  currentEase = 0.025;

  angle = 0;
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(animateToTarget);
});
