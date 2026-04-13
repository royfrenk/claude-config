/**
 * Adapter Loader
 *
 * Dynamically loads the appropriate SRE adapter based on the target
 * specified in .sre/config.yaml.
 */

import type { SREAdapter, SreProjectConfig } from "../adapters/adapter-interface.js"

export async function loadAdapter(config: SreProjectConfig): Promise<SREAdapter> {
  const { target } = config

  switch (target) {
    case "vercel-railway": {
      const mod = await import("../adapters/vercel-railway/index.js")
      return mod.createAdapter(config)
    }
    case "raspberry-pi": {
      const mod = await import("../adapters/raspberry-pi/index.js")
      return mod.createAdapter(config)
    }
    case "macos-desktop": {
      const mod = await import("../adapters/macos-desktop/index.js")
      return mod.createAdapter(config)
    }
    default:
      throw new Error(
        `Unknown SRE adapter target: "${target}". ` +
        `Expected one of: vercel-railway, raspberry-pi, macos-desktop`
      )
  }
}
