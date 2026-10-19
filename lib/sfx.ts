let ctx: AudioContext | null = null;
function tone(freq: number, at: number, dur: number, type: OscillatorType, vol = 0.06) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
}
export function play(kind: "correct" | "wrong" | "fail") {
  try {
    ctx ??= new AudioContext();
    if (kind === "correct") [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.18, "triangle"));
    else if (kind === "wrong") tone(220, 0, 0.18, "sawtooth", 0.05);
    else [196, 147, 110].forEach((f, i) => tone(f, i * 0.12, 0.25, "sawtooth", 0.05));
  } catch {}
}
