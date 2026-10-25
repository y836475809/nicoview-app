import { Emitter } from 'mitt';

export interface DialogEventMap {
  'dialog:open': { showok: boolean; showcancel: boolean, message: string };
  'dialog:close': void;
  'dialog:update-message': { message: string };
  'dialog:ok': void;
  'dialog:cancel': void;
}
export type DialogEmitter = Emitter<DialogEventMap>;
