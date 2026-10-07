import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
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

/** Quotes a value for safe use in a POSIX shell command line. */
function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

interface OpenInput {
  command: string
  args: string[]
  directory: string | undefined
}

/**
 * Runs the editor on the OpenCode server through SSH, handing over the local
 * terminal. Used when the TUI runs on a client connected to a remote server,
 * where the project directory exists on the server but not on the client.
 */
function openRemote(context: Plugin.Context, input: OpenInput, ssh: string, sshArgs: string[]): void {
  const remoteCommand = [
    input.directory ? `cd ${shellQuote(input.directory)}` : undefined,
    `exec ${[input.command, ...input.args].map(shellQuote).join(" ")}`,
  ]
    .filter((part): part is string => part !== undefined)
    .join(" && ")

  const result = spawnSync("ssh", [...sshArgs, "-t", ssh, remoteCommand], { stdio: "inherit" })

  if (result.error) {
    const code = (result.error as NodeJS.ErrnoException).code
    context.ui.toast.show({
      message:
        code === "ENOENT"
          ? `Could not find "ssh". Install it or clear the "ssh" option to open the editor locally.`
          : `Failed to run ssh: ${result.error.message}`,
      variant: "error",
    })
    return
  }

  // ssh uses exit status 255 for its own connection/authentication failures.
  if (result.status === 255) {
    context.ui.toast.show({
      message: `SSH to "${ssh}" failed. Check the host and your SSH keys.`,
      variant: "error",
    })
  }
}

/**
 * Runs the editor on the machine where the TUI runs. Only valid when that
 * machine holds the project files.
 */
function openLocal(context: Plugin.Context, input: OpenInput): void {
  if (input.directory && !existsSync(input.directory)) {
    context.ui.toast.show({
      message: `Directory "${input.directory}" does not exist on this machine. If OpenCode is connected to a remote server, set the "ssh" option so the editor opens on the server.`,
      variant: "error",
    })
    return
  }

  const result = spawnSync(input.command, input.args, {
    stdio: "inherit",
    ...(input.directory ? { cwd: input.directory } : {}),
  })

  if (result.error) {
    const code = (result.error as NodeJS.ErrnoException).code
    context.ui.toast.show({
      message:
        code === "ENOENT"
          ? `Could not find "${input.command}". Install it or set the "command" option.`
          : `Failed to open "${input.command}": ${result.error.message}`,
      variant: "error",
    })
  }
}

export default Plugin.define({
  id: "opencode-nvim",
  setup(context) {
    const command =
      stringOption(context.options, "command") ??
      process.env.OPENCODE_NVIM_COMMAND ??
      DEFAULT_COMMAND
    const args = stringArrayOption(context.options, "args")
    const ssh = stringOption(context.options, "ssh")
    const sshArgs = stringArrayOption(context.options, "sshArgs")
    const directoryOption = stringOption(context.options, "directory")

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
            const directory = directoryOption ?? context.location?.directory

            // Hand the terminal over to the editor: the renderer leaves the
            // alternate screen and stops drawing until `resume()` is called.
            context.renderer.suspend()
            try {
              if (ssh) {
                openRemote(context, { command, args, directory }, ssh, sshArgs)
              } else {
                openLocal(context, { command, args, directory })
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
