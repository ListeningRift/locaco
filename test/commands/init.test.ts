import { createInstance } from '@/index'
import { fs, vol } from 'memfs'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs')
vi.mock('node:fs/promises')

beforeEach(() => {
  vol.reset()
})

afterAll(() => {
  vi.clearAllMocks()
})

describe('createInit', () => {
  const testCwd = '/test'
  const mockOptions = {
    cwd: testCwd,
    componentsJson: true,
    repo: 'test-repo',
    owner: 'test-owner',
    getRelativeFile: vi.fn(),
  }
  const { init } = createInstance(mockOptions)

  beforeEach(() => {
    vol.mkdirSync(testCwd, { recursive: true })
  })

  it('should create basic components.json file', async () => {
    await init()

    expect(fs.existsSync(`${testCwd}/components.json`)).toBe(true)
    const result = fs.readFileSync(`${testCwd}/components.json`, 'utf-8')
    expect(result).toMatchInlineSnapshot(`
      "{
        "components": {}
      }"
    `)
  })

  it('should create components.json file with extra properties', async () => {
    const extraProps = {
      version: '1.0.0',
      description: 'Test components',
    }

    await init({ extra: extraProps })

    expect(fs.existsSync(`${testCwd}/components.json`)).toBe(true)
    const result = fs.readFileSync(`${testCwd}/components.json`, 'utf-8')
    expect(result).toMatchInlineSnapshot(`
      "{
        "components": {},
        "version": "1.0.0",
        "description": "Test components"
      }"
    `)
  })
})
