import { TextAttributes } from "@opentui/core"
import { useTheme } from "@/context/theme"
import { useRenderer } from "@opentui/solid"
import { useToast } from "@/ui/toast"
import { Clipboard } from "@/util/clipboard"

interface ErrorComponentProps {
  error: Error
}

export function ErrorComponent(props: ErrorComponentProps) {
  const theme = useTheme().theme
  const renderer = useRenderer()
  const toast = useToast()

  return (
    <box
      flexDirection="column"
      gap={2}
      onMouseUp={async () => {
        const text = renderer.getSelection()?.getSelectedText()
        if (text && text.length > 0) {
          const base64 = Buffer.from(text).toString("base64")
          const osc52 = `\x1b]52;c;${base64}\x07`
          const finalOsc52 = process.env["TMUX"] ? `\x1bPtmux;\x1b${osc52}\x1b\\` : osc52
          /* @ts-expect-error */
          renderer.writeOut(finalOsc52)
          await Clipboard.copy(text)
          .then(() => toast.show({ message: "Copied to clipboard", variant: "info" }))
          .catch(toast.error)
          renderer.clearSelection()
        }
      }}
    >
      <box>
        <text attributes={TextAttributes.BOLD} fg={theme.warning}>
          There's been a woopsie!
        </text>
        <text fg={theme.textMuted}>
          If this problem persists, please reach out to me on X @swe_steeve
        </text>
      </box>
      <box flexDirection="column" gap={1}>
        <box>
          <text fg={theme.error} attributes={TextAttributes.BOLD}>
            Error message:
          </text>
          <text fg={theme.textMuted}>{props.error.message}</text>
        </box>
        <box>
          <text fg={theme.error} attributes={TextAttributes.BOLD}>
            Stack trace:
          </text>
          <text fg={theme.textMuted}>{props.error.stack}</text>
        </box>
      </box>
    </box>
  )
}
