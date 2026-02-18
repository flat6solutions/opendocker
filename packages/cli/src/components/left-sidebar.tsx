import ContainerList from "@/components/panes/container/list"
import ImageList from "@/components/panes/image/list"
import VolumeList from "@/components/panes/volume/list"
import { useApplication } from "@/context/application"
import { useKeybind } from "@/context/keybind"
import { useDialog } from "@/ui/dialog"
import { useKeyboard } from "@opentui/solid"

export default function LeftSidebar() {
  const keybind = useKeybind()
  const app = useApplication()
  const dialog = useDialog()

  useKeyboard(key => {
    if (dialog.stack.length > 0) return

    if (keybind.match("cycle_pane", key)) {
      switch (app.activePane) {
        case "containers":
          app.setActivePane("images")
          break
        case "images":
          app.setActivePane("volumes")
          break
        case "volumes":
          app.setActivePane("containers")
          break
      }
    }

    if (keybind.match("focus_containers", key)) {
      app.setActivePane("containers")
    }

    if (keybind.match("focus_images", key)) {
      app.setActivePane("images")
    }

    if (keybind.match("focus_volumes", key)) {
      app.setActivePane("volumes")
    }
  })

  return (
    <box flexDirection="column" width="30%" height="100%" gap={1} justifyContent="flex-start" alignItems="stretch">
      <ContainerList />
      <ImageList />
      <VolumeList />
    </box>
  )
}
