import {
  createEffect,
  createSignal,
  Show,
} from "solid-js"
import { TextAttributes } from "@opentui/core"
import { useApplication } from "@/context/application"
import type { Image } from "@/context/application"
import { Pane } from "@/ui/pane"
import { useTheme } from "@/context/theme"

export default function Config() {
  const app = useApplication()
  const theme = useTheme().theme
  const [image, setImage] = createSignal<Image>()

  createEffect(() => {
    setImage(app.images.find((image) => image.id === app.activeImage))
  })

  const fields = [
    { label: "Image", value: () => image()?.name },
    { label: "Tag", value: () => image()?.tag },
    { label: "Size", value: () => image()?.size },
    { label: "Created", value: () => image()?.created },
    { label: "Id", value: () => image()?.id },
  ]

  const maxLabelLength = Math.max(
    ...fields.map(f => f.label.length),
  )

  return (
    <Pane title="Config" width="100%" flexGrow={0} flexShrink={0}>
      <box
        flexDirection="column"
        width="100%"
        paddingLeft={1}
        paddingRight={2}
        marginTop={1}
      >
        <Show when={app.activeImage} fallback={
          <text fg={theme.textMuted}>No image selected</text>
        }>
          <box>
            {fields.map((field) => (
              <box flexDirection="row" gap={3}>
                <text fg={theme.textMuted} attributes={TextAttributes.BOLD} flexShrink={0}>
                  {field.label.padEnd(maxLabelLength)}
                </text>
                <text fg={theme.text}>{field.value()}</text>
              </box>
            ))}
          </box>
        </Show>
      </box>
    </Pane>
  )
}
