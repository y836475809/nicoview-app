import { IpcMainInvokeEvent } from "electron";

interface ContextMenuItem {
  label: string;
  action: string;
}

type LibraryCommand 
  = 'playOnline'|'stack'|'bookmark'|'delete';

type DownloadCommand 
  = 'delete';

type PlayerCommand 
  = 'stack'|'bookMark'|'bookMarkTime'|'download'|'reload';

type MainEvent = IpcMainInvokeEvent;

type IpcChannels = {
  'player:moundted':(event: MainEvent) => Promise<void>;

  'config:get': <K extends keyof AppConfig>(event: MainEvent) => Promise<AppConfig>;
  'config:set': <K extends keyof AppConfig>(event: MainEvent, key: K, value: AppConfig[K]) => Promise<void>;

  'showMsgBox': (event: MainEvent, buttons: 'ok'|'okCancel', message: string) => Promise<boolean>;
  'showErrorMsgBox': (event: MainEvent, message: string) => Promise<void>;
  'showSelectFolderDialog': (event: MainEvent) => Promise<string|null>;
  'showSelectFileDialog': (event: MainEvent) => Promise<string|null>;

  'library:showContextMenu': (event: MainEvent, videoId: string) => Promise<LibraryCommand|null>;
  'library:getItems': (event: MainEvent) => Promise<LibraryItem[]>;
  'library:getItem': (event: MainEvent, videoId: string) => Promise<LibraryItem|null>;
  'library:addItem': (event: MainEvent, item: LibraryItem) => Promise<void>;
  'library:deleteItem': (event: MainEvent, videoId: string) => Promise<Error|null>;
  'library:exists': (event: MainEvent, videoId: string) => Promise<boolean>;
  'library:getPlayData': (event: MainEvent, videoId: string) => Promise<PlayData|null>;
  'library:getSearchItems': (event: MainEvent) => Promise<LibrarySearchItem[]>;
  'library:updateSearchItems': (event: MainEvent, items: LibrarySearchItem[]) => Promise<void>;
  'library:filter': (event: MainEvent, query: string) => Promise<void>;
  'library:convertToMp4': (event: MainEvent, videoId: string) => Promise<Error|null>;

  'download:showContextMenu': (event: MainEvent, videoId: string) => Promise<DownloadCommand|null>;
  'download:addItem': (event: MainEvent, item: DownloadItem) => Promise<void>;
  'download:getItems': (event: MainEvent) => Promise<DownloadItem[]>;
  'download:saveItems': (event: MainEvent, items: DownloadItem[]) => Promise<void>;
  'download:getMarkedIds': (event: MainEvent) => Promise<string[]>;
  'download:startDownload': (event: MainEvent, videoId: string) => Promise<void>;
  'download:cancelDownload': (event: MainEvent) => Promise<void>;
  'download:deleteMark': (event: MainEvent, videoId: string ) => Promise<void>;

  'history:addItem': (event: MainEvent, item: HistoryItem) => Promise<void>;
  'history:getItems': (event: MainEvent) => Promise<HistoryItem[]>;
  'history:saveItems': (event: MainEvent, items: HistoryItem[]) => Promise<void>;

  'mylist:fetchPage': (event: MainEvent, mylistId: string) => Promise<MyListItem>;
  'mylist:getItems': (event: MainEvent) => Promise<MyListItem[]>;
  'mylist:saveItems': (event: MainEvent, items: MyListItem[]) => Promise<void>;
  'mylist:loadPage': (event: MainEvent, mylistId: string) => Promise<void>;
  'mylist:getPage': (event: MainEvent, mylistId: string) => Promise<MyListItem>;
  'mylist:savePage': (event: MainEvent, mylistId: string) => Promise<void>;
  'mylist:deletPage': (event: MainEvent, mylistId: string) => Promise<void>;
  'mylist:saveImageCache': (event: MainEvent, mylistIds: string[]) => Promise<void>;
  'mylist:getImageHtml': (event: MainEvent, mylistId: string, url: string) => Promise<string>;
  'mylist:loadImageCache': (event: MainEvent, mylistIds: string[], mylistId: string) => Promise<void>;
  'mylist:setImageIds': (event: MainEvent, mylistIds: string[]) => Promise<void>;
  'mylist:setImage': (event: MainEvent, mylistId: string, imageElem: HTMLImageElement) => Promise<void>;
  
  'stack:getItems': (event: MainEvent) => Promise<StackItem[]>;
  'stack:saveItems': (event: MainEvent, items: StackItem[]) => Promise<void>;
  'stack:addItem': (event: MainEvent, item: StackItem) => Promise<void>;

  'bookmark:getItems': (event: MainEvent) => Promise<BookmarkItem[]>;
  'bookmark:saveItems': (event: MainEvent, items: BookmarkItem[]) => Promise<void>;
  'bookmark:addItem': (event: MainEvent, item: BookmarkItem) => Promise<void>;
  'bookmark:showContextMenu': (event: MainEvent, videoId: string) => Promise<void>;
  
  'nicoSearch:getItems': (event: MainEvent) => Promise<NicoSearchItem[]>;
  'nicoSearch:saveItems': (event: MainEvent, items: NicoSearchItem[]) => Promise<void>;

  'ngList:getItems': (event: MainEvent) => Promise<NGCommentItem[]>;
  'ngList:saveItems': (event: MainEvent, items: NGCommentItem[]) => Promise<void>;

  'player:showContextMenu': (event: MainEvent, videoId: string) => Promise<PlayerCommand|null>;
  'player:play': (event: MainEvent, videoId: string, online: boolean) => Promise<void>;
};

