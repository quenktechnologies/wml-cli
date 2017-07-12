#! /usr/bin/env node

import {
    dirname,
    basename,
    resolve,
    extname
} from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as docopt from 'docopt';
import * as Future from 'fluture';
import {compile} from '@quenk/wml';

/**
 * CompileError
 */
export function CompileError(path, message) {

  this.message = `Error while processing ${path}:${os.EOL}${message}`;
  this.stack = (new Error(this.message)).stack;
  this.name = this.constructor.name;

  if (Error.hasOwnProperty('captureStackTrace'))
    Error.captureStackTrace(this, this.constructor);

}

CompileError.prototype = Object.create(Error.prototype);
CompileError.prototype.constructor = CompileError;

export default CompileError

const getFileName = file =>
    `${dirname(file)}/${basename(file, extname(file))}`;

const expand = parent => path => resolve(parent, path);

const getOptions = args => ({

    es5: args['--es5'],
    pretty: args['--pretty'],
    main: args['--main'],
    typescript: args['--typescript']

});

const args = docopt.docopt(`

Usage:
  wml [options] <path>

Options:
  -h --help          Show this screen.
  --extension ext    The file extension to use when writing files. [default: js]
  --es5              Output ES5 javascript.
  --typescript       Output typescript instead of ES6 syntax.
  --pretty           Pretty prints the output.
  --version          Show version.
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
                        .chain(contents => 
                             Future.try(() => compile(contents, getOptions(args)))
                             .mapRej(e=> new CompileError(path, e.message)))
                        .chain(result => 
                            Future.node(cb =>
                                fs.writeFile(
                                  `${getFileName(path)}.${args['--extension']}`, result, cb))));

execute(expand(process.cwd())(args['<path>']))
    .fork(e => (console.error(e.stack?e.stack:e), process.exit(255)), () => process.exit(0))

