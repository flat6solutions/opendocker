import { createSignal, createMemo, For, Show, type JSX } from "solid-js"
import { TextAttributes, RGBA } from "@opentui/core"
import { useTheme, selectedForeground } from "@/context/theme"
import { useDialog } from "@/ui/dialog"
import { Locale } from "@/util/locale"
import { isDeepEqual } from "remeda"

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
    value: value,
  }))

  const [selected, setSelected] = createSignal(0)

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
      >
        <For each={options}>
          {(option) => {
            const active = createMemo(() => isDeepEqual(option.value, selected()?.value))
            const current = createMemo(() => isDeepEqual(option.value, props.current))

            return (
              <box
                id={JSON.stringify(option.value)}
                flexDirection="row"
                backgroundColor={active() ? (option.bg ?? theme.primary) : RGBA.fromInts(0, 0, 0, 0)}
                paddingLeft={current() || option.gutter ? 1 : 3}
                paddingRight={3}
                gap={1}
              >
                <Option
                  title={option.title}
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
  footer?: JSX.Element | string
  gutter?: JSX.Element
  onMouseOver?: () => void
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
      <Show when={!props.current && props.gutter}>
        <box flexShrink={0} marginRight={0}>
          {props.gutter}
        </box>
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
      <Show when={props.footer}>
        <box flexShrink={0}>
          <text fg={props.active ? fg : theme.textMuted}>{props.footer}</text>
        </box>
      </Show>
    </>
  )
}
