#!/bin/bash

# npmjx is a proxy module downloaded by jx when 'jx npm install'
# is invoked.
# npmjx is created running this script from within tools/npmjx.
# It calls the replace_urls.py script to create index.js and then
# it compiles nmpjx.jxp to create the npm proxy module.
# The npm proxy module contains at index.js:199 the url to download
# the npm module, that url that can be changed by editing:
# build_scripts/replace_urls/tools-npmjx-index.js.template
# after the template has been change, please re-run this script.

cwd=$(pwd)
cd ../../build_scripts/replace_urls/
python replace_urls.py tools-npmjx-index.js.template
cd $cwd
jx compile npmjx.jxp
