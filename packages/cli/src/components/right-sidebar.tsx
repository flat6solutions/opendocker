import { Show } from "solid-js"
import ContainerHeader from "@/components/panes/container/header"
import ContainerLogs from "@/components/panes/container/logs"
import ContainerFilter from "@/components/panes/container/filter"
import ImageConfig from "@/components/panes/image/config"
import ImageHistory from "@/components/panes/image/history"
import VolumeConfig from "@/components/panes/volume/config"
import { useApplication } from "@/context/application"

export default function RightSidebar() {
  const app = useApplication()

  return (
    <box flexDirection="column" gap={1} width="70%" height="100%">
      <Show when={app.activePane === "containers" || app.activePane === "filter"}>
        <ContainerHeader />
        <ContainerLogs />
        <ContainerFilter />
      </Show>
      <Show when={app.activePane === "images"}>
        <ImageConfig />
        <ImageHistory />
      </Show>
      <Show when={app.activePane === "volumes"}>
        <VolumeConfig />
      </Show>
    </box>
  )
}
