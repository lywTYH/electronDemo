import gulp from 'gulp';
import '../gulpfile.js';
function build() {
  const taskInstance = gulp.task('build');
  if (taskInstance === undefined) {
    console.error('no task named compile registered');
    return;
  }
  taskInstance.apply(gulp);
}
build();
