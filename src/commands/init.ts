import type { Command, CommandArgs, CreateInstanceOptions } from '@/utils/types'
import { updateComponentsJson } from '@/utils/utils'
import chalk from 'chalk'

export interface InitArgs extends CommandArgs {
  /**
   * extra properties that need to be initialized
   */
  extra?: Record<string, any>
}

/**
 * Create `init` command
 *
 * @param instanceOptions create instance options
 * @returns `init` command
 */
export function createInit(instanceOptions: Required<CreateInstanceOptions>): Command<InitArgs> {
  const {
    cwd,
    componentsJson,
  } = instanceOptions

  return async (args?: InitArgs) => {
    const {
      extra = {},
      log = true,
    } = args || {}

    const obj = {
      components: {},
    }
    const content = Object.assign({}, obj, extra)
    await updateComponentsJson(content, cwd, componentsJson)
    if (log) {
      // eslint-disable-next-line no-console
      console.log(chalk.green.bold('\nSuccess!'))
    }
  }
}
