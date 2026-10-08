# opencode-nvim

An [OpenCode](https://opencode.ai) plugin that adds an **Open nvim** command to
the Command Palette (`Ctrl+P`). Running it suspends the TUI, opens
[Neovim](https://neovim.io) in the project directory, and restores the TUI when
you quit Neovim. When the TUI is connected to a remote OpenCode server, it can
open the editor on that server over SSH.

## Requirements

- OpenCode **V2** (`opencode --version` → `2.x`).
- `nvim` where the editor should run: on the TUI machine for local use, or on
  the OpenCode server with the [`ssh` option](#remote-server-ssh).
- For remote use, working SSH access from the TUI machine to the server.

The editor is launched through your login shell (`$SHELL -lc`) with the standard
binary directories appended to `PATH`, so it is found even when OpenCode starts
with a minimal environment (a desktop launcher, a service, or a client whose
shell never sourced its rc files).

## Install

The plugin is a normal npm package with a TUI entrypoint
(`@nandobfer/opencode-nvim/tui`). Pick whichever loading style fits your setup.

> The package is **not published to npm yet**, so the local-checkout method is
> the one that works today. The npm forms below become available once it is
> published.

### CLI-only (recommended)

Add the package to your global CLI config so it stays active even when the TUI
is connected to a remote OpenCode server:

```json title="~/.config/opencode/cli.json"
{
  "plugins": ["@nandobfer/opencode-nvim"]
}
```

### Via project config

If you load it through `opencode.json`, OpenCode loads the TUI component
automatically:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["@nandobfer/opencode-nvim"]
}
```

### Local checkout (works today)

Register the checkout by absolute path:

```json title="~/.config/opencode/cli.json"
{
  "plugins": ["/absolute/path/to/opencode-nvim"]
}
```

OpenCode also auto-discovers plugins under the global config directory and the
project's `.opencode` directory, so you can drop the package in a discovery
path instead:

```text
<project>/.opencode/plugins/opencode-nvim/tui.ts
<global-config>/plugins/opencode-nvim/tui.ts
```

## Usage

1. Open the Command Palette with `Ctrl+P`.
2. Select **Open nvim**.

The TUI releases the terminal, Neovim opens in the project directory, and the
TUI comes back when Neovim exits. If the editor binary cannot be found, a toast
explains what to fix and the TUI is restored either way.

## Options

Pass options through the object form of the plugin entry:

```json title="~/.config/opencode/cli.json"
{
  "plugins": [
    {
      "package": "@nandobfer/opencode-nvim",
      "options": {
        "command": "nvim",
        "args": [],
        "directory": "/optional/explicit/project"
      }
    }
  ]
}
```

| Option      | Type       | Default                  | Description                                              |
| ----------- | ---------- | ------------------------ | -------------------------------------------------------- |
| `command`   | `string`   | `$OPENCODE_NVIM_COMMAND` or `nvim` | Editor binary to launch.                      |
| `args`      | `string[]` | `[]`                     | Arguments passed to the editor.                          |
| `directory` | `string`   | session/project location | Directory the editor opens in.                           |
| `ssh`       | `string`   | —                        | Open the editor on this SSH target (`user@host` or an SSH config alias). |
| `sshArgs`   | `string[]` | `[]`                     | Extra arguments passed to `ssh` (e.g. `["-p", "2222"]`). |

`OPENCODE_NVIM_COMMAND` is read when the `command` option is omitted.

## Remote server (SSH)

CLI plugins run on the machine where the TUI runs, but the project files live on
the OpenCode server. When the TUI is connected to a remote server with
`opencode --server <url>`, the project directory does not exist on the client,
so opening the editor locally would edit the wrong files (and usually fails
because that directory is missing).

Set `ssh` to open Neovim on the server instead. The plugin runs
`ssh -t <target> "cd '<directory>' && exec '<command>' <args>"`, so the editor
gets the client's terminal while working on the server's files:

```json title="~/.config/opencode/cli.json"
{
  "plugins": [
    {
      "package": "@nandobfer/opencode-nvim",
      "options": { "ssh": "user@host" }
    }
  ]
}
```

`nvim` must be installed on the server, and the client must be able to reach it
over SSH (key authentication or an SSH config alias both work).

## How it works

The plugin registers a palette command with `context.keymap.layer(...)`. When it
runs, it calls `context.renderer.suspend()` to leave the alternate screen and
stop drawing, hands the terminal to the editor with inherited stdio, then calls
`context.renderer.resume()` in a `finally` block. Without `ssh` it runs the
editor through your login shell (`$SHELL -lc`); with `ssh` it runs
`ssh -t <target> ...`, which forwards the terminal to the server. In both cases
it appends the standard binary directories to `PATH`, so the editor is found
even when OpenCode starts with a minimal environment. There is no server side;
`index.ts` is a no-op entrypoint that only exists so the package can also be
loaded from `opencode.json`.

## Development

```bash
npm install
npx tsc --noEmit
```

## License

MIT
