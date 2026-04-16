import { z } from "zod"
import { createStore } from "solid-js/store"
import { createSimpleContext } from "./helper"
import type { Docker } from "@/lib/docker"
import { KeybindsConfig } from "@/util/config"

const Pane = z.enum(["containers", "images", "volumes"])
type Pane = z.infer<typeof Pane>

const ContainerFocus = z.enum(["list", "filter"])

const ActiveView = z.discriminatedUnion("pane", [
  z.object({
    pane: z.literal("containers"),
    focus: ContainerFocus,
  }),
  z.object({
    pane: z.literal("images"),
  }),
  z.object({
    pane: z.literal("volumes"),
  }),
])
type ActiveView = z.infer<typeof ActiveView>

const Container = z.object({
  id: z.string().describe("Unique container identifier"),
  name: z.string().describe("Container name"),
  state: z.string().describe("Container state (e.g. running, stopped)"),
  status: z.string().describe("Container status message"),
})
export type Container = z.infer<typeof Container>

const Image = z.object({
  id: z.string().describe("Unique image identifier"),
  name: z.string().describe("Image name"),
  tag: z.string().describe("Image tag"),
  size: z.string().describe("Image size"),
  created: z.string().describe("Image creation date"),
})
export type Image = z.infer<typeof Image>

const Volume = z.object({
  name: z.string().describe("Volume name"),
  driver: z.string().describe("Volume driver"),
  scope: z.string().describe("Volume scope"),
  mountpoint: z.string().describe("Volume mountpoint"),
  labels: z.record(z.string(), z.string()).describe("Volume labels"),
  options: z.record(z.string(), z.string()).nullable().describe("Volume options"),
  status: z.record(z.string(), z.string()).nullable().describe("Volume status"),
})
export type Volume = z.infer<typeof Volume>

type Config = {
  theme?: string,
  keybinds: KeybindsConfig,
}

function getViewForPane(pane: Pane): ActiveView {
  switch (pane) {
    case "containers":
      return { pane, focus: "list" }
    case "images":
      return { pane }
    case "volumes":
      return { pane }
  }
}

export const { use: useApplication, provider: ApplicationProvider } = createSimpleContext({
  name: "Application",
  init: () => {
    const [store, setStore] = createStore<{
      containers: Array<Container>
      images: Array<Image>
      volumes: Array<Volume>
      activeContainer: string | null
      activeImage: string | null
      activeVolume: string | null
      rightSidebarOpen: boolean
      docker: Docker | null
      activeView: ActiveView
      filters: Record<string, string>
      config: Config
    }>({
      containers: [],
      images: [],
      volumes: [],
      activeContainer: null,
      activeImage: null,
      activeVolume: null,
      rightSidebarOpen: false,
      docker: null,
      activeView: { pane: "containers", focus: "list" },
      filters: {},
      config: {
        keybinds: KeybindsConfig.parse({}),
      },
    })

    return {
      get containers() { return store.containers },
      get images() { return store.images },
      get volumes() { return store.volumes },
      get activeContainer() { return store.activeContainer },
      get activeImage() { return store.activeImage },
      get activeVolume() { return store.activeVolume },
      get rightSidebarOpen() { return store.rightSidebarOpen },
      get docker() { return store.docker },
      get activePane() { return store.activeView.pane },
      get filters() { return store.filters },
      get filtering() {
        return store.activeView.pane === "containers" && store.activeView.focus === "filter"
      },
      get config() { return store.config },

      setContainers: (v: Array<Container>) => setStore("containers", v),
      setImages: (v: Array<Image>) => setStore("images", v),
      setVolumes: (v: Array<Volume>) => setStore("volumes", v),
      setActiveContainer: (v: string | null) => setStore("activeContainer", v),
      setActiveImage: (v: string | null) => setStore("activeImage", v),
      setActiveVolume: (v: string | null) => setStore("activeVolume", v),
      toggleRightSidebar: () => setStore("rightSidebarOpen", open => !open),
      setDocker: (v: Docker | null) => setStore("docker", v),
      focusContainers: () => setStore("activeView", getViewForPane("containers")),
      focusImages: () => setStore("activeView", getViewForPane("images")),
      focusVolumes: () => setStore("activeView", getViewForPane("volumes")),
      startContainerFilter: () => setStore("activeView", { pane: "containers", focus: "filter" }),
      stopContainerFilter: () => setStore("activeView", { pane: "containers", focus: "list" }),
      setContainerFilter: (id: string, value: string) => setStore("filters", id, value),
      setConfig: (v: Config) => setStore("config", v),
    }
  },
})