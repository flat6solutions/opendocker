import { createEffect, createSignal } from "solid-js"
import { KeyEvent, TextareaRenderable, TextAttributes } from "@opentui/core"
import { useTheme } from "@/context/theme"
import { useApplication, type Container } from "@/context/application"

interface CmdExecDialogProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function CmdExecDialog({ onConfirm, onCancel }: CmdExecDialogProps) {
  const app = useApplication()
  const theme = useTheme().theme

  let input: TextareaRenderable

  const [selected, setSelected] = createSignal<Container>()
  const [value, setValue] = createSignal<string>("")

  async function submit(key: KeyEvent) {
    key.preventDefault()

    try {
      const args = value().trim()
      const cmd = `docker exec ${app.activeContainer} ${args}`
      const res = await Bun.$`${cmd}`.nothrow().quiet()
    } catch (error) {
      return
    }

    input.submit()
    input.blur()

    onConfirm()
  }

  createEffect(() => {
    setSelected(
      app.containers.find((c: Container) => c.id === app.activeContainer)
    )
  })

  return (
    <box
      paddingLeft={4}
      paddingRight={4}
      paddingBottom={1}
      flexDirection="column"
      gap={1}
    >
      <box flexDirection="row" alignItems="center" justifyContent="space-between" width="100%">
        <box flexDirection="row" gap={1}>
          <text fg={theme.text} attributes={TextAttributes.BOLD}>Execute in</text>
          <text fg={theme.textMuted}>{selected()?.name}</text>
        </box>
        <text fg={theme.textMuted}>esc</text>
      </box>
      <textarea
        placeholder={`Type a command... "composer install"`}
        textColor={theme.textMuted}
        focusedTextColor={theme.text}
        minHeight={1}
        maxHeight={1}
        onContentChange={() => setValue(input.plainText)}
        ref={(r: TextareaRenderable) => {
          input = r
          setTimeout(() => {
            if (!input) return
            if (input.isDestroyed) return
            input.focus()
            input.cursorColor = theme.text
          }, 0)
        }}
        focusedBackgroundColor={theme.backgroundPanel}
        cursorColor={theme.primary}
        onKeyDown={key => {
          if (key.name === "enter" || key.name === "return") {
            submit(key)
          }

          if (key.name === "escape") {
            onCancel()
          }
        }}
      />
    </box>
  )
}
