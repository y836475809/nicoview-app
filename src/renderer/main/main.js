import * as riot from 'riot';
import MainRiot from '@renderer/main/main.riot';

const registerApp = riot.component(MainRiot);
registerApp(document.querySelector('#main'));
