// Loaded automatically by CAP (e.g. `cds watch`).
// Ensures TypeScript-based handlers/bindings are registered in all run modes.
try {
  require("tsx/cjs");
} catch {
  // If tsx isn't available, we still start up; custom TS handlers may be missing.
}

const cds = require("@sap/cds");

cds.on("served", () => {
  try {
    const { bindAllServices } = require("./srv/bindings");
    bindAllServices();
  } catch (e) {
    // Don't crash the server on boot; surface the real problem in logs.
    console.error("Failed to bind service handlers:", e);
  }
});

