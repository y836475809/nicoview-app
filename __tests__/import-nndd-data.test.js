const test = require("ava");
const path = require("path");
const { ImportNNDDSetting } = require("../app/js/import-nndd-data");

test("parse nndd history", t => {
    const thumbUrl1 = "http://dummy.jp/video/smile?i=1";
    const videoName1 = "テスト[sm0] - [sm1].mp4";
    const url1 = "http://www.nicovideo.jp/watch/sm1";

    const thumbUrl2 = "C:\\data\\テスト - [sm2].jgeg";
    const videoName2 = "テスト - [sm2].mp4";
    const url2 = "file://C:/data/テスト - [sm2].mp4";

    const body = 
        '<history>'

        + '<historyItem '
        + `thumbUrl="${encodeURI(thumbUrl1)}" `
        + `videoName="${encodeURI(videoName1)}" `
        + 'playDate="1" playCount="0" condition="false" time="0" ' 
        + `url="${encodeURI(url1)}"/>`
        
        + '<historyItem '
        + `thumbUrl="${encodeURI(thumbUrl2)}" `
        + `videoName="${encodeURI(videoName2)}" `
        + 'playDate="2" playCount="0" condition="true" time="0" '
        + `url="${encodeURI(url2)}"/>`

        + '</history>';

    const imp_nndd = new ImportNNDDSetting();
    const data = imp_nndd._getHistory(body);

    t.deepEqual(data, [
        { thumb_img:thumbUrl1, id:"sm1", title:videoName1, time:0, play_date:1, url:url1 },
        { thumb_img:thumbUrl2, id:"sm2", title:videoName2, time:0, play_date:2, url:url2 },
    ]);
});

test("parse nndd mylist", t => {
    const url1 = "mylist/1";
    const name1 = "test1 [name0] [name1]";
    
    const url2 = "user/2";
    const name2 = "test2 [name2]";

    const body = 
        '<myLists>'

        + `<myList url="${encodeURI(url1)}" `
        + `name="${encodeURI(name1)}" `
        + 'type="MY_LIST" isDir="false" sortFiledName="dataGridColumn_index" '
        + 'sortFiledDescending="false"/>'

        + `<myList url="${encodeURI(url2)}" `
        + `name="${encodeURI(name2)}" `
        + 'type="USER_UPLOAD_VIDEO" isDir="false" sortFiledName="dataGridColumn_index" '
        + 'sortFiledDescending="false"/>'

        + '</myLists>';


    const imp_nndd = new ImportNNDDSetting();
    const data = imp_nndd._getMyList(body);

    t.deepEqual(data, [
        { title:"test1 [name0]", mylist_id:url1, creator:"name1" },
        { title:"test2", mylist_id:url2, creator:"name2" },
    ]);
});

test("mylist src, dest files", t => {
    const imp_nndd = new ImportNNDDSetting("nndd_dir", "data_dir");
    const dest_dir = path.join("data_dir", "mylist");
    const file_items = imp_nndd._getMyListCopyFiles(
        ["mylist/1", "user/2"], dest_dir);

    t.deepEqual(file_items, [
        { src:path.join("nndd_dir", "myList", "1.xml") , dest: path.join(dest_dir, "mylist-1.xml")},
        { src:path.join("nndd_dir", "user", "2.xml"), dest: path.join(dest_dir, "user-2.xml")},
    ]);
});

test("parse nndd search items", t => {
    const name1 = "テスト1";
    const word1 = "検索1";

    const name2 = "テスト2";
    const word2 = "検索2";

    const name3 = "テスト3";
    const word3 = "検索3";

    const body = 
        '<searchItems>'

        // word, 投稿が新しい
        + `<searchItem name="${encodeURI(name1)}" `
        + `sortType="0" searchType="0" searchWord="${word1}" `
        + 'isDir="false"/>'

        // tag, コメントが多い
        + `<searchItem name="${encodeURI(name2)}" `
        + ` sortType="4" searchType="1" searchWord="${word2}" `
        + 'isDir="false"/>'

        // word, コメントが新しい(該当なし)
        + `<searchItem name="${encodeURI(name3)}" `
        + `sortType="6" searchType="0" searchWord="${word3}" `
        + 'isDir="false"/>'

        + '</searchItems>';

    const imp_nndd = new ImportNNDDSetting();
    const data = imp_nndd._getSearchItems(body);
    t.deepEqual(data, [
        {              
            cond: {
                query: word1,
                search_target: "keyword",
                sort_name: "startTime",
                sort_order: "-",
            },
            title: name1 
        },
        {              
            cond: {
                query: word2,
                search_target: "tag",
                sort_name: "commentCounter",
                sort_order: "-",
            },
            title: name2 
        },
        {              
            cond: {
                query: word3,
                search_target: "keyword",
                sort_name: "startTime",
                sort_order: "-",
            },
            title: name3 
        }
    ]);
});

test("parse nndd nglist", t => {
    const word1 = "テスト1";
    const word2 = "テスト2";

    const body = 
        '<ng>'

        + '<item kind="ID">1</item>'
        + '<item kind="ID">2</item>'

        + `<item kind="単語">${encodeURI(word1)}</item>`
        + `<item kind="単語">${encodeURI(word2)}</item>`

        + '</ng>';

    const imp_nndd = new ImportNNDDSetting();
    const data = imp_nndd._getNGList(body);
    t.deepEqual(data, {
        ng_user_ids: ["1", "2"],
        ng_texts: [word1, word2]
    });
});
