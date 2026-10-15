import { $, element, notify } from "./dom";

function pixelSprite(
  rows: string[],
  colors: Record<string, string>,
  width: number,
  height: number
): string {
  const pixels = rows
    .flatMap((row, y) =>
      [...row].map((pixel, x) =>
        colors[pixel]
          ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[pixel]}"/>`
          : ""
      )
    )
    .join("");
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${pixels}</svg>`;
}

export function drawArtwork(): void {
  $("mario").innerHTML = pixelSprite(
    [
      ".....rrrrrr.....",
      "....rrrrrrrrr...",
      "....bbbsbs......",
      "...bsbsssbsss...",
      "...bsbbsssbsss..",
      "....bssssbbbb...",
      ".....sssssss....",
      "....rrbrrbrr....",
      "...rrrbrrbrrr...",
      "..rrrrbbbbrrrr..",
      "..ssrbbyybbrss..",
      "..sssbbbbbbsss..",
      "....bbbbbbbb....",
      "...bbbb..bbbb...",
      "..bbbb....bbbb..",
      "..bbbb....bbbb..",
    ],
    { r: "#d64a35", b: "#513f31", s: "#edb97c", y: "#f3ce6f" },
    16,
    16
  );
  $("powerup-sprite").innerHTML = pixelSprite(
    [
      "....rrrr....",
      "..rrrrrrrr..",
      ".rrwwrrwwrr.",
      ".rwwwrrwwwr.",
      "rrrrrrrrrrrr",
      "rrrwwwwwwrrr",
      "...wwwwww...",
      "...wbwwbw...",
      "...wwwwww...",
      "....wwww....",
    ],
    { r: "#c77c58", w: "#e5cfa0", b: "#967c53" },
    12,
    10
  );
  element(".brand-icon").innerHTML = $("powerup-sprite").innerHTML;
  element("#new-run > span").innerHTML =
    '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M3 1l8 5-8 5Z" fill="currentColor"/></svg>';
}

let sound = false;
let audioContext: AudioContext | null = null;

function updateSound(): void {
  $("sound-toggle").setAttribute("aria-pressed", String(sound));
  $("sound-toggle").setAttribute("aria-label", sound ? "Mute sound" : "Enable sound");
}

function playTone(context: AudioContext, frequency: number, index: number): void {
  const now = context.currentTime + index * 0.09;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.025, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.13);
}

export function chime(failure = false): void {
  if (!sound) return;
  try {
    const context = (audioContext ??= new AudioContext());
    const notes = failure ? [220, 165, 110] : [523, 659, 784];
    notes.forEach((frequency, index) => playTone(context, frequency, index));
  } catch {
    sound = false;
    updateSound();
    notify("Sound is unavailable in this browser.");
  }
}

export function toggleSound(): void {
  sound = !sound;
  updateSound();
  if (sound) {
    chime();
    void audioContext?.resume().catch(() => {
      sound = false;
      updateSound();
      notify("Sound could not be enabled in this browser.");
    });
  }
  notify(sound ? "Sound on. A little victory music." : "Sound muted.");
}
