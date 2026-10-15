import { tickRun } from "./model";
import { state } from "./state";
import { render } from "./render";
import { drawArtwork, chime } from "./artwork";
import { notify } from "./dom";
import { setupControls } from "./controls";

function announceStatus(): void {
  const { selected } = state;
  if (selected.status === state.announcedStatus) return;
  state.announcedStatus = selected.status;
  if (selected.status === "success") {
    notify(`Run #${selected.number} complete. Level clear!`);
    chime();
  } else if (selected.status === "failure") {
    notify(`Run #${selected.number} failed. Inspect the failed platform.`);
    chime(true);
  }
}

let lastTick = performance.now();
function tick(): void {
  const now = performance.now();
  const seconds = document.hidden ? 0 : Math.min((now - lastTick) / 1000, 1);
  lastTick = now;
  let changed = false;
  for (const run of state.runs) if (tickRun(run, seconds)) changed = true;
  const selectedActive =
    state.selected.status === "running" && !state.selected.paused && seconds > 0;
  if (changed || selectedActive) render();
  announceStatus();
}

drawArtwork();
setupControls();
render();
setInterval(tick, 1000);
