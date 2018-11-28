# coding=utf-8

from bottle import run, template, get, post, request, response
import sys, codecs
sys.stdout = codecs.getwriter("utf-8")(sys.stdout)

@get("/wh")
def method_wh():
    response.set_cookie("nicohistory", "sm123%5678")
    response.set_cookie("nicosid", "1234.5678")

@post("/login")
def method_login():
    mail = request.forms.mail_tel
    password = request.forms.password
    if check_login(mail, password):
        response.set_cookie("user_session", "user_session_1234_56789")
        response.set_cookie("user_session_secure", "abcdefg")
        return template('<b>ok</b>!')
    else:
        return template('<b>fault</b>!')


def check_login(username, password):
    if username == "a" and password == "1":
        return True
    else:
        return False


if __name__ == "__main__":
    port = 8084
    host = "http://localhost:%d" % port
    run(host='localhost', port=port, debug=True)
