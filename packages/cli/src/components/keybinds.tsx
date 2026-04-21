import { For } from "solid-js"
import { useKeybind } from "@/context/keybind"
import { KeybindsConfig } from "@/util/config"
import { useTheme } from "@/context/theme"
import { useKeyboard } from "@opentui/solid"
import { useDialog } from "@/ui/dialog"
import { useApplication } from "@/context/application"
import { DockerV2 } from "@/lib/docker-v2"
import { useToast } from "@/ui/toast"

type Config = Array<{ label: string; key: keyof KeybindsConfig }>

export default function Keybinds() {
  const theme = useTheme().theme
  const keybind = useKeybind()
  const dialog = useDialog()
  const app = useApplication()
  const toast = useToast()

  const left: Config = [
    { label: "start", key: "container_start" },
    { label: "stop", key: "container_stop" },
  ]

  const right: Config = [
    { label: "sidebar", key: "sidebar_toggle" },
    { label: "themes", key: "theme_list" },
  ]

  useKeyboard(key => {
    if (dialog.stack.length > 0) return
    if (app.activePane !== "containers") return

    if (keybind.match("container_stop", key)) {
      toast.show({
        variant: "info",
        message: "Stopping container",
      })
      const c = app.activeContainer
      if (!c) return
      DockerV2.stopContainer(c)
    }

    if (keybind.match("container_start", key)) {
      toast.show({
        variant: "info",
        message: "Starting container",
      })
      const c = app.activeContainer
      if (!c) return
      DockerV2.startContainer(c)
    }
  })

  return (
    <box
      width="100%"
      height="auto"
      paddingLeft={1}
      paddingRight={1}
      flexDirection="row"
      justifyContent="space-between"
    >
      <box flexDirection="row" gap={2}>
        <For each={left}>
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
      <box flexDirection="row" gap={2}>
        <For each={right}>
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
    </box>
  )
}
