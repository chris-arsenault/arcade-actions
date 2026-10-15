import { jobFor } from "./model";
import { state } from "./state";
import { $, element, statusIcon, labels, escapeHtml } from "./dom";
import type { Job, RunStatus } from "./types";

let previousMario = "";
const courseMessages: Record<RunStatus, string> = {
  success: "★ LEVEL CLEAR! NICELY SHIPPED. ★",
  failure: "A BUMP IN THE ROAD. CHECK THE FAILED JOB.",
  cancelled: "RUN CANCELLED. RE-RUN TO TRY AGAIN.",
  running: "",
};

function platform(job: Job): string {
  const waiting = ["queued", "skipped", "cancelled"].includes(job.status);
  const time = waiting ? "—" : `${Math.floor(job.elapsed)}s`;
  return `<button class="platform ${job.status} ${state.selectedJob === job.id ? "selected" : ""}" data-job="${job.id}" style="left:${job.x / 10}%;top:${job.y}px" aria-label="${escapeHtml(job.title)}, ${labels[job.status]}, ${Math.floor(job.elapsed)} seconds" aria-pressed="${state.selectedJob === job.id}"><span class="platform-label"><span class="platform-name">${statusIcon(job.status)}${job.title}</span><span class="platform-time">${time}</span></span><span class="brick-bed" aria-hidden="true"></span></button>`;
}

function pipe(job: Job, id: string): string {
  const source = jobFor(state.selected, id);
  const from = source.x + 52;
  const to = job.x - 52;
  const middle = from + (to - from) / 2;
  const path = `M${from} ${source.y + 44}H${middle}V${job.y + 44}H${to}`;
  const style =
    ({ success: "done", running: "active" } as Partial<Record<Job["status"], string>>)[
      job.status
    ] ?? "";
  return `<path class="pipe-path ${style}" d="${path}"/><path class="pipe-inner ${style}" d="${path}"/>`;
}

function moveMario(): void {
  const { selected } = state;
  const current =
    selected.jobs.find((job) => job.status === "failure") ??
    selected.jobs.find((job) => job.status === "running") ??
    [...selected.jobs].reverse().find((job) => job.status === "success") ??
    selected.jobs[0];
  const key = `${selected.number}-${current.id}-${selected.status}`;
  if (previousMario === key) return;
  const finished = selected.status === "success";
  $("mario").style.left = `${finished ? 93.5 : current.x / 10}%`;
  $("mario").style.top = `${finished ? 291 : current.y - 54}px`;
  centerCourse(finished ? 935 : current.x);
  previousMario = key;
}

function coin(job: Job): string {
  if (job.status === "success") return "";
  const opacity = job.status === "running" ? "1" : ".55";
  return `<use href="#coin" x="${job.x - 8}" y="${job.y - 39}" opacity="${opacity}"/>`;
}

export function renderCourse(): void {
  const { selected } = state;
  $("platforms").innerHTML = selected.jobs.map(platform).join("");
  $("course-paths").innerHTML = selected.jobs
    .flatMap((job) => job.needs.map((id) => pipe(job, id)))
    .join("");
  $("course-props").innerHTML = selected.jobs.map(coin).join("");
  moveMario();
  $("mario").className = `mario ${selected.status}`;
  $("finish-flag").className = `finish-flag ${selected.status}`;
  $("course-message").className = `course-message ${selected.status}`;
  $("course-message").textContent = courseMessages[selected.status];
}

export function centerCourse(x: number): void {
  const scroll = element<HTMLElement>(".course-scroll");
  if (scroll.scrollWidth <= scroll.clientWidth) return;
  scroll.scrollTo({
    left: (x / 1000) * $("course").clientWidth - scroll.clientWidth / 2,
    behavior: "instant",
  });
}
