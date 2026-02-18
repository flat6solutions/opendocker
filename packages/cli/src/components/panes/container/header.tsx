import {
    createMemo,
    createEffect,
    createSignal,
    For,
} from "solid-js"
import { useApplication } from "@/context/application"
import type { Container } from "@/context/application"
import { Pane } from "@/ui/pane"
import { getColorForContainerState } from "@/util/colors"
import { TextAttributes } from "@opentui/core"
import { useTheme } from "@/context/theme"

export default function Header() {
    const theme = useTheme().theme
    const app = useApplication()
    const [selected, setSelected] = createSignal<Container>()

    createEffect(() => {
        setSelected(
            app.containers.find((c: Container) => c.id === app.activeContainer)
        )
    })

    const highlight = createMemo(() => {
        return getColorForContainerState(
            false,
            selected()?.status,
            selected()?.state
        )
    })

    const fields = [
        { label: "Name", value: () => selected()?.name },
        { label: "Status", value: () => selected()?.status },
        { label: "State", value: () => selected()?.state },
    ]

    return (
        <Pane width="100%" height="auto" flexShrink={0}>
            <box
                paddingRight={1}
                paddingLeft={1}
                flexDirection="row"
                gap={1}
            >
                <For each={fields}>
                    {(header) => (
                        <box flexDirection="column">
                            <text fg={theme.textMuted} attributes={TextAttributes.BOLD} flexShrink={0}>
                                {header.label}
                            </text>
                            <text fg={header.label === "Name" ? theme.text : highlight()}>{header.value()}</text>
                        </box>
                    )}
                </For>
            </box>
        </Pane>
    )
}
