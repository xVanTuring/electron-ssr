const pkg = require('./package.json')
const os = require('os')
const platform = os.platform()
const extraFiles = []
let files = [
    '**/*',
    '!imgs/*.svg',
    '!fonts/*.eot',
    '!fonts/*.ttf',
]
const macImages = [
    '!static/enabled@(Template|Highlight)?(@2x).png',
    '!static/pac@(Template|Highlight)?(@2x).png',
    '!static/global@(Template|Highlight)?(@2x).png'
]
const winImages = [
    '!static/enabled?(@2x).png',
    '!static/pac?(@2x).png',
    '!static/global?(@2x).png'
]
switch (platform) {
    case 'darwin':
        extraFiles.push({ from: 'src/lib/proxy_conf_helper', to: './' })
        files = files.concat(winImages)
        break
    case 'win32':
        extraFiles.push({ from: 'src/lib/sysproxy.exe', to: './' })
        files = files.concat(macImages)
        break
    case 'linux':
        files = files.concat(macImages)
}
module.exports = {
    pluginOptions: {
        electronBuilder: {
            mainProcessFile: 'src/main/index.js',
            mainProcessWatch: ['src/main/**'],
            builderOptions: {
                productName: 'electron-ssr',
                appId: 'me.erguotou.ssr',
                artifactName: '${productName}-${version}.${ext}',
                copyright: 'Copyright © 2020 The Electron-SSR Authors',
                files,
                extraFiles,
                linux: {
                    icon: 'build/icons',
                    category: 'Development',
                    synopsis: pkg.description,
                    target: [
                        'deb',
                        'rpm',
                        'tar.gz',
                        'pacman',
                        'appImage'
                    ],
                    desktop: {
                        Name: 'electron-ssr',
                        Encoding: 'UTF-8',
                        Type: 'Application',
                        Comment: pkg.description,
                        StartupWMClass: 'electron-ssr'
                    }
                },
                dmg: {
                    contents: [
                        {
                            x: 410,
                            y: 150,
                            type: 'link',
                            path: '/Applications'
                        },
                        {
                            x: 130,
                            y: 150,
                            type: 'file'
                        }
                    ]
                },
                mac: {
                    icon: 'build/icons/icon.icns',
                    category: 'public.app-category.developer-tools',
                    target: [
                        'zip',
                        'dmg'
                    ],
                    extendInfo: {
                        LSUIElement: 'YES'
                    }
                },
            }
        },
    },
    chainWebpack: (config) => {
        config.entry("app")
            .clear()
            .add("./src/renderer/main.js")
            .end()

    }
}