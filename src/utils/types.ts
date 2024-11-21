import type { AddArgs } from '@/commands/add'
import type { DiffArgs } from '@/commands/diff'
import type { InitArgs } from '@/commands/init'

/**
 * type of components.json
 */
export interface ComponentsJson {
  [key: string]: any
  /**
   * components with version
   */
  components: Record<string, string>
}

/**
 * the options of create a new instance
 */
export interface CreateInstanceOptions {
  /**
   * source repo name
   */
  repo: string
  /**
   * source repo owner
   */
  owner: string
  /**
   * the working directory. defaults to the current directory.
   */
  cwd?: string
  /**
   * the components directory
   * @default `src/components`
   */
  dir?: string | ((filePath: string) => string)
  /**
   * whether to use `components.json`
   * @default true
   */
  componentsJson?: boolean | string
  /**
   * get the tag name by version
   * if not set, will use `repo@${version}`
   *
   * @param version the version specified by user. if not specified, will be `latest`
   * @returns the tag name
   */
  getTag?: (version: string) => string
  /**
   * whether the tag is valid
   * determine if the tag is a version tag, used to identify which tag is `latest`
   *
   * @param tag the tag name
   * @returns whether the tag is valid
   */
  isValidTag?: (tag: string) => boolean
  /**
   * get the relative path of the files which will be downloaded
   *
   * @param components the components specified by user
   * @returns the relative path of the files which will be downloaded
   */
  getRelativeFile: (component: string, tag: string, componentsJson?: ComponentsJson) => string[]
  /**
   * transform the file content
   *
   * @param filePath the file path
   * @param tag the tag
   * @param fileContent the file content
   * @returns the transformed file content
   */
  transformFile?: (filePath: string, tag: string, fileContent: string) => string
}

/**
 * base type of the command arguments
 */
export interface CommandArgs {
  /**
   * whether to log
   *
   * @default true
   */
  log?: boolean
}

export type Command<T extends CommandArgs = CommandArgs> = (args?: T) => Promise<void>

export interface LocacoInstance {
  /**
   * init components.json
   */
  init: Command<InitArgs>
  /**
   * add components to project
   */
  add: Command<AddArgs>
  /**
   * diff two versions of components
   */
  diff: Command<DiffArgs>
}

/**
 * component info
 */
export interface ComponentInfo {
  /**
   * component name
   */
  component: string
  /**
   * relative files of the component
   */
  relativeFile: ReturnType<CreateInstanceOptions['getRelativeFile']>
  /**
   * tag of the component download
   */
  tag: string
  /**
   * version of the component download
   */
  version: string
}

/**
 * Tree node of the repo
 */
export interface RepoTreeNode {
  path: string
  url: string
  type: 'blob' | 'tree'
  size: number
}
