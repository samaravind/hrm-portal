// Kills any process listening on the given port before dev server starts
const { execSync } = require('child_process')
const PORT = process.argv[2] || 3000

try {
  const result = execSync(
    `(Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue).OwningProcess | Sort-Object -Unique`,
    { encoding: 'utf8', shell: 'powershell.exe' }
  ).trim()

  if (result) {
    const pids = result.split('\n').map(p => p.trim()).filter(p => p && p !== '0')
    pids.forEach((pid) => {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore', shell: 'powershell.exe' })
        console.log(`✓ Killed process ${pid} holding port ${PORT}`)
      } catch (_) {}
    })
  } else {
    console.log(`✓ Port ${PORT} is free`)
  }
} catch (_) {
  console.log(`✓ Port ${PORT} is free`)
}
