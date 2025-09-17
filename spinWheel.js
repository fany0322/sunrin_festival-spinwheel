const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const resultDiv = document.getElementById('result');

// 확률표
const probsRaw = [
  {label:"1등", weight:5},
  {label:"2등", weight:11},
  {label:"3등", weight:15},
  {label:"3등", weight:18},
  {label:"4등", weight:22},
  {label:"4등", weight:10},
  {label:"2등", weight:11},
  {label:"4등", weight:8}
];
const colorMap = {
  "1등":"#ff4d4d",
  "2등":"#ffb84d",
  "3등":"#4db2ff",
  "4등":"#7dff4d"
};
const total = probsRaw.reduce((a,b)=>a+b.weight,0);

function reorderNoAdjSame(arr){
  const inArr=[...arr], out=[];
  while(inArr.length){
    let placed=false;
    for(let i=0;i<inArr.length;i++){
      if(out.length===0 || out[out.length-1].label!==inArr[i].label){
        out.push(inArr[i]);
        inArr.splice(i,1);
        placed=true;
        break;
      }
    }
    if(!placed && out.length>=2){
      const last=inArr.shift();
      const t=out[out.length-1];
      out[out.length-1]=out[out.length-2];
      out[out.length-2]=t;
      out.push(last);
    }
  }
  return out;
}
const probs = reorderNoAdjSame(probsRaw);

// 돌림판 배경 그리기
function makeWheelGradient(){
  let start=0, stops=[];
  for(let i=0;i<probs.length;i++){
    const arc = probs[i].weight/total*360;
    const end = start + arc;
    const color = colorMap[probs[i].label];
    stops.push(`${color} ${start}deg ${end}deg`);
    probs[i].start = start;
    probs[i].end   = end;
    probs[i].mid   = (start+end)/2;
    start=end;
  }
  probs[probs.length-1].end = 360;
  wheel.style.background = `conic-gradient(from -90deg, ${stops.join(",")})`;
}

// 라벨 배치 (중앙을 바라보게)
function placeLabels(){
  let labels = document.getElementById("labels");
  if (!labels) {
    labels = document.createElement("div");
    labels.id = "labels";
    labels.className = "labels";
    wheel.parentElement.appendChild(labels);
  }
  labels.innerHTML="";
  for(const p of probs){
    const span = document.createElement("span");
    span.textContent = p.label;
    const midTop = p.mid - 90;
    span.style.transform = `translate(-50%,-50%) rotate(${midTop}deg) translateY(-28vh)`;
    labels.appendChild(span);
    p.el = span;
  }
}

makeWheelGradient();
placeLabels();

let spinning=false, angle=0, raf=null, targetAngle=0, chosen=null;

// 확률로 하나 뽑기
// 확률로 하나 뽑기 (섹터 비율과 무관, 고정 확률)
function pickResult(){
  let r = Math.random() * 100; // 0~100
  let label;
  if (r < 5) label = "1등";       // 10%
  else if (r < 30) label = "2등";  // 20%
  else if (r < 70) label = "3등";  // 40%
  else label = "4등";              // 30%

  // 선택된 label과 같은 섹터들 중 랜덤 하나 뽑기
  const candidates = probs.filter(p => p.label === label);
  return candidates[Math.floor(Math.random() * candidates.length)];
}


// 부드럽게 목표에 수렴하는 애니메이션
function animateToTarget(){
  const ease = 0.07; // ← 회전 속도 천천히
  const delta = targetAngle - angle;
  angle += delta * ease;

  wheel.style.transform = `rotate(${angle}deg)`;

  if (Math.abs(delta) < 0.5) {
    angle = targetAngle;
    wheel.style.transform = `rotate(${angle}deg)`;
    finish();
  } else {
    raf = requestAnimationFrame(animateToTarget);
  }
}

function finish(){
  if (raf) cancelAnimationFrame(raf);
  resultDiv.textContent = "결과: " + chosen.label;
  resultDiv.style.display = 'block';
  probs.forEach(p => p.el.classList.remove("selected"));
  chosen.el.classList.add("selected");
  spinning = false;
  spinBtn.textContent = "다시 돌리기";
}

// 클릭 이벤트
spinBtn.addEventListener("click", ()=>{
  if(spinning) return;
  spinning=true;
  resultDiv.textContent = "돌리는 중...";
  resultDiv.style.display = 'block';
  spinBtn.textContent = "돌리는 중...";

  // 1. 확률로 결과 뽑기
  chosen = pickResult();

  // 2. 목표 각도 = chosen.mid를 위쪽(12시 화살표)에 맞추기
  const mid = (chosen.start + chosen.end) / 2;
  const corrected = (mid + 270) % 360; // 3시 기준 → 12시 기준으로 보정
  targetAngle = 360*5 + (360 - corrected);

  // 3. 초기화 후 시작
  angle = 0;
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(animateToTarget);
});
