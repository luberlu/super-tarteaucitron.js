import services from "./services";
import { MeringueParams, Service } from './types';
import { cdn } from "./config";
import { EventEmitter } from "./EventEmitter";
import { Cookies } from "./Cookies";

export default class Meringue extends EventEmitter {
    version: number;
    cdn?: string;
    user: Record<string, any>;
    lang: Record<string, any>;
    services: Record<string, any>;
    added: boolean[];
    idprocessed: any[];
    categories: string[];
    state: Record<string, any>;
    launch: boolean[];
    parameters: MeringueParams;
    isAjax: boolean;
    reloadThePage: boolean;
    language: string;
    isAdBlock: boolean;
    isLoaded: boolean;
    job: string[];
    
    private cookiesManager: Cookies;

    constructor(params: MeringueParams = {}) {
        super();

        this.version = 1.19;
        this.cdn = cdn;
        this.user = {};
        this.lang = {};
        this.services = services;
        this.isLoaded = false;
        this.added = [];
        this.idprocessed = [];
        this.categories = [
            'ads', 'analytic', 'api', 'comment', 'social', 
            'support', 'video', 'other', 'google'
        ];
        this.state = {};
        this.launch = [];
        this.isAjax = false;
        this.reloadThePage = false;
        this.language = 'en';
        this.lang = {};
        this.job = [];
        this.isAdBlock = false;
        this.parameters = this.setParameters(params);

        this.cookiesManager = new Cookies(this.parameters);
    }

    private async load() {
        if (this.isLoaded) return;

        console.log('Meringue loading...');
        
        this.language = this.getLanguage();
        await this.loadLang();

        this.setOrientation();
        this.sortCategories();

        try {
            await this.testAdBlock();
        } catch (err) {
            console.log('Ad block is enabled or script loading failed:', err);
            this.setProperty('isAdBlock', true); 
        }

        if(!this.isAdBlock || !this.parameters.adblocker){

            if (this.job.length > 0) {
               this.job = this.cleanArray(this.job, this.services);

                this.job.forEach(serviceKey => {
                    this.addService(serviceKey);
                });
            }
        }

        this.isLoaded = true;
    }

     public allowService(serviceId: string) {
        console.log('allow man')
        if (this.services[serviceId]) {
            this.state[serviceId] = true;
            this.cookiesManager.create(serviceId, 'true');

            if (typeof this.services[serviceId].js === 'function') {
                this.services[serviceId].js();
            }

            this.emit('serviceStatus', serviceId, true); 
        }
    }

    public disallowService(serviceId: string) {
        if (this.services[serviceId]) {
            this.state[serviceId] = false;
            this.cookiesManager.create(serviceId, 'false');

            if (typeof this.services[serviceId].fallback === 'function') {
                this.services[serviceId].fallback();
            }

            this.emit('serviceStatus', serviceId, false); 
        }
    }

    // Fonction pour ajouter des services et notifier via les listeners
    public addService(serviceId: string) {
        const service = this.services[serviceId];
        if (!service) return;

        if (this.parameters.alwaysNeedConsent === true) {
            service.needConsent = true;
        }

        // Gérer l'état du service (autorisé/refusé/en attente)
        const cookie = this.cookiesManager.read();

        const isAllowed = cookie.includes(`${service.key}=true`);
        const isDenied = cookie.includes(`${service.key}=false`);

        let state = 'wait';

        if (isAllowed) {
            state = 'true';
        } else if (isDenied) {
            state = 'false';
        }

        // Met à jour l'état du service dans Meringue
        this.state[service.key] = state === 'true';

        if (this.state[service.key]) {
            if (typeof service.activate === 'function') service.activate();
        } else if (isDenied) {
            if (typeof service.fallback === 'function') service.fallback();
        }

        this.emit('serviceStatus', serviceId, this.state[service.key]); 

        // Ajouter le service à la liste des tâches
        // this.job.push(serviceId);
    }

    public init() {
        /*
        if (alreadyLaunch === 0) {
            alreadyLaunch = 1;
            this.load();

            console.log('content initialisé');

            return this;
        }*/

        this.load();
        return this;
    }

    private setParameters(params: MeringueParams): MeringueParams {
        const defaults: MeringueParams = {
            adblocker: false,
            hashtag: '#meringue',
            cookieName: 'meringue',
            highPrivacy: true,
            orientation: 'middle',
            bodyPosition: "bottom",
            removeCredit: false,
            showAlertSmall: false,
            showDetailsOnClick: true,
            showIcon: true,
            iconPosition: "BottomRight",
            cookieslist: false,
            handleBrowserDNTRequest: false,
            DenyAllCta: true,
            AcceptAllCta: true,
            moreInfoLink: true,
            privacyUrl: "",
            useExternalCss: false,
            useExternalJs: false,
            mandatory: true,
            mandatoryCta: true,
            closePopup: false,
            groupServices: false,
            serviceDefaultState: 'wait',
            googleConsentMode: true,
            partnersList: false,
            alwaysNeedConsent: false
        };

        return {
            ...defaults,
            ...params
        };
    }

