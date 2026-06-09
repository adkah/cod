import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import petstore from './fixtures/petstore.json'

const fixtureDir = dirname(fileURLToPath(import.meta.url))

export const fixturePath = join(fixtureDir, 'fixtures/petstore.json')

export const fixtureUrl = new URL('./fixtures/petstore.json', import.meta.url)

export { petstore }
