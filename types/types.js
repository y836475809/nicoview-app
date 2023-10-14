
/**
 * 再生履歴
 * @typedef {Object} HistoryItem
 * @property {string} thumb_img 
 * @property {string} video_id
 * @property {string} title
 * @property {number} play_date
 * @property {number} time
 */

/**
 * サイドバーのリストアイテム
 * @typedef {Object} ListItem 
 * @property {string} title 表示名
 * @property {string} state 表示状態
 * @property {boolean} marked true:アイコンを赤色にする
 */

/**
 * @typedef {Object} DownloadSchedule 
 * @property {{hour:number, minute:number}} date
 * @property {boolean} enable
 */

/**
 * ダウンロード
 * @typedef {Object} RegDownloadItem 
 * @property {string} video_id
 * @property {string} title
 * @property {number} state wait: 0,downloading: 1,complete: 2, error: 3
 * @property {string} thumb_img
 */

/**
 *  ダウンロード完了時に通達されるダウンロードデータ
 * @typedef {Object} DownloadedItem 
 * @property {string} data_type json or xml
 * @property {string} dirpath
 * @property {string} video_id
 * @property {string} title
 * @property {string} video_type
 * @property {boolean} is_economy
 * @property {number} play_time
 * @property {number} pub_date
 * @property {string[]} tags
 * @property {boolean} is_deleted
 * @property {string} thumbnail_size S or L
 */
 
 
/**
 * mylistの見出し
 * @typedef {Object} MyListIndexItem 
 * @property {string} title
 * @property {string} mylist_id id
 * @property {string} creator
 */

/**
 * mylistの動画
 * @typedef {Object} MyListVideoItem
 * @property {number} no
 * @property {string} title
 * @property {string} video_id
 * @property {string} link
 * @property {string} description
 * @property {string} thumb_img
 * @property {string} length
 * @property {string} date
 */

/**
 * mylist
 * @typedef {Object} MyListItem 
 * @property {string} title
 * @property {string} mylist_id
 * @property {string} link
 * @property {string} creator
 * @property {string} description
 * @property {MyListVideoItem[]} items
 */

/**
 * ライブラリの動画情報
 * @typedef {Object} LibraryItem
 * @property {string} data_type
 * @property {string} title
 * @property {string} video_id
 * @property {string} video_type
 * @property {string} dirpath_id
 * @property {string} dirpath
 * @property {string} common_filename
 * @property {string} thumbnail_size
 * @property {string} [thumb_img]
 * @property {number} modification_date
 * @property {number} creation_date
 * @property {number} pub_date
 * @property {number} last_play_date
 * @property {number} play_count
 * @property {number} play_time
 * @property {string[]} tags
 * @property {boolean} is_economy
 * @property {boolean} is_deleted
 */

/**
 * ライブラリ検索条件
 * @typedef {Object} LibrarySearchItem 
 * @property {string} title
 * @property {string} query
 * @property {string[]} target_ids
 * @property {boolean} [marked]
 */

/**
 * ニコニコ動画検索ソート種類
 * 検索ページのソート種類項目を生成するためのデータ
 * @typedef {Object} NicoSearchSortItem 
 * @property {string} title
 * @property {string} name
 * @property {string} order
 */

/**
 * ニコニコ動画検索対象条件
 * 検索ページの検索対象項目を生成するためのデータ
 * @typedef {Object} NicoSearchTargetItem 
 * @property {string} title
 * @property {string} target
 */

/**
 * ニコニコ動画検索条件
 * @typedef {Object} NicoSearchParamsItem
 * @property {string} query
 * @property {string} sort_name
 * @property {string} sort_order
 * @property {string} search_target
 * @property {number} page
 */

/**
 * ニコニコ動画検索結果の検索数、ページ数情報
 * @typedef {Object} NicoSearchResultPageItem 
 * @property {number} page_num
 * @property {number} total_page_num
 * @property {number} search_result_num
 */

/**
 * ニコニコ動画検索結果の動画情報
 * @typedef {Object} NicoSearchResultVideoItem 
 * @property {string} thumbnailUrl
 * @property {string} contentId
 * @property {string} title
 * @property {number} viewCounter
 * @property {number} commentCounter
 * @property {number} lengthSeconds
 * @property {number} startTime
 * @property {string} tags
 */

/**
 * ニコニコ動画検索結果
 * @typedef {Object} NicoSearchResultItem
 * @property {NicoSearchResultPageItem} page_ifno
 * @property {NicoSearchResultVideoItem[]} list
 */

/**
 * 動画更新結果
 * @typedef {Object} NicoUpdateResult 
 * @property {string} video_id
 * @property {{}} props
 * @property {boolean} update_thumbnail
 */

/**
 * ブックマーク
 * @typedef {Object} BookmarkItem 
 * @property {string} title
 * @property {string} video_id
 * @property {number} time
 * @property {boolean} [marked]
 */

/**
 * 後で見る(スタック)
 * @typedef {Object} StackItem 
 * @property {string} title
 * @property {string} video_id
 * @property {string} thumb_img
 * @property {number} [time]
 * @property {string} [state]
 */

