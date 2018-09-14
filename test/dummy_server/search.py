# coding=utf-8

# from bottle import route, run, template, get, post, request


# @route('/hello/<name>')
# def index(name):
#     return template('<b>Hello {{name}}</b>!', name=name)

# @route("/")
# def index():
#     username = 'test name'
#     return template('sample')


# def check_login(username, password):
#     return True
#
#
# @get('/login')  # or @route('/login')
# def login():
#     return '''
#         <form action="/login" method="post">
#             Username: <input name="username" type="text" />
#             Password: <input name="password" type="password" />
#             <input value="Login" type="submit" />
#         </form>
#     '''
#
#
# @post('/login')  # or @route('/login', method='POST')
# def do_login():
#     username = request.forms.get('username')
#     password = request.forms.get('password')
#     if check_login(username, password):
#         return "<p>Your login information was correct.</p>"
#     else:
#         return "<p>Login failed.</p>"
#
#
# run(host='localhost', port=8083)

from bottle import Bottle, run, route, request, response
import json

json_data = None
app = Bottle()


@route('/api.search.nicovideo.jp/api/v2/<service:re:[a-z]+>/contents/search', method='GET')
def serach(service):
    response.headers['Content-Type'] = 'application/json'
    key_word = request.query.q
    targets = request.query.targets.split(",")
    fields = request.query.fields.split(",")
    sort = request.query._sort
    offset = request.query._offset
    limit = request.query._limit
    context = request.query._context
    non = request.query.non # ''

    # fp = open("./data/search.json", encoding="utf-8")
    # json_obj = json.load(fp)
    # datas = json_obj["data"]
    datas = json_data

    results = []
    for target in targets:
        results.append(list(filter(lambda data: key_word in data[target], datas)))

    result = flatten(results)
    unique_result = unique(result)

    # result = {k: v for k, v in json_obj.items() if 'オリジナル' in k}
    return getJson()


@route('/counter')
def counter():
    count = int(request.cookies.get('counter', '0'))
    count += 1
    response.set_cookie('counter', str(count), max_age=2678400)  # 最大３１日有効
    return 'You visited this page %d times' % count


def getJson():
    # obj = {'TV': 100, 'camera': 200, 'radio': 300}
    # return json.dumps(obj, indent=2)
    s = ""
    with open("./tmp/search0-10.json", encoding="utf-8") as f:
        s = f.read()
    return s


def flatten(nested_list):
    return [e for inner_list in nested_list for e in inner_list]


def unique(dic_list):
    return [dict(t) for t in set([tuple(d.items()) for d in dic_list])]


if __name__ == "__main__":
    fp = open("./data/search.json", encoding="utf-8")
    json_data = json.load(fp)
    fp.close()

    run(host='localhost', port=8083, debug=True)
