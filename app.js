const CDN = "https://cdn.jsdelivr.net/gh/workinwithai-create/PreEight@main/public/samples";
const STEPS = 16;
const CALL = 4;
const ANSWER = 4;
const TOTAL = CALL + ANSWER;
const recipes = [
  { id:"brass-answer", name:"Brass answer", blurb:"Trumpet replies on bars 5 and 7. Leave space." },
  { id:"nylon-echo", name:"Nylon echo", blurb:"Nylon restates the last interval one octave down." },
  { id:"kit-talk", name:"Kit talkback", blurb:"Snare conversation on the ands. No crash." },
  { id:"violin-hold", name:"Violin hold", blurb:"Violin sits on the 5 while the pocket answers." },
  { id:"bass-reply", name:"Bass reply", blurb:"Upright answers the lyric rhythm, not the root loop." },
  { id:"stop-space", name:"Stop space", blurb:"Bar 5 is air until beat 3. Then the reply." },
  { id:"octave-piano", name:"Octave piano", blurb:"Grand answers an octave above the call voicing." },
  { id:"crowd-stab", name:"Crowd stab", blurb:"Kit + brass hit on bar 6 beat 1. Then hush." },
  { id:"walk-answer", name:"Walk answer", blurb:"Bass walks 1–2–3–5 under the reply." },
  { id:"hush-reply", name:"Hush reply", blurb:"Hats die. Soft nylon. The line can breathe." }
];
function bar(symbol, piano, guitar, bass){ return { symbol, piano, guitar, bass }; }
const grooves = [
  { id:"amber", name:"Amber Walk", bpm:98, key:"A minor",
    call:[bar("Am",[45,48,52,57],[45,52,57],33),bar("F",[41,45,48,53],[41,48,53],41),bar("C",[48,52,55,60],[48,52,55],36),bar("G",[43,47,50,55],[43,47,50],31)],
    answer:[bar("F",[41,45,48,53],[41,48,53],41),bar("G",[43,47,50,55],[43,47,50],31),bar("Am",[45,48,52,57],[45,52,57],33),bar("E7",[40,44,47,52],[40,47,50],28)] },
  { id:"porch", name:"Porch Climb", bpm:86, key:"E major",
    call:[bar("E",[40,44,47,52],[40,47,52],28),bar("B",[35,39,42,47],[35,42,47],23),bar("C#m",[44,47,51,56],[44,51,56],32),bar("A",[33,37,40,45],[33,40,45],33)],
    answer:[bar("A",[33,37,40,45],[33,40,45],33),bar("B",[35,39,42,47],[35,42,47],23),bar("E",[40,44,47,52],[40,47,52],28),bar("B",[35,39,42,47],[35,42,47],23)] },
  { id:"fold", name:"Fold Radio", bpm:104, key:"D minor",
    call:[bar("Dm",[38,41,45,50],[38,45,50],26),bar("Bb",[34,38,41,46],[34,41,46],34),bar("F",[41,45,48,53],[41,48,53],29),bar("C",[36,40,43,48],[36,43,48],24)],
    answer:[bar("Bb",[34,38,41,46],[34,41,46],34),bar("C",[36,40,43,48],[36,43,48],24),bar("Dm",[38,41,45,50],[38,45,50],26),bar("A7",[33,37,40,43],[33,40,43],33)] }
];
const state = { groove: grooves[0], recipe: recipes[0], playing:false, bar:0, mode:null };
let ctx, bus, buffers = {};
async function load() {
  ctx = new AudioContext();
  bus = ctx.createGain(); bus.gain.value = 0.35; bus.connect(ctx.destination);
  const files = [
    ["kick",`${CDN}/drums/kick.mp3`],["snare",`${CDN}/drums/snare.mp3`],["hat",`${CDN}/drums/hihat.mp3`],["crash",`${CDN}/drums/crash.mp3`],
    ["pC3",`${CDN}/piano/C3.mp3`],["pC4",`${CDN}/piano/C4.mp3`],["pA3",`${CDN}/piano/A3.mp3`],
    ["bE1",`${CDN}/bass/E1.mp3`],["bA1",`${CDN}/bass/A1.mp3`],["bC2",`${CDN}/bass/C2.mp3`],
    ["gE2",`${CDN}/guitar/E2.mp3`],["gA2",`${CDN}/guitar/A2.mp3`],["gE3",`${CDN}/guitar/E3.mp3`],
    ["tC4",`${CDN}/trumpet/C4.mp3`],["vA3",`${CDN}/violin/A3.mp3`]
  ];
  let n=0;
  for (const [k,url] of files) {
    try { const r = await fetch(url); buffers[k] = await ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) { console.warn(k, e); }
    n++; document.getElementById("status").textContent = `Seating chairs ${n}/${files.length}`;
  }
  document.getElementById("status").textContent = "Chairs seated · live FluidR3 + kit";
}
function playBuf(name, when, rate=1, gain=0.4) {
  const b = buffers[name]; if (!b || !ctx) return;
  const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = gain; src.connect(g); g.connect(bus); src.start(when);
}
function rateFromMidi(midi, baseMidi){ return Math.pow(2, (midi-baseMidi)/12); }
function chordAt(i){ return i < CALL ? state.groove.call[i] : state.groove.answer[i-CALL]; }
function zone(i){ return i < CALL ? "call" : "answer"; }
function scheduleBar(barIndex, t0, stepDur){
  const ch = chordAt(barIndex); const z = zone(barIndex); const rec = state.recipe.id;
  const onAns = z === "answer";
  const hush = rec==="hush-reply" && onAns;
  for (let s=0;s<STEPS;s++){
    const when = t0 + s*stepDur;
    if (onAns && rec==="stop-space" && barIndex===4 && s < 8) continue;
    if (s%2===0) playBuf("hat", when, 1, hush ? 0.03 : 0.07);
    if (s===0) playBuf("kick", when, 1, hush ? 0.4 : 0.7);
    if (s===8 && !(onAns && rec==="kit-talk")) playBuf("snare", when, 1, hush ? 0.22 : 0.45);
    if (onAns && rec==="kit-talk" && (s===4 || s===8 || s===12)) playBuf("snare", when, 1, 0.28);
    if (s===0) {
      const pianoGain = onAns && rec==="octave-piano" ? 0.38 : 0.26;
      const pianoRate = onAns && rec==="octave-piano" ? rateFromMidi((ch.piano[2]||60)+12, 60) : rateFromMidi(ch.piano[2]||60, 60);
      playBuf("pC4", when, pianoRate, pianoGain);
      playBuf("pA3", when, rateFromMidi(ch.piano[1]||57, 57), 0.2);
      let bassMidi = ch.bass;
      if (onAns && rec==="walk-answer") {
        const walk = [ch.bass, ch.bass+2, ch.bass+4, ch.bass+7];
        bassMidi = walk[0];
        playBuf("bA1", when+4*stepDur, rateFromMidi(walk[1], 33), 0.4);
        playBuf("bA1", when+8*stepDur, rateFromMidi(walk[2], 33), 0.4);
        playBuf("bA1", when+12*stepDur, rateFromMidi(walk[3], 33), 0.45);
      }
      if (onAns && rec==="bass-reply" && s===0) {
        playBuf("bA1", when+6*stepDur, rateFromMidi(ch.bass+7, 33), 0.42);
        playBuf("bA1", when+10*stepDur, rateFromMidi(ch.bass+5, 33), 0.38);
      }
      playBuf("bA1", when, rateFromMidi(bassMidi, 33), hush ? 0.28 : 0.45);
      playBuf("gA2", when, rateFromMidi(ch.guitar[0]||45, 45), hush || rec==="nylon-echo" && onAns ? 0.3 : 0.2);
    }
    if (onAns && rec==="nylon-echo" && s===8) playBuf("gE3", when, rateFromMidi((ch.guitar[1]||52)-12, 52), 0.3);
    if (onAns && rec==="brass-answer" && (barIndex===4 || barIndex===6) && (s===4 || s===12)) playBuf("tC4", when, rateFromMidi(ch.piano[3]||69,60), 0.36);
    if (onAns && rec==="crowd-stab" && barIndex===5 && s===0) {
      playBuf("crash", when, 1, 0.16);
      playBuf("tC4", when, rateFromMidi(ch.piano[3]||69,60), 0.32);
    }
    if (onAns && rec==="violin-hold") playBuf("vA3", when + (s===0?0:99), rateFromMidi(ch.piano[2]||60,57), 0.18);
  }
}
let timer=null;
function stop(){ state.playing=false; state.mode=null; if(timer) clearTimeout(timer); timer=null; paintBars(); }
async function play(mode){
  if (!ctx) await load();
  if (ctx.state==="suspended") await ctx.resume();
  stop(); state.playing=true; state.mode=mode;
  const startBar = mode==="eight" ? CALL : 0;
  const endBar = mode==="loop" ? CALL : TOTAL;
  const stepDur = 60/state.groove.bpm/4;
  let barIndex = startBar;
  const tick = () => {
    if (!state.playing) return;
    if (barIndex >= endBar) { if (mode==="loop") barIndex = startBar; else { stop(); return; } }
    state.bar = barIndex; paintBars();
    scheduleBar(barIndex, ctx.currentTime+0.02, stepDur);
    barIndex += 1;
    timer = setTimeout(tick, STEPS*stepDur*1000);
  };
  tick();
}
function punch(){
  const g=state.groove, r=state.recipe;
  return `CallFour punch list\n${g.name} · ${g.bpm} BPM · ${g.key} · ${r.name}\n\nThe problem: the last sung line talks to nobody. Session players write four live bars that answer it.\nThe move: ${r.blurb}\n\nCall (bars 1-4)\n${g.call.map((b,i)=>`  ${i+1}. ${b.symbol}`).join("\n")}\n\nAnswer (bars 5-8) — ${r.name}\n${g.answer.map((b,i)=>`  ${i+5}. ${b.symbol}`).join("\n")}\n\nLive chairs only. Distinct from TagFour, LiftTwo, PreEight, AfterHook, Patchform.\nDrop the idea on bars 5-8. Do not loop the call into the next section.`;
}
function paintGrooves(){
  const el=document.getElementById("grooves"); el.innerHTML="";
  grooves.forEach(g=>{ const b=document.createElement("button"); b.className="card"+(state.groove.id===g.id?" on":""); b.innerHTML=`<b>${g.name}</b><span>${g.bpm} BPM · ${g.key}</span>`; b.onclick=()=>{ state.groove=g; render(); }; el.appendChild(b); });
}
function paintRecipes(){
  const el=document.getElementById("recipes"); el.innerHTML="";
  recipes.forEach(r=>{ const b=document.createElement("button"); b.className="card"+(state.recipe.id===r.id?" on":""); b.innerHTML=`<b>${r.name}</b><span>${r.blurb}</span>`; b.onclick=()=>{ state.recipe=r; render(); }; el.appendChild(b); });
}
function paintBars(){
  const el=document.getElementById("bars"); el.innerHTML="";
  for(let i=0;i<TOTAL;i++){
    const ch=chordAt(i); const z=zone(i);
    const d=document.createElement("div");
    d.className="bar "+z+(state.playing && state.bar===i?" active":"");
    const label = z==="call"?"C":"A";
    d.innerHTML=`<div class="n">${i+1} · ${label}</div><div class="c">${ch.symbol}</div>`;
    el.appendChild(d);
  }
}
function render(){ paintGrooves(); paintRecipes(); paintBars(); document.getElementById("punch").textContent = punch(); }
document.getElementById("playA").onclick=()=>play("loop");
document.getElementById("playB").onclick=()=>play("cut");
document.getElementById("play8").onclick=()=>play("eight");
document.getElementById("stop").onclick=stop;
document.getElementById("copy").onclick=()=>navigator.clipboard.writeText(punch());
render();
load();
