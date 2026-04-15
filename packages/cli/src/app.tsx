import { useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/solid"
import { Show, Switch, Match, createMemo, ErrorBoundary, onMount } from "solid-js"
import { ErrorComponent } from "@/components/error-component"
import { BaseLayout } from "@/layouts/base-layout"
import LeftSidebar from "@/components/left-sidebar"
import Main from "@/components/main"
import { ToastProvider, useToast } from "@/ui/toast"
import { Clipboard } from "@/util/clipboard"
import { ApplicationProvider, useApplication } from "@/context/application"
import { KeybindProvider, useKeybind } from "@/context/keybind"
import { ThemeProvider } from "@/context/theme"
import { KVProvider } from "@/context/kv"
import { DialogProvider, useDialog } from "@/ui/dialog"
import ThemesDialog from "@/components/dialogs/themes"
import RightSidebar from "@/components/right-sidebar"

export function tui() {
  return (
    <ToastProvider>
      <KVProvider>
        <ApplicationProvider>
          <ThemeProvider mode="dark">
            <KeybindProvider>
              <DialogProvider>
                <BaseLayout>
                  <ErrorBoundary fallback={(error, _) => <ErrorComponent error={error} />}>
                    <App />
                  </ErrorBoundary>
                </BaseLayout>
              </DialogProvider>
            </KeybindProvider>
          </ThemeProvider>
        </ApplicationProvider>
      </KVProvider>
    </ToastProvider>
  )
}

function App() {
  const renderer = useRenderer()
  const toast = useToast()
  const app = useApplication()
  const keybind = useKeybind()
  const dialog = useDialog()

  const dimensions = useTerminalDimensions()
  const wide = createMemo(() => dimensions().width > 120)

  useKeyboard(event => {
    if (app.filtering) return
    if (dialog.stack.length > 0) return

    if (keybind.match("app_exit", event)) {
      exit()
    }

    if (keybind.match("debug_toggle", event)) {
      renderer?.console.toggle()
      renderer?.toggleDebugOverlay()
    }

    if (keybind.match("theme_list", event)) {
      dialog.replace(() => <ThemesDialog title="Themes" />)
    }

    if (keybind.match("sidebar_toggle", event)) {
      app.toggleRightSidebar()
    }
  })

  function exit() {
    renderer.setTerminalTitle("")
    renderer.destroy()
    process.exit(0)
  }

  async function checkForUpdates() {
    const version = typeof OPENDOCKER_VERSION !== "undefined" ? OPENDOCKER_VERSION : "local"
    if (version === "local") return
    console.log("OpenDocker version", version)
  }

  function setup() {
    checkForUpdates()
  }

  onMount(() => {
    setup()
  })

  return (
    <box
      width="100%"
      height="100%"
      flexDirection="row"
      gap={1}
      onMouseUp={async () => {
        const text = renderer.getSelection()?.getSelectedText()
        if (text && text.length > 0) {
          const base64 = Buffer.from(text).toString("base64")
          const osc52 = `\x1b]52;c;${base64}\x07`
          const finalOsc52 = process.env["TMUX"] ? `\x1bPtmux;\x1b${osc52}\x1b\\` : osc52
          /* @ts-expect-error */
          renderer.writeOut(finalOsc52)
          await Clipboard.copy(text)
          .then(() => toast.show({ message: "Copied to clipboard", variant: "info" }))
          .catch(toast.error)
          renderer.clearSelection()
        }
      }}
    >
      <LeftSidebar />
      <Main />
      <Show when={app.rightSidebarOpen}>
        <Switch>
          <Match when={wide()}>
            <RightSidebar />
          </Match>
        </Switch>
      </Show>
    </box>
  )
}
