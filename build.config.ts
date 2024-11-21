import { resolve } from 'node:path'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index.ts',
  ],
  alias: {
    '@': resolve(__dirname, 'src'),
  },
  declaration: true,
  rollup: {
    emitCJS: false,
  },
  outDir: 'dist',
  failOnWarn: false,
})
