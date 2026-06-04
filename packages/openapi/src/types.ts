import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

/** HTTP methods that Cod extracts from OpenAPI path items. */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace'

/** An OpenAPI 3.0 or 3.1 document accepted by the loader. */
export type OpenApiSpec = OpenAPIV3.Document | OpenAPIV3_1.Document

/**
 * OpenAPI document after references have been dereferenced.
 *
 * Cod keeps the shape intentionally loose so extension fields and OpenAPI
 * features that are not rendered directly can still pass through to consumers.
 */
export type DereferencedOpenApiSpec = Record<string, unknown> & {
  paths?: Record<string, OpenApiPathItem>
  servers?: OpenApiServer[]
  security?: SecurityRequirement[]
  components?: {
    securitySchemes?: Record<string, SecurityScheme>
    [key: string]: unknown
  }
}

/** Server metadata from an OpenAPI document. */
export interface OpenApiServer {
  /** Server base URL, copied to generated endpoints as `baseUrl`. */
  url: string
  /** Template variables declared by the server URL. */
  variables?: Record<string, { default?: string; description?: string }>
}

/** Path item containing path-level parameters and supported operations. */
export interface OpenApiPathItem extends Record<string, unknown> {
  /** Parameters shared by operations on this path. */
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

/** OpenAPI operation data used to build a generated API entry. */
export interface OpenApiOperation extends Record<string, unknown> {
  /** Stable operation identifier; used to generate the entry id when present. */
  operationId?: string
  /** Short operation title; used as the entry title before falling back to `operationId`. */
  summary?: string
  /** Long-form operation description copied to the entry and endpoint. */
  description?: string
  /** Whether the operation is marked deprecated in the OpenAPI document. */
  deprecated?: boolean
  /** Operation tags; matched against `excludeTags` and copied to the endpoint. */
  tags?: string[]
  /** Operation-level parameters; override path-level parameters with the same `in:name`. */
  parameters?: Parameter[]
  /** Request body definition copied from the dereferenced operation. */
  requestBody?: RequestBody
  /** Response definitions keyed by status code or `default`. */
  responses?: Record<string, ResponseObject>
  /** Operation-level security requirements; override document-level security. */
  security?: SecurityRequirement[]
}

/** Dereferenced JSON schema-like object preserved from the OpenAPI document. */
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

/** OpenAPI parameter copied to generated endpoint data. */
export interface Parameter extends Record<string, unknown> {
  /** Parameter name, such as `petId` or `limit`. */
  name: string
  /** Parameter location, such as `path`, `query`, `header`, or `cookie`. */
  in: string
  /** Whether the parameter is required. */
  required?: boolean
  /** Human-readable parameter description. */
  description?: string
  /** Dereferenced schema for the parameter value. */
  schema?: Schema
}

/** OpenAPI request body copied to generated endpoint data. */
export interface RequestBody extends Record<string, unknown> {
  /** Whether the request body is required. */
  required?: boolean
  /** Human-readable request body description. */
  description?: string
  /** Media type map, such as `application/json`, with dereferenced schemas. */
  content?: Record<string, { schema?: Schema; [key: string]: unknown }>
}

/** OpenAPI response object copied to generated endpoint data. */
export interface ResponseObject extends Record<string, unknown> {
  /** Human-readable response description. */
  description?: string
  /** Media type map, such as `application/json`, with dereferenced schemas. */
  content?: Record<string, { schema?: Schema; [key: string]: unknown }>
}

/** OpenAPI security scheme copied from `components.securitySchemes`. */
export interface SecurityScheme extends Record<string, unknown> {
  /** Security scheme type, such as `apiKey`, `http`, `oauth2`, or `openIdConnect`. */
  type: string
  /** HTTP authorization scheme, such as `bearer` or `basic`. */
  scheme?: string
  /** Optional bearer token format hint. */
  bearerFormat?: string
  /** Human-readable security scheme description. */
  description?: string
  /** Name of the header, query parameter, or cookie for `apiKey` schemes. */
  name?: string
  /** Location of the API key for `apiKey` schemes. */
  in?: string
}

/** Security requirement object keyed by security scheme name. */
export type SecurityRequirement = Record<string, string[]>

/** Server URL template variable copied to generated endpoint data. */
export interface ServerVariable {
  /** Variable name from the server URL template. */
  name: string
  /** Default value for the variable. */
  default: string
  /** Human-readable variable description. */
  description?: string
}

/**
 * Endpoint data generated for a single OpenAPI operation.
 *
 * The object keeps dereferenced OpenAPI request, response, parameter, and
 * security metadata available for rendering API reference pages.
 */
export interface Endpoint {
  /** Uppercase HTTP method, such as `GET` or `POST`. */
  method: string
  /** OpenAPI path template, such as `/pets/{petId}`. */
  path: string
  /** Original OpenAPI operation id, when provided. */
  operationId?: string
  /** Short operation summary copied from the OpenAPI document. */
  summary?: string
  /** Long-form operation description copied from the OpenAPI document. */
  description?: string
  /** First OpenAPI server URL, when one is declared. */
  baseUrl?: string
  /** Optional server URL suffix available to downstream renderers. */
  serverUrlSuffix?: string
  /** Variables declared by the first OpenAPI server URL. */
  serverVariables?: ServerVariable[]
  /** Merged path-level and operation-level parameters. */
  parameters?: Parameter[]
  /** Dereferenced request body definition. */
  requestBody?: RequestBody
  /** Dereferenced response definitions keyed by status code or `default`. */
  responses?: Record<string, ResponseObject>
  /** Operation security requirements, or document-level requirements if the operation does not override them. */
  security?: SecurityRequirement[]
  /** Security schemes copied from `components.securitySchemes`. */
  securitySchemes?: Record<string, SecurityScheme>
  /** Whether the operation is marked deprecated. */
  deprecated?: boolean
  /** Operation tags copied from the OpenAPI document. */
  tags?: string[]
}

/**
 * Source accepted by the OpenAPI loader.
 *
 * Strings are resolved relative to `process.cwd()`. File URLs are loaded from
 * disk, non-file URLs are fetched by the Swagger parser, objects are used
 * directly, and functions are called before dereferencing.
 */
export type ApiSpecSource = string | URL | OpenApiSpec | (() => OpenApiSpec | Promise<OpenApiSpec>)

/** Options used to generate API reference entries from an OpenAPI document. */
export interface ApiLoaderOptions {
  /** Entry id prefix and API grouping slug, such as `api` in `api/list-pets`. */
  slug: string
  /** Human-readable API label copied to each generated entry's OpenAPI payload. */
  label: string
  /** OpenAPI document source to load and dereference. */
  source: ApiSpecSource
  /** Exclude operations that have any matching tag. */
  excludeTags?: string[]
}

/** OpenAPI-specific payload stored on generated API entries. */
export interface OpenApiEntryData {
  /** API grouping slug copied from loader options. */
  apiSlug: string
  /** Human-readable API grouping label copied from loader options. */
  apiLabel: string
  /** Generated endpoint details for rendering the operation. */
  endpoint: Endpoint
}

/** Data shape stored for each generated Astro content collection entry. */
export interface ApiEntryData {
  /** Entry title from operation summary, operation id, or method/path fallback. */
  title: string
  /** Long-form operation description, when provided. */
  description?: string
  /** Zero-based order based on traversal through paths and methods. */
  sortOrder: number
  /** OpenAPI-specific payload; also acts as the API page discriminator. */
  openapi: OpenApiEntryData
}

declare global {
  interface CodEntryDataExtensions {
    /** OpenAPI-specific payload when the entry represents an OpenAPI operation. */
    openapi?: OpenApiEntryData
  }
}
