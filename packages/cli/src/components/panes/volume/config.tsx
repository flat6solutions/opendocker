import {
  createEffect,
  createSignal,
  For,
  Show,
} from "solid-js"
import { TextAttributes } from "@opentui/core"
import { Pane } from "@/ui/pane"
import { useApplication } from "@/context/application"
import { useTheme } from "@/context/theme"
import type { Volume } from "@/context/application"

type SimpleField = {
  label: string
  value: () => string | undefined
}

type RecordField = {
  label: string
  value: () => Record<string, string> | null | undefined
}

export default function Config() {
  const app = useApplication()
  const theme = useTheme().theme
  const [volume, setVolume] = createSignal<Volume>()

  createEffect(() => {
    setVolume(app.volumes.find((v) => v.name === app.activeVolume))
  })

  const simpleFields: SimpleField[] = [
    { label: "Name", value: () => volume()?.name },
    { label: "Driver", value: () => volume()?.driver },
    { label: "Scope", value: () => volume()?.scope },
    { label: "Mountpoint", value: () => volume()?.mountpoint },
  ]

  const recordFields: RecordField[] = [
    { label: "Labels", value: () => volume()?.labels },
    { label: "Options", value: () => volume()?.options },
    { label: "Status", value: () => volume()?.status },
  ]

  const maxLabelLength = Math.max(
    ...simpleFields.map(f => f.label.length),
    ...recordFields.map(f => f.label.length)
  )

  return (
    <Pane title="Config" width="100%" flexGrow={0} flexShrink={0} active={true}>
      <box
        flexDirection="column"
        width="100%"
        paddingLeft={1}
        paddingRight={2}
      >
        <Show when={!volume()}>
          <text fg={theme.textMuted}>
            No volume selected
          </text>
        </Show>
        <Show when={volume()}>
          <For each={simpleFields}>
            {(field) => (
              <box flexDirection="row" gap={3}>
                <text fg={theme.textMuted} attributes={TextAttributes.BOLD} flexShrink={0}>
                  {field.label.padEnd(maxLabelLength)}
                </text>
                <text fg={theme.text}>{field.value()}</text>
              </box>
            )}
          </For>
        </Show>
      </box>
    </Pane>
  )
}
