import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/** Lifts the HTML boot title card once React has painted. */
function dismissBoot(): void {
  const boot = document.getElementById("boot");
  if (!boot || boot.dataset.dismissed === "true") return;
  boot.dataset.dismissed = "true";
  boot.classList.add("is-done");
  window.setTimeout(() => boot.remove(), 700);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Two frames: one to commit, one to paint, then a beat so the reveal reads.
requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(dismissBoot, 240)));

// Safety net — the title card must never trap the user if mounting throws.
window.setTimeout(dismissBoot, 3500);
