import { $ } from "bun"
import { createSignal, onMount } from "solid-js"
import { useTheme } from "@/context/theme"
import { DockerV2 } from "@/lib/docker-v2"

export default function RightSidebar(props: { overlay?: boolean }) {
  const theme = useTheme().theme
  const [pwd, setPwd] = createSignal("")
  const [socket, setSocket] = createSignal("")
  const version = getVersion()

  onMount(async () => {
    const cwd = process.cwd()
    const home = process.env.HOME || ""
    const path = cwd.startsWith(home) ? cwd.replace(home, "~") : cwd
    setPwd(path)
    getEndpoint()

    const branch = await getCurrentBranch()
    if (branch) {
      setPwd(`${path}:${branch}`)
    }
  })

  async function getEndpoint() {
    const res = await DockerV2.getSocket()
    setSocket(res)
  }

  async function getCurrentBranch() {
    return $`git rev-parse --abbrev-ref HEAD`
      .quiet()
      .nothrow()
      .text()
      .then(x => x.trim())
  }

  function getVersion() {
    const version = typeof OPENDOCKER_VERSION !== "undefined" ? OPENDOCKER_VERSION : "local"
    return "v" + version
  }

  return (
    <box
      backgroundColor={theme.backgroundPanel}
      width={42}
      height="100%"
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
      position={props.overlay ? "absolute" : "relative"}
      flexDirection="column"
      justifyContent="space-between"
    >
      <box flexDirection="column" gap={2}>
        <box>
          <text fg={theme.text}><b>Docker Socket</b></text>
          <text fg={theme.textMuted}>{socket()}</text>
        </box>
      </box>
      <box flexShrink={0} gap={1} paddingRight={1}>
        <text fg={theme.textMuted}>{pwd()}</text>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.success }}>•</span> <b>Open</b>
          <span style={{ fg: theme.text }}>
            <b>Docker</b>
          </span>{" "}
          <span>{version}</span>
        </text>
      </box>
    </box>
  )
}