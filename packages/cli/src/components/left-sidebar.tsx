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

    if (keybind.match("focus_containers", key)) {
      app.focusContainers()
    }

    if (keybind.match("focus_images", key)) {
      app.focusImages()
    }

    if (keybind.match("focus_volumes", key)) {
      app.focusVolumes()
    }
  })

  return (
    <box
      flexDirection="column"
      width={42}
      height="100%"
      gap={1}
      justifyContent="flex-start"
      alignItems="stretch"
    >
      <ContainerList />
      <ImageList />
      <VolumeList />
    </box>
  )
}