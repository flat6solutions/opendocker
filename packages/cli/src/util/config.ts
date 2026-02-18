import { z } from "zod"
import type { ThemeColors } from "@/context/theme"

type ThemeColorName = keyof ThemeColors

export const KeybindsConfig = z.object({
  leader: z.string().optional().default("ctrl+x").describe("Leader key for keybind combinations"),
  app_exit: z.string().optional().default("ctrl+c,<leader>q,q").describe("Exit the application"),
  theme_mode_toggle: z.string().optional().default("<leader>t").describe("Toggle between light and dark theme"),
  object_change: z.string().optional().default("tab").describe("Toggle between docker object panes"),
  up: z.string().optional().default("up,k").describe("Move up"),
  down: z.string().optional().default("down,j").describe("Move down"),
  debug_toggle: z.string().optional().default("ctrl+d").describe("Toggle debug mode"),
  container_stop: z.string().optional().default("<leader>s").describe("Stop a container"),
  container_pause: z.string().optional().default("<leader>p").describe("Pause a container"),
  container_restart: z.string().optional().default("<leader>r").describe("Restart a container"),
  container_exec_cmd: z.string().optional().default("<leader>e").describe("Execute a command in a container"),
  open_settings: z.string().optional().default("ctrl+p").describe("Open settings"),
})

export type KeybindsConfig = z.infer<typeof KeybindsConfig>

export type PaneConfig = {
  title?: string
  color: ThemeColorName
}