    private sortCategories(): void {
        this.categories = this.categories.sort((a, b) => {
            if (this.lang[a].title > this.lang[b].title) { return 1; }
            if (this.lang[a].title < this.lang[b].title) { return -1; }
            return 0;
        });
    }

    private setOrientation(): void {
        const isReadmoreLink = this.parameters.readmoreLink && window.location.href === this.parameters.readmoreLink;
        const isPrivacyUrl = this.parameters.privacyUrl ? window.location.href.includes(this.parameters.privacyUrl) : false;

        if ((isReadmoreLink || isPrivacyUrl) && this.parameters.orientation === "middle") {
            this.parameters.orientation = "bottom";
        }
    }

    public addJob(job: string) {
        this.setProperty('job', [
            ...this.job,
            job
        ])

        return this;
    }

    public addJobs(...jobs: string[]){
        this.setProperty('job', [
            ...this.job,
            ...jobs
        ])

        return this;
    }

    // Fonction séparée pour rechercher un service par son 'key' dans un tableau de services
    private findServiceByKey = (key: string, services: Service[]) => {
        return services.find(service => service.key === key);
    };

    private cleanArray(arr: string[], services: Record<string, any>): string[] {
        const seen: Record<string, boolean> = {}; // Pour garder trace des éléments déjà vus
        const uniqueServices = arr.filter(item => {
            if (!seen[item] && services[item] !== undefined) {
                seen[item] = true;
                return true;
            }
            return false;
        });
    
        return uniqueServices.sort((a, b) => 
            (services[a].type + services[a].key).localeCompare(services[b].type + services[b].key)
        );
    }
    

    private async testAdBlock() {
        return await this.addInternalScript(`./meringue.advertising.js`);
    }

    private async loadLang() {
        try {
            const res = await fetch(`./lang/${this.language}.json`);
            let lang = await res.json();

            this.setProperty('lang', lang);
        } catch (error) {
            console.error('Failed to load language file', error);
        }
    }

    private async loadFile(url: string) {
        try {
            return await fetch(url);
        } catch (error) {
            console.error(`Failed to load file: ${url}`, error);
        }
    }

    private getLanguage(): string {
        const availableLanguages = [
            'ar', 'bg', 'ca', 'cn', 'cs', 'da', 'de', 'et', 'el', 'en', 'es', 'fi', 'fr', 'hr', 'hu', 'it',
            'ja', 'ko', 'lb', 'lt', 'lv', 'nl', 'no', 'oc', 'pl', 'pt', 'ro', 'ru', 'se', 'sk', 'sv', 'tr',
            'uk', 'vi', 'zh'
        ];
    
        const defaultLanguage = 'en';
    
        // Vérifier la langue forcée
        if (meringueForceLanguage && availableLanguages.includes(meringueForceLanguage)) {
            return meringueForceLanguage;
        }
    
        // Vérifier la langue de l'attribut lang de la balise HTML
        const HTMLlang = document.documentElement.getAttribute("lang")?.slice(0, 2);
        if (HTMLlang && availableLanguages.includes(HTMLlang)) {
            return HTMLlang;
        }
    
        // Vérifier la langue du navigateur
        const lang = navigator.language?.slice(0, 2);
        if (lang && availableLanguages.includes(lang)) {
            return lang;
        }
    
        // Retourner la langue par défaut si aucune correspondance
        return defaultLanguage;
    }

    private addScript(
        url: string, 
        id?: string, 
        callback?: () => void, 
        execute: boolean = true, 
        attrName?: string, 
        attrVal?: string, 
        internal: boolean = true
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            if (execute === false) {
                if (typeof callback === 'function') {
                    callback();
                }
                resolve();
            } else {
                const script = document.createElement('script');
                let done = false;
    
                if (id !== undefined) {
                    script.id = id;
                }
    
                script.async = true;
                script.src = url;
    
                if (attrName !== undefined && attrVal !== undefined) {
                    script.setAttribute(attrName, attrVal);
                }
    
                script.onerror = () => {
                    reject(new Error(`Failed to load script: ${url}`));
                };
    
                script.onload = () => {
                    if (!done) {
                        done = true;
                        if (typeof callback === 'function') {
                            callback();
                        }
                        resolve();
                    }
                };
    
                if (!this.parameters.useExternalJs || !internal) {
                    document.getElementsByTagName('head')[0].appendChild(script);
                } else {
                    resolve(); // Si on n'ajoute pas le script, on résout la promesse
                }
            }
        });
    }
    
    private addInternalScript(
        url: string, 
        id?: string, 
        callback?: () => void, 
        execute: boolean = true, 
        attrName?: string, 
        attrVal?: string
    ): Promise<void> {
        return this.addScript(url, id, callback, execute, attrName, attrVal, true);
    }
    
}

