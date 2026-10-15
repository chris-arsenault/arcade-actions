import { stepStatus } from "./model";
import { escapeHtml } from "./dom";
import type { Job, Status } from "./types";

const symbols: Partial<Record<Status, string>> = { success: "✓", failure: "×" };
const styles: Partial<Record<Status, string>> = { success: "good", failure: "error" };

function waitingLog(job: Job): string | null {
  if (job.status === "queued")
    return '<div class="log-empty">Waiting for upstream jobs to finish.<br />Mario will reach this platform when its dependencies pass.</div>';
  if (job.status === "skipped")
    return '<div class="log-empty">This job was skipped because a dependency failed.<br />Inspect the failed platform for the cause.</div>';
  if (job.status === "cancelled" && job.elapsed === 0)
    return '<div class="log-empty">Run cancelled before this job started.</div>';
  return null;
}

function stepLines(job: Job, index: number): { text: string; style: string; time: number }[] {
  const status = stepStatus(job, index);
  if (status === "queued" || (status === "cancelled" && index > 0)) return [];
  const time = Math.floor((index * job.duration) / job.steps.length);
  const lines = [
    {
      text: `${symbols[status] ?? "›"} ${job.steps[index]}${status === "running" ? "…" : ""}`,
      style: styles[status] ?? "active",
      time,
    },
  ];
  const extra = successfulStepOutput(job, index, status);
  if (extra) lines.push({ text: extra, style: "", time });
  if (status === "failure")
    lines.push({
      text: "Demo finding: dependency severity exceeds the configured threshold.",
      style: "error",
      time,
    });
  return lines;
}

function successfulStepOutput(job: Job, index: number, status: Status): string | null {
  if (status !== "success") return null;
  if (job.id === "test" && index === 0) return "Tests: 128 passed · 12 suites · 0 failed";
  if (job.id === "build" && index === 1) return "dist/index.html · assets/app.js · assets/app.css";
  return null;
}

export function logsFor(job: Job): string {
  const waiting = waitingLog(job);
  if (waiting) return waiting;
  const lines = [
    { text: `Runner: ubuntu-latest · ${job.title.toLowerCase()}`, style: "", time: 0 },
    ...job.steps.flatMap((_, index) => stepLines(job, index)),
  ];
  if (job.status === "success")
    lines.push({ text: "Job completed successfully.", style: "good", time: job.duration });
  if (job.status === "cancelled")
    lines.push({
      text: "Execution cancelled by user.",
      style: "active",
      time: Math.floor(job.elapsed),
    });
  return lines
    .map(
      (line, index) =>
        `<div class="log-line"><span class="log-number">${index + 1}</span><span class="log-time">00:${String(line.time).padStart(2, "0")}</span><span class="log-text ${line.style}">${escapeHtml(line.text)}</span></div>`
    )
    .join("");
}
