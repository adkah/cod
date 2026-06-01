declare module 'cod:config' {
  import type { CodConfig } from 'cod-core'

  const config: CodConfig
  export default config
}

declare module 'cod:site' {
  import type { CodSite } from 'cod-core/site'

  export const site: CodSite
}
