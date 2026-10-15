import { artifactsFor, jobFor, workflowFor } from "./model";
import { state } from "./state";
import { $, statusIcon, labels, duration, escapeHtml } from "./dom";
import { logsFor } from "./logs";
import type { Job, RunStatus } from "./types";

const summaryTitles: Record<RunStatus, string> = {
  success: "The finish flag is yours.",
  failure: "One platform needs another look.",
  cancelled: "This adventure ended early.",
  running: "A good run is underway.",
};

function pill(job: Job): string {
  const selected = job.id === state.selectedJob;
  return `<button class="job-pill ${selected ? "selected" : ""}" data-job="${job.id}" aria-pressed="${selected}">${statusIcon(job.status)}${job.title}</button>`;
}

function jobDetails(): string {
  const job = jobFor(state.selected, state.selectedJob);
  return `<div class="job-pills">${state.selected.jobs.map(pill).join("")}</div><div class="console"><div class="console-heading"><span class="console-title">${statusIcon(job.status)}${job.title}<span class="console-job-status">/ ${labels[job.status]}</span></span><small>${Math.floor(job.elapsed)}s · Demo logs</small></div><div class="console-body" tabindex="0" aria-label="${job.title} demo logs">${logsFor(job)}</div></div>`;
}

function artifactDetails(): string {
  const artifacts = artifactsFor(state.selected);
  if (!artifacts.length)
    return '<div class="artifact-list"><div class="empty-artifact"><span class="empty-icon" aria-hidden="true">▣</span><strong>No artifacts yet</strong><p>A successful Build job creates a demo artifact. Workflows without a Build job do not create one.</p></div></div>';
  const cards = artifacts
    .map(
      (artifact) =>
        `<div class="artifact-item"><span class="artifact-icon" aria-hidden="true">▣</span><div><strong>${artifact.name}</strong><p>${artifact.size} simulated bundle · ${artifact.files.length} files</p></div><button class="button compact" data-download="${artifact.name}">Download manifest ↓</button></div>`
    )
    .join("");
  return `<div class="artifact-list">${cards}<p class="artifact-caption">Downloads a local JSON manifest describing the demo artifact. No build files are produced.</p></div>`;
}

function summaryDetails(): string {
  const { selected } = state;
  const passed = selected.jobs.filter((job) => job.status === "success").length;
  const failed = selected.jobs.filter((job) => job.status === "failure").length;
  return `<div class="summary-panel"><h3>${summaryTitles[selected.status]}</h3><p>${workflowFor(selected.workflowId).title} · Run #${selected.number} · ${escapeHtml(selected.branch)} · ${duration(selected.elapsed)}</p><div class="summary-progress" role="progressbar" aria-label="Jobs completed successfully" aria-valuemin="0" aria-valuemax="${selected.jobs.length}" aria-valuenow="${passed}"><span style="width:${(100 * passed) / selected.jobs.length}%"></span></div><div class="summary-numbers"><span><strong>${passed}</strong> completed</span><span><strong>${failed}</strong> failed</span><span><strong>${selected.jobs.length - passed - failed}</strong> remaining / skipped</span></div><p>Simulated workflow. No code was executed or deployed.</p></div>`;
}

export function renderDetails(): void {
  $("detail-content").setAttribute("aria-labelledby", `tab-${state.tab}`);
  for (const button of document.querySelectorAll<HTMLElement>("[data-tab]")) {
    const chosen = button.dataset.tab === state.tab;
    button.setAttribute("aria-selected", String(chosen));
    button.tabIndex = chosen ? 0 : -1;
  }
  const views = { jobs: jobDetails, artifacts: artifactDetails, summary: summaryDetails };
  $("detail-content").innerHTML = views[state.tab]();
}
