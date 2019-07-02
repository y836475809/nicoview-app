const test = require("ava");
const { NicoUpdate } = require("../app/js/nico-update");

const api_data = {
    video:{
        video_id: "",
        title: "", 
        description: "", 
        isDeleted: false,
        thumbnailURL:"url-S",
        largeThumbnailURL:"url-L",
        postedDateTime: 0, 
        movieType:"mp4",
        viewCount: 0, 
        mylistCount: 0 
    },
    thread: {
        commentCount: 0
    },
    tags:[],
    owner: {
        id: "", 
        nickname: "",
        iconURL: "",
    }
};

const commnets = [
    {
        "ping": {
            "content": "rs:0"
        }
    },
    {
        "ping": {
            "content": "ps:0"
        }
    },
    {
        "thread": {
            "resultcode": 0,
            "thread": "1234567890",
            "fork": 1,
            "server_time": 1546694359,
            "last_res": 2,
            "ticket": "1234567890",
            "revision": 1
        }
    },
    {
        "global_num_res": {
            "thread": "1234567890",
            "num_res": 5
        }
    },
    {
        "chat": {
            "thread": "1234567890",
            "fork": 1,
            "no": 1,
            "vpos": 100,
            "date": 1360996778,
            "premium": 1,
            "mail": "shita green small",
            "content": "owner comment1"
        }
    },
    {
        "chat": {
            "thread": "1234567890",
            "fork": 1,
            "no": 2,
            "vpos": 200,
            "date": 1360996778,
            "premium": 1,
            "mail": "shita green small",
            "content": "owner comment2"
        }
    },
    {
        "ping": {
            "content": "pf:0"
        }
    },
    {
        "ping": {
            "content": "ps:1"
        }
    },   
    {
        "thread": {
            "resultcode": 0,
            "thread": "1234567890",
            "server_time": 1546694359,
            "last_res": 3336,
            "ticket": "0x83d23581",
            "revision": 2
        }
    },
    {
        "leaf": {
            "thread": "1234567890",
            "count": 303
        }
    },
    {
        "leaf": {
            "thread": "1234567890",
            "leaf": 1,
            "count": 152
        }
    },
    {
        "thread": {
            "resultcode": 0,
            "thread": "1234567890",
            "server_time": 1546694359,
            "last_res": 5,
            "ticket": "0x83d23581",
            "revision": 2
        }
    },
    {
        "chat": {
            "thread": "1234567890",
            "no": 16,
            "vpos": 300,
            "leaf": 7,
            "date": 1359607148,
            "premium": 1,
            "anonymity": 1,
            "user_id": "abcdefg",
            "mail": "184",
            "content": "comment3"
        }
    },
    {
        "chat": {
            "thread": "1234567890",
            "no": 17,
            "vpos": 400,
            "leaf": 11,
            "date": 1359607224,
            "anonymity": 1,
            "user_id": "hijklnm",
            "mail": "184",
            "content": "comment4"
        }
    },
    {
        "ping": {
            "content": "pf:2"
        }
    },
    {
        "ping": {
            "content": "rf:0"
        }
    }
];

test("validate apidata", async(t) => {
    const nico_update = new NicoUpdate();

});