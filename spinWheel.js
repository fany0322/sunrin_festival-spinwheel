const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const resultDiv = document.getElementById('result');

// 확률표 (합=100)
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

// 같은 등수가 이웃하지 않도록 재배치
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

// 돌림판 배경 그라디언트와 각도 표 만들기
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
  probs[probs.length-1].end = 360; // 마지막 보정
  wheel.style.background = `conic-gradient(from -90deg, ${stops.join(",")})`;
}

// 라벨 배치 (중앙을 바라보게)
function placeLabels(){
  let labels = document.getElementById("labels");
  if (!labels) {
    labels = document.createElement("div");
    labels.id = "labels";
    labels.className = "labels";
    // wheel 안이 아니라 부모에 붙여서 회전 영향 없음
    wheel.parentElement.appendChild(labels);
  }
  labels.innerHTML="";
  for(const p of probs){
    const span = document.createElement("span");
    span.textContent = p.label;
    const midTop = p.mid - 90;
    // 👉 마지막 rotate(-midTop) 제거 → 글자가 중심 바라봄
    span.style.transform = `translate(-50%,-50%) rotate(${midTop}deg) translateY(-28vh)`;
    labels.appendChild(span);
    p.el = span;
  }
}

makeWheelGradient();
placeLabels();

let spinning=false, angle=0, speed=0, raf;

function spin(){
  angle += speed;
  wheel.style.transform = `rotate(${angle}deg)`;
  if(speed>0.3){
    speed *= 0.985; // 감속
    raf = requestAnimationFrame(spin);
  } else {
    speed = 0;
    finish();
  }
}

function finish() {
  cancelAnimationFrame(raf);
  const rawAngle = ((angle % 360) + 360) % 360;
  const arrowAngle = (rawAngle + 90) % 360; // 화살표 기준 (12시 방향)

  let picked = null;
  for (const p of probs) {
    if (arrowAngle >= p.start && arrowAngle < p.end) {
      picked = p;
      break;
    }
  }
  if (!picked) picked = probs[probs.length - 1];

  if (picked) {
    resultDiv.textContent = "결과: " + picked.label;
    resultDiv.style.display = 'block';
    probs.forEach(p => p.el.classList.remove("selected"));
    picked.el.classList.add("selected");
  } else {
    resultDiv.textContent = "결과 계산 실패";
    resultDiv.style.display = 'block';
  }

  spinning = false;
  spinBtn.textContent = "다시 돌리기";
}

spinBtn.addEventListener("click", ()=>{
  if(spinning) return;
  spinning=true;
  resultDiv.textContent = "돌리는 중...";
  resultDiv.style.display = 'block';
  spinBtn.textContent = "돌리는 중...";
  speed = 25;
  spin();
});
