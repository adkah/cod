import type { CodConfig, PageItem } from './types.js'

export function defineCodConfig(config: CodConfig): CodConfig {
  return config
}

export function validateCodConfig(config: unknown): asserts config is CodConfig {
  if (!isRecord(config)) throw new Error('[Cod] Config must be an object.')
  if (!isNonEmptyString(config.defaultCollection)) {
    throw new Error('[Cod] defaultCollection must be a non-empty string.')
  }
  if (!isRecord(config.navigation)) throw new Error('[Cod] navigation must be an object.')
  if (!Array.isArray(config.navigation.tabs)) throw new Error('[Cod] navigation.tabs must be an array.')

  config.navigation.tabs.forEach((tab, tabIndex) => {
    if (!isRecord(tab)) throw new Error(`[Cod] navigation.tabs[${tabIndex}] must be an object.`)
    if (!isNonEmptyString(tab.tab))
      throw new Error(`[Cod] navigation.tabs[${tabIndex}].tab must be a non-empty string.`)
    if (!Array.isArray(tab.pages)) throw new Error(`[Cod] navigation.tabs[${tabIndex}].pages must be an array.`)
    tab.pages.forEach((item, itemIndex) => validatePageItem(item, `navigation.tabs[${tabIndex}].pages[${itemIndex}]`))
  })
}

function validatePageItem(item: unknown, path: string): asserts item is PageItem {
  if (typeof item === 'string') {
    if (!isNonEmptyString(item)) throw new Error(`[Cod] ${path} must be a non-empty string.`)
    return
  }

  if (!isRecord(item)) throw new Error(`[Cod] ${path} must be a string or object.`)
  if (!isNonEmptyString(item.group)) throw new Error(`[Cod] ${path}.group must be a non-empty string.`)
  if ('root' in item && item.root !== undefined && !isNonEmptyString(item.root)) {
    throw new Error(`[Cod] ${path}.root must be a non-empty string.`)
  }
  if ('icon' in item && item.icon !== undefined && !isNonEmptyString(item.icon)) {
    throw new Error(`[Cod] ${path}.icon must be a non-empty string.`)
  }

  const hasCollection = 'collection' in item
  const hasPages = 'pages' in item
  if (hasCollection === hasPages) {
    throw new Error(`[Cod] ${path} must specify exactly one of collection or pages.`)
  }

  if (hasCollection) {
    if (!isNonEmptyString(item.collection)) throw new Error(`[Cod] ${path}.collection must be a non-empty string.`)
    return
  }

  if (!Array.isArray(item.pages)) throw new Error(`[Cod] ${path}.pages must be an array.`)
  item.pages.forEach((child, index) => validatePageItem(child, `${path}.pages[${index}]`))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
