# coding=utf-8

import urllib.request
import urllib.parse
import pprint
import json


if __name__ == "__main__":
    url = 'http://localhost:8083/api.search.nicovideo.jp/api/v2/video/contents/search'
    url += "?targets=title"
    url += "&fields=contentId,title,viewCounter,thumbnailUrl,tags,startTime,lengthSeconds"
    url += "&_sort=-viewCounter"
    url += "&_offset=0"
    url += "&_limit=3"
    url += "&_context=apiguide"
    url += "&q=" + urllib.parse.quote("初音ミク")
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as res:
        body = res.read()
        content = json.loads(body.decode('utf8'))
        pprint.pprint(content)

