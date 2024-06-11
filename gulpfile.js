"use strict";

var gulp = require("gulp"),
	minifycss = require("gulp-clean-css"),
	uglify = require("gulp-uglify"),
	concat = require("gulp-concat"),
	header = require("gulp-header"),
	buffer = require("vinyl-buffer"),
	pkg = require("./package.json"),
	eslint = require("gulp-eslint"),
	prettify = require("gulp-jsbeautifier"),
	browserify = require("browserify"),
	source = require("vinyl-source-stream"),
	rename = require("gulp-rename"),
	browserSync = require('browser-sync').create();

var banner = ["/**",
	" * <%= pkg.name %> v<%= pkg.version %>",
	" * Copyright <%= pkg.company %>",
	" * @link <%= pkg.homepage %>",
	" * @license <%= pkg.license %>",
	" */",
	""].join("\n");

function prettifyJs() {
	return gulp.src("./src/js/simplemde.js")
		.pipe(prettify({ js: { brace_style: "collapse", indent_char: "\t", indent_size: 1, max_preserve_newlines: 3, space_before_conditional: false } }))
		.pipe(gulp.dest("./src/js"));
}

function prettifyCss() {
	return gulp.src("./src/css/simplemde.css")
		.pipe(prettify({ css: { indentChar: "\t", indentSize: 1 } }))
		.pipe(gulp.dest("./src/css"));
}

function lint() {
	return gulp.src("./src/js/**/*.js")
		// .pipe(eslint({ fix: true })) // 자동 수정 옵션 추가
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
}

function taskBrowserify(opts) {
	return browserify("./src/js/simplemde.js", opts)
		.bundle();
}

function browserifyDebug() {
	return taskBrowserify({ debug: true, standalone: "SimpleMDE" })
		.pipe(source("simplemde.debug.js"))
		.pipe(buffer())
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest("./debug/"));
}

function browserifyTask() {
	return taskBrowserify({ standalone: "SimpleMDE" })
		.pipe(source("simplemde.js"))
		.pipe(buffer())
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest("./debug/"));
}

function scripts() {
	var js_files = ["./debug/simplemde.js"];

	return gulp.src(js_files)
		.pipe(concat("simplemde.min.js"))
		.pipe(uglify())
		.pipe(buffer())
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest("./dist/"));
}

function styles() {
	var css_files = [
		"./node_modules/codemirror/lib/codemirror.css",
		"./src/css/*.css",
		"./node_modules/codemirror-spell-checker/src/css/spell-checker.css"
	];

	return gulp.src(css_files)
		.pipe(concat("simplemde.css"))
		.pipe(buffer())
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest("./debug/"))
		.pipe(minifycss())
		.pipe(rename("simplemde.min.css"))
		.pipe(buffer())
		.pipe(header(banner, { pkg: pkg }))
		.pipe(gulp.dest("./dist/"));
}

function serve() {
	browserSync.init({
		server: {
			baseDir: "./dist"
		},
		port: 3000
	});

	//gulp.watch("src/**/*.js", gulp.series(browserifyDebug, scripts));
	//gulp.watch("src/**/*.js", gulp.series(prettifyJs, lint, browserifyDebug, browserifyTask, scripts)).on;
	//gulp.watch("src/**/*.js", gulp.series(prettifyJs, lint, browserifyDebug, browserifyTask, scripts)).on('change', browserSync.reload);
	gulp.watch("src/js/simplemde.js", gulp.series(lint, browserifyDebug, browserifyTask, scripts))
	gulp.watch("src/**/*.css", gulp.series(prettifyCss, styles));
	gulp.watch(["dist/**/*"]).on('change', browserSync.reload);
}

gulp.task("prettify-js", prettifyJs);
gulp.task("prettify-css", prettifyCss);
gulp.task("lint", gulp.series(prettifyJs, lint));
gulp.task("browserify:debug", gulp.series("lint", browserifyDebug));
gulp.task("browserify", gulp.series("lint", browserifyTask));
gulp.task("scripts", gulp.series("browserify:debug", "browserify", scripts));
gulp.task("styles", gulp.series("prettify-css", styles));
gulp.task("serve", serve);
gulp.task("default", gulp.series("scripts", "styles"));