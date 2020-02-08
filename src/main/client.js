import path from 'path'
import { execFile } from 'child_process'
// import treeKill from 'tree-kill'
import { dialog } from 'electron'
import { appConfig$ } from './data'
import { ensureHostPortValid } from './port'
import logger from './logger'
import { isConfigEqual } from '../shared/utils'
import { showNotification } from './notification'
import { toggleEnable } from './tray-handler'
import * as i18n from './locales'
const $t = i18n.default
let child

/**
 * 运行shell命令并写入到日志中
 * @param {*String} command 待执行的shell命令
 */
export function runCommand (command, params) {
  if (command && params.length) {
    const commandStr = `${command} ${params.join(' ')}`
    logger.info('run command: %s', commandStr.replace(/-k [\d\w]* /, '-k ****** '))
    child = execFile(command, params)
    logger.debug(`Python SSR start with pid: ${child.pid}`)
    child.stdout.on('data', logger.info)
    child.stderr.on('data', (error) => {
      error.split('\n').forEach(msg => {
        if (msg.indexOf('INFO') >= 0) {
          logger.info(msg)
        } else if (msg.indexOf('ERROR') >= 0) {
          logger.error(msg)
        } else if (msg.indexOf('WARNING') >= 0) {
          logger.warn(msg)
        } else {
          logger.info(msg)
        }
      })
    })
  }
}

/**
 * 运行ssr
 * @param {*Object} config ssr配置
 * @param {*String} ssrPath local.py的路径
 * @param {*[Number|String]} localPort 本地共享端口
 */
export async function run (appConfig) {
  const listenHost = appConfig.shareOverLan ? '0.0.0.0' : '127.0.0.1'
  // 先结束之前的
  await stop()
  try {
    await ensureHostPortValid(listenHost, appConfig.localPort || 1080)
    const config = appConfig.configs[appConfig.index]
    // 参数
    const params = [path.join(appConfig.ssrPath, 'local.py')]
    params.push('-s')
    params.push(config.server)
    params.push('-p')
    params.push(config.server_port)
    params.push('-k')
    params.push(config.password)
    params.push('-m')
    params.push(config.method)
    params.push('-O')
    params.push(config.protocol)
    if (config.protocolparam) {
      params.push('-G')
      params.push(config.protocolparam)
    }
    if (config.obfs) {
      params.push('-o')
      params.push(config.obfs)
    }
    if (config.obfsparam) {
      params.push('-g')
      params.push(config.obfsparam)
    }
    params.push('-b')
    params.push(listenHost)
    params.push('-l')
    params.push(appConfig.localPort || 1080)
    if (config.timeout) {
      params.push('-t')
      params.push(config.timeout)
    }
    runCommand('python', params)
  } catch (e) {
    logger.error('SSR Client Port Check failed, with error: ')
    logger.error(e)
    toggleEnable()
    dialog.showErrorBox($t('NOTI_PORT_TAKEN', { 'port': appConfig.localPort }), $t('NOTI_CHECK_PORT'))
  }
}

/**
 * 结束command的后台运行
 */
export function stop (force = false) {
  if (child && child.pid) {
    logger.log('Kill client')
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // 5m内如果还没有关掉仍然resolve
        if (child && !child.killed) {
          logger.error(`Process ${child.pid} may not shut down`)
          !force && showNotification($t('NOTI_PROCESS_CANT_KILL', { pid: child.pid }))
        }
        resolve()
      }, 5000)
      child.once('exit', (code) => {
        child = null
        if (timeout) {
          clearTimeout(timeout)
        }
        resolve()
      })
      child.kill()
    })
  }
  return Promise.resolve()
}

/**
 * 根据配置运行SSR命令
 * @param {Object} appConfig 应用配置
 */
export function runWithConfig (appConfig) {
  if (appConfig.ssrPath && appConfig.enable && appConfig.configs && appConfig.configs[appConfig.index]) {
    run(appConfig)
  }
}

// 监听配置变化
appConfig$.subscribe(data => {
  const [appConfig, changed, oldConfig] = data
  // 初始化
  if (changed.length === 0) {
    runWithConfig(appConfig)
  } else {
    if (changed.indexOf('enable') > -1) {
      if (appConfig.enable) {
        runWithConfig(appConfig)
      } else {
        stop()
      }
    } else if (appConfig.enable) {
      if (['ssrPath', 'index', 'localPort', 'shareOverLan'].some(key => changed.indexOf(key) > -1)) {
        runWithConfig(appConfig)
      }
      if (changed.indexOf('configs') > -1) {
        // configs被清空
        if (!appConfig.configs.length) {
          stop()
        } else if (!oldConfig.configs.length) {
          // configs由空到有
          runWithConfig(appConfig)
        } else if (!isConfigEqual(appConfig.configs[appConfig.index], oldConfig.configs[oldConfig.index])) {
          // 只有选中的配置发生改变时才重新运行
          runWithConfig(appConfig)
        }
      }
    }
  }
})
