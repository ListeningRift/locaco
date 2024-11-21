import type { Command, CommandArgs, CreateInstanceOptions } from '@/utils/types'
import type { Change } from 'diff'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { isString } from '@/utils/tools'
import { fetchFile, fetchTags, getAllFilesByPath, getLatestTag, getRepoUtils, importComponentsJson } from '@/utils/utils'
import chalk from 'chalk'
import { diffLines } from 'diff'

/**
 * Print diff content
 *
 * @param diff diff content
 */
function printDiffContent(diff: Change[]): void {
  diff.forEach((part) => {
    if (part) {
      if (part.added) {
        return process.stdout.write(chalk.green(part.value))
      }
      if (part.removed) {
        return process.stdout.write(chalk.red.strikethrough(part.value))
      }

      return process.stdout.write(part.value)
    }
  })
  process.stdout.write('\n\n')
}

export interface DiffArgs extends CommandArgs {
  /**
   * Component name that needs to be diffed.
   * Supports version specifier with `@` prefix.
   */
  component: string
  /**
   * Old version of the component.
   * If not specified, will use the version specified in `components.json`.
   * If `components.json` is not used, must be specified.
   */
  oldVersion?: string
}

/**
 * Create `diff` command
 *
 * @param instanceOptions create instance options
 * @returns `diff` command
 */
export function createDiff(instanceOptions: Required<CreateInstanceOptions>): Command<DiffArgs> {
  const {
    componentsJson,
    cwd,
    owner,
    repo,
    dir,
    getRelativeFile,
    getTag,
    isValidTag,
    transformFile,
  } = instanceOptions
  const { getDownloadUrl, getRepoTreeUrl, getRepoTagUrl } = getRepoUtils(owner, repo)

  return async (args?: DiffArgs) => {
    const {
      component,
      log = true,
    } = args || { component: '' }
    let { oldVersion } = args || { oldVersion: '' }

    if (componentsJson === false && !oldVersion) {
      throw new Error('Old version is required when `components.json` is not used.')
    }

    const config = componentsJson !== false ? await importComponentsJson(cwd, componentsJson) : undefined
    const componentName = component.split('@')[0]
    const newVersion = component.split('@')[1] || 'latest'

    if (!oldVersion) {
      oldVersion = config!.components[componentName]
    }

    const newTag = newVersion === 'latest' ? getLatestTag(await fetchTags(getRepoTagUrl()), isValidTag) : getTag(newVersion)
    const newRelativeFile = getRelativeFile(componentName, newTag, config)
    const oldTag = getTag(oldVersion)
    const oldRelativeFile = getRelativeFile(componentName, oldTag, config)

    const diffContent: {
      name: string
      diff: Change[]
    }[] = await Promise.all(
      (await getAllFilesByPath(newRelativeFile, getRepoTreeUrl(newTag)))
        .map(async (path) => {
          const fileName = path.split('/').pop()!
          const writePath = join(cwd, isString(dir) ? dir : dir(path), fileName)
          const newDownloadUrl = getDownloadUrl(newTag, path)
          const oldFileContent = await readFile(writePath, 'utf-8')
          const newFileContent = await fetchFile(newDownloadUrl)
          return {
            name: path,
            diff: diffLines(oldFileContent, transformFile ? transformFile(path, newTag, newFileContent) : newFileContent),
          }
        })
        .concat(
          (await getAllFilesByPath(oldRelativeFile, getRepoTreeUrl(oldTag)))
            .filter(path => !newRelativeFile.includes(path))
            .map(async (path) => {
              const fileName = path.split('/').pop()!
              const writePath = join(cwd, isString(dir) ? dir : dir(path), fileName)
              const oldFileContent = await readFile(writePath, 'utf-8')
              return {
                name: path,
                diff: diffLines(oldFileContent, ''),
              }
            }),
        ),
    )

    if (log) {
      diffContent.forEach((item) => {
        process.stdout.write(`${chalk.blue.bold(item.name)}\n`)
        printDiffContent(item.diff)
      })
    }
  }
}
