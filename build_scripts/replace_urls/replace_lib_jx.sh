#!/bin/sh

# This script is called by Makefile to create lib/jx/_jx_install.js at build
# time

cd build_scripts/replace_urls/
python replace_urls.py lib-jx-_jx_install.js.template
