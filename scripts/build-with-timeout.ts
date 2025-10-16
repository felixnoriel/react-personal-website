import { spawn } from 'child_process'

const TIMEOUT_MS = 120000 // 120 seconds (2 minutes)

console.log('🔨 Starting build with 120s timeout...\n')
console.log('📊 Checking data file sizes...')
const { execSync } = require('child_process')
try {
  const sizes = execSync('ls -lh src/data/*.ts', { encoding: 'utf-8' })
  console.log(sizes)
} catch (e) {
  // ignore
}
console.log('🚀 Running vite build...\n')

const buildProcess = spawn('vite', ['build', '--logLevel', 'info'], {
  stdio: 'inherit',
  shell: true,
})

const timeout = setTimeout(() => {
  console.error('\n❌ Build timed out after 120 seconds!')
  console.error('This usually means:')
  console.error('  - Vite is stuck processing large files (blog.ts is 218KB)')
  console.error('  - Circular dependencies')
  console.error('  - Memory issue with large data files')
  console.error('  - Issue with CSS imports (lightbox styles)')
  console.error('\nKilling process...')
  buildProcess.kill('SIGTERM')
  setTimeout(() => buildProcess.kill('SIGKILL'), 1000) // Force kill if needed
  process.exit(1)
}, TIMEOUT_MS)

buildProcess.on('exit', (code) => {
  clearTimeout(timeout)
  if (code === 0) {
    console.log('\n✅ Build completed successfully!')
  } else {
    console.error(`\n❌ Build failed with code ${code}`)
    process.exit(code || 1)
  }
})

buildProcess.on('error', (error) => {
  clearTimeout(timeout)
  console.error('\n❌ Build error:', error)
  process.exit(1)
})
