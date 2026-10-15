import type { Status } from "./types";

export function element<T extends Element = HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing UI element: ${selector}`);
  return node;
}

export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => element<T>(`#${id}`);
export const search = () => $<HTMLInputElement>("run-search");
export const dialog = () => $<HTMLDialogElement>("help-dialog");
export const escapeHtml = (value: string | number) =>
  String(value).replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
export const labels: Record<Status, string> = {
  success: "Completed",
  running: "In progress",
  queued: "Waiting",
  failure: "Failed",
  skipped: "Skipped",
  cancelled: "Cancelled",
};

export function statusIcon(status: Status): string {
  const paths: Partial<Record<Status, string>> = {
    success: "M3 8l3 3 7-7",
    failure: "M4 4l8 8M4 12l8-8",
  };
  const icon =
    status === "running"
      ? ""
      : `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${paths[status] ?? "M4 8h8"}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `<span class="status-icon ${status}" aria-label="${labels[status]}">${icon}</span>`;
}

export const duration = (seconds: number) =>
  `${Math.floor(seconds / 60)}m ${String(Math.floor(seconds % 60)).padStart(2, "0")}s`;
let toastTimeout: ReturnType<typeof setTimeout>;
export function notify(message: string): void {
  $("toast").textContent = message;
  $("toast").classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $("toast").classList.remove("visible"), 3500);
}
