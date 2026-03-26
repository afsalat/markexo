import appConfig from './appConfig.json';

const normalizeUrl = (value: string) => value.replace(/\/+$/, '');

const buildOrigin = (port: number) => {
    const origin = `${appConfig.protocol}://${appConfig.host}`;
    if ((appConfig.protocol === 'http' && port !== 80) || (appConfig.protocol === 'https' && port !== 443)) {
        return normalizeUrl(`${origin}:${port}`);
    }
    return normalizeUrl(origin);
};

export const APP_URL = buildOrigin(appConfig.frontendPort);
export const API_ORIGIN = buildOrigin(appConfig.backendPort);
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const MEDIA_URL = `${API_ORIGIN}/media`;

export const BASE_URL = APP_URL;
