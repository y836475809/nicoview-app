const test = require("ava");
const { NicoUpdate } = require("../src/lib/nico-update");

const cu_cm1 = [
    {
        "chat": {
            "thread": "1634187662",
            "no": 1,
            "vpos": 938,
            "date": 1634194399,
            "date_usec": 429564,
            "anonymity": 1,
            "user_id": "dJRZ0xdZS33s83MjiYDmIOBecsU",
            "mail": "184",
            "content": "つるぎのまい"
        }
    },
    {
        "chat": {
            "thread": "1634187662",
            "no": 2,
            "vpos": 433,
            "date": 1634205062,
            "date_usec": 972169,
            "premium": 1,
            "anonymity": 1,
            "user_id": "k1UsWqNxc7tkxIlPJL-UXruWR5A",
            "mail": "184",
            "content": "なにこれ・・・"
        }
    },
    {
        "chat": {
            "thread": "1634187662",
            "no": 5,
            "vpos": 79,
            "date": 1634208867,
            "date_usec": 960624,
            "anonymity": 1,
            "user_id": "-D19mqJdbNWRvAeJKoNkHrFMXRI",
            "mail": "184 ",
            "content": "カイロスじゃねーか！"
        }
    }
];

const nw_cm1 = [
    {
        "chat": {
            "thread": "1634187662",
            "no": 1,
            "vpos": 938,
            "date": 1634194399,
            "date_usec": 429564,
            "anonymity": 1,
            "user_id": "dJRZ0xdZS33s83MjiYDmIOBecsU",
            "mail": "184",
            "content": "つるぎのまい"
        }
    },
    {
        "chat": {
            "thread": "1634187662",
            "no": 2,
            "vpos": 433,
            "date": 1634205062,
            "date_usec": 972169,
            "premium": 1,
            "anonymity": 1,
            "user_id": "k1UsWqNxc7tkxIlPJL-UXruWR5A",
            "mail": "184",
            "content": "なにこれ・・・"
        }
    },
    {
        "chat": {
            "thread": "1634187662",
            "no": 4,
            "vpos": 79,
            "date": 1634208867,
            "date_usec": 960624,
            "anonymity": 1,
            "user_id": "-D19mqJdbNWRvAeJKoNkHrFMXRI",
            "mail": "184 ",
            "content": "カイロスじゃねーか！"
        }
    },
    {
        "chat": {
            "thread": "1634187662",
            "no": 6,
            "vpos": 79,
            "date": 1634208867,
            "date_usec": 960624,
            "anonymity": 1,
            "user_id": "-D19mqJdbNWRvAeJKoNkHrFMXRI",
            "mail": "184 ",
            "content": "カイロスじゃねーか！"
        }
    }
];

test("update commnet1", async(t) => {
    const nu = new NicoUpdate();
    const m_cm = nu._margeCommentData(cu_cm1, cu_cm1);
    t.is(0, m_cm.length);
});

test("update commnet2", async(t) => {
    const nu = new NicoUpdate();
    const m_cm = nu._margeCommentData(cu_cm1, nw_cm1);
    const no_list = m_cm.map(value=>{
        return value.chat.no;
    });
    t.deepEqual(
        [1, 2, 5, 4, 6], 
        no_list);
});
