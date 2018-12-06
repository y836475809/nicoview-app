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


def session_ok():
    nicohistory = request.get_cookie("nicohistory", "")
    nicosid = request.get_cookie("nicosid", "")
    session = request.session
    return session["nicohistory"] == nicohistory and session["nicosid"] == nicosid


@app.get("/watch/<videoid>")
def method_watch(videoid):
    response.set_cookie("nicohistory", "%s%%1234" % videoid)
    response.set_cookie("nicosid", "1234.5678")
    session = request.environ.get('beaker.session')
    session["nicohistory"] = "%s%%5678" % videoid
    session["nicosid"] = "1234.5678"
    return template(videoid)


@app.get("/smile")
def method_smile():
    if not session_ok():
        abort(403)

    video_id = request.query.m.split(",")[0]
    nicohistory = request.get_cookie("nicohistory", "")
    if nicohistory.count(video_id):
        return template('<b>ok</b>!')
    else:
        abort(403)


@app.post("/sessions?_format=json")
def method_dmc():
    content_type = request.get_header('Content-Type')
    if content_type == "application/json":
        json = request.json
        if "session" not in json:
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


@app.post("/sessions/<sessionid>?_format=json&_method=PUT")
def method_hb(sessionid):
    content_type = request.get_header('Content-Type')
    if content_type == "application/json":
        print("sessionid=%s" % sessionid)
    else:
        abort(403)


if __name__ == "__main__":
    port = 8084
    host = "http://localhost:%d" % port
    run(app=apps, host='localhost', port=port, debug=True)
