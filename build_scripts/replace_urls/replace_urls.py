# This script is used to create files from templates and replace
# place-holders ids with values defined in replace_urls.json.
# The values are urls to the:
# - npm proxy module
# - npm module
# - node-gyp

import sys
import json

if len(sys.argv) != 2:
    sys.exit(1)

with open('replace_urls.json') as data_file:    
    data = json.load(data_file)

for file_to_process in data["files"]:
    if sys.argv[1] == file_to_process["template"]:
        with open(file_to_process["destination"], "wt") as fout:
            with open(file_to_process["template"], "rt") as fin:
                for line in fin:
                    for url in file_to_process["url"]:
                        line = line.replace(url["id"], url["value"])
                    fout.write(line)
