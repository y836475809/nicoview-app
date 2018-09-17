# coding=utf-8

from typing import List, Dict
import json
from datetime import datetime
import copy
import pprint


class MyJson:
    def __init__(self, path: str, host: str):
        fp = open(path, encoding="utf-8")
        self.json = json.load(fp)
        fp.close()

        cnt = 0
        for data in self.json["data"]:
            img_fname = "smile%d.jpeg" % cnt
            cnt += 1
            data["thumbnailUrl"] = data["thumbnailUrl"] % (host, img_fname)

        self.data_list_bk = copy.deepcopy(self.json["data"])
        # self.data_list = self.json["data"]

    def reset(self):
        self.json["data"] = copy.deepcopy(self.data_list_bk)

    def targets(self, key_word: str, targets: List[str]):
        data_list = copy.deepcopy(self.json["data"])
        result = []
        for target in targets:
            tmp_list = list(filter(lambda data: key_word in data[target], data_list))
            for tmp in tmp_list:
                if tmp not in result:
                    result.append(tmp)
        self.json["data"] = result
        return self

    def fields(self, fields: List[str]):
        for data in self.json["data"]:
            for field in fields:
                if field not in data:
                    del data[field]
        return self

    def sort(self, sort: str):
        s_type = sort[0]
        target = sort[1:]
        reverse = False if s_type == "+" else True

        if target == "startTime":
            self.json["data"].sort(key=lambda x: self.cnv_datetime(x[target]), reverse=reverse)
        else:
            self.json["data"].sort(key=lambda x: x[target], reverse=reverse)
        return self

    def offset(self, offset: int, limit: int):
        self.json["data"] = self.json["data"][offset:offset+limit]
        return self

    def cnv_datetime(self, time: str):
        time = time[:-6]
        dt = datetime.strptime(time, '%Y-%m-%dT%H:%M:%S')
        return dt


if __name__ == "__main__":
    my_json = MyJson("./data/search_local.json", "http://localhost:8083")
    # pprint.pprint(my_json.data_list)
    json_data = my_json.targets("オリジナル", ["title"]).sort("-startTime").offset(0, 3).json
    # my_json.reset()
    # pprint.pprint(my_json.data_list)
    # my_json.targets("オリジナル", ["title", "tags"])
    pprint.pprint(json_data)
    print("len=", len(json_data["data"]))
