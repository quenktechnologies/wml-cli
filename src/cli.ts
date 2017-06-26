#! /usr/bin/env node

import {
    dirname,
    basename,
    resolve,
    extname
} from 'path';
import * as fs from 'fs';
import * as docopt from 'docopt';
import * as Future from 'fluture';
import compile from '@quenk/wml';

const getFileName = file =>
    `${dirname(file)}/${basename(file, extname(file))}`;

const expand = parent => path => resolve(parent, path);

const getOptions = args => ({

    es2015: args['--es2015']

});

const args = docopt.docopt(`

Usage:
  wml [options] <path>

Options:
  -h --help     Show this screen.
  --es2015      Output ES2015 javascript.
  --version     Show version.
`, {
        version: require('../package.json').version
    });

const execute = path =>
    Future
        .node(cb => fs.stat(path, cb))
        .chain(stats =>
            stats.isDirectory() ?
                Future
                    .node(cb => fs.readdir(path, cb))
                    .chain(list => Future.parallel(100, list.map(expand(path)).map(execute))) :
                (extname(path) !== '.wml') ?
                    Future.of() :
                    Future
                        .node(cb => fs.readFile(path, { encoding: 'utf8' }, cb))
                        .chain(contents => Future.try(() => compile(contents, getOptions(args))))
                        .chain(result => Future.node(cb => fs.writeFile(`${getFileName(path)}.js`, result, cb))));


execute(expand(process.cwd())(args['<path>']))
    .fork(e => (console.error(e.stack), process.exit(255)), () => process.exit(0))

