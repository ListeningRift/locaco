import type { RepoTreeNode } from './types'
import globToRegExp from 'glob-to-regexp'

/**
 * is string
 */
export function isString(value: any): value is string {
  return typeof value === 'string'
}

/**
 * filter tree nodes by path
 *
 * @param treeNodes tree nodes
 * @param pattern path to filter
 * @returns filtered tree nodes
 */
export async function filterTreeNodeByPath(treeNodes: RepoTreeNode[], pattern: string): Promise<RepoTreeNode[]> {
  const filterPattern = globToRegExp(pattern)
  return treeNodes.filter((node) => {
    return filterPattern.test(node.path)
  })
}
