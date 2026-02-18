import { createSignal, Switch, Match, createEffect } from "solid-js"
import { KeyEvent, TextareaRenderable } from "@opentui/core"
import { useKeyboard } from "@opentui/solid"
import { SplitBorder } from "@/components/border"
import { useApplication } from "@/context/application"
import { useTheme } from "@/context/theme"
import { useDialog } from "@/ui/dialog"

export default function Filter() {
  const app = useApplication()
  const theme = useTheme().theme
  const dialog = useDialog()
  const [value, setValue] = createSignal<string>("")
  let input: TextareaRenderable

  useKeyboard(key => {
    if (dialog.stack.length > 0) return

    if (key.name === "f") {
      if (!input.focused) {
        input.focus()
        input.cursorOffset = input.plainText.length
        key.preventDefault()
        app.setActivePane("filter")
        app.setFiltering(true)
        return
      }
    }
  })

  function submit(key: KeyEvent) {
    input.submit()
    input.blur()
    key.preventDefault()
    app.setFiltering(false)

    app.setActivePane("containers")
    if (app.activeContainer) {
      app.setFilters({ [app.activeContainer]: value()})
    }

    return
  }

  function cancel(key: KeyEvent) {
    input.blur()
    key.preventDefault()
    app.setFiltering(false)

    app.setActivePane("containers")
    return
  }

  createEffect(() => {
    if (app.activeContainer) {
      const filterValue = app.filters[app.activeContainer] || "" 
      setValue(filterValue)

      if (input) {
        input.setText(filterValue)
      }
    }
  })

  return (
    <box
      border={["left"]}
      customBorderChars={SplitBorder.customBorderChars}
      borderColor={app.activePane === "filter" ? theme.text : theme.border}
      flexShrink={0}
    >
      <box backgroundColor={theme.backgroundPanel} flexDirection="row">
        <box
          gap={1}
          paddingLeft={1}
          paddingRight={3}
          paddingTop={1}
          paddingBottom={1}
          width="100%"
        >
          <textarea
            marginLeft={1}
            placeholder={`Press "f" to filter... "GET /api"`}
            textColor={theme.textMuted}
            focusedTextColor={theme.text}
            minHeight={1}
            maxHeight={1}
            onContentChange={() => setValue(input.plainText)}
            ref={(r: TextareaRenderable) => {
              input = r
              setTimeout(() => {
                input.cursorColor = theme.text
              }, 0)
            }}
            focusedBackgroundColor={theme.backgroundPanel}
            cursorColor={theme.warning}
            onKeyDown={key => {
              if (key.name === "enter" || key.name === "return") {
                submit(key)
              }

              if (key.name === "escape") {
                cancel(key)
              }
            }}
          />
        </box>
        <box
          flexDirection="row"
          flexShrink={0}
          gap={1}
          paddingTop={1}
          paddingLeft={1}
          paddingRight={2}
          paddingBottom={1}
          backgroundColor={theme.backgroundElement}
          justifyContent="space-between"
        >
          <box flexDirection="row" gap={1}>
          </box>
          <box flexDirection="row" gap={2}>
            <Switch>
              <Match when={!app.filtering}>
                <text fg={theme.text}>
                  {"f"} <span style={{ fg: theme.textMuted }}>filter</span>
                </text>
              </Match>
              <Match when={app.filtering}>
                <text fg={theme.text}>
                  esc <span style={{ fg: theme.textMuted }}>cancel</span>
                </text>
                <text fg={theme.text}>
                  enter <span style={{ fg: theme.textMuted }}>confirm</span>
                </text>
              </Match>
            </Switch>
          </box>
        </box>
      </box>
    </box>
  )
}
