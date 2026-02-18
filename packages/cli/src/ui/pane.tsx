import { RGBA, TextAttributes } from "@opentui/core"
import type { BoxProps } from "@opentui/solid"
import { createEffect, createSignal, Show, splitProps, type Accessor, type JSX } from "solid-js"
import { SplitBorder } from "@/components/border"
import { useTheme } from "@/context/theme"

interface PaneProps extends Omit<BoxProps, "borderColor" | "title"> {
  children?: JSX.Element
  title?: string
  shortcut?: string
  subtitle?: JSX.Element
  borderColor?: Accessor<RGBA | undefined> | string | RGBA
  active?: boolean
}

export function Pane(props: PaneProps) {
  const [local, others] = splitProps(
    props,
    [
      "children",
      "title",
      "shortcut",
      "subtitle",
      "borderColor",
      "active",
    ],
  )
  const theme = useTheme()
  const colors = theme.theme
  const [bg, setBg] = createSignal(theme.mode() === "dark" ? theme.theme.backgroundPanel : theme.theme.backgroundElement)

  function getBorderColor() {
    if (!local.borderColor) return bg()
    if (typeof local.borderColor === "function") {
      if (local.borderColor() === undefined) {
        return bg()
      }

      return local.borderColor()
    }
    return local.borderColor
  }

  createEffect(() => {
    setBg(theme.mode() === "dark" ? theme.theme.backgroundPanel : theme.theme.backgroundElement)
  })

  return (
    <box
      border={["left"]}
      customBorderChars={SplitBorder.customBorderChars}
      borderColor={getBorderColor()}
      {...others}
      {...(local.active === false ? { height: 3 } : {})}
    >
      <box
        backgroundColor={bg()}
        width="100%"
        height={local.active !== undefined ? "100%" : undefined}
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={1}
        paddingRight={1}
      >
        {local.title && (
          <>
            <box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              width="100%"
            >
              {local.title && (
                <box flexDirection="row" gap={1} marginBottom={local.active ? 1 : 0} marginLeft={1}>
                  {local.shortcut && <text fg={colors.textMuted}>[{local.shortcut}]</text>}
                  <text fg={colors.text} attributes={TextAttributes.BOLD}>{local.title}</text>
                </box>
              )}
              <Show when={local.subtitle}>
                <box
                  marginBottom={local.active ? 1 : 0}
                  marginRight={1}
                >
                  {local.subtitle}
                </box>
              </Show>
            </box>
          </>
        )}
        {local.children && local.children}
      </box>
    </box>
  )
}
