import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import SwaggerParser from '@apidevtools/swagger-parser'
import type {
  ApiLoaderOptions,
  Endpoint,
  HttpMethod,
  OpenApiOperation,
  OpenApiPathItem,
  OpenApiSpec,
  Parameter,
  ServerVariable,
} from './types.js'
import { slugify } from './utils.js'

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const

export interface ExtractedApiEntry {
  id: string
  title: string
  description?: string
  method: string
  apiSlug: string
  apiLabel: string
  sortOrder: number
  endpoint: Endpoint
}

export async function loadOpenApiSpec(source: ApiLoaderOptions['source']): Promise<OpenApiSpec> {
  if (typeof source === 'function') return dereferenceObject(await source())
  if (source instanceof URL) {
    return dereference(source.protocol === 'file:' ? fileURLToPath(source) : source.href)
  }
  if (typeof source === 'string') {
    const absolutePath = resolve(process.cwd(), source)
    return dereference(absolutePath)
  }
  return dereferenceObject(source)
}

export async function extractApiEntries(options: ApiLoaderOptions): Promise<ExtractedApiEntry[]> {
  const spec = (await loadOpenApiSpec(options.source)) as OpenApiSpec
  const entries: ExtractedApiEntry[] = []
  const entrySources = new Map<string, string>()
  const excludedTags = new Set(options.excludeTags ?? [])
  const securitySchemes = spec.components?.securitySchemes
  const server = spec.servers?.[0]

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method]
      if (!operation || shouldExcludeOperation(operation, excludedTags)) continue

      const buildOptions: Parameters<typeof buildEndpoint>[0] = {
        method,
        operation,
        path,
        pathItem,
      }
      if (server?.url !== undefined) buildOptions.baseUrl = server.url
      if (spec.security !== undefined) buildOptions.security = spec.security
      if (securitySchemes !== undefined) buildOptions.securitySchemes = securitySchemes
      if (server) {
        const serverVariables = getServerVariables(server.variables)
        if (serverVariables !== undefined) buildOptions.serverVariables = serverVariables
      }

      const endpoint = buildEndpoint(buildOptions)
      const title = operation.summary ?? operation.operationId ?? `${method.toUpperCase()} ${path}`
      const operationSlug = getOperationSlug(method, path, operation)
      const id = `${options.slug}/${operationSlug}`
      const sourceLabel = `${method.toUpperCase()} ${path}`
      const existingSource = entrySources.get(id)
      if (existingSource !== undefined) {
        throw new Error(
          `Duplicate OpenAPI entry id "${id}" generated for ${sourceLabel}; already used by ${existingSource}`
        )
      }
      entrySources.set(id, sourceLabel)

      const entry: ExtractedApiEntry = {
        id,
        title,
        method: method.toUpperCase(),
        apiSlug: options.slug,
        apiLabel: options.label,
        sortOrder: entries.length,
        endpoint,
      }
      if (operation.description !== undefined) entry.description = operation.description
      entries.push(entry)
    }
  }

  return entries
}

export async function getApiEntryIds(options: ApiLoaderOptions): Promise<string[]> {
  const entries = await extractApiEntries(options)
  return entries.map((entry) => entry.id)
}

function shouldExcludeOperation(operation: OpenApiOperation, excludedTags: Set<string>): boolean {
  return (operation.tags ?? []).some((tag) => excludedTags.has(tag))
}

function getOperationSlug(method: HttpMethod, path: string, operation: OpenApiOperation): string {
  if (operation.operationId !== undefined) return slugify(operation.operationId)
  return slugify(`${method}-${path.replaceAll('{', 'by-').replaceAll('}', '')}`)
}

function buildEndpoint(options: {
  method: HttpMethod
  path: string
  pathItem: OpenApiPathItem
  operation: OpenApiOperation
  baseUrl?: string
  security?: Endpoint['security']
  securitySchemes?: Endpoint['securitySchemes']
  serverVariables?: ServerVariable[]
}): Endpoint {
  const parameters = mergeParameters(options.pathItem.parameters, options.operation.parameters)
  const endpoint: Endpoint = {
    method: options.method.toUpperCase(),
    path: options.path,
  }

  if (options.operation.operationId !== undefined) endpoint.operationId = options.operation.operationId
  if (options.operation.summary !== undefined) endpoint.summary = options.operation.summary
  if (options.operation.description !== undefined) endpoint.description = options.operation.description
  if (options.baseUrl !== undefined) endpoint.baseUrl = options.baseUrl
  if (options.serverVariables !== undefined) endpoint.serverVariables = options.serverVariables
  if (parameters.length > 0) endpoint.parameters = parameters
  if (options.operation.requestBody !== undefined) endpoint.requestBody = options.operation.requestBody
  if (options.operation.responses !== undefined) endpoint.responses = options.operation.responses

  const security = options.operation.security ?? options.security
  if (security !== undefined) endpoint.security = security

  if (options.securitySchemes !== undefined) endpoint.securitySchemes = options.securitySchemes
  if (options.operation.deprecated !== undefined) endpoint.deprecated = options.operation.deprecated
  if (options.operation.tags !== undefined) endpoint.tags = options.operation.tags

  return endpoint
}

function mergeParameters(pathParameters: Parameter[] = [], operationParameters: Parameter[] = []): Parameter[] {
  const parameters = new Map<string, Parameter>()
  for (const parameter of pathParameters) {
    parameters.set(`${parameter.in}:${parameter.name}`, parameter)
  }
  for (const parameter of operationParameters) {
    parameters.set(`${parameter.in}:${parameter.name}`, parameter)
  }
  return [...parameters.values()]
}

function getServerVariables(variables: Record<string, { default?: string; description?: string }> | undefined) {
  if (!variables) return undefined
  return Object.entries(variables).map(([name, variable]) => {
    const serverVariable: ServerVariable = { name, default: variable.default ?? '' }
    if (variable.description !== undefined) serverVariable.description = variable.description
    return serverVariable
  })
}

async function dereference(source: string): Promise<OpenApiSpec> {
  const spec = await SwaggerParser.dereference(source)
  return spec as unknown as OpenApiSpec
}

async function dereferenceObject(source: OpenApiSpec): Promise<OpenApiSpec> {
  const spec = await SwaggerParser.dereference(source as unknown as Parameters<typeof SwaggerParser.dereference>[0])
  return spec as unknown as OpenApiSpec
}
