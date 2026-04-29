import { createMemo, Switch, Match, For } from "solid-js"
import { useKeybind } from "@/context/keybind"
import { KeybindsConfig } from "@/util/config"
import { useTheme } from "@/context/theme"
import { useApplication } from "@/context/application"
import ContainerKeybinds from "./container"

type Config = Array<ConfigItem>
type ConfigItem = { label: string; key: keyof KeybindsConfig }

export default function Keybinds() {
  const theme = useTheme().theme
  const keybind = useKeybind()
  const app = useApplication()

  const right = createMemo<Config>(() => [
    { label: "themes", key: "theme_list" },
    { label: "sidebar", key: "sidebar_toggle" },
  ])

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
        <Switch>
          <Match when={app.activePane === "containers"}>
            <ContainerKeybinds />
          </Match>
        </Switch>
      </box>
      <box flexDirection="row" gap={2}>
        <For each={right()}>
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
