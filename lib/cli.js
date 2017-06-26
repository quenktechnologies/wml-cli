#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var fs = require("fs");
var docopt = require("docopt");
var Future = require("fluture");
var wml_1 = require("@quenk/wml");
var getFileName = function (file) {
    return path_1.dirname(file) + "/" + path_1.basename(file, path_1.extname(file));
};
var expand = function (parent) { return function (path) { return path_1.resolve(parent, path); }; };
var getOptions = function (args) { return ({
    es2015: args['--es2015']
}); };
var args = docopt.docopt("\n\nUsage:\n  wml [options] <path>\n\nOptions:\n  -h --help     Show this screen.\n  --es2015      Output ES2015 javascript.\n  --version     Show version.\n", {
    version: require('../package.json').version
});
var execute = function (path) {
    return Future
        .node(function (cb) { return fs.stat(path, cb); })
        .chain(function (stats) {
        return stats.isDirectory() ?
            Future
                .node(function (cb) { return fs.readdir(path, cb); })
                .chain(function (list) { return Future.parallel(100, list.map(expand(path)).map(execute)); }) :
            (path_1.extname(path) !== '.wml') ?
                Future.of() :
                Future
                    .node(function (cb) { return fs.readFile(path, { encoding: 'utf8' }, cb); })
                    .chain(function (contents) { return Future.try(function () { return wml_1.default(contents, getOptions(args)); }); })
                    .chain(function (result) { return Future.node(function (cb) { return fs.writeFile(getFileName(path) + ".js", result, cb); }); });
    });
};
execute(expand(process.cwd())(args['<path>']))
    .fork(function (e) { return (console.error(e.stack), process.exit(255)); }, function () { return process.exit(0); });
//# sourceMappingURL=cli.js.map