import { workflows } from "./workflows";
import { artifactsFor, workflowFor } from "./model";
import { state, visibleRuns } from "./state";
import { $, element, search, escapeHtml, statusIcon, labels, duration } from "./dom";
import type { Run, Workflow } from "./types";

function workflowButton(workflow: Workflow): string {
  const latest = state.runs.find((run) => run.workflowId === workflow.id);
  const active = state.activeWorkflow === workflow.id;
  return `<button class="nav-button ${active ? "active" : ""}" data-workflow="${workflow.id}" ${active ? 'aria-current="true"' : ""}><span aria-hidden="true">${workflow.icon}</span><span class="workflow-name">${workflow.title}<small class="workflow-sub">World ${workflow.world}</small></span><i class="workflow-dot ${latest?.status ?? "queued"}" aria-hidden="true"></i></button>`;
}

function runButton(run: Run): string {
  const chosen = state.selected.number === run.number;
  return `<button class="recent-run ${chosen ? "selected" : ""}" data-run="${run.number}" ${chosen ? 'aria-current="true"' : ""}>${statusIcon(run.status)}<div><strong>${workflowFor(run.workflowId).title}</strong><small>#${run.number} · ${escapeHtml(run.branch)}</small></div><span aria-hidden="true">↗</span></button>`;
}

export function renderNavigation(): void {
  $("all-workflows").classList.toggle("active", state.activeWorkflow === null);
  $("workflow-nav").innerHTML = workflows.map(workflowButton).join("");
  const visible = visibleRuns(search().value.trim().toLowerCase());
  $("recent-runs").innerHTML = visible.length
    ? visible.slice(0, 7).map(runButton).join("")
    : '<div class="empty-search">No runs match your search.</div>';
}

function stat(label: string, value: string, caption: string): string {
  return `<div class="stat"><div class="stat-label">${label}</div><div class="stat-value">${value} <small>${caption}</small></div></div>`;
}

export function renderOverview(): void {
  const filtered = state.runs.filter(
    (run) => !state.activeWorkflow || run.workflowId === state.activeWorkflow
  );
  const complete = filtered.filter((run) => run.status !== "running");
  const passed = filtered.filter((run) => run.status === "success");
  const rate = complete.length ? Math.round((100 * passed.length) / complete.length) : 0;
  const average = passed.length
    ? passed.reduce((sum, run) => sum + run.elapsed, 0) / passed.length
    : 0;
  $("overview").innerHTML = [
    stat("Workflow runs", filtered.length.toString().padStart(2, "0"), "this session"),
    stat("Success rate", `${rate}%`, `${complete.length} finished`),
    stat("Average duration", passed.length ? duration(average) : "—", "successful runs"),
    stat(
      "Worlds to explore",
      state.activeWorkflow ? "01" : "03",
      state.activeWorkflow ? "workflow" : "workflows"
    ),
  ].join("");
}

function runEvent(run: Run): string {
  if (run.event === "workflow_dispatch") return "Manually triggered";
  return run.event === "pull_request" ? "Pull request opened" : "Pushed";
}

function liveLabel(run: Run): string {
  if (run.paused) return "PAUSED";
  if (run.status === "running") return "LIVE DEMO";
  return run.status === "success" ? "LEVEL CLEAR" : labels[run.status].toUpperCase();
}

export function renderHeader(): void {
  const { selected } = state;
  $("run-title").textContent = selected.title;
  $("run-status-icon").innerHTML = statusIcon(selected.status);
  $("run-status").className = `status-badge ${selected.status}`;
  $("run-status").textContent = selected.paused ? "Paused" : labels[selected.status];
  $("run-meta").innerHTML =
    `<span>#${selected.number}</span><span class="meta-dot">·</span><span class="branch">⑂ ${escapeHtml(selected.branch)}</span><code>${selected.commit}</code><span class="meta-dot">·</span><span>${runEvent(selected)} by <strong>${selected.actor}</strong></span><span class="meta-dot">·</span><span id="run-duration">${duration(selected.elapsed)}</span>`;
  $<HTMLButtonElement>("cancel").disabled = selected.status !== "running";
  $<HTMLButtonElement>("pause-toggle").disabled = selected.status !== "running";
  $("pause-toggle").setAttribute("aria-pressed", String(selected.paused));
  $("pause-toggle").setAttribute(
    "aria-label",
    selected.paused ? "Resume animation" : "Pause animation"
  );
  element("#pause-toggle > span").innerHTML =
    `<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="${selected.paused ? "M4 2l9 6-9 6Z" : "M3 2h4v12H3Zm6 0h4v12H9Z"}" fill="currentColor"/></svg>`;
  const workflow = workflowFor(selected.workflowId);
  $("world-title").textContent = `WORLD ${workflow.world}`;
  $("course-subtitle").textContent = workflow.description;
  $("live-indicator").className = `live-indicator ${selected.status}`;
  $("live-indicator").textContent = liveLabel(selected);
  $("course").classList.toggle("paused", selected.paused);
  $("job-count").textContent = String(selected.jobs.length);
  $("artifact-count").textContent = String(artifactsFor(selected).length);
}

export function renderInfo(): void {
  const { selected } = state;
  const pairs = [
    ["Workflow", workflowFor(selected.workflowId).file],
    ["Triggered by", `${selected.actor} · ${selected.event}`],
    ["Branch", `⑂ ${selected.branch}`],
    ["Commit", selected.commit],
    ["Runner", "ubuntu-latest"],
    ["Total time", duration(selected.elapsed)],
  ];
  $("run-info").innerHTML = pairs
    .map(
      ([label, value]) =>
        `<div class="info-row"><span>${label}</span><span>${escapeHtml(value)}</span></div>`
    )
    .join("");
}
