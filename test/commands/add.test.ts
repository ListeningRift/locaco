import { createInstance } from '@/index'
import { fs, vol } from 'memfs'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs')
vi.mock('node:fs/promises')
vi.mock('node-fetch', () => ({
  default: vi.fn(async (url) => {
    if (url.includes('tags')) {
      return {
        ok: true,
        json: () => Promise.resolve([
          {
            name: '2.0.0',
          },
          {
            name: '1.0.0',
          },
        ]),
      }
    }
    if (url.includes('tree')) {
      return {
        ok: true,
        json: () => Promise.resolve({
          tree: [
            {
              path: 'test/button.ts',
            },
            {
              path: 'test/button.type.ts',
            },
          ],
        }),
      }
    }
    return {
      ok: true,
      text: () => Promise.resolve('mocked file content'),
    }
  }),
}))

beforeEach(() => {
  vol.reset()
})

afterAll(() => {
  vi.clearAllMocks()
})

describe('createAdd', () => {
  const cwd = '/test'
  const componentsPath = `${cwd}/src/components`
  const mockOptions = {
    cwd,
    componentsJson: true,
    repo: 'test-repo',
    owner: 'test-owner',
    getRelativeFile: vi.fn().mockReturnValue(['test/*.ts']),
  }
  const { add, init } = createInstance(mockOptions)

  beforeEach(async () => {
    vol.mkdirSync(cwd, { recursive: true })
    vol.mkdirSync(componentsPath, { recursive: true })
    await init()
  })

  it('should add component to specified directory', async () => {
    expect(fs.existsSync(`${cwd}/components.json`)).toBe(true)
    await add({
      components: ['button@1.0.0'],
      overwrite: true,
    })

    expect(fs.existsSync(`${componentsPath}/button.ts`)).toBe(true)
    expect(fs.existsSync(`${componentsPath}/button.type.ts`)).toBe(true)
    const result = fs.readFileSync(`${cwd}/components.json`, 'utf-8')
    expect(result).toMatchInlineSnapshot(`
      "{
        "components": {
          "button": "1.0.0"
        }
      }"
    `)
    const fileContent = fs.readFileSync(`${cwd}/src/components/button.ts`, 'utf-8')
    expect(fileContent).toBe('mocked file content')
    const typeFileContent = fs.readFileSync(`${cwd}/src/components/button.type.ts`, 'utf-8')
    expect(typeFileContent).toBe('mocked file content')
  })

  it('should transform file content', async () => {
    const transformFile = vi.fn().mockReturnValue('transformed file content')
    const { add } = createInstance({
      ...mockOptions,
      transformFile,
    })
    await add({
      components: ['button@1.0.0'],
      overwrite: true,
    })

    const fileContent = fs.readFileSync(`${cwd}/src/components/button.ts`, 'utf-8')
    expect(fileContent).toBe('transformed file content')
  })

  it('should read component info from components.json', async () => {
    const componentsJson = {
      components: {
        button: '1.0.0',
      },
    }
    await init({ extra: componentsJson })

    await add()

    expect(fs.existsSync(`${cwd}/src/components/button.ts`)).toBe(true)
    const fileContent = fs.readFileSync(`${cwd}/src/components/button.ts`, 'utf-8')
    expect(fileContent).toBe('mocked file content')
  })

  it('should not overwrite when file exists and overwrite is false', async () => {
    vol.fromJSON({
      '/test/src/components/button.ts': 'old content',
    })

    await add({
      components: ['button@1.0.0'],
      overwrite: false,
    })

    const content = fs.readFileSync(`${cwd}/src/components/button.ts`, 'utf-8')
    expect(content).toBe('old content')
  })

  it('should overwrite when file exists and overwrite is true', async () => {
    vol.fromJSON({
      '/test/src/components/button.ts': 'old content',
    })

    await add({
      components: ['button@latest'],
      overwrite: true,
    })

    expect(fs.existsSync(`${cwd}/src/components/button.ts`)).toBe(true)
    const fileContent = fs.readFileSync(`${cwd}/src/components/button.ts`, 'utf-8')
    expect(fileContent).toBe('mocked file content')
  })
})
