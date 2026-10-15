import { makeDemoRuns, workflowFor } from "./model";
import type { Run, Tab } from "./types";

const runs = makeDemoRuns();
export const state: {
  runs: Run[];
  selected: Run;
  selectedJob: string;
  activeWorkflow: string | null;
  tab: Tab;
  announcedStatus: Run["status"];
} = {
  runs,
  selected: runs[0],
  selectedJob: "build",
  activeWorkflow: null,
  tab: "jobs",
  announcedStatus: runs[0].status,
};

export function visibleRuns(query: string): Run[] {
  return state.runs.filter(
    (run) =>
      (!state.activeWorkflow || run.workflowId === state.activeWorkflow) &&
      `${run.title} ${run.number} ${run.branch} ${workflowFor(run.workflowId).title}`
        .toLowerCase()
        .includes(query)
  );
}
