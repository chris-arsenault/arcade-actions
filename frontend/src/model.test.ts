import { test } from "vitest";
import assert from "node:assert/strict";
import {
  createRun,
  tickRun,
  cancelRun,
  makeDemoRuns,
  artifactsFor,
  stepStatus,
  jobFor,
} from "./model";
import type { Job, Run } from "./types";

function finish(run: Run) {
  for (let seconds = 0; seconds < 100 && run.status === "running"; seconds++) tickRun(run, 1);
  assert.notEqual(run.status, "running", "run should reach a terminal state");
  return run;
}

test("parallel jobs start together, and build waits for both prerequisites", () => {
  const run = createRun("ci", 1);
  for (let seconds = 0; seconds < 6; seconds++) tickRun(run, 1);
  const job = (id: string) => jobFor(run, id);
  assert.equal(job("lint").status, "running");
  assert.equal(job("test").status, "running");
  assert.equal(job("build").status, "queued");
  for (let seconds = 0; seconds < 4; seconds++) tickRun(run, 1);
  assert.equal(job("lint").status, "success");
  assert.equal(job("test").status, "running");
  assert.equal(job("build").status, "queued");
  for (let seconds = 0; seconds < 2; seconds++) tickRun(run, 1);
  assert.equal(job("build").status, "running");
  finish(run);
  assert.equal(run.status, "success");
  assert.ok(run.jobs.every((item) => item.status === "success"));
});

test("a failure skips dependent jobs but lets independent jobs finish", () => {
  const run = finish(createRun("security", 2, { failJob: "audit" }));
  assert.equal(run.status, "failure");
  assert.equal(jobFor(run, "report").status, "skipped");
  assert.equal(jobFor(run, "codeql").status, "success");
});

test("failure propagates through multiple dependent jobs", () => {
  const run = finish(createRun("ci", 3, { failJob: "install" }));
  assert.equal(run.status, "failure");
  for (const id of ["lint", "test", "build", "deploy"])
    assert.equal(jobFor(run, id).status, "skipped");
});

test("pause freezes time, and cancellation is terminal", () => {
  const run = createRun("ci", 4);
  tickRun(run, 1);
  run.paused = true;
  const snapshot = structuredClone(run);
  tickRun(run, 8);
  assert.deepEqual(run, snapshot);
  run.paused = false;
  cancelRun(run);
  assert.equal(run.status, "cancelled");
  assert.ok(run.jobs.every((job) => job.status === "cancelled"));
  const cancelled = structuredClone(run);
  tickRun(run, 30);
  assert.deepEqual(run, cancelled);
});

test("cancelling preserves completed jobs and their artifacts", () => {
  const run = createRun("ci", 5);
  while (jobFor(run, "build").status !== "success") tickRun(run, 1);
  cancelRun(run);
  assert.equal(jobFor(run, "build").status, "success");
  assert.equal(jobFor(run, "deploy").status, "cancelled");
  assert.equal(artifactsFor(run).length, 1);
  assert.equal(artifactsFor(run)[0].demo, true);
});

test("artifacts only appear after a successful build", () => {
  assert.deepEqual(artifactsFor(createRun("ci", 6)), []);
  assert.equal(artifactsFor(finish(createRun("ci", 7))).length, 1);
  assert.deepEqual(artifactsFor(finish(createRun("security", 8))), []);
});

test("step status exposes the active step and failure", () => {
  const job: Pick<Job, "status" | "duration" | "elapsed" | "steps"> = {
    status: "running",
    duration: 6,
    elapsed: 3,
    steps: ["one", "two", "three"],
  };
  assert.equal(stepStatus(job, 0), "success");
  assert.equal(stepStatus(job, 1), "running");
  assert.equal(stepStatus(job, 2), "queued");
  job.status = "failure";
  job.elapsed = 6;
  assert.equal(stepStatus(job, 2), "failure");
});

test("demo runs include an active run, a success, and an inspectable failure", () => {
  const runs = makeDemoRuns();
  assert.equal(runs[0].status, "running");
  assert.equal(jobFor(runs[0], "build").status, "running");
  assert.equal(runs[1].status, "success");
  assert.equal(runs[2].status, "failure");
  assert.throws(() => createRun("missing", 9), /Unknown workflow/);
});

test("an invalid job id fails explicitly instead of returning a missing job", () => {
  assert.throws(() => jobFor(createRun("ci", 9), "missing"), /Unknown job: missing/);
});
