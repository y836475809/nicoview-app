import * as riot from 'riot';
import PlayerRiot from '@renderer/player/player-main.riot';

const registerApp = riot.component(PlayerRiot);
registerApp(document.querySelector('#player-main'));