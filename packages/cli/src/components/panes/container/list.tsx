import { TextAttributes } from "@opentui/core"
import { useKeyboard } from "@opentui/solid"
import {
  createEffect,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch,
  onCleanup,
} from "solid-js"
import { useApplication } from "@/context/application"
import type { Container } from "@/context/application"
import { Pane } from "@/ui/pane"
import { getColorForContainerState } from "@/util/colors"
import { useTheme } from "@/context/theme"
import { useKeybind } from "@/context/keybind"
import { DockerV2 } from "@/lib/docker-v2"
import { useDialog } from "@/ui/dialog"

export default function List() {
  const keybind = useKeybind()
  const app = useApplication()
  const dialog = useDialog()
  const [active, setActive] = createSignal<boolean>(false)
  const maxStateLength = () => Math.max(...app.containers.map(c => c.state.length), 0)
  const theme = useTheme().theme

  async function setup() {
    const c = await DockerV2.getContainers()
    app.setContainers(c)
    const activeId = validateActiveContainer(c, app.activeContainer)
    if (activeId !== app.activeContainer) {
      app.setActiveContainer(activeId)
    }
  }

  onMount(() => {
    setup()

    const intervalId = setInterval(() => {
      setup()
    }, 1000)

    onCleanup(() => {
      clearInterval(intervalId)
    })
  })

  function validateActiveContainer(containers: Array<Container>, activeId: string | null) {
    if (!activeId) return containers[0]?.id
    const exists = containers.find(c => c.id === activeId)
    return exists ? activeId : containers[0]?.id
  }

  function getSelectedIndex() {
    if (!app.activeContainer) {
      return -1
    }

    return app.containers.findIndex(c => c.id === app.activeContainer)
  }

  useKeyboard(key => {
    if (app.filtering) return
    if (app.activePane !== "containers") return
    if (dialog.stack.length > 0) return

    if (keybind.match("up", key)) {
      const index = getSelectedIndex()
      if (index === -1 && app.containers.length > 0) {
        app.setActiveContainer(app.containers[app.containers.length - 1].id)
        return
      }

      if (index <= 0) {
        return
      }

      const newSelected = app.containers[index - 1]
      app.setActiveContainer(newSelected.id)
    }

    if (keybind.match("down", key)) {
      const index = getSelectedIndex()

      if (index === -1 && app.containers.length > 0) {
        app.setActiveContainer(app.containers[0].id)
        return
      }

      if (index >= app.containers.length - 1) {
        return
      }

      const newSelected = app.containers[index + 1]
      app.setActiveContainer(newSelected.id)
    }
  })

  createEffect(() => {
    if (!app.activeContainer && app.containers.length > 0) {
      app.setActiveContainer(app.containers[0].id)
    }
  })

  createEffect(() => {
    setActive(app.activePane === "containers")
  })

  return (
    <Pane
      title="Containers"
      shortcut="1"
      width="100%"
      flexGrow={active() ? 1 : 0}
      flexShrink={1}
      borderColor={() => (active() && !app.filtering ? theme.border : theme.backgroundPanel)}
      active={active()}
      subtitle={
        <box flexDirection="row" gap={1} alignItems="center">
          <text fg={theme.textMuted}>
            {app.containers.length}
          </text>
        </box>
      }
    >
      <Show when={active()}>
        <Switch>
          <Match when={app.containers.length > 0}>
            <box flexDirection="column" width="100%">
              <For each={app.containers}>
                {(container: Container) => {
                  const isActive = () => app.activeContainer === container.id
                  return (
                    <box
                      backgroundColor={isActive() ? theme.border : undefined}
                      flexDirection="row"
                      gap={1}
                      paddingLeft={1}
                      paddingRight={1}
                    >
                      <text
                        fg={getColorForContainerState(
                          isActive(),
                          container.status,
                          container.state
                        )}
                        attributes={
                          isActive() ? TextAttributes.BOLD : undefined
                        }
                        flexShrink={0}
                      >
                        {container.state.padEnd(maxStateLength())}
                      </text>
                      <text
                        fg={
                          isActive()
                            ? theme.text
                            : theme.textMuted
                        }
                        attributes={
                          isActive() ? TextAttributes.BOLD : undefined
                        }
                        flexShrink={1}
                        flexGrow={1}
                        wrapMode="none"
                      >
                        {container.name}
                      </text>
                    </box>
                  )
                }}
              </For>
            </box>
          </Match>
          <Match when={app.containers.length === 0}>
            <box flexDirection="column" width="100%">
              <box paddingLeft={1} paddingRight={1} paddingBottom={1}>
                <text fg={theme.textMuted}>No containers found</text>
              </box>
            </box>
          </Match>
        </Switch>
      </Show>
    </Pane>
  )
}
