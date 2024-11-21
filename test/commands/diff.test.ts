import { createInstance } from '@/index'
import { vol } from 'memfs'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs')
vi.mock('node:fs/promises')
vi.mock('node-fetch', () => ({
  default: vi.fn(async (url: string) => {
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
      if (url.includes('1.0.0')) {
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
      else {
        return {
          ok: true,
          json: () => Promise.resolve({
            tree: [
              {
                path: 'test/button.ts',
              },
            ],
          }),
        }
      }
    }

    return {
      ok: true,
      text: () => Promise.resolve(`export function Button() {
return (
  <button className="new-class">
    Click me
  </button>
)
}`),
    }
  }),
}))

beforeEach(() => {
  vol.reset()
})

afterAll(() => {
  vi.clearAllMocks()
})

describe('createDiff', () => {
  const cwd = '/test'
  const componentsPath = `${cwd}/src/components`
  const mockOptions = {
    cwd,
    componentsJson: true,
    repo: 'test-repo',
    owner: 'test-owner',
    getTag: (version: string) => version,
    getRelativeFile: vi.fn(() => {
      return ['test/*.ts']
    }),
    dir: 'src/components/locaco',
  }
  const { diff, init } = createInstance(mockOptions)

  beforeEach(async () => {
    vol.mkdirSync(cwd, { recursive: true })
    vol.mkdirSync(componentsPath, { recursive: true })
    await init()
  })

  it('should throw error when components.json is not used and oldVersion is not provided', async () => {
    const { diff } = createInstance({
      ...mockOptions,
      componentsJson: false,
    })

    await expect(diff({
      component: 'button@2.0.0',
    })).rejects.toThrow('Old version is required when `components.json` is not used.')
  })

  it('should diff component with version from components.json', async () => {
    const componentsJson = {
      components: {
        button: '1.0.0',
      },
    }
    await init({ extra: componentsJson })

    vol.fromJSON({
      '/test/src/components/locaco/button.ts': `export function Button() {
  return (
    <button className="old-class">
      Submit
    </button>
  )
}`,
      '/test/src/components/locaco/button.type.ts': `export type ButtonProps = {
  className: string
}`,
    })

    const mockStdout = vi.spyOn(process.stdout, 'write')
    await diff({
      component: 'button@latest',
    })

    expect(mockStdout).toHaveBeenCalled()
  })

  it('should diff component with specified old version', async () => {
    vol.fromJSON({
      '/test/src/components/locaco/button.ts': `export function Button() {
  return (
    <button className="old-class">
      Submit
    </button>
  )
}`,
      '/test/src/components/locaco/button.type.ts': `export type ButtonProps = {
  className: string
}`,
    })

    const mockStdout = vi.spyOn(process.stdout, 'write')
    await diff({
      component: 'button@2.0.0',
      oldVersion: '1.0.0',
    })

    expect(mockStdout).toHaveBeenCalled()
  })
})
