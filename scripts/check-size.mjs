import { statSync } from 'fs'

const FILE = 'dist/flowwrite.html'
const LIMIT = 400 * 1024

try {
  const size = statSync(FILE).size
  const kb = (size / 1024).toFixed(1)
  const percent = ((size / LIMIT) * 100).toFixed(0)

  console.log(`dist/flowwrite.html: ${size} bytes (${kb} KB)`)
  console.log(`${percent}% of 400 KB budget`)

  if (size > LIMIT) {
    console.error(
      `FAIL: exceeds 400 KB budget by ${(size - LIMIT).toLocaleString()} bytes`,
    )
    process.exit(1)
  }
  console.log('OK: within budget')
} catch (err) {
  console.error(`FAIL: cannot stat ${FILE}: ${err.message}`)
  process.exit(1)
}
