export type Status = "success" | "running" | "queued" | "failure" | "skipped" | "cancelled";
export type RunStatus = "success" | "running" | "failure" | "cancelled";
export type Tab = "jobs" | "artifacts" | "summary";

export interface JobDefinition {
  id: string;
  title: string;
  needs: string[];
  duration: number;
  x: number;
  y: number;
  steps: string[];
}

export interface Job extends JobDefinition {
  status: Status;
  elapsed: number;
}

export interface Workflow {
  id: string;
  title: string;
  file: string;
  world: string;
  description: string;
  icon: string;
  jobs: JobDefinition[];
}

export interface Run {
  number: number;
  workflowId: string;
  title: string;
  branch: string;
  commit: string;
  actor: string;
  event: "workflow_dispatch" | "push" | "pull_request";
  status: RunStatus;
  elapsed: number;
  paused: boolean;
  failJob: string | null;
  jobs: Job[];
}

export type RunOptions = Partial<Pick<Run, "title" | "branch" | "commit" | "event" | "failJob">>;

export interface Artifact {
  name: string;
  size: string;
  files: string[];
  run: number;
  commit: string;
  demo: true;
}
