import { defineConfig } from "vitest/config";

// fake-indexeddb/auto installs a global `indexedDB` before the storage layer
// touches it. Node 20+ provides global `crypto.subtle` for the passphrase hash.
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["fake-indexeddb/auto"],
  },
});
