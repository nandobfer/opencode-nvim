import { spawnSync } from "node:child_process"
import { Plugin } from "@opencode/plugin/tui"

const DEFAULT_COMMAND = "nvim"

function stringOption(options: Readonly<Record<string, any>>, key: string): string | undefined {
  const value = options[key]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function stringArrayOption(options: Readonly<Record<string, any>>, key: string): string[] {
  const value = options[key]
  return Array.isArray(value) ? value.map(String) : []
}

export default Plugin.define({
  id: "opencode-nvim",
  setup(context) {
    const command =
      stringOption(context.options, "command") ??
      process.env.OPENCODE_NVIM_COMMAND ??
      DEFAULT_COMMAND
    const args = stringArrayOption(context.options, "args")

    context.keymap.layer(() => ({
      mode: "global",
      priority: 10,
      commands: [
        {
          id: "opencode-nvim.open",
          title: "Open nvim",
          group: "Nvim",
          palette: true,
          suggested: true,
          run: () => {
            const directory =
              stringOption(context.options, "directory") ??
              context.location?.directory ??
              process.cwd()

            // Hand the terminal to nvim: the renderer leaves the alternate
            // screen and stops drawing until `resume()` is called.
            context.renderer.suspend()
            try {
              const result = spawnSync(command, args, {
                cwd: directory,
                stdio: "inherit",
              })

              if (result.error) {
                const code = (result.error as NodeJS.ErrnoException).code
                context.ui.toast.show({
                  message:
                    code === "ENOENT"
                      ? `Could not find "${command}". Install it or set the "command" option.`
                      : `Failed to open "${command}": ${result.error.message}`,
                  variant: "error",
                })
              }
            } finally {
              context.renderer.resume()
            }
          },
        },
      ],
    }))
  },
})
