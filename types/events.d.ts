export interface DialogEventMap {
  'dialog:open': { showok: boolean; showcancel: boolean, message: string };
  'dialog:close': void;
  'dialog:update-message': { message: string };
  'dialog:ok': void;
  'dialog:cancel': void;
}

import { Emitter } from 'mitt';
export type DialogEmitter = Emitter<DialogEventMap>;