import { renderNavigation, renderOverview, renderHeader, renderInfo } from "./viewShell";
import { renderCourse } from "./viewCourse";
import { renderDetails } from "./viewDetails";

function focusSelector(focused: Element | null): string | null {
  if (!(focused instanceof HTMLElement)) return null;
  const data = focused.dataset;
  if (data.job)
    return `.${focused.classList.contains("platform") ? "platform" : "job-pill"}[data-job="${data.job}"]`;
  if (data.run) return `[data-run="${data.run}"]`;
  if (data.workflow) return `[data-workflow="${data.workflow}"]`;
  if (data.download) return `[data-download="${data.download}"]`;
  if (focused.id) return `#${focused.id}`;
  return focused.classList.contains("console-body") ? ".console-body" : null;
}

export function render(): void {
  // Timed updates preserve focus and log position while replacing job markup.
  const selector = focusSelector(document.activeElement);
  const scrollTop = document.querySelector(".console-body")?.scrollTop ?? 0;
  renderNavigation();
  renderOverview();
  renderHeader();
  renderCourse();
  renderDetails();
  renderInfo();
  if (selector) document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
  const log = document.querySelector(".console-body");
  if (log) log.scrollTop = scrollTop;
}
