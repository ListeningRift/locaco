import type { ComponentsJson, CreateInstanceOptions, RepoTreeNode } from './types'
import { readFile, writeFile as write } from 'node:fs/promises'
import { join } from 'node:path'
import fetch from 'node-fetch'
import { filterTreeNodeByPath, isString } from './tools'

/**
 * utils function to get information from github
 *
 * @param owner repo owner
 * @param repoName repo name
 * @returns utils to get information from github
 */
export function getRepoUtils(owner: string, repoName: string): {
  getRepoTreeUrl: (tag: string) => string
  getRepoTagUrl: () => string
  getDownloadUrl: (tag: string, path: string) => string
} {
  return {
    getRepoTreeUrl: (tag: string) => `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/git/trees/${encodeURIComponent(tag)}?recursive=1`,
    getRepoTagUrl: () => `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/tags`,
    getDownloadUrl: (tag: string, path: string) => `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/${encodeURIComponent(tag)}/${path}`,
  }
}

/**
 * get repo tree nodes by github url
 *
 * @param url url of github repo tree node
 * @returns tree nodes
 */
export async function fetchTree(url: string): Promise<RepoTreeNode[]> {
  let treeNodes: RepoTreeNode[] = []
  try {
    const response = await fetch(url)
    const list = (await response.json()) as { tree: RepoTreeNode[] }
    treeNodes = list.tree
  }
  catch (err: any) {
    throw new Error(`Fetch repo error: ${err.message}`)
  }

  return treeNodes
}

/**
 * get all files by relative path glob pattern
 *
 * @param relativeFiles relative path glob pattern
 * @param url url of github repo tree node
 * @returns all files
 */
export async function getAllFilesByPath(relativeFiles: string[], url: string): Promise<string[]> {
  const files: string[] = []
  const treeNodes = await fetchTree(url)
  await Promise.all(relativeFiles.map(async (path) => {
    const filteredNodes = await filterTreeNodeByPath(treeNodes, path)
    files.push(...filteredNodes.map(node => node.path))
  }))
  return files
}

/**
 * fetch tags from github
 *
 * @param url url of github tags
 * @returns tags
 */
export async function fetchTags(url: string): Promise<string[]> {
  const response = await fetch(url)
  const list = (await response.json()) as { name: string }[]
  return list.map(item => item.name)
}

/**
 * get the latest tag
 *
 * @param tags tags
 * @param isValidTag whether the tag is valid
 * @returns the latest tag
 */
export function getLatestTag(tags: string[], isValidTag: ((tag: string) => boolean) | undefined): string {
  return tags.find(tag => isValidTag ? isValidTag(tag) : true) || tags[0]
}

/**
 * get file content by github url
 *
 * @param url file url of github file
 * @returns file content
 */
export async function fetchFile(url: string): Promise<string> {
  let text = ''
  try {
    const response = await fetch(url)
    text = await response.text()
  }
  catch (err: any) {
    throw new Error(`Fetch file error: ${err.message}`)
  }

  return text
}

/**
 * write file content to file
 *
 * @param path file path
 * @param content file content
 */
export async function writeFile(path: string, content: string): Promise<void> {
  try {
    await write(path, content)
  }
  catch (err: any) {
    throw new Error(`Write file error: ${err.message}`)
  }
}

/**
 * get information from `components.json`
 *
 * @param cwd current working directory
 * @param componentsJson components.json path
 */
export async function importComponentsJson(cwd: string, componentsJson: CreateInstanceOptions['componentsJson']): Promise<ComponentsJson> {
  const componentsJsonPath = join(cwd, isString(componentsJson) ? componentsJson : 'components.json')

  try {
    const content = await readFile(componentsJsonPath, 'utf-8')
    return JSON.parse(content)
  }
  catch (err: any) {
    throw new Error(`Import config error: ${err.message}\nPlease check the file or run "init".`)
  }
}

/**
 * update components.json
 *
 * @param newContent new config that needs to update
 * @param cwd current working directory
 * @param componentsJson components.json path
 */
export async function updateComponentsJson(newContent: Partial<ComponentsJson>, cwd: string, componentsJson: CreateInstanceOptions['componentsJson']): Promise<void> {
  const componentsJsonPath = join(cwd, isString(componentsJson) ? componentsJson : 'components.json')

  try {
    await writeFile(componentsJsonPath, JSON.stringify(newContent, null, 2))
  }
  catch (err: any) {
    throw new Error(err.message)
  }
}
