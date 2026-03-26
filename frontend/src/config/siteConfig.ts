import appConfig from './appConfig.json';

const normalizeUrl = (value: string) => value.replace(/\/+$/, '');

const buildOrigin = (port: number) =>
    normalizeUrl(`${appConfig.protocol}://${appConfig.host}:${port}`);

export const APP_URL = buildOrigin(appConfig.frontendPort);
export const API_ORIGIN = buildOrigin(appConfig.backendPort);
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const MEDIA_URL = `${API_ORIGIN}/media`;
export const BASE_URL = APP_URL;
