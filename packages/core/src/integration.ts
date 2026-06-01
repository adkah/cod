import type { AstroIntegration } from 'astro'
import { validateCodConfig } from './config.js'
import type { CodIntegrationOptions } from './types.js'
import { createCodVirtualModulesPlugin, resolveConfigSource } from './virtual-modules.js'

export default function cod(options: CodIntegrationOptions = {}): AstroIntegration {
  return {
    name: 'cod-core',
    hooks: {
      'astro:config:setup': ({ config, addWatchFile, updateConfig }) => {
        const source = resolveConfigSource(config.root.pathname, options.config)
        if (source.type === 'inline') validateCodConfig(source.config)
        if (source.type === 'file') addWatchFile(source.path)
        updateConfig({ vite: { plugins: [createCodVirtualModulesPlugin(source)] } })
      },
    },
  }
}
