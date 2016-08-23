#!/bin/sh

# deps/npm/lib/_jx.js contains a url to the node-gyp module used by jx/
# the deps/npm/lib/_jx.js is created from a template invoking the
# replace_urls.py script. The url to node-gyp can be changed by editing
# the template: build_scripts/replace_urls/deps-npm-lib-_jx.js.template

cwd=$(pwd)
cd ../build_scripts/replace_urls/
python replace_urls.py deps-npm-lib-_jx.js.template
cd $cwd

VER=314
tar -zcvf npmjx$VER.tar.gz npm
cp npmjx$VER.tar.gz ~/.jx/
cd ~/.jx/
rm -rf npm
tar -xvf npmjx$VER.tar.gz
