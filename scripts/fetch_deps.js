const request = require('request')
const os = require('os')
const path = require('path')
const fs = require('fs')
const { ensureDir, copy } = require('fs-extra')
const { exec } = require('child_process')
const unzipper = require('unzipper')
const Socks5ClientHttpsAgent = require('socks5-https-client/lib/Agent')
function fetchIndex (url) {
  return new Promise((resolve, reject) => {
    console.log(`Start Fetching: ${url}`)
    let option = {
      url: url,
      headers: {
        'User-Agent': 'request'
      }
    }
    withProxy(option)
    request(option, (err, resp, body) => {
      if (err) {
        reject(err)
      } else {
        try {
          resolve(JSON.parse(body))
        } catch (error) {
          console.error(`Failed to parse: ${body} err: ${error}`)
          reject(error)
        }
      }
    })
  })
}
const tmpDir = path.join(os.tmpdir(), 'electron-ssr-deps-fetch')
const copyDir = path.join(process.cwd(), 'src', 'lib')
async function getSocks2http () {
  const releaseIndex = 'https://api.github.com/repos/xVanTuring/socks2http-rs/releases/latest'
  let index = await fetchIndex(releaseIndex)
  const assets = index['assets']
  let withName = 'linux'
  switch (process.platform) {
    case 'win32':
      withName = 'windows'
      break
    case 'linux':
      break
    case 'darwin':
      withName = 'osx'
      break
    default:
      console.error('Unsupported system')
      return
  }
  let downloadPath = path.join(tmpDir, 'socks2http.zip')
  for (const asset of assets) {
    if (asset['name'].indexOf(withName) >= 0) {
      await downloadFile(asset['browser_download_url'], downloadPath)
      break
    }
  }
  await extractFile(downloadPath)
  let socks2httpName = 'socks2http'
  if (process.platform === 'win32') {
    socks2httpName += '.exe'
  }
  let copiedPath = path.join(copyDir, socks2httpName)
  await copy(path.join(tmpDir, socks2httpName), copiedPath)
  if (process.platform !== 'win32') {
    await new Promise((resolve, reject) => {
      console.log(`executing chmod +x ${copiedPath}`)
      exec(['chmod', '+x', copiedPath].join(' '), (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}
async function getSysProxy () {
  const releaseIndex = 'https://api.github.com/repos/xVanTuring/sysproxy/releases/latest'
  let index = await fetchIndex(releaseIndex)
  const assets = index['assets']
  let downloadPath = path.join(tmpDir, 'sysproxy.exe')
  for (const asset of assets) {
    if (asset['name'].indexOf('64') >= 0) {
      await downloadFile(asset['browser_download_url'], downloadPath)
      break
    }
  }
  let copiedPath = path.join(copyDir, 'sysproxy.exe')
  await copy(downloadPath, copiedPath)
}

function downloadFile (url, path) {
  return new Promise((resolve, reject) => {
    console.log(`Start Downloading: ${url}`)
    const file = fs.createWriteStream(path)
    let option = {
      url: url,
      header: {
        'User-Agent': 'request'
      }
    }
    withProxy(option)
    request(option).on('error', reject).pipe(file)
    file.on('close', () => {
      console.log('WRITE DONE!')
      resolve()
    })
  })
}
function getLibsodium () {
  // todo
}
function extractFile (path) {
  return new Promise((resolve, reject) => {
    console.log(`Start Unzipping ${path}`)
    fs.createReadStream(path).pipe(unzipper.Extract({ path: tmpDir }))
      .on('finish', resolve)
      .on('error', reject)
  })
}
let agent = null
function withProxy (option) {
  let proxy = process.env.http_proxy || process.env.all_proxy || process.env.fetch_proxy
  if (proxy) {
    if (proxy.startsWith('socks5://')) {
      console.log(`Using Socks5 Proxy ${proxy}`)
      if (agent == null) {
        let url = new (require('url').URL)(proxy)
        agent = new Socks5ClientHttpsAgent({
          socksHost: url.hostname,
          socksPort: parseInt(url.port, 10)
        })
      }
      option['agent'] = agent
      return
    }
    console.log(`Using proxy: ${proxy}`)
    option['proxy'] = proxy
  }
}

async function main () {
  await ensureDir(tmpDir)
  await getSocks2http()
  if (process.platform === 'win32') { await getSysProxy() }
}
try {
  main()
} catch (error) {
  console.error(error)
}
