import { existsSync } from 'node:fs'
import { join, sep } from 'node:path'
import type { CodConfig } from './types.js'

export const codConfigModuleId = 'cod:config'
export const codSiteModuleId = 'cod:site'
export const resolvedCodConfigModuleId = `\0${codConfigModuleId}`
export const resolvedCodSiteModuleId = `\0${codSiteModuleId}`

const configFileNames = ['cod.config.ts', 'cod.config.mts', 'cod.config.js', 'cod.config.mjs'] as const

export type ConfigSource = { type: 'inline'; config: CodConfig } | { type: 'file'; path: string; relativePath: string }

type VitePlugin = {
  name: string
  resolveId(id: string): string | null
  load(id: string): string | null
}

export function resolveConfigSource(root: string, inlineConfig?: CodConfig): ConfigSource {
  if (inlineConfig) return { type: 'inline', config: inlineConfig }

  const matches = configFileNames
    .map((fileName) => ({ relativePath: fileName, path: join(root, fileName) }))
    .filter((candidate) => existsSync(candidate.path))

  if (matches.length === 0) throw new Error(missingConfigError())
  if (matches.length > 1) throw new Error(multipleConfigError(matches.map((match) => match.relativePath)))
  const match = matches[0]
  if (!match) throw new Error(missingConfigError())
  return { type: 'file', path: match.path, relativePath: match.relativePath }
}

export function createCodVirtualModulesPlugin(configSource: ConfigSource): VitePlugin {
  return {
    name: 'cod-core-virtual-modules',
    resolveId(id) {
      if (id === codConfigModuleId) return resolvedCodConfigModuleId
      if (id === codSiteModuleId) return resolvedCodSiteModuleId
      return null
    },
    load(id) {
      if (id === resolvedCodConfigModuleId) return generateConfigModule(configSource)
      if (id === resolvedCodSiteModuleId) return generateSiteModule()
      return null
    },
  }
}

export function generateConfigModule(configSource: ConfigSource): string {
  if (configSource.type === 'file') return `export { default } from '${toPosixPath(configSource.path)}'\n`

  let serialized: string
  try {
    serialized = JSON.stringify(configSource.config)
  } catch {
    throw new Error(
      '[Cod] Inline config must be serializable. Move config to cod.config.ts to use non-serializable values.'
    )
  }
  if (serialized === undefined) {
    throw new Error(
      '[Cod] Inline config must be serializable. Move config to cod.config.ts to use non-serializable values.'
    )
  }
  return `export default ${serialized}\n`
}

export function generateSiteModule(): string {
  return `import config from 'cod:config'
import { CodSite } from 'cod-core/site'

export const site = new CodSite(config)
`
}

export function missingConfigError(): string {
  return `[Cod] Could not find a Cod config file.

Searched:
- cod.config.ts
- cod.config.mts
- cod.config.js
- cod.config.mjs

Create cod.config.ts at the Astro project root, or pass inline config with cod({ config: defineCodConfig(...) }).`
}

export function multipleConfigError(relativePaths: string[]): string {
  return `[Cod] Found multiple Cod config files:
${relativePaths.map((path) => `- ${path}`).join('\n')}

Keep only one Cod config file at the project root.`
}

function toPosixPath(path: string): string {
  return path.split(sep).join('/')
}
