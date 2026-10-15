import { artifactsFor, cancelRun, createRun, jobFor } from "./model";
import { $, element, search, dialog, notify } from "./dom";
import { state, visibleRuns } from "./state";
import { chime, toggleSound } from "./artwork";
import { render } from "./render";
import { renderNavigation, renderOverview } from "./viewShell";
import { renderCourse, centerCourse } from "./viewCourse";
import { renderDetails } from "./viewDetails";
import type { Run, Tab } from "./types";

function data(button: HTMLElement, key: string): string {
  const value = button.dataset[key];
  if (!value) throw new Error(`Missing control value: ${key}`);
  return value;
}

function selectRun(run: Run): void {
  state.selected = run;
  state.selectedJob =
    run.jobs.find((job) => job.status === "failure")?.id ??
    run.jobs.find((job) => job.status === "running")?.id ??
    run.jobs[0].id;
  state.announcedStatus = run.status;
  render();
}

function clearSearch(): void {
  search().value = "";
  element(".app-shell").classList.remove("searching");
}

function startRun(retry = false): void {
  const workflowId = retry
    ? state.selected.workflowId
    : (state.activeWorkflow ?? state.selected.workflowId);
  const number = Math.max(...state.runs.map((run) => run.number)) + 1;
  const options = retry
    ? {
        title: state.selected.title,
        branch: state.selected.branch,
        commit: state.selected.commit,
      }
    : { title: "feat: the next great adventure" };
  const run = createRun(workflowId, number, options);
  state.runs.unshift(run);
  clearSearch();
  state.tab = "jobs";
  selectRun(run);
  notify(`Run #${number} started. Let’s-a go!`);
  chime();
}

function selectWorkflow(button: HTMLElement): void {
  state.activeWorkflow = data(button, "workflow");
  const run = state.runs.find((item) => item.workflowId === state.activeWorkflow);
  if (run) selectRun(run);
}

function selectRecentRun(button: HTMLElement): void {
  const run = state.runs.find((item) => item.number === Number(data(button, "run")));
  if (run) selectRun(run);
}

function selectJob(button: HTMLElement): void {
  state.selectedJob = data(button, "job");
  state.tab = "jobs";
  renderCourse();
  renderDetails();
  centerCourse(jobFor(state.selected, state.selectedJob).x);
  const kind = button.classList.contains("platform") ? "platform" : "job-pill";
  element<HTMLElement>(`.${kind}[data-job="${state.selectedJob}"]`).focus({ preventScroll: true });
}

function tabValue(button: HTMLElement): Tab {
  const value = data(button, "tab");
  if (value === "jobs" || value === "artifacts" || value === "summary") return value;
  throw new Error(`Unknown details tab: ${value}`);
}

function selectTab(button: HTMLElement): void {
  state.tab = tabValue(button);
  renderDetails();
}

function downloadArtifact(button: HTMLElement): void {
  const artifact = artifactsFor(state.selected).find(
    (item) => item.name === data(button, "download")
  );
  if (!artifact) return;
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(artifact, null, 2)], { type: "application/json" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `demo-${artifact.name}-${state.selected.number}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Demo artifact manifest downloaded.");
}

function delegatedClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return;
  const actions: [string, (button: HTMLElement) => void][] = [
    ["[data-workflow]", selectWorkflow],
    ["[data-run]", selectRecentRun],
    ["[data-job]", selectJob],
    ["[data-tab]", selectTab],
    ["[data-download]", downloadArtifact],
  ];
  for (const [selector, action] of actions) {
    const button = event.target.closest<HTMLElement>(selector);
    if (button) {
      action(button);
      return;
    }
  }
}

function searchRuns(): void {
  const query = search().value.trim().toLowerCase();
  element(".app-shell").classList.toggle("searching", Boolean(query));
  renderNavigation();
  const match = visibleRuns(query)[0];
  if (query && match && match !== state.selected) selectRun(match);
}

function cancelSelected(): void {
  cancelRun(state.selected);
  render();
  notify(`Run #${state.selected.number} cancelled.`);
}

function pauseSelected(): void {
  state.selected.paused = !state.selected.paused;
  render();
  notify(state.selected.paused ? "Adventure paused. Take a look around." : "Adventure resumed.");
}

function tabIndex(key: string, current: number, count: number): number {
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return (current + (key === "ArrowRight" ? 1 : -1) + count) % count;
}

function tabsKeyboard(event: KeyboardEvent): void {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const tabs = [...document.querySelectorAll<HTMLElement>("[data-tab]")];
  const current = tabs.findIndex((button) => button.dataset.tab === state.tab);
  const next = tabs[tabIndex(event.key, current, tabs.length)];
  state.tab = tabValue(next);
  renderDetails();
  next.focus();
}

function searchKeyboard(event: KeyboardEvent): void {
  if (dialog().open || event.ctrlKey || event.metaKey || event.altKey) return;
  const editing = document.activeElement?.matches("input, textarea, [contenteditable=true]");
  if (event.key === "/" && !editing) {
    event.preventDefault();
    search().focus();
  }
  if (event.key === "Escape" && document.activeElement === search()) {
    clearSearch();
    renderNavigation();
    search().blur();
  }
}

function dialogBackdrop(event: MouseEvent): void {
  if (event.target !== dialog()) return;
  const rect = dialog().getBoundingClientRect();
  const outside =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;
  if (outside) dialog().close();
}

export function setupControls(): void {
  document.addEventListener("click", delegatedClick);
  document.addEventListener("keydown", searchKeyboard);
  element(".details-tabs").addEventListener("keydown", tabsKeyboard);
  $("all-workflows").addEventListener("click", () => {
    state.activeWorkflow = null;
    renderNavigation();
    renderOverview();
  });
  search().addEventListener("input", searchRuns);
  $("new-run").addEventListener("click", () => startRun());
  $("replay").addEventListener("click", () => startRun(true));
  $("cancel").addEventListener("click", cancelSelected);
  $("pause-toggle").addEventListener("click", pauseSelected);
  $("sound-toggle").addEventListener("click", toggleSound);
  for (const id of ["help-button", "about-button"])
    $(id).addEventListener("click", () => dialog().showModal());
  for (const id of ["close-dialog", "start-playing"])
    $(id).addEventListener("click", () => dialog().close());
  dialog().addEventListener("click", dialogBackdrop);
}
