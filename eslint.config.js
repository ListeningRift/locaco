import rules from '@antfu/eslint-config'

export default rules({
  type: 'lib',
  typescript: true,
  ignores: ['**/test/out/**'],
})
