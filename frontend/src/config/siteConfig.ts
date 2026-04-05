import appConfig from './appConfig.json';

const normalizeUrl = (value: string) => value.replace(/\/+$/, '');
const SITE_ORIGIN = normalizeUrl(`${appConfig.protocol}://${appConfig.host}`);

export const APP_URL = SITE_ORIGIN;
export const API_ORIGIN = SITE_ORIGIN;
export const API_BASE_URL = `${SITE_ORIGIN}/api`;
export const MEDIA_URL = `${SITE_ORIGIN}/media`;

export const BASE_URL = APP_URL;
