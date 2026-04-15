import { For } from "solid-js"
import { useKeybind } from "@/context/keybind"
import { KeybindsConfig } from "@/util/config"
import { useTheme } from "@/context/theme"
import { useKeyboard } from "@opentui/solid"
import { useDialog } from "@/ui/dialog"
import CmdExecDialog from "./dialogs/cmd-exec"

export default function Keybinds() {
  const theme = useTheme().theme
  const keybind = useKeybind()
  const dialog = useDialog()

  const config: Array<{ label: string; key: keyof KeybindsConfig }> = [
    { label: "sidebar", key: "sidebar_toggle" },
    { label: "themes", key: "theme_list" },
  ]

  useKeyboard(key => {
    if (dialog.stack.length > 0) return

    if (keybind.match("container_exec_cmd", key)) {
      dialog.replace(() =>
        <CmdExecDialog
          onConfirm={() => {
            dialog.clear()
          }}
          onCancel={() => {
            dialog.clear()
          }}
        />
      )
    }

    if (keybind.match("container_restart", key)) {

    }
  })

  return (
    <box
      width="100%"
      height="auto"
      flexDirection="row"
      justifyContent="flex-end"
      alignItems="center"
      gap={2}
      paddingLeft={1}
      paddingRight={1}
    >
      <For each={config}>
        {(item) => {
          return (
            <box flexDirection="row" gap={1}>
              <text fg={theme.text}>{keybind.print(item.key)}</text>
              <text fg={theme.textMuted}>{item.label}</text>
            </box>
          )
        }}
      </For>
    </box>
  )
}