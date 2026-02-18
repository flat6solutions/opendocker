import {
  createEffect,
  createSignal,
  For,
  Show,
} from "solid-js"
import { ScrollBoxRenderable, TextAttributes } from "@opentui/core"
import { useApplication } from "@/context/application"
import { Docker, type ImageHistoryItem } from "@/lib/docker"
import { Pane } from "@/ui/pane"
import { useTheme } from "@/context/theme"

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatId(id: string): string {
  if (!id || id === "<missing>") return "<missing>"
  return id.replace(/^sha256:/, "").substring(0, 12)
}

function formatCommand(createdBy: string): string {
  return createdBy.replace(/^\/bin\/sh -c #\(nop\)\s+/, "").replace(/^\/bin\/sh -c /, "RUN ")
}

const HEADERS = {
  layerId: "Layer ID",
  size: "Size",
  command: "Command",
}

export default function History() {
  const app = useApplication()
  const theme = useTheme().theme
  const [history, setHistory] = createSignal<ImageHistoryItem[]>([])
  const [scroll, setScroll] = createSignal<ScrollBoxRenderable>()

  createEffect(async () => {
    const imageId = app.activeImage
    if (!imageId) {
      setHistory([])
      return
    }

    try {
      const docker = Docker.getInstance()
      const historyData = await docker.streamImageHistory(imageId)
      setHistory(historyData)
    } catch (err) {
      setHistory([])
    }
  })

  const maxIdLength = () => Math.max(
    HEADERS.layerId.length,
    ...history().map(item => formatId(item.Id).length)
  )

  const maxSizeLength = () => Math.max(
    HEADERS.size.length,
    ...history().map(item => formatSize(item.Size).length)
  )

  return (
    <Pane title="History" width="100%" flexGrow={1} flexShrink={1} height="100%">
      <box
        height="100%"
        paddingLeft={1}
        paddingRight={2}
        marginTop={1}
        flexDirection="column"
      >
        <Show when={app.activeImage} fallback={
          <text fg={theme.textMuted}>No image selected</text>
        }>
          <Show when={history().length > 0} fallback={
            <text fg={theme.textMuted}>Loading history...</text>
          }>
            <box flexDirection="row" gap={2} marginBottom={1}>
              <text fg={theme.textMuted} attributes={TextAttributes.BOLD} flexShrink={0}>
                {HEADERS.layerId.padEnd(maxIdLength())}
              </text>
              <text fg={theme.textMuted} attributes={TextAttributes.BOLD} flexShrink={0}>
                {HEADERS.size.padEnd(maxSizeLength())}
              </text>
              <text fg={theme.textMuted} attributes={TextAttributes.BOLD}>{HEADERS.command}</text>
            </box>
            <scrollbox
              ref={(r: ScrollBoxRenderable) => setScroll(r)}
              scrollY={true}
              flexGrow={1}
              flexShrink={1}
            >
              <box flexDirection="column">
                <For each={history()}>
                  {(item) => (
                    <box flexDirection="row" gap={2}>
                      <text fg={theme.textMuted} flexShrink={0}>
                        {formatId(item.Id).padEnd(maxIdLength())}
                      </text>
                      <text fg={theme.textMuted} flexShrink={0}>
                        {formatSize(item.Size).padEnd(maxSizeLength())}
                      </text>
                      <text fg={theme.text} flexShrink={1} wrapMode="none">{formatCommand(item.CreatedBy)}</text>
                    </box>
                  )}
                </For>
              </box>
            </scrollbox>
          </Show>
        </Show>
      </box>
    </Pane>
  )
}
