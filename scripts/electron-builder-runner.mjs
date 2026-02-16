import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const electronBuilderCli = require.resolve('electron-builder/out/cli/cli.js')
const args = process.argv.slice(2)

const child = spawn(process.execPath, [electronBuilderCli, ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    npm_config_user_agent: 'traversal',
  },
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})

child.on('error', (error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to run electron-builder:', error)
  process.exit(1)
})
