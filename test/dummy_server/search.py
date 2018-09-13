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

app = Bottle()


@route('/api.search.nicovideo.jp/api/v2/<service:re:[a-z]+>/contents/search', method='GET')
def serach(service):
    response.headers['Content-Type'] = 'application/json'
    return getJson()


@route('/counter')
def counter():
    count = int(request.cookies.get('counter', '0'))
    count += 1
    response.set_cookie('counter', str(count), max_age=2678400)  # 最大３１日有効
    return 'You visited this page %d times' % count


def getJson():
    obj = {'TV': 100, 'camera': 200, 'radio': 300}
    return json.dumps(obj, indent=2)


if __name__ == "__main__":
    run(host='localhost', port=8083, debug=True)
