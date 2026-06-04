import { join } from 'node:path'
import petstore from './fixtures/petstore.json'

export const fixturePath = join(import.meta.dir, 'fixtures/petstore.json')

export const fixtureUrl = new URL('./fixtures/petstore.json', import.meta.url)

export { petstore }
