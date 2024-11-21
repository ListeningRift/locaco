import type { Command, CommandArgs, ComponentInfo, CreateInstanceOptions } from '../utils/types'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { isString } from '@/utils/tools'
import { fetchFile, fetchTags, getAllFilesByPath, getLatestTag, getRepoUtils, importComponentsJson, updateComponentsJson, writeFile } from '@/utils/utils'
import chalk from 'chalk'

export interface AddArgs extends CommandArgs {
  /**
   * the components to be added
   * Support for append `@${version}` to the component name
   * to specify a separate version for the component,
   * with higher priority. If not version, use the `version` property.
   *
   * if empty, will use `components.json`.
   */
  components?: string[]
  /**
   * the version of the components to be added.
   *
   * @default `latest`
   */
  version?: string
  /**
   * whether to overwrite existing files.
   *
   * @default false
   */
  overwrite?: boolean
}

/**
 * Create `add` command
 *
 * @param instanceOptions create instance options
 * @returns `add` command
 */
export function createAdd(instanceOptions: Required<CreateInstanceOptions>): Command<AddArgs> {
  const {
    owner,
    repo,
    componentsJson,
    cwd,
    dir,
    getRelativeFile,
    getTag,
    isValidTag,
    transformFile,
  } = instanceOptions
  const { getDownloadUrl, getRepoTreeUrl, getRepoTagUrl } = getRepoUtils(owner, repo)

  return async (args?: AddArgs) => {
    const {
      overwrite = false,
      components = [],
      version = 'latest',
      log = true,
    } = args || {}

    const componentsWithVersion: ComponentInfo[] = []

    const config = componentsJson !== false ? await importComponentsJson(cwd, componentsJson) : undefined

    if (components.length === 0 && componentsJson !== false) {
      await Promise.all(
        Object.keys(config!.components).map(async (component) => {
          const componentName = component
          const componentVersion = config!.components[component]
          const tag = getTag(componentVersion)
          componentsWithVersion.push({
            component: componentName,
            relativeFile: await getAllFilesByPath(getRelativeFile(componentName, tag, config), getRepoTreeUrl(tag)),
            tag,
            version: componentVersion,
          })
        }),
      )
    }

    await Promise.all(
      components.map(async (component) => {
        const componentName = component.split('@')[0]
        const componentVersion = component.split('@')[1] || version
        const tag = componentVersion === 'latest' ? getLatestTag(await fetchTags(getRepoTagUrl()), isValidTag) : getTag(componentVersion)
        componentsWithVersion.push({
          component: componentName,
          relativeFile: await getAllFilesByPath(getRelativeFile(componentName, tag, config), getRepoTreeUrl(tag)),
          tag,
          version: componentVersion,
        })
      }),
    )

    const tasks: Promise<void>[] = []
    componentsWithVersion.forEach((componentWithVersion) => {
      const { relativeFile, tag } = componentWithVersion
      relativeFile.forEach((path) => {
        const fileName = path.split('/').pop()!
        const writePath = join(cwd, isString(dir) ? dir : dir(path), fileName)

        if (!overwrite && existsSync(writePath))
          return

        const downloadUrl = getDownloadUrl(tag, path)
        const writeTask = async (): Promise<void> => {
          const content = await fetchFile(downloadUrl)
          await writeFile(writePath, transformFile ? transformFile(path, tag, content) : content)
          if (log) {
            // eslint-disable-next-line no-console
            console.log(`Downloaded ${chalk.blue.bold(`${componentWithVersion.component}@${componentWithVersion.version}`)} ${chalk.gray(path)}.`)
          }
          componentsJson !== false && (config!.components[componentWithVersion.component] = componentWithVersion.version)
        }
        tasks.push(writeTask())
      })
    })
    await Promise.all(tasks)
    componentsJson !== false && (await updateComponentsJson(config!, cwd, componentsJson))
    if (log) {
      // eslint-disable-next-line no-console
      console.log(chalk.green.bold('\nSuccess!'))
    }
  }
}
