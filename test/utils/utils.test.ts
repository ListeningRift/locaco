import { fetchFile, fetchTags, fetchTree, getLatestTag, getRepoUtils, importComponentsJson, updateComponentsJson } from '@/utils/utils'
import { fs, vol } from 'memfs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs')
vi.mock('node:fs/promises')

beforeEach(() => {
  vol.reset()
})

describe.concurrent('getRepoUtils', () => {
  const owner = 'testOwner'
  const repoName = 'testRepo'
  const utils = getRepoUtils(owner, repoName)

  const tag = 'testRepo@1.0.0'

  it('should return correct getRepoTreeUrl', () => {
    const expectedUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${encodeURIComponent(tag)}?recursive=1`

    expect(utils.getRepoTreeUrl(tag)).toEqual(expectedUrl)
  })

  it('should return correct getRepoTagUrl', () => {
    const expectedUrl = `https://api.github.com/repos/${owner}/${repoName}/tags`

    expect(utils.getRepoTagUrl()).toEqual(expectedUrl)
  })

  it('should return correct getDownloadUrl', () => {
    const path = 'packages/components/testComponent/testComponent.ts'

    const expectedUrl = `https://raw.githubusercontent.com/${owner}/${repoName}/${encodeURIComponent(tag)}/${path}`

    expect(utils.getDownloadUrl(tag, path)).toEqual(expectedUrl)
  })
})

describe.sequential('fetchFile', () => {
  it('should fetch file content successfully - real newwork', async () => {
    const testUrl = 'https://vuejs.org/'
    const result = await fetchFile(testUrl)
    expect(result).toMatchSnapshot()
  })

  it('should throw error when fetch fails - mocked', async () => {
    await expect(fetchFile('testUrl'))
      .rejects
      .toThrow('Fetch file error: Invalid URL')
  })
})

describe.sequential('fetchTree', () => {
  it('should throw error when fetch fails', async () => {
    await expect(fetchTree('testUrl'))
      .rejects
      .toThrow('Fetch repo error')
  })
})

describe.sequential('getAllFilesByPath', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('should get all files by path pattern', async () => {
    const mockTreeNodes = [
      { path: 'src/button/button.ts', type: 'blob', url: '', size: 0 },
      { path: 'src/button/button.test.ts', type: 'blob', url: '', size: 0 },
      { path: 'src/input/input.ts', type: 'blob', url: '', size: 0 },
    ]

    vi.doMock('node-fetch', () => ({
      default: () => Promise.resolve({
        json: () => Promise.resolve({ tree: mockTreeNodes }),
      }),
    }))

    const { getAllFilesByPath } = await import('../../src/utils/utils')
    const files = await getAllFilesByPath(['src/button/*.ts'], 'test-url')

    expect(files).toEqual([
      'src/button/button.ts',
      'src/button/button.test.ts',
    ])
  })

  it('should return empty array when no files match pattern', async () => {
    const mockTreeNodes = [
      { path: 'src/input/input.ts', type: 'blob', url: '', size: 0 },
    ]

    vi.doMock('node-fetch', () => ({
      default: () => Promise.resolve({
        json: () => Promise.resolve({ tree: mockTreeNodes }),
      }),
    }))

    const { getAllFilesByPath } = await import('../../src/utils/utils')
    const files = await getAllFilesByPath(['src/button/*.ts'], 'test-url')

    expect(files).toEqual([])
  })

  it('should handle multiple patterns', async () => {
    const mockTreeNodes = [
      { path: 'src/button/button.ts', type: 'blob', url: '', size: 0 },
      { path: 'src/input/input.ts', type: 'blob', url: '', size: 0 },
    ]

    vi.doMock('node-fetch', () => ({
      default: () => Promise.resolve({
        json: () => Promise.resolve({ tree: mockTreeNodes }),
      }),
    }))

    const { getAllFilesByPath } = await import('../../src/utils/utils')
    const files = await getAllFilesByPath(['src/button/*.ts', 'src/input/*.ts'], 'test-url')

    expect(files).toEqual([
      'src/button/button.ts',
      'src/input/input.ts',
    ])
  })
})

describe('getLatestTag', () => {
  it('should return first tag when no validator provided', () => {
    const tags = ['1.0.0', '2.0.0', '3.0.0']

    const result = getLatestTag(tags, undefined)

    expect(result).toBe('1.0.0')
  })

  it('should return first valid tag when validator provided', () => {
    const tags = ['1.0.0', '2.0.0', '3.0.0']
    const isValidTag = (tag: string) => tag === '2.0.0'

    const result = getLatestTag(tags, isValidTag)

    expect(result).toBe('2.0.0')
  })

  it('should return first tag when no valid tags found', () => {
    const tags = ['1.0.0', '2.0.0', '3.0.0']
    const isValidTag = () => false

    const result = getLatestTag(tags, isValidTag)

    expect(result).toBe('1.0.0')
  })
})

describe.sequential('components json', () => {
  it('should import components.json successfully', async () => {
    const componentsJson = {
      components: {
        button: '1.0.0',
      },
    }

    vol.fromJSON({
      '/test/components.json': JSON.stringify(componentsJson),
    })

    const result = await importComponentsJson('/test', 'components.json')

    expect(result).toEqual(componentsJson)
  })

  it('should throw error when import fails', async () => {
    await expect(importComponentsJson('/test', 'invalid.json'))
      .rejects
      .toThrow('Import config error')
  })

  it('should update components.json successfully', async () => {
    const cwd = '/test'
    const componentsJsonPath = 'components.json'
    const newContent = {
      components: {
        button: '2.0.0',
      },
    }

    vol.mkdirSync(cwd, { recursive: true })
    await updateComponentsJson(newContent, cwd, true)

    const result = fs.readFileSync(`${cwd}/${componentsJsonPath}`, 'utf-8')
    expect(result).toMatchInlineSnapshot(`
      "{
        "components": {
          "button": "2.0.0"
        }
      }"
    `)
  })

  it('should throw error when update fails', async () => {
    await expect(updateComponentsJson({}, '/test', true))
      .rejects
      .toThrow('Write file error')
  })
})
