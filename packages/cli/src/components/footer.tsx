import Keybinds from "./keybinds"

export default function Footer() {
  return (
    <box
      width="100%"
      height="auto"
      paddingLeft={1}
      paddingRight={1}
      paddingBottom={1}
    >
      <Keybinds />
    </box>
  )
}