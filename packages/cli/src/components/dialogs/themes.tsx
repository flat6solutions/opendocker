import { DialogSelect, type DialogSelectRef } from "@/ui/dialog-select"
import { useTheme } from "@/context/theme"
import { useDialog } from "@/ui/dialog"
import { onCleanup } from "solid-js"

export default function ThemesDialog(props: { title?: string }) {
  const theme = useTheme()
  const options = Object.keys(theme.all())
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((value) => ({
      title: value,
      value: value,
    }))
  const dialog = useDialog()
  let confirmed = false
  let ref: DialogSelectRef<string>
  const initial = theme.selected

  function toggleMode() {
    theme.setMode(theme.mode() === "dark" ? "light" : "dark")
  }

  onCleanup(() => {
    if (!confirmed) theme.set(initial)
  })

  return (
    <DialogSelect
      title={props.title ?? "Themes"}
      options={options}
      current={initial}
      keybind={[
        {
          title: "toggle mode",
          keybind: {
            name: "space",
            ctrl: false,
            meta: false,
            shift: false,
            super: false,
            leader: false,
          },
          side: "right",
          onTrigger: () => {
            toggleMode()
          },
        },
      ]}
      onMove={(opt) => {
        theme.set(opt.value)
      }}
      onSelect={(opt) => {
        theme.set(opt.value)
        confirmed = true
        dialog.clear()
      }}
      ref={(r) => {
        ref = r
      }}
      onFilter={(query) => {
        if (query.length === 0) {
          theme.set(initial)
          return
        }

        const first = ref.filtered[0]
        if (first) theme.set(first.value)
      }}
    />
  )
}
