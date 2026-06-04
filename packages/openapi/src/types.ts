import type { OpenAPI } from 'openapi-types'

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace'

export type OpenApiSpec = OpenAPI.Document

export type DereferencedOpenApiSpec = Record<string, unknown> & {
  paths?: Record<string, OpenApiPathItem>
  servers?: OpenApiServer[]
  security?: SecurityRequirement[]
  components?: {
    securitySchemes?: Record<string, SecurityScheme>
    [key: string]: unknown
  }
}

export interface OpenApiServer {
  url: string
  variables?: Record<string, { default?: string; description?: string }>
}

export interface OpenApiPathItem extends Record<string, unknown> {
  parameters?: Parameter[]
  get?: OpenApiOperation
  post?: OpenApiOperation
  put?: OpenApiOperation
  patch?: OpenApiOperation
  delete?: OpenApiOperation
  head?: OpenApiOperation
  options?: OpenApiOperation
  trace?: OpenApiOperation
}

export interface OpenApiOperation extends Record<string, unknown> {
  operationId?: string
  summary?: string
  description?: string
  deprecated?: boolean
  tags?: string[]
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses?: Record<string, ResponseObject>
  security?: SecurityRequirement[]
}

export interface Schema extends Record<string, unknown> {
  type?: string
  properties?: Record<string, Schema>
  items?: Schema
  required?: string[]
  description?: string
  enum?: unknown[]
  default?: unknown
  format?: string
  example?: unknown
  oneOf?: Schema[]
  anyOf?: Schema[]
  allOf?: Schema[]
  nullable?: boolean
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  pattern?: string
  title?: string
  deprecated?: boolean
  additionalProperties?: boolean | Schema
}

export interface Parameter extends Record<string, unknown> {
  name: string
  in: string
  required?: boolean
  description?: string
  schema?: Schema
}

export interface RequestBody extends Record<string, unknown> {
  required?: boolean
  description?: string
  content?: Record<string, { schema?: Schema; [key: string]: unknown }>
}

export interface ResponseObject extends Record<string, unknown> {
  description?: string
  content?: Record<string, { schema?: Schema; [key: string]: unknown }>
}

export interface SecurityScheme extends Record<string, unknown> {
  type: string
  scheme?: string
  bearerFormat?: string
  description?: string
  name?: string
  in?: string
}

export type SecurityRequirement = Record<string, string[]>

export interface ServerVariable {
  name: string
  default: string
  description?: string
}

export interface Endpoint {
  method: string
  path: string
  operationId?: string
  summary?: string
  description?: string
  baseUrl?: string
  serverUrlSuffix?: string
  serverVariables?: ServerVariable[]
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses?: Record<string, ResponseObject>
  security?: SecurityRequirement[]
  securitySchemes?: Record<string, SecurityScheme>
  deprecated?: boolean
  tags?: string[]
}

export type ApiSpecSource = string | URL | OpenApiSpec | (() => OpenApiSpec | Promise<OpenApiSpec>)

export interface ApiLoaderOptions {
  slug: string
  label: string
  source: ApiSpecSource
  excludeTags?: string[]
}

export interface ApiEntryData {
  title: string
  description?: string
  method: string
  apiSlug: string
  apiLabel: string
  sortOrder: number
  endpoint: Endpoint
}
