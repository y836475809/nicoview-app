# coding=utf-8

from bottle import Bottle, run, route, request, response, static_file
import json

from util import MyJson


app = Bottle()
my_json = None


@route('/api.search.nicovideo.jp/api/v2/<service:re:[a-z]+>/contents/search', method='GET')
def serach(service):
    response.headers['Content-Type'] = 'application/json'
    key_word = request.query.q
    targets = request.query.targets.split(",")
    fields = request.query.fields.split(",")
    sort = request.query._sort
    offset = int(request.query._offset)
    limit = int(request.query._limit)
    context = request.query._context
    non = request.query.non # ''

    my_json.reset()
    json_data = my_json.targets(key_word, targets).sort(sort).offset(offset, limit).json
    return json_data


@route('/data/img/<filename:path>')
def static(filename):
    return static_file(filename, root="./data/img")


# @route('/counter')
# def counter():
#     count = int(request.cookies.get('counter', '0'))
#     count += 1
#     response.set_cookie('counter', str(count), max_age=2678400)  # 最大３１日有効
#     return 'You visited this page %d times' % count
#
#
# def getJson():
#     # obj = {'TV': 100, 'camera': 200, 'radio': 300}
#     # return json.dumps(obj, indent=2)
#     s = ""
#     with open("./tmp/search0-10.json", encoding="utf-8") as f:
#         s = f.read()


if __name__ == "__main__":
    path = "./data/search_local.json"
    port = 8083
    host = "http://localhost:%d" % port
    my_json = MyJson("./data/search_local.json", host)

    run(host='localhost', port=port, debug=True)
