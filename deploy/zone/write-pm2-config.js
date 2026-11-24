// Runs on the server (`node - <settings JSON>`, piped in by deploy.sh). Writes the PM2 files of the API and the
// worker, with secrets generated here so they never leave the server.
//
// The env of an existing file is the source of truth: values edited on the server (deploy/zone/edit-env.sh),
// and settings added there, are kept. Only the settings that come from zone.env (address, path, database) are
// overwritten, and defaults fill in settings that are missing.
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const s = JSON.parse(process.argv[2])
const dir = path.join(s.remoteHome, 'prokathub')
const apiFile = path.join(dir, 'api.pm2.json')
const workerFile = path.join(dir, 'worker.pm2.json')

const read = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).apps[0] : undefined)
const oldApiApp = read(apiFile)
const oldWorkerApp = read(workerFile)
const oldApi = oldApiApp?.env ?? {}
const oldWorker = oldWorkerApp?.env ?? {}

// Seed passwords need upper case, lower case and a digit.
const password = () => 'Pk' + crypto.randomBytes(9).toString('hex') + '7'
// Connection string values with ; " ' = or spaces must be quoted, with " doubled inside.
const quote = (value) => (/[;"'=\s]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value)

// Used only when the setting isn't in the file yet. A seed password set to "" turns that account off.
const apiDefaults = {
  ASPNETCORE_ENVIRONMENT: 'Production',
  DB_PASSWORD: '__SET_DB_PASSWORD__',
  Database__MigrateOnStartup: 'true',
  Jwt__SigningKey: crypto.randomBytes(48).toString('base64'),
  Seed__DemoData: 'true',
  Seed__Accounts__Admin__Password: password(),
  Seed__Accounts__Staff__Password: password(),
  Seed__Accounts__Customer__Password: password(),
  Seed__Accounts__Service__Password: password(),
}
const api = { ...apiDefaults, ...oldApi }
// Always from zone.env.
Object.assign(api, {
  ASPNETCORE_URLS: `http://${s.appIp}:${s.appPort}`,
  PathBase: s.basePath,
  ConnectionStrings__Default:
    `Server=${s.dbHost};Port=3306;Database=${s.dbName};User=${s.dbUser};Password=${quote(api.DB_PASSWORD)}`,
  Database__ServerVersion: s.dbServerVersion,
  Cors__AllowedOrigins__0: s.siteOrigin,
})

const workerDefaults = {
  DOTNET_ENVIRONMENT: 'Production',
  Api__Email: 'service@prokathub.test',
  Overdue__Interval: '01:00:00',
}
const worker = { ...workerDefaults, ...oldWorker }
Object.assign(worker, {
  // The API also answers without the path base, so the worker talks to it directly.
  Api__BaseUrl: `http://${s.appIp}:${s.appPort}`,
  // The worker logs in as the Service account the API seeds.
  Api__Password: api.Seed__Accounts__Service__Password,
})

const app = (old, name, folder, script, env, memory) => ({
  apps: [
    {
      name,
      cwd: path.join(dir, folder),
      script: path.join(dir, folder, script),
      interpreter: 'none',
      env,
      max_memory_restart: old?.max_memory_restart ?? memory,
    },
  ],
})

fs.mkdirSync(dir, { recursive: true })
for (const [file, config] of [
  [apiFile, app(oldApiApp, 'prokathub-api', 'api', 'ProkatHub.Api', api, '400M')],
  [workerFile, app(oldWorkerApp, 'prokathub-worker', 'worker', 'ProkatHub.Worker', worker, '150M')],
]) {
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 })
  fs.chmodSync(file, 0o600)
}

console.log(api.DB_PASSWORD === '__SET_DB_PASSWORD__' ? 'needs-db-password' : 'ready')
