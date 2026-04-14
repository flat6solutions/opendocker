import { createMemo, createSignal, For, onCleanup, Show } from "solid-js"
import { TextAttributes, RGBA } from "@opentui/core"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { useTheme, selectedForeground } from "@/context/theme"
import { useDialog } from "@/ui/dialog"
import { Locale } from "@/util/locale"

interface ThemesDialogProps {
  title: string
}

export default function ThemesDialog({ title }: ThemesDialogProps) {
  const theme = useTheme()
  const dialog = useDialog()
  const options = Object.keys(theme.all())
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((value) => ({
      title: value,
      value,
    }))

  const initial = theme.selected
  const initialIndex = Math.max(0, options.findIndex((option) => option.value === initial))
  const [selected, setSelected] = createSignal(initialIndex)
  let confirmed = false

  onCleanup(() => {
    if (!confirmed) {
      theme.set(initial)
    }
  })

  function move(direction: number) {
    if (options.length === 0) return
    let next = selected() + direction
    if (next < 0) next = options.length - 1
    if (next >= options.length) next = 0
    setSelected(next)
    const option = options[next]
    if (option) {
      theme.set(option.value)
    }
  }

  function confirm() {
    const option = options[selected()]
    if (!option) return
    theme.set(option.value)
    confirmed = true
    dialog.clear()
  }

  useKeyboard((key) => {
    if (key.name === "up") {
      key.preventDefault()
      key.stopPropagation()
      move(-1)
    }

    if (key.name === "down") {
      key.preventDefault()
      key.stopPropagation()
      move(1)
    }

    if (key.name === "return" || key.name === "enter") {
      key.preventDefault()
      key.stopPropagation()
      confirm()
    }
  })

  const currentTheme = createMemo(() => theme.selected)
  const dimensions = useTerminalDimensions()
  const height = createMemo(() => Math.min(options.length, Math.floor(dimensions().height / 2) - 6))

  return (
    <box gap={1} paddingBottom={1}>
      <box paddingLeft={4} paddingRight={4}>
        <box flexDirection="row" justifyContent="space-between">
          <text fg={theme.theme.text} attributes={TextAttributes.BOLD}>
            {title}
          </text>
          <text fg={theme.theme.textMuted} onMouseUp={() => dialog.clear()}>
            esc
          </text>
        </box>
      </box>
      <scrollbox
        paddingLeft={1}
        paddingRight={1}
        scrollbarOptions={{ visible: false }}
        maxHeight={height()}
      >
        <For each={options}>
          {(option, index) => {
            const active = createMemo(() => index() === selected())
            const current = createMemo(() => option.value === currentTheme())
            const bg = createMemo(() => (active() ? theme.theme.primary : RGBA.fromInts(0, 0, 0, 0)))

            return (
              <box
                id={JSON.stringify(option.value)}
                flexDirection="row"
                backgroundColor={bg()}
                paddingLeft={current() ? 1 : 3}
                paddingRight={3}
                gap={1}
                onMouseDown={() => {
                  setSelected(index())
                  theme.set(option.value)
                }}
                onMouseUp={() => {
                  setSelected(index())
                  confirm()
                }}
              >
                <Option
                  title={option.title}
                  active={active()}
                  current={current()}
                />
              </box>
            )
          }}
        </For>
      </scrollbox>
    </box>
  )
}

function Option(props: {
  title: string
  description?: string
  active?: boolean
  current?: boolean
}) {
  const { theme } = useTheme()
  const fg = selectedForeground(theme)

  return (
    <>
      <Show when={props.current}>
        <text flexShrink={0} fg={props.active ? fg : props.current ? theme.primary : theme.text} marginRight={0}>
          ●
        </text>
      </Show>
      <text
        flexGrow={1}
        fg={props.active ? fg : props.current ? theme.primary : theme.text}
        attributes={props.active ? TextAttributes.BOLD : undefined}
        overflow="hidden"
        wrapMode="none"
        paddingLeft={3}
      >
        {Locale.truncate(props.title, 61)}
        <Show when={props.description}>
          <span style={{ fg: props.active ? fg : theme.textMuted }}> {props.description}</span>
        </Show>
      </text>
    </>
  )
}
