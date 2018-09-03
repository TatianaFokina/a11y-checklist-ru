// ========================================================================
// Подключение модулей
// ========================================================================
var gulp = require('gulp'),
	CompileStylus = require('gulp-stylus'),
	pug           = require('gulp-pug'),
	fs            = require("fs"),
	pugBeautify   = require('gulp-pug-beautify'),
	browserSync   = require('browser-sync'),
	// Для конкатенации файлов
	concat        = require('gulp-concat'),
	// Для минификации CSS
	cssnano       = require('gulp-cssnano'),
	// Для переименования файлов
	rename        = require('gulp-rename'),
	// Для удаления файлов и папок
	del           = require('del'),
	// Библиотека кеширования
	cache         = require('gulp-cache'),
	// Для автоматического добавления префиксов
	autoprefixer  = require('gulp-autoprefixer'),
	// Для работы с изображениями
	imagemin      = require('gulp-imagemin'),
	// Для сжатия png
	pngquant      = require('imagemin-pngquant'),
	// Для сжатия jpg
	imageminJpegtran = require('imagemin-jpegtran'),
	// Для сжатия gif
	imageminGifsicle = require('imagemin-gifsicle'),
	// Для сжатия svg
	imageminSvgo = require('imagemin-svgo'),
	gulp_postcss = require('gulp-postcss'),
	datauri = require('postcss-data-uri'),
	// Объединяет селекторы с одинаковыми свойствами
	mergeRules = require('postcss-merge-rules'),
	// Объединяет @media, помещает их в конец css
	combineCssMedia = require('css-mqpacker');
	htmlbeautify = require('gulp-html-beautify'),
	plumber = require('gulp-plumber'),
	notify = require("gulp-notify"),
	// Меняет пути к файлам в css
	modifyCssUrls = require('gulp-modify-css-urls'),
	postcss_inline_svg = require('postcss-inline-svg'),
	replace = require('gulp-replace'),
	// Убирает неиспользуемые стили
	purify = require('gulp-purifycss');




// В квадратных скобках указываются таски, котоыре должны выполниться ДО текущего таска

// ========================================================================
// Компиляция
// ========================================================================
// Stylus (all.styl → test/)
gulp.task('__compileStylus', function () {
	var $postcss_plugins = [
		postcss_inline_svg,
		mergeRules
	];

	return gulp.src('src/styl/styles.styl')
		.pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
		.pipe(CompileStylus({'include css': true}))
		.pipe(autoprefixer({
			// Версии поддерживаемых браузеров
			browsers: [
				"last 2 versions",
				"> 1%",
				"Firefox >= 20",
				"ie >= 10"],
			cascade: false
		}))
		.pipe(gulp_postcss($postcss_plugins))
		.pipe(gulp.dest('test/css'))
		.pipe(browserSync.reload({stream: true}));
});

// Stylus (all.styl → docs/)
gulp.task('__compileStylus_docs', function () {
	var $postcss_plugins = [
		postcss_inline_svg,
		mergeRules
	];

	return gulp.src('src/styl/all.styl')
		.pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
		.pipe(CompileStylus({'include css': true}))
		.pipe(autoprefixer({
			// Версии поддерживаемых браузеров
			browsers: [
				"last 2 versions",
				"> 2%",
				"Firefox >= 30"],
			cascade: false
		}))
		.pipe(gulp_postcss($postcss_plugins))
		.pipe(gulp.dest('docs/css'))
		.pipe(browserSync.reload({stream: true}));
});

// Pug
gulp.task('__compilePug', function () {
	return gulp.src([
		'src/pug/**/*.pug',
		'!src/pug/-helpers/**/*',
		'!src/pug/-templates/**/*',
		'!src/pug/**/*.inc.pug',
		'!src/pug/**/*.tpl.pug',
		'!src/pug/**/*--inc.pug',
		'!src/pug/**/*--tpl.pug',
		'!src/pug/**/_*.pug'
	])
		.pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
		.pipe(pug())
		// Разметка НЕ в одну строку
		//.pipe(pug({pretty: true}))
		.pipe(htmlbeautify({
			"indent_with_tabs": true
		}))
		.pipe(gulp.dest("test"))
		.pipe(browserSync.reload({stream: true}));
});






// ========================================================================
// Watch (следит за измениями файлов и компилирует в папку test)
// ========================================================================
// Следит за папкой "test"
gulp.task('Watch', ['Build--Test'], function () {
	gulp.watch('src/styl/**/*.styl', ['__compileStylus']);
	gulp.watch(['src/**/*.pug','!src/helpers/**/*'], ['__compilePug']);
});

// Следит за папкой "test" и открывает в браузере
gulp.task('LiveReload', ['Build--Test'], function () {
	// Выполняем browserSync
	browserSync({
		// Определяем параметры сервера
		server: {
			// Директория для сервера
			baseDir: 'test'

		},
		port: 3087,
		// Отключаем уведомления
		notify: false
	});
	gulp.watch('src/styl/**/*.styl', ['__compileStylus']);
	gulp.watch('src/**/*.pug', ['__compilePug']);
});






// ========================================================================
// Удаление папок
// ========================================================================
// docs
gulp.task('__deldocs', function() {
	return del.sync('docs');
});
// test
gulp.task('__delTest', function() {
	return del.sync('test');
});






// ========================================================================
// Билд
// ========================================================================

// →  "test"
gulp.task('Build--Test', ['__compileStylus', '__compilePug'], function() {
	// Шрифты
	gulp.src('src/fonts/**/*')
		.pipe(gulp.dest('test/fonts'));

	// Favicons
	gulp.src('src/favicons/**/*')
		.pipe(gulp.dest('test/favicons'));

	// Images
	gulp.src('src/imgs/**/*')
		.pipe(gulp.dest('test/imgs'));
});

// → "docs"
gulp.task('Build', ['__deldocs', '__compileStylus', '__compilePug'], function() {
	// Шрифты
	gulp.src('src/fonts/**/*')
		.pipe(gulp.dest('docs/fonts'));

	// Favicons
	gulp.src('src/favicons/**/*')
		.pipe(cache(imagemin([
			imagemin.gifsicle({interlaced: true}),
			imagemin.jpegtran({progressive: true}),
			imagemin.optipng({optimizationLevel: 7}),
			imagemin.svgo({plugins: [{removeViewBox: true}]})
		])))
		.pipe(gulp.dest('docs/favicons'));

	// Images (с оптимизацией)

	// Выбираем папку с исходными изображениями
	gulp.src('src/imgs/**/*')
		.pipe(cache(imagemin([
			imagemin.gifsicle({interlaced: true}),
			imagemin.jpegtran({progressive: true}),
			imagemin.optipng({optimizationLevel: 7}),
			imagemin.svgo({plugins: [{removeViewBox: true}]})
		])))
		.pipe(gulp.dest('docs/imgs'));

	// Copy html
	gulp.src('test/**/*.html')
		.pipe(gulp.dest("docs"));

	// CSS
	var $postcss_plugins = [
		combineCssMedia({
			sort: false
		})
	];

	gulp.src('test/css/**/*.css')
		.pipe(purify(['test/**/*.html'], { // Убирает неиспользуемые стили
		}))
		// Сжимаем
		.pipe(cssnano())
		// Сохраняем в папку
		.pipe(gulp.dest('docs/css'));

	// Copy .txt
	gulp.src('src/*.txt')
		.pipe(gulp.dest("docs"));
});






// ========================================================================
// Разное
// ========================================================================
// Задача по-умолчанию
gulp.task('default', ['LiveReload']);
