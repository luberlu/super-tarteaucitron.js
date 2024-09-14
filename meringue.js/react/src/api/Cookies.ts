import { MeringueParams } from './types';
import { meringueForceExpire, meringueExpireInDay } from "./config";

export class Cookies {
    private cookieName: string;
    private timeExpire: number;
    private parameters: MeringueParams;

    constructor(parameters: MeringueParams) {
        this.cookieName = parameters.cookieName || 'meringue';
        this.parameters = parameters;
        this.timeExpire = this.calculateExpiration();
    }

    // Calculer l'expiration du cookie en fonction des paramètres
    private calculateExpiration(): number {
        const timeExpire = 365 * 86400000; // Valeur par défaut (365 jours)

        if (meringueForceExpire) {
            const expireValue = parseInt(meringueForceExpire);

            if (meringueExpireInDay && expireValue < 365) {
                return expireValue * 86400000;
            } else if (!meringueExpireInDay && expireValue < 8760) {
                return expireValue * 3600000;
            }
        }
        return timeExpire;
    }

    // Créer un cookie
    public create(key: string, status: string) {
        const d = new Date();
        const expireTime = d.getTime() + this.timeExpire;
        const domain = this.parameters.cookieDomain ? `; domain=${this.parameters.cookieDomain}` : '';
        const secure = location.protocol === 'https:' ? '; Secure' : '';

        const regex = new RegExp(`!${key}=(wait|true|false)`, 'g');
        const cookieValue = this.read().replace(regex, '');
        const value = `${this.cookieName}=${cookieValue}!${key}=${status}`;

        d.setTime(expireTime);
        document.cookie = `${value}; expires=${d.toUTCString()}; path=/${domain}${secure}; samesite=lax`;
        this.consentUpdated();
    }

    // Lire un cookie
    public read(): string {
        const nameEQ = `${this.cookieName}=`;
        const ca = document.cookie.split(';');
        
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return '';
    }

    // Purger des cookies spécifiques
    public purge(cookieArray: string[]) {
        cookieArray.forEach(cookie => {
            const cookiePatterns = [
                `${cookie}=; expires=Thu, 01 Jan 2000 00:00:00 GMT; path=/;`,
                `${cookie}=; expires=Thu, 01 Jan 2000 00:00:00 GMT; path=/; domain=.${location.hostname};`,
                `${cookie}=; expires=Thu, 01 Jan 2000 00:00:00 GMT; path=/; domain=.${location.hostname.split('.').slice(-2).join('.')};`
            ];

            cookiePatterns.forEach(pattern => {
                document.cookie = pattern;
            });
        });
    }

    // Vérifier et afficher le nombre de cookies pour chaque service
    public checkCount(key: string, services: Record<string, any>) {
        const serviceCookies = services[key]?.cookies || [];
        let currentCookies = 0;

        serviceCookies.forEach(cookie => {
            if (document.cookie.includes(`${cookie}=`)) {
                currentCookies++;
            }
        });

        const cookieLabel = currentCookies === 1 ? 'cookie' : 'cookies';
        const message = currentCookies
            ? `This service uses ${currentCookies} ${cookieLabel}.`
            : 'No cookies used by this service.';

        console.log(message);
    }

    // Mettre à jour l'événement de consentement
    private consentUpdated() {
        const event = new CustomEvent('tac.consent_updated');
        window.dispatchEvent(event);
    }

    // Vérifier si un élément est dans un tableau
    public crossIndexOf(arr: string[], match: string): boolean {
        return arr.includes(match);
    }

    // Mettre à jour et afficher la liste des cookies
    public number(services: Record<string, any>) {
        const cookies = document.cookie.split(';').sort();
        const cookieCount = cookies.length;
        const s = cookieCount > 1 ? 's' : '';
        let html = '';

        cookies.forEach(cookie => {
            const [name] = cookie.split('=').map(c => c.trim());
            const service = services[name];

            html += service
                ? `<div><strong>${service.name}</strong>: ${cookie}</div>`
                : `<div>${name}</div>`;
        });

        document.getElementById('cookieList')!.innerHTML = html;
        document.getElementById('cookieCount')!.innerHTML = `${cookieCount} cookie${s}`;
    }
}
