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
    es5: args['--es5'],
    pretty: args['--pretty'],
    main: args['--main'],
    typescript: args['--typescript']
}); };
var args = docopt.docopt("\n\nUsage:\n  wml [options] <path>\n\nOptions:\n  -h --help          Show this screen.\n  --extension ext    The file extension to use when writing files. [default: js]\n  --es5              Output ES5 javascript.\n  --typescript       Output typescript instead of ES6 syntax.\n  --pretty           Pretty prints the output.\n  --version          Show version.\n", {
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
                    .chain(function (contents) { return Future.try(function () { return wml_1.compile(contents, getOptions(args)); }); })
                    .chain(function (result) {
                    return Future.node(function (cb) {
                        return fs.writeFile(getFileName(path) + "." + args['--extension'], result, cb);
                    });
                });
    });
};
execute(expand(process.cwd())(args['<path>']))
    .fork(function (e) { return (console.error(e.stack ? e.stack : e), process.exit(255)); }, function () { return process.exit(0); });
//# sourceMappingURL=cli.js.map