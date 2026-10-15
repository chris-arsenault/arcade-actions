import { workflows } from "./workflows";
import type { Artifact, Job, Run, RunOptions, Status } from "./types";

export function workflowFor(id: string) {
  const workflow = workflows.find((item) => item.id === id);
  if (!workflow) throw new Error(`Unknown workflow: ${id}`);
  return workflow;
}

export function jobFor(run: Run, id: string): Job {
  const job = run.jobs.find((item) => item.id === id);
  if (!job) throw new Error(`Unknown job: ${id}`);
  return job;
}

export function createRun(workflowId: string, number: number, options: RunOptions = {}): Run {
  const workflow = workflowFor(workflowId);
  return {
    number,
    workflowId,
    title: options.title ?? "A fresh adventure begins",
    branch: options.branch ?? "main",
    commit: options.commit ?? "f7c2a91",
    actor: "alex",
    event: options.event ?? "workflow_dispatch",
    status: "running",
    elapsed: 0,
    paused: false,
    failJob: options.failJob ?? null,
    jobs: workflow.jobs.map((job) => ({
      ...job,
      status: job.needs.length ? "queued" : "running",
      elapsed: 0,
    })),
  };
}

function advanceJobs(run: Run, seconds: number) {
  let changed = false;
  for (const job of run.jobs) {
    if (job.status !== "running") continue;
    job.elapsed = Math.min(job.duration, job.elapsed + seconds);
    if (job.elapsed >= job.duration) {
      job.status = run.failJob === job.id ? "failure" : "success";
      changed = true;
    }
  }
  return changed;
}

function scheduleJobs(run: Run) {
  let changed = false;
  for (const job of run.jobs) {
    if (job.status !== "queued") continue;
    const dependencies = job.needs.map((id) => jobFor(run, id));
    if (dependencies.some((item) => ["failure", "skipped", "cancelled"].includes(item.status))) {
      job.status = "skipped";
      changed = true;
    } else if (dependencies.every((item) => item.status === "success")) {
      job.status = "running";
      changed = true;
    }
  }
  return changed;
}

export function tickRun(run: Run, seconds: number): boolean {
  if (run.status !== "running" || run.paused || seconds <= 0) return false;
  run.elapsed += seconds;
  const advanced = advanceJobs(run, seconds);
  const scheduled = scheduleJobs(run);
  if (run.jobs.every((job) => !["running", "queued"].includes(job.status))) {
    run.status = run.jobs.some((job) => job.status === "failure") ? "failure" : "success";
    return true;
  }
  return advanced || scheduled;
}

export function cancelRun(run: Run): void {
  if (run.status !== "running") return;
  run.status = "cancelled";
  run.paused = false;
  for (const job of run.jobs) {
    if (["running", "queued"].includes(job.status)) job.status = "cancelled";
  }
}

function finishDemoRun(run: Run): Run {
  while (run.status === "running") tickRun(run, 1);
  return run;
}

export function makeDemoRuns(): Run[] {
  const active = createRun("ci", 482, { title: "feat: a little more wonder", event: "push" });
  while (jobFor(active, "build").status !== "running") tickRun(active, 1);
  const preview = finishDemoRun(
    createRun("preview", 481, {
      title: "feat: refresh the landing page",
      branch: "feat/new-home",
      event: "pull_request",
      commit: "8b3e4d2",
    })
  );
  const failed = finishDemoRun(
    createRun("security", 480, {
      title: "chore: update dependencies",
      failJob: "audit",
      event: "push",
      commit: "c4a98b1",
    })
  );
  const passed = finishDemoRun(
    createRun("ci", 479, {
      title: "fix: keep the good things moving",
      event: "push",
      commit: "a31e6f0",
    })
  );
  return [active, preview, failed, passed];
}

export function artifactsFor(run: Run): Artifact[] {
  if (!run.jobs.some((job) => job.id === "build" && job.status === "success")) return [];
  return [
    {
      name: "web-build",
      size: "1.8 MB",
      files: ["index.html", "assets/app.js", "assets/app.css"],
      run: run.number,
      commit: run.commit,
      demo: true,
    },
  ];
}

export function stepStatus(
  job: Pick<Job, "status" | "steps" | "elapsed" | "duration">,
  index: number
): Status {
  if (job.status === "success") return "success";
  if (["queued", "skipped", "cancelled"].includes(job.status)) return job.status;
  const current = Math.min(
    job.steps.length - 1,
    Math.floor((job.elapsed / job.duration) * job.steps.length)
  );
  if (index < current) return "success";
  if (index > current) return "queued";
  return job.status;
}