/**
 * ニコニコ動画コメントのスレッド情報
 * @typedef {Object} CommentThreadItem
 * @property {number} [fork]
 * @property {number} last_res 
 * @property {number} resultcode 
 * @property {number} revision
 * @property {number} server_time
 * @property {string} thread 
 * @property {string} ticket 
 */

/**
 * 動画コメント
 * @typedef {Object} CommentItem
 * @property {number} [id] 順番 コメントリスト表示時に追加される
 * @property {number} [anonymity] 未使用
 * @property {string} content 本文
 * @property {number} date
 * @property {number} [date_usec] 未使用 
 * @property {string} mail
 * @property {number} no
 * @property {string} [thread] 未使用
 * @property {string} user_id
 * @property {number} vpos
 */

/**
 * @typedef {Object} CommentThreadData
 * @property {CommentThreadItem} thread 
 */

/**
 * @typedef {Object} CommentChatData
 * @property {CommentItem} chat
 */

/**
 * 動画に流れるコメント要素
 * @typedef {Object} CommentElm
 * @property {string} content 本文 
 * @property {number} duration
 * @property {number} no
 * @property {string} user_id
 * @property {number} vpos
 * @property {string} type ue:固定、上に表示 shita:固定、下に表示 naka:流れる
 * @property {string} color 文字色
 * @property {string} font_size フォントサイズ
 */

/**
 * オーナー情報
 * @typedef {Object} Owner 
 * @property {string} iconURL
 * @property {string} id
 * @property {string} nickname
 */

/**
 * 動画タグ
 * @typedef {Object} VideoTag 
 * @property {string} id
 * @property {boolean} isLocked
 * @property {string} name
 */

/**
 * ニコニコ動画情報
 * 動画情報
 * @typedef {Object} ThumbVideo
 * @property {string} description
 * @property {string} duration 動画時間(mm:ssの形式)
 * @property {string} largeThumbnailURL
 * @property {number} mylistCount
 * @property {string} postedDateTime
 * @property {string} thumbnailURL
 * @property {string} title
 * @property {string} video_id
 * @property {string} video_type
 * @property {number} viewCount
 */

/**
 * ニコニコ動画情報
 * オーナー、タグ、動画情報
 * @typedef {Object} ThumbInfo 
 * @property {Owner} owner
 * @property {VideoTag[]} tags
 * @property {{commentCount:number}} thread
 * @property {ThumbVideo} video
 * @property {boolean} [is_deleted] true:動画がニコニコ動画から削除済み
 * @property {boolean} [is_economy] true:エコノミー動画
 */

/**
 * 動画再生で使用するオプション
 * @typedef {Object} VideoOption 
 * @property {boolean} [is_online] true:オンライン再生を優先
 * @property {boolean} [is_saved] true:動画保存済み
 * @property {number} [time] 再生開始時間(sec)
 */

/**
 * ビデオ要素に設定する値
 * @typedef {Object} VideoElemProp
 * @property {string} src 動画url
 * @property {string} type 動画形式
 */

/**
 * 動画再生情報
 * @typedef {Object} PlayData
 * @property {VideoElemProp} video_elem_prop ビデオ要素に設定する値
 * @property {CommentItem[]} comments 動画コメント
 * @property {VideoOption} video_option 再生状態
 */

/**
 * 現在再生中の動画情報
 * 再読み込み、ブックマーク、「後で見る」を実行に情報
 * @typedef {Object} CurrentPlayVideo 
 * @property {string} video_id
 * @property {string} title
 * @property {string} thumbnailURL
 * @property {boolean} online
 */

/**
 * コメント表示の設定
 * @typedef {Object} CommentConfig
 * @property {boolean} auto_sync_checked true:動画時間にコメント同期
 * @property {number} auto_sync_interval 同期チェック間隔(sec)
 * @property {number} auto_sync_threshold 同期ずれ時間閾値(sec) 同期チェック時これ以上ずれていたら同期調整する
 * @property {number} fps コメントfps, 大きいほど動きが滑らか
 * @property {boolean} do_limit true:一分間に表示するコメント数を制限する
 * @property {number} duration_sec コメント表示時間
 */

/**
 * NG comment item
 * @typedef {Object} NGCommentItem
 * @property {string} type text or user_id
 * @property {string} value
 */


/**
 * NicoGrid SortParam
 * @typedef {Object} NicoGridSortParam
 * @property {string} id
 * @property {boolean} asc
 */

/**
 * NicoGrid columns state
 * @typedef {Object} NicoGridColumnsState
 * @property {string} id
 * @property {number} width
 */

/**
 * NicoGrid options
 * @typedef {Object} NicoGridOptions
 * @property {Number} [header_height]
 * @property {Number} [row_height] 
 * @property {NicoGridSortParam} [sort_param]
 * @property {string[]} [filter_target_ids]
 * @property {Number} [img_cache_capacity]
 * @property {Number} [view_margin_num]
 */

/**
 * NicoGrid state
 * @typedef {Object} NicoGridState
 * @property {NicoGridColumnsState[]} columns
 * @property {NicoGridSortParam} sort_param
 */

/** 
 * @typedef {import("@lib/my-observable").MyObservable} MyObservable
 * @typedef {import("@lib/modal-dialog").ModalDialog} ModalDialog
 * @typedef {import("node_modules/riot/riot").RiotComponent} RiotComponent
 */