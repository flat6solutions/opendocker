import type { JSX } from "solid-js"
import { useTerminalDimensions } from "@opentui/solid"
import { Toast } from "@/ui/toast"
import { Docker } from "@/lib/docker"
import { useApplication } from "@/context/application"
import Footer from "@/components/footer"
import { useTheme } from "@/context/theme"
import { RGBA } from "@opentui/core"
import { createMemo, Match, Show, Switch, onMount } from "solid-js"
import RightSidebar from "@/components/right-sidebar"

export function BaseLayout({ children }: { children: JSX.Element }) {
  const app = useApplication()
  const theme = useTheme().theme
  const dimensions = useTerminalDimensions()
  const wide = createMemo(() => dimensions().width > 120)

  onMount(() => {
    createDockerInstance()
  })

  function createDockerInstance() {
    const d = Docker.getInstance()
    app.setDocker(d)
  }

  return (
    <>
      <Toast />
      <box width="100%" height="100%" backgroundColor={theme.background}>
        <box height="100%" width="100%" padding={1}>
          {children}
        </box>
        <Footer />
      </box>
      <Show when={app.rightSidebarOpen}>
        <Switch>
          <Match when={wide()}>
            <RightSidebar />
          </Match>
          <Match when={!wide()}>
            <box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              alignItems="flex-end"
              backgroundColor={RGBA.fromInts(0, 0, 0, 70)}
            >
              <RightSidebar overlay />
            </box>
          </Match>
        </Switch>
      </Show>
    </>
  )
}