
/**
 * 再生履歴
 * @typedef {Object} HistoryItem
 * @property {string} thumb_img 
 * @property {string} id
 * @property {string} title
 * @property {number} play_date
 * @property {number} time
 */

/**
 * サイドバーのリストアイテム
 * @typedef {Object} ListItem 
 * @property {string} title 表示名
 * @property {string} [state] 表示状態 保存時に削除
 * @property {boolean} marked true:アイコンを赤色にする
 */

/**
 * @typedef {Object} DownloadSchedule 
 * @property {{hour:number, minute:number}} date
 * @property {boolean} enable
 */

/**
 * @typedef {Object} DownloadItem 
 * @property {string} id
 * @property {string} title
 * @property {number} state
 * @property {string} thumb_img
 */
 
/**
 * @typedef {Object} MyListListItem 
 * @property {string} title
 * @property {string} mylist_id id
 * @property {string} creator
 */

/**
 * @typedef {Object} MyListVideoItem
 * @property {number} no
 * @property {string} title
 * @property {string} id
 * @property {string} link
 * @property {string} description
 * @property {string} thumb_img
 * @property {string} length
 * @property {string} date
 */

/**
 * @typedef {Object} MyListData 
 * @property {string} title
 * @property {string} mylist_id
 * @property {string} link
 * @property {string} creator
 * @property {string} description
 * @property {MyListVideoItem[]} items
 */

/**
 * ライブラリデータ
 * @typedef {Object} LibraryData 
 * @property {string} data_type
 * @property {string} title
 * @property {string} video_type
 * @property {number} dirpath_id
 * @property {string} dirpath
 * @property {string} common_filename
 * @property {string} thumbnail_size
 * @property {number} modification_date
 * @property {number} creation_date
 * @property {number} pub_date
 * @property {number} last_play_date
 * @property {number} play_count
 * @property {string[]} tags
 * @property {boolean} is_economy
 * @property {boolean} is_deleted
 * @property {string} video_id
 * @property {number} play_time
 */

/**
 * ライブラのグリッドテーブルのデータ
 * @typedef {Object} LibraryGridTableData 
 * @property {string} data_type
 * @property {string} title
 * @property {string} video_type
 * @property {number} dirpath_id
 * @property {string} dirpath
 * @property {string} common_filename
 * @property {string} thumbnail_size
 * @property {string} thumb_img
 * @property {number} modification_date
 * @property {number} creation_date
 * @property {number} pub_date
 * @property {number} last_play_date
 * @property {number} play_count
 * @property {string} tags
 * @property {boolean} is_economy
 * @property {boolean} is_deleted
 * @property {string} video_id
 * @property {number} play_time
 */

/**
 * ライブラリ検索リストアイテム
 * @typedef {Object} LibrarySearchItem 
 * @property {string} title
 * @property {string} query
 * @property {string[]} target_ids
 * @property {boolean} [marked]
 */

/**
 * ニコニコ動画検索ソート種類
 * @typedef {Object} SearchSortItem 
 * @property {string} title
 * @property {string} name
 * @property {string} order
 */

/**
 * ニコニコ動画検索対象条件
 * @typedef {Object} SearchTargetItem 
 * @property {string} title
 * @property {string} target
 */

/**
 * ニコニコ動画検索条件
 * @typedef {Object} SearchCond 
 * @property {string} query
 * @property {string} sort_name
 * @property {string} sort_order
 * @property {string} search_target
 * @property {number} page
 */

/**
 * ニコニコ動画検索サイドバーのリストアイテム
 * @typedef {Object} SearchListItem 
 * @property {string} title
 * @property {boolean} [marked]
 * @property {SearchCond} cond
 */

/**
 * ニコニコ動画検索結果の検索数、ページ数情報
 * @typedef {Object} SearchPageInfo 
 * @property {number} page_num
 * @property {number} total_page_num
 * @property {number} search_result_num
 */

