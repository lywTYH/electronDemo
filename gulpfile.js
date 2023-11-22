import {exec} from 'child_process';
import {deleteAsync} from 'del';
import {build as electronBuild} from 'electron-builder';
import gulp from 'gulp';
import {build} from 'vite';
import {getVersion} from './version/getVersion.mjs';

/** @type 'production' | 'development'' */
const mode = (process.env.MODE = process.env.MODE || 'development');
/** @type {import('vite').LogLevel} */
const logLevel = 'warn';

const buildPath = 'dist';

gulp.task('clean', () => deleteAsync([buildPath]));

/** @param {'main'|'preload'|'renderer'} type */
function viteBuild(type) {
  return build({
    mode,
    logLevel,
    configFile: `packages/${type}/vite.config.js`,
  });
}
gulp.task('build:main', () => viteBuild('main'));
gulp.task('build:preload', () => viteBuild('preload'));
gulp.task('build:renderer', () => viteBuild('renderer'));
gulp.task('electron:build', () => {
  return electronBuild({
    config: {
      productName: 'pName',
      appId: 'com.leon.xxxxx',
      // copyright
      asar: false,
      directories: {
        output: buildPath,
      },
      nsis: {
        oneClick: false, // 是否一键安装
        allowElevation: true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
        allowToChangeInstallationDirectory: true, // 允许修改安装目录
        installerIcon: './build/icons/aaa.ico', // 安装图标
        uninstallerIcon: './build/icons/bbb.ico', //卸载图标
        installerHeaderIcon: './build/icons/aaa.ico', // 安装时头部图标
        createDesktopShortcut: true, // 创建桌面图标
        createStartMenuShortcut: true, // 创建开始菜单图标
        shortcutName: 'xxxx', // 图标名称
        include: 'build/script/installer.nsh', // 包含的自定义nsis脚本
      },
      publish: [
        {
          provider: 'generic', // 服务器提供商 也可以是GitHub等等
          url: 'http://xxxxx/', // 服务器地址
        },
      ],
      files: ['packages/**/dist/**'],
      extraMetadata: {
        version: getVersion(),
      },
      linux: {
        target: 'deb',
        icon: 'build/icons',
      },
      win: {
        icon: 'build/icons/aims.ico',
        target: [
          {
            target: 'nsis',
            arch: ['ia32'],
          },
        ],
      },
    },
    dir: true,
  });
});

/** @param {'main'|'preload'|'renderer'} type */
function typeCheck(type, cb) {
  const cmd = exec(`npx tsc --noEmit -p packages/${type}/tsconfig.json`, {
    stdio: 'inherit',
  });
  cmd.on('close', function (code) {
    cb(code);
  });
}
gulp.task('typecheck:main', done => typeCheck('main', done));
gulp.task('typecheck:preload', done => typeCheck('preload', done));
gulp.task('typecheck:renderer', done => typeCheck('renderer', done));
gulp.task(
  'typecheck',
  gulp.parallel(['typecheck:main', 'typecheck:preload', 'typecheck:renderer']),
);

gulp.task(
  'build',
  gulp.series([
    gulp.parallel(['clean', 'typecheck']),
    gulp.parallel(['build:main', 'build:preload', 'build:renderer']),
    // 'electron:build',
  ]),
);

gulp.task('test:main');
gulp.task('test:preload');
gulp.task('test:renderer');
gulp.task('test:e2e');
gulp.task('test');
