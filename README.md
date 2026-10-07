# opencode-nvim

An [OpenCode](https://opencode.ai) plugin that adds an **Open nvim** command to
the Command Palette (`Ctrl+P`). Running it suspends the TUI, opens
[Neovim](https://neovim.io) in the current project directory, and restores the
TUI when you quit Neovim.

## Requirements

- OpenCode **V2** (`opencode --version` → `2.x`).
- `nvim` available on your `PATH` (or a custom command, see [Options](#options)).

## Install

The plugin is a normal npm package with a TUI entrypoint (`opencode-nvim/tui`).
Pick whichever loading style fits your setup.

### CLI-only (recommended)

Add the package to your global CLI config so it stays active even when the TUI
is connected to a remote OpenCode server:

```json title="~/.config/opencode/cli.json"
{
  "plugins": ["opencode-nvim"]
}
```

### Via project config

If you load it through `opencode.json`, OpenCode loads the TUI component
automatically:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-nvim"]
}
```

### Local development

OpenCode also auto-discovers plugins under the global config directory and the
project's `.opencode` directory. Either register the checkout directly:

```json title="~/.config/opencode/cli.json"
{
  "plugins": ["/absolute/path/to/opencode-nvim"]
}
```

or drop the package in a discovery path:

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
      "package": "opencode-nvim",
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
| `command`   | `string`   | `$OPENCODE_NVIM_COMMAND` or `nvim` | Editor binary to launch.                        |
| `args`      | `string[]` | `[]`                     | Arguments passed to the editor.                          |
| `directory` | `string`   | session/project location | Directory the editor opens in.                           |

`OPENCODE_NVIM_COMMAND` is read when the `command` option is omitted.

## How it works

The plugin registers a palette command with `context.keymap.layer(...)`. When it
runs, it calls `context.renderer.suspend()` to leave the alternate screen and
stop drawing, spawns the editor with inherited stdio so it owns the terminal,
then calls `context.renderer.resume()` in a `finally` block. There is no server
side; `src/index.ts` is a no-op entrypoint that only exists so the package can
also be loaded from `opencode.json`.

## Development

```bash
npm install
npx tsc --noEmit
```

## License

MIT