type TailParameters<T> = T extends (event: IpcMainInvokeEvent, ...args: infer P) => any ? P : never;

type ChannelsParams<K extends keyof IpcChannels> = TailParameters<IpcChannels[K]>;
type ChannelsReturn<K extends keyof IpcChannels> = ReturnType<IpcChannels[K]>;


type onIpcChannels = {
  'library:addItem': (item: LibraryItem) => void;
  'library:deleteItem': (item: LibraryItem) => void;
  'library:filter': (query: string) => void;
  'library:cmdDeleteItem': (videoId: string) => void;

  'download:addItem': (item: DownloadItem) => void;
  'download:addMark': (videoId: string, mark: 'reg'|'downloaded') => void;
  'download:deleteMark': (videoId: string, mark: 'reg'|'downloaded') => void;
  'download:DownloadProgress': (videoId: string, state: DownloadState, message: string) => Promise<void>;
  'download:DownloadResult': (videoId: string, result: DownloadResult, message: string) => Promise<void>;
  
  'mylist:loadPage': (mylistId: string) => void;

  'history:addItem': (item: HistoryItem) => void;

  'stack:additem': (item: StackItem) => void;
  'bookmark:additem': (item: BookmarkItem) => void;

  'player:play': (videoId: string, online: boolean) => void;
};

type onTailParameters<T> = T extends (...args: infer P) => any ? P : never;
type onChannelsParams<K extends keyof onIpcChannels> = onTailParameters<onIpcChannels[K]>;

global {
  interface MyIpcMain {
    handle<K extends keyof IpcChannels>(
        channel: K, listener: IpcChannels[K]): void;
    handleOnce<K extends keyof IpcChannels>(
        channel: K, listener: IpcChannels[K]): void;
  }

  type MySend =  <K extends keyof onIpcChannels>(channel: K, ...args: onChannelsParams<K>) => void;

  interface api {
      invoke: <K extends keyof IpcChannels>(
          channel: K, ...args: ChannelsParams<K>
      ) => Promise<ChannelsReturn<K>>;
      on: <K extends keyof onIpcChannels>(
          channel: K, listener: onIpcChannels[K]
      ) => void;
  };

  interface Window {
    electronAPI: api;
  }
}