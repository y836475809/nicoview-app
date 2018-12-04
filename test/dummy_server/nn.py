# coding=utf-8

from bottle import run, template, get, post, request, response, Bottle, abort, HTTPResponse
from beaker.middleware import SessionMiddleware
import sys, codecs

sys.stdout = codecs.getwriter("utf-8")(sys.stdout)

session_opts = {
    'session.type': 'memory',
    'session.cookie_expires': 300,
    'session.auto': True
}

app = Bottle()
apps = SessionMiddleware(app, session_opts)


def sesstion_ok():
    nicohistory = request.get_cookie("nicohistory", "")
    nicosid = request.get_cookie("nicosid", "")
    sesstion = request.session
    return sesstion["nicohistory"] == nicohistory and sesstion["nicosid"] == nicosid


@app.get("/watch/<videoid>")
def method_watch(videoid):
    response.set_cookie("nicohistory", "%s%%1234" % videoid)
    response.set_cookie("nicosid", "1234.5678")
    sesstion = request.environ.get('beaker.session')
    sesstion["nicohistory"] = "%s%%5678" % videoid
    sesstion["nicosid"] = "1234.5678"
    return template(videoid)


@app.get("/smile")
def method_smile():
    if not sesstion_ok():
        abort(403)

    p = request.query.m
    id = p.split(",")[0]
    nicohistory = request.get_cookie("nicohistory", "")
    if nicohistory.count(id):
        return template('<b>ok</b>!')
    else:
        abort(403)


@app.post("/sessions?_format=json")
def method_dmc():
    contentType = request.get_header('Content-Type')
    if contentType == "application/json":
        json = request.json
        if "session" not in json:
            abort(403)

        if not sesstion_ok():
            abort(403)

        body = {
            "data": {
                "session": {
                    "content_uri": "http://pa90.dmc.nico:2812/vod/ht2_nicovideo/nicovideo-aa"
                }
            }
        }
        r = HTTPResponse(status=200, body=body)
        r.set_header("Content-Type", "application/json")
        return r
    else:
        abort(403)


if __name__ == "__main__":
    port = 8084
    host = "http://localhost:%d" % port
    run(app=apps, host='localhost', port=port, debug=True)
