import type { JSX } from "solid-js"
import { onMount } from "solid-js"
import { Toast } from "@/ui/toast"
import { Docker } from "@/lib/docker"
import { useApplication } from "@/context/application"
import Footer from "@/components/footer"
import { useTheme } from "@/context/theme"

export function BaseLayout({ children }: { children: JSX.Element }) {
  const app = useApplication()
  const theme = useTheme().theme

  onMount(() => {
    createDockerInstance()
  })

  function createDockerInstance() {
    const d = Docker.getInstance()
    app.setDocker(d)
  }

  return (
    <>
      <Toast />
      <box width="100%" height="100%" backgroundColor={theme.background}>
        <box height="100%" width="100%" padding={1}>
          {children}
        </box>
        <Footer />
      </box>
    </>
  )
}
