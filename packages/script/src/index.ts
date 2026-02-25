const env = {
  OPENDOCKER_BUMP: process.env["OPENDOCKER_BUMP"],
  OPENDOCKER_VERSION: process.env["OPENDOCKER_VERSION"],
  OPENDOCKER_RELEASE: process.env["OPENDOCKER_RELEASE"],
}


const VERSION = await (async () => {
  if (env.OPENDOCKER_VERSION) return env.OPENDOCKER_VERSION


  // Fetch current version from npm
  const version = await fetch("https://registry.npmjs.org/opendocker/latest")
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })
    .then((data: any) => data.version)
    .catch(() => "0.0.0") // First publish


  const [major, minor, patch] = version.split(".").map((x: string) => Number(x) || 0)
  const bump = env.OPENDOCKER_BUMP?.toLowerCase()


  if (bump === "major") return `${major + 1}.0.0`
  if (bump === "minor") return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
})()


export const Script = {
  get version() {
    return VERSION
  },
  get release() {
    return env.OPENDOCKER_RELEASE === "true" || env.OPENDOCKER_RELEASE === "1"
  },
}


console.log(`opendocker script`, JSON.stringify(Script, null, 2))
