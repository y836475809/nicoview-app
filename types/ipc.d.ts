

interface IpcChannelMap {
  'user:save': {
    args: [userData: { name: string; age: number }];
    return: Promise<{ success: boolean; id: string }>;
  };
  'app:version': {
    args: [];
    return: string;
  };
}

type IpcChannels = {
  'library:getItems': (event: MainEvent) => Promise<LibraryItem[]>;

//   'library:exists': (event: MainEvent, videoId: string) => Promise<boolean>;
//   'library:getVideoUrl': (event: MainEvent, videoId: string) => Promise<string | null>;
//   'library:getThumbInfo': (event: MainEvent, videoId: string) => Promise<ThumbInfo | null>;
//   'library:getComments': (event: MainEvent, videoId: string) => Promise<Comment[]>;
//   'sendPlayer:play': (event: MainEvent, videoId: string, online: boolean) => Promise<void>;
//   'player:showContextMenu': (
//     event: MainEvent,
//     data: string,
//     type: 'text' | 'link'
//   ) => Promise<void>;
//   'library:showContextMenu': (
//     event: MainEvent,
//     videoId: string
//   ) => Promise<void>;
};

type TailParameters<T> = T extends (event: MainEvent, ...args: infer P) => any ? P : never;

type ChannelsParams<K extends keyof IpcChannels> = TailParameters<IpcChannels[K]>;
type ChannelsReturn<K extends keyof IpcChannels> = ReturnType<IpcChannels[K]>;

interface MyIpcMain {
    handle<K extends keyof IpcChannels>(
        channel: K, listener: IpcChannels[K]): void;
}

type onIpcChannels = {
  onDescriptionLinkClicked: (link: string, online: boolean) => void;
  play: (videoId: string, online: boolean) => void;
};

interface pp {
    invoke: <K extends keyof IpcChannels>(
        channel: K, ...args: ChannelsParams<K>
    ) => Promise<ChannelsReturn<K>>;
    on: <K extends keyof onIpcChannels>(
        channel: K, listener: onIpcChannels[K]
    ) => void;
};

// declare global {
//   interface window {
//     electronAPI: pp;
//   }
// }
interface Window {
  electronAPI: pp;
}