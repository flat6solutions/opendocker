import { useTheme } from "@/context/theme"

export function getColorForContainerState(isActive: boolean, status?: string, state?: string) {
  const theme = useTheme().theme

  if (!status || !state) {
    return theme.textMuted
  }

  switch (state) {
    case "running":
      if (status.includes("unhealthy")) {
        return theme.warning
      }
      if (status.includes("starting")) {
        return theme.info
      }
      return theme.success
    case "exited":
      return theme.error
    case "created":
      return theme.info
    default:
      return theme.textMuted
  }
}
