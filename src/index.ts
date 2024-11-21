import type { CreateInstanceOptions, LocacoInstance } from './utils/types'
import process from 'node:process'
import { createAdd } from './commands/add'
import { createDiff } from './commands/diff'
import { createInit } from './commands/init'

/**
 * TODO: query all components
 * TODO: plugin: diff can output html that can merge specific part to current file
 */

/**
 * Create locaco instance
 * @param options - instance options
 * @returns locaco instance
 */
export function createInstance(options: CreateInstanceOptions): LocacoInstance {
  const mergedOptions = Object.assign({}, {
    cwd: process.cwd(),
    dir: 'src/components',
    componentsJson: true,
    getTag: (version: string) => {
      return `${options.repo}@${version}`
    },
  }, options) as Required<CreateInstanceOptions>

  return {
    init: createInit(mergedOptions),
    add: createAdd(mergedOptions),
    diff: createDiff(mergedOptions),
  }
}

export type { Command, CreateInstanceOptions, LocacoInstance } from '@/utils/types'
export { importComponentsJson, updateComponentsJson } from '@/utils/utils'
