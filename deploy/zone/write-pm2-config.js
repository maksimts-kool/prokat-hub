// Runs on the server (`node - <settings JSON>`, piped in by deploy.sh). Writes the PM2 files of the API and the
// worker once, with secrets generated here so they never leave the server. Existing files are kept as they are,
// except that settings from zone.env (address, paths, database name) are refreshed.
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const s = JSON.parse(process.argv[2])
const dir = path.join(s.remoteHome, 'prokathub')
const apiFile = path.join(dir, 'api.pm2.json')
const workerFile = path.join(dir, 'worker.pm2.json')

const read = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).apps[0].env : {})
const oldApi = read(apiFile)
const oldWorker = read(workerFile)

// Seed passwords need upper case, lower case and a digit.
const password = () => 'Pk' + crypto.randomBytes(9).toString('hex') + '7'
const keep = (value, make) => value || make()

const dbPassword = keep(oldApi.DB_PASSWORD, () => '__SET_DB_PASSWORD__')
const servicePassword = keep(oldApi.Seed__Accounts__Service__Password, password)

// Connection string values with ; " ' = or spaces must be quoted, with " doubled inside.
const quote = (value) => (/[;"'=\s]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value)

const apiEnv = {
  ASPNETCORE_ENVIRONMENT: 'Production',
  ASPNETCORE_URLS: `http://${s.appIp}:${s.appPort}`,
  PathBase: s.basePath,
  DB_PASSWORD: dbPassword,
  ConnectionStrings__Default:
    `Server=${s.dbHost};Port=3306;Database=${s.dbName};User=${s.dbUser};Password=${quote(dbPassword)}`,
  Database__MigrateOnStartup: 'true',
  Database__ServerVersion: s.dbServerVersion,
  Jwt__SigningKey: keep(oldApi.Jwt__SigningKey, () => crypto.randomBytes(48).toString('base64')),
  Cors__AllowedOrigins__0: s.siteOrigin,
  Seed__DemoData: 'true',
  Seed__Accounts__Admin__Password: keep(oldApi.Seed__Accounts__Admin__Password, password),
  Seed__Accounts__Staff__Password: keep(oldApi.Seed__Accounts__Staff__Password, password),
  Seed__Accounts__Customer__Password: keep(oldApi.Seed__Accounts__Customer__Password, password),
  Seed__Accounts__Service__Password: servicePassword,
}

const workerEnv = {
  DOTNET_ENVIRONMENT: 'Production',
  // The API also answers without the path base, so the worker talks to it directly.
  Api__BaseUrl: `http://${s.appIp}:${s.appPort}`,
  Api__Email: oldWorker.Api__Email || 'service@prokathub.test',
  Api__Password: servicePassword,
  Overdue__Interval: oldWorker.Overdue__Interval || '01:00:00',
}

const app = (name, folder, script, env, memory) => ({
  apps: [
    {
      name,
      cwd: path.join(dir, folder),
      script: path.join(dir, folder, script),
      interpreter: 'none',
      env,
      max_memory_restart: memory,
    },
  ],
})

fs.mkdirSync(dir, { recursive: true })
for (const [file, config] of [
  [apiFile, app('prokathub-api', 'api', 'ProkatHub.Api', apiEnv, '400M')],
  [workerFile, app('prokathub-worker', 'worker', 'ProkatHub.Worker', workerEnv, '150M')],
]) {
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 })
  fs.chmodSync(file, 0o600)
}

console.log(dbPassword === '__SET_DB_PASSWORD__' ? 'needs-db-password' : 'ready')
