WML CLI
=======

# Installation
```sh

npm install -g @quenk/wml-cli

```

# Usage

``` sh

wml folder/with/files

```

`wml` will search recursively for any files ending with `.wml` and create a corresponding
js file. 

WARNING!

This tool will overwrite on any naming conflicts so don't have a `Something.js` 
and a `Something.wml` in your codebase!
