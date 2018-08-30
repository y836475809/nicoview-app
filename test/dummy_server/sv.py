# coding=utf-8

from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import json


class GetHandler(BaseHTTPRequestHandler):
    contentRoot = "./images/"
    def do_GET(self):
        parsed_path = urlparse(self.path)
        print(parsed_path)

        # 成功レスポンス(200)を返す
        if parsed_path.path == "/ok-api":
            self.send_response(200)
            self.end_headers()
            self.wfile.write("OK")
            return

        # 失敗レスポンス(403)を返す
        elif parsed_path.path == "/ng-api":
            self.send_error(403, "NG!")
            self.end_headers()
            return

        # クエリパラメータ("left-str", "right-str")を連結した文字列を返す
        # /concat-str?left-str=Hello&right-str=World
        # elif parsed_path.path == "/concat-str":
        #     # クエリパラメータのパース(dictionary型)
        #     querys = parse_qs(parsed_path.query)
        #     if ("left-str" in querys) and ("right-str" in querys):
        #         concat_str = querys["left-str"][0] + querys["right-str"][0]
        #         self.send_response(200)
        #         self.end_headers()
        #         self.wfile.write(concat_str.encode())
        #
        #     else:
        #         # "left-str"と"right-str"のクエリがなかったらエラー
        #         self.send_error(400, "query NG!")
        #         self.end_headers()
        #         return
        elif parsed_path.path == "/brie1":
            print("do_GET brie1")
            file_data = self.__retrieve_image("brie.jpg")
            file_data_len = len(file_data)

            content_type = "image/jpeg"
            self.send_response(200)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Disposition", "attachment")
            self.send_header("Content-Length", file_data_len)
            self.send_header("Content-type", content_type)
            self.end_headers()
            self.wfile.write(file_data)
        elif parsed_path.path == "/brie2":
            print("do_GET brie2")
            file_data = self.__retrieve_image("cheddar.jpg")
            file_data_len = len(file_data)

            content_type = "image/jpeg"
            self.send_response(200)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Disposition", "attachment")
            self.send_header("Content-Length", file_data_len)
            self.send_header("Content-type", content_type)
            self.end_headers()
            self.wfile.write(file_data)

        # Jsonを返す
        elif parsed_path.path == "/return-json":
            data = [{u"name":u"尾崎豊", u"age":26},
                    {u"name":u"hide", u"age":33}]
            jsonData = json.dumps(data, ensure_ascii=False, encoding='utf-8')

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            self.wfile.write(jsonData.encode("utf-8"))
            return

        else:
            self.send_error(400, "NG!")
            self.end_headers()
            return

    def __retrieve_image(self, url_path):
        image_path = self.__class__.contentRoot + url_path
        try:
            file = open(image_path, "rb")
        except IOError as ioerr:
            print("File not found : ", ioerr)
        else:
            file_data = file.read()
            file.close()
        return file_data

    # Bodyを設定して送ると、こちらが呼ばれる
    def do_POST(self):

        # request取得
        content_len = int(self.headers.get("content-length"))
        request_body = self.rfile.read(content_len).decode("utf-8")

        try:
            # requestのjson読み込み
            data = json.loads(request_body)

            # 読み込んだ内容出力
            for key in data:
                print("key:{0} value:{1}".format(key, data[key]))

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            # requestと同じjsonを返す
            self.wfile.write(request_body.encode("utf-8"))
            return

        except:
            self.send_error(400, "request NG!")
            self.end_headers()
            return


if __name__ == "__main__":
    host = "localhost"
    port = 8000

    server = HTTPServer((host, port), GetHandler)
    server.serve_forever()