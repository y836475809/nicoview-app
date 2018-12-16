# coding=utf-8

from bottle import run, template, get, post, request, response, Bottle, abort, HTTPResponse, static_file
from beaker.middleware import SessionMiddleware
import json
import sys, codecs
from datetime import datetime
from logging import getLogger, StreamHandler, DEBUG
logger = getLogger(__name__)
handler = StreamHandler()
handler.setLevel(DEBUG)
logger.setLevel(DEBUG)
logger.addHandler(handler)
logger.propagate = False

sys.stdout = codecs.getwriter("utf-8")(sys.stdout)

session_opts = {
    'session.type': 'memory',
    'session.cookie_expires': 300,
    'session.auto': True
}

app = Bottle()
apps = SessionMiddleware(app, session_opts)

port = 8084
host = "http://localhost:%d" % port


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
        return static_file("test.mp4", root="./data/video")
    else:
        abort(403)


@app.post("/sessions")
def method_dmc():
    if request.query._format != "json":
        abort(403)

    content_type = request.get_header('Content-Type')
    if content_type == "application/json":
        json = request.json
        if "session" not in json:
            abort(403)

        body = {
            "meta": {
                "status": 201,
                "message": "created"
            },
            "data": {
                "session": {
                    "id": "4649242834315c372b54",
                    "content_uri": "%s/data/video/test.mp4" % (host)
                }
            }
        }
        r = HTTPResponse(status=201, body=body)
        r.set_header("Content-Type", "application/json")
        return r
    else:
        abort(403)


@app.route('/sessions/<sessionid>', method=['OPTIONS', 'POST'])
def method_hb(sessionid):
    if request.query._format != "json":
        abort(403)

    content_type = request.get_header('Content-Type')
    if request.method == "POST" and content_type == "application/json":
        abort(403)
        logger.debug(request.json)
        if "session" in request.json:
            logger.debug("%s %s sessionid=%s" % (request.method, datetime.now().strftime("%Y/%m/%d %H:%M:%S"), sessionid))
        else:
            abort(403)
    elif request.method == "OPTIONS":
        # abort(403)
        logger.debug("%s %s sessionid=%s" % (request.method, datetime.now().strftime("%Y/%m/%d %H:%M:%S"), sessionid))
    else:
        abort(403)


@app.post("/api.json/")
def method_comment():
    content_type = request.get_header('Content-Type')
    if content_type != "application/json":
        abort(403)

    req_json = request.json
    if "ping" not in req_json[0] or "ping" not in req_json[1] or "thread" not in req_json[2]:
        abort(403)

    comment_json = []
    with open("./data/comment.json") as f:
        comment_json = json.load(f)
    return comment_json


if __name__ == "__main__":
    run(app=apps, host='localhost', port=port, debug=True)
