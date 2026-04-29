import { createMemo, createSignal, createEffect, For } from "solid-js"
import { useKeybind } from "@/context/keybind"
import { KeybindsConfig } from "@/util/config"
import { useTheme } from "@/context/theme"
import { useKeyboard } from "@opentui/solid"
import { useDialog } from "@/ui/dialog"
import { useApplication } from "@/context/application"
import type { Container } from "@/context/application"
import { DockerV2 } from "@/lib/docker-v2"
import { useToast } from "@/ui/toast"

type Config = Array<ConfigItem>
type ConfigItem = { label: string; key: keyof KeybindsConfig }

export default function ContainerKeybinds() {
  const theme = useTheme().theme
  const keybind = useKeybind()
  const dialog = useDialog()
  const app = useApplication()
  const toast = useToast()
  const [selected, setSelected] = createSignal<Container>()

  const keybinds = createMemo<Config>(() => [
    { label: `${getCmdForState(selected())}`, key: "container_start_stop" },
  ])

  createEffect(() => {
    setSelected(
      app.containers.find((c: Container) => c.id === app.activeContainer)
    )
  })

  function getCmdForState(container: Container | undefined): "start" | "stop" | null {
    switch (container?.state) {
      case "created":
      case "restarting":
      case "running":
        return "stop"
      case "paused":
      case "exited":
      case "dead":
        return "start"
      default:
        return null
    }
  }

  useKeyboard(key => {
    if (dialog.stack.length > 0) return
    if (app.activePane !== "containers") return

    if (keybind.match("container_start_stop", key)) {
      const container = selected()
      if (!container) return
      const cmd = getCmdForState(container)

      if (cmd === "start") {
        toast.show({
          variant: "info",
          message: "Starting container",
        })
        DockerV2.startContainer(container.name)
        return
      }

      if (cmd === "stop") {
        toast.show({
          variant: "info",
          message: "Stopping container",
        })
        DockerV2.stopContainer(container.name)
        return
      }
    }
  })

  return (
    <>
      <For each={keybinds()}>
        {(item: ConfigItem) => {
          return (
            <box flexDirection="row" gap={1}>
              <text fg={theme.text}>{keybind.print(item.key)}</text>
              <text fg={theme.textMuted}>{item.label}</text>
            </box>
          )
        }}
      </For>
    </>
  )
}