/**
 * ニコニコ動画検索結果(グリッドテーブル情報)
 * @typedef {Object} SearchResultItem 
 * @property {string} thumbnailUrl
 * @property {string} contentId
 * @property {string} title
 * @property {number} viewCounter
 * @property {number} commentCounter
 * @property {number} contenlengthSecondstId
 * @property {number} startTime
 * @property {string[]} tags
 */

/**
 * ニコニコ動画検索結果
 * @typedef {Object} SearchResult 
 * @property {SearchPageInfo} page_ifno
 * @property {SearchResultItem[]} list
 */

/**
 * 動画更新結果
 * @typedef {Object} NicoUpdateResult 
 * @property {string} video_id
 * @property {{}} props
 * @property {boolean} update_thumbnail
 */

/**
 * ブックマークリストアイテム
 * @typedef {Object} BookmarkListItem 
 * @property {string} title
 * @property {string} type
 * @property {{video_id:string, time:number}} data
 */

/**
 * ブックマーク
 * @typedef {Object} BookmarkItem 
 * @property {string} title
 * @property {string} id
 * @property {number} time
 */

/**
 * 後で見る(スタック)
 * @typedef {Object} StackItem 
 * @property {string} title
 * @property {string} id
 * @property {string} thumb_img
 * @property {number} [time]
 * @property {string} [state]
 */

/**
 * ニコニコ動画コメントのスレッド情報
 * @typedef {Object} CommentThreadData
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
 * owner
 * @typedef {Object} OwnerInfo 
 * @property {string} iconURL
 * @property {string} id
 * @property {string} nickname
 */

/**
 * 動画タグ
 * @typedef {Object} TagInfo 
 * @property {string} id
 * @property {boolean} isLocked
 * @property {string} name
 */

/**
 * 動画情報
 * @typedef {Object} VideoInfo 
 * @property {string} description
 * @property {number} duration
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
 * ThumbInfo
 * @typedef {Object} ThumbInfo 
 * @property {OwnerInfo} owner
 * @property {TagInfo[]} tags
 * @property {{commentCount:number}} thread
 * @property {VideoInfo} video
 */

/**
 * ViewInfo
 * @typedef {Object} ViewInfo 
 * @property {boolean} is_deleted
 * @property {boolean} is_economy
 * @property {ThumbInfo} thumb_info
 */

/**
 * PlayStateInfo
 * @typedef {Object} PlayStateInfo 
 * @property {boolean} [is_online]
 * @property {boolean} [is_saved]
 * @property {number} time
 */

/**
 * NicoPlayData
 * @typedef {Object} NicoPlayData 
 * @property {string} video_id
 * @property {string} title
 * @property {string} thumbnailURL
 * @property {boolean} online
 */

/**
 * Comment params
 * @typedef {Object} CommentParams
 * @property {boolean} auto_sync_checked
 * @property {number} auto_sync_interval
 * @property {number} auto_sync_threshold
 * @property {number} fps
 * @property {boolean} do_limit
 * @property {number} duration_sec
 */

/**
 * player play state
 * @typedef {Object} PlayerPlayState
 * @property {boolean} is_online
 * @property {boolean} is_saved
 * @property {number} time
 */

/**
 * player play data
 * @typedef {Object} PlayerPlayData
 * @property {{src:string, type:string}} video_data
 * @property {CommentItem[]} comments
 * @property {PlayerPlayState} state
 */

/**
 * NG comment item
 * @typedef {Object} NGCommentItem
 * @property {number} id
 * @property {string} title
 * @property {string} type text or user_id
 * @property {string} value
 */

/**
 * NG item
 * @typedef {Object} NGItems
 * @property {string[]} ng_texts
 * @property {string[]} ng_user_ids
 */

/** 
 * @typedef {import("@js/my-observable").MyObservable} MyObservable
 * @typedef {import("node_modules/riot/riot").RiotComponent} RiotComponent
 */