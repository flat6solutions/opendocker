import { ConsolePosition } from "@opentui/core"
import { render } from "@opentui/solid"
import { tui } from "./app"

function copyToClipboard(text: string) {
  const proc = Bun.spawn(["pbcopy"], { stdin: "pipe" })
  proc.stdin.write(text)
  proc.stdin.end()
  console.info("Copied to clipboard")
}

render(tui, {
  targetFps: 60,
  gatherStats: false,
  exitOnCtrlC: true,
  consoleOptions: {
    position: ConsolePosition.BOTTOM,
    maxStoredLogs: 1000,
    sizePercent: 70,
    onCopySelection: text => copyToClipboard(text),
  },
})
