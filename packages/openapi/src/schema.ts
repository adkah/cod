import { z } from 'astro/zod'

export const schemaSchema = z.record(z.string(), z.unknown())

export const parameterSchema = z.looseObject({
  name: z.string(),
  in: z.string(),
  required: z.boolean().optional(),
  description: z.string().optional(),
  schema: schemaSchema.optional(),
})

export const securitySchemeSchema = z.looseObject({
  type: z.string(),
  scheme: z.string().optional(),
  bearerFormat: z.string().optional(),
  description: z.string().optional(),
  name: z.string().optional(),
  in: z.string().optional(),
})

export const serverVariableSchema = z.object({
  name: z.string(),
  default: z.string(),
  description: z.string().optional(),
})

export const endpointSchema = z.looseObject({
  method: z.string(),
  path: z.string(),
  operationId: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  baseUrl: z.string().optional(),
  serverUrlSuffix: z.string().optional(),
  serverVariables: z.array(serverVariableSchema).optional(),
  parameters: z.array(parameterSchema).optional(),
  requestBody: z.record(z.string(), z.unknown()).optional(),
  responses: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
  security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
  securitySchemes: z.record(z.string(), securitySchemeSchema).optional(),
  deprecated: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

export const apiCollectionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  method: z.string(),
  apiSlug: z.string(),
  apiLabel: z.string(),
  sortOrder: z.number(),
  endpoint: endpointSchema,
})
