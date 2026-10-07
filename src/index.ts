import { Plugin } from "@opencode/plugin"

/**
 * Server-side entrypoint.
 *
 * This plugin has no server behavior; the feature lives in the TUI entrypoint
 * (`./tui`). This export exists so the package can also be loaded through
 * `plugins` in `opencode.json(c)`, where OpenCode loads the TUI component
 * automatically.
 */
export default Plugin.define({
  id: "opencode-nvim",
  setup() {},
})
