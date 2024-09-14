import services from "./services";
import { MeringueParams } from './types';
import { cdn } from "./config";
import { EventEmitter } from "./EventEmitter";

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

    constructor(params: MeringueParams = {}) {
        super();

        this.version = 1.19;
        this.cdn = cdn;
        this.user = {};
        this.lang = {};
        this.services = {};
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
               this.job = this.cleanJobArray(this.job, services);

                this.job.forEach(serviceKey => {
                    this.addService(serviceKey);
                });
            }
        }

        this.isLoaded = true;
    }

    private addService(key: string){
        console.log('service added', key)
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
    private findServiceByKey = (key: string, services: { key: string, type: string }[]) => {
        return services.find(service => service.key === key);
    };

    // Fonction pour nettoyer le tableau des jobs
    private cleanJobArray(job: string[], services: { key: string, type: string }[]): string[] {
        const seen: Record<string, boolean> = {};

        const uniqueServices = job.filter(item => {
            const service = this.findServiceByKey(item, services);
 
            if (!seen[item] && service !== undefined) {
                seen[item] = true;
                return true;
            }
            return false;
        });

        return uniqueServices.sort((a, b) => {
            const serviceA = this.findServiceByKey(a, services);
            const serviceB = this.findServiceByKey(b, services);

            if (serviceA && serviceB) {
                return (serviceA.type + serviceA.key).localeCompare(serviceB.type + serviceB.key);
            }
            return 0;
        });
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

