import { z } from "zod"

export const KeybindsConfig = z.object({
  leader: z.string().optional().default("ctrl+x").describe("Leader key for keybind combinations"),
  app_exit: z.string().optional().default("ctrl+c,<leader>q,q").describe("Exit the application"),
  theme_list: z.string().optional().default("<leader>t").describe("Open theme picker"),
  sidebar_toggle: z.string().optional().default("<leader>b").describe("Toggle sidebar"),
  up: z.string().optional().default("up,k").describe("Move up"),
  down: z.string().optional().default("down,j").describe("Move down"),
  debug_toggle: z.string().optional().default("ctrl+d").describe("Toggle debug mode"),
  container_start_stop: z.string().optional().default("<leader>s").describe("Start/Stop a container"),
  open_settings: z.string().optional().default("ctrl+p").describe("Open settings"),
  focus_containers: z.string().optional().default("1").describe("Focus containers pane"),
  focus_images: z.string().optional().default("2").describe("Focus images pane"),
  focus_volumes: z.string().optional().default("3").describe("Focus volumes pane"),
})

export type KeybindsConfig = z.infer<typeof KeybindsConfig>
