import { createEffect, createSignal, onCleanup, Switch, Match } from "solid-js"
import { ScrollBoxRenderable } from "@opentui/core"
import { useKeyboard } from "@opentui/solid"
import { useApplication } from "@/context/application"
import { Pane } from "@/ui/pane"
import { stripANSI } from "bun"
import { SyntaxStyle } from "@opentui/core"
import { useTheme } from "@/context/theme"

export default function Logs() {
  const app = useApplication()
  const theme = useTheme().theme
  const [logs, setLogs] = createSignal<string>("")
  const [tempLogs, setTempLogs] = createSignal<string>("")
  const [paused, setPaused] = createSignal<boolean>(false)
  const [scroll, setScroll] = createSignal<ScrollBoxRenderable>()
  const logSyntaxStyle = SyntaxStyle.create()
  const [width, setWidth] = createSignal<number>(0)

  useKeyboard(key => {
    if (app.activePane !== "container") {
      return
    }

    if (key.name === "p") {
      setPaused(true)
    }

    if (key.name === "r") {
      setLogs(prev => prev + tempLogs())
      setTempLogs("")
      const scrollBox = scroll()
      if (scrollBox) {
        scrollBox.scrollTo({ x: 0, y: scrollBox.scrollHeight })
        scrollBox.stickyScroll = true
      }
      setPaused(false)
    }
  })

  createEffect(() => {
    logs()
    const scrollBox = scroll()
    if (scrollBox) {
      setWidth(scrollBox.viewport.width)
    }
  })

  createEffect(() => {
    if (!app.activeContainer) {
      setLogs("")
      return
    }

    const filter = app.filters[app.activeContainer] || ""
    const baseCommand = `docker logs --follow --tail 100 ${app.activeContainer}`
    const shellCommand = filter
      ? `${baseCommand} 2>&1 | grep --line-buffered "${filter}"`
      : baseCommand

    const process = Bun.spawn([
      "bash",
      "-c",
      shellCommand,
    ], {
        stdout: "pipe",
        stderr: "pipe",
      })

    const abortController = new AbortController()

    async function readStream(stream: ReadableStream) {
      const decoder = new TextDecoder()
      const reader = stream.getReader()

      try {
        while (!abortController.signal.aborted) {
          const { done, value } = await reader.read()
          if (done) break


          const text = decoder.decode(value, { stream: true })
          const cleanText = stripANSI(text)
          if (cleanText.length > 0) {
            if (paused()) {
              setTempLogs(prev => prev + cleanText)
              continue
            }

            setLogs(prev => prev + cleanText)
          }
        }
      } catch (err) {}
    }

    readStream(process.stdout)
    readStream(process.stderr)

    onCleanup(() => {
      abortController.abort()
      process.kill()
      setLogs("")
      setPaused(false)
    })
  })

  return (
    <Pane width="100%" flexGrow={1}>
      <box
        paddingLeft={1}
        paddingRight={1}
        flexGrow={1}
        flexShrink={1}
        flexDirection="column"
        gap={1}
      >
        <Switch>
          <Match when={app.activeContainer}>
            <scrollbox
              ref={(r: ScrollBoxRenderable) => setScroll(r)}
              scrollY={true}
              stickyScroll={true}
              stickyStart="bottom"
              flexGrow={1}
              flexShrink={1}
            >
              <code
                content={logs()}
                syntaxStyle={logSyntaxStyle}
                streaming={false}
                width={width()}
                fg={theme.textMuted}
              />
            </scrollbox>
          </Match>
          <Match when={!app.activeContainer && app.containers.length > 0}>
            <box height="100%" width="100%" paddingLeft={1} paddingRight={1}>
              <text fg={theme.textMuted}>No container selected</text>
              <text fg={theme.textMuted}>
                Select a container to view logs (use j/k or ↑/↓ to navigate)
              </text>
            </box>
          </Match>
          <Match when={!app.activeContainer && app.containers.length === 0}>
            <box height="100%" width="100%" paddingLeft={1} paddingRight={1}>
              <text fg={theme.textMuted}>No container selected</text>
            </box>
          </Match>
        </Switch>
      </box>
    </Pane>
  )
}
