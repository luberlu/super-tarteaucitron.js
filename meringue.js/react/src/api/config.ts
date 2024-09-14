export const scripts = document.getElementsByTagName('script');
export const meringuePath = (document.currentScript as HTMLScriptElement || scripts[scripts.length - 1]).src.split('?')[0];

export const meringueForceCDN: string = (window as GlobalWindow).meringueForceCDN ?? '';
export const meringueUseMin: string = (window as GlobalWindow).meringueUseMin ?? '';
export const cdn: string | undefined = (window as GlobalWindow).meringueForceCDN === '' ? meringuePath.split('/').slice(0, -1).join('/') + '/' : window.meringueForceCDN;

export const alreadyLaunch: number = (window as GlobalWindow).alreadyLaunch ?? 0;
export const meringueForceLanguage: string = (window as GlobalWindow).meringueForceLanguage ?? '';
export const meringueForceExpire: string = (window as GlobalWindow).meringueForceExpire ?? '';
export const meringueCustomText: string = (window as GlobalWindow).meringueCustomText ?? '';
export const meringueExpireInDay: boolean = (window as GlobalWindow).meringueExpireInDay ?? true;
export const timeExpire: number = 31536000000; // 1 year in milliseconds
