import {spawn} from 'child_process';
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
      appId: 'appid',
      asar: false,
      directories: {
        output: buildPath,
        buildResources: 'buildResources',
      },
      files: ['packages/**/dist/**'],
      extraMetadata: {
        version: getVersion(),
      },
      linux: {
        target: 'deb',
      },
      win: {
        target: ['nsis'],
      },
    },
    dir: true,
  });
});

/** @param {'main'|'preload'|'renderer'} type */
function typeCheck(type, cb) {
  const cmd = spawn('tsc', ['--noEmit', '-p', 'packages/main/tsconfig.json'], {stdio: 'inherit'});
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
    'electron:build',
  ]),
);

// "test": "npm run test:main && npm run test:preload && npm run test:renderer && npm run test:e2e",
// "test:e2e": "npm run build && vitest run",
// "test:main": "vitest run -r packages/main --passWithNoTests",
// "test:preload": "vitest run -r packages/preload --passWithNoTests",
// "test:renderer": "vitest run -r packages/renderer --passWithNoTests",
