import services from "./services";

declare global {
    interface Window {
        meringueForceCDN: string | undefined;
        meringueUseMin: string | undefined;
        alreadyLaunch: number | undefined;
        meringueForceLanguage: string | undefined;
        meringueForceExpire: string | undefined;
        meringueCustomText: string | undefined;
        meringueExpireInDay: boolean | undefined;
        meringueProLoadServices: any;
        meringueNoAdBlocker: boolean | undefined;
        meringueIsLoaded: boolean | undefined;
    }
}

interface MeringueParams {
    adblocker?: boolean; // Vrai ou faux pour activer/désactiver l'adblocker
    hashtag?: string; // Hashtag à utiliser pour ouvrir le panneau de consentement
    cookieName?: string; // Nom du cookie utilisé
    highPrivacy?: boolean; // Activer ou désactiver la haute confidentialité
    orientation?: 'middle' | 'top' | 'bottom'; // Position de la popup (ici 'middle', 'top' ou 'bottom')
    bodyPosition?: 'top' | 'bottom'; // Position du corps de la popup
    removeCredit?: boolean; // Indiquer si on doit enlever le crédit de tarteaucitron.io
    showAlertSmall?: boolean; // Afficher ou non la petite alerte
    showDetailsOnClick?: boolean; // Afficher les détails sur clic
    showIcon?: boolean; // Afficher ou non l'icône de gestion des cookies
    iconPosition?: 'BottomRight' | 'BottomLeft' | 'TopRight' | 'TopLeft'; // Position de l'icône
    cookieslist?: boolean; // Afficher ou non la liste des cookies
    handleBrowserDNTRequest?: boolean; // Gérer la requête Do Not Track du navigateur
    DenyAllCta?: boolean; // Afficher ou non le bouton "Tout refuser"
    AcceptAllCta?: boolean; // Afficher ou non le bouton "Tout accepter"
    moreInfoLink?: boolean; // Lien vers plus d'informations
    privacyUrl?: string; // URL de la page de politique de confidentialité
    useExternalCss?: boolean; // Utiliser un CSS externe
    useExternalJs?: boolean; // Utiliser un JavaScript externe
    mandatory?: boolean; // Indiquer si certains cookies sont obligatoires
    mandatoryCta?: boolean; // Afficher l'appel à l'action pour les cookies obligatoires
    closePopup?: boolean; // Activer ou non la fermeture automatique de la popup
    groupServices?: boolean; // Grouper les services par catégorie
    readmoreLink?: string,
    serviceDefaultState?: 'wait' | 'allow' | 'deny'; // État par défaut des services
    googleConsentMode?: boolean; // Activer ou non le mode de consentement Google
    partnersList?: boolean; // Afficher ou non la liste des partenaires
    alwaysNeedConsent?: boolean; // Toujours demander le consentement pour certains services
}

let scripts: HTMLCollectionOf<HTMLScriptElement> = document.getElementsByTagName('script');
let meringuePath: string = (document.currentScript as HTMLScriptElement || scripts[scripts.length - 1]).src.split('?')[0];

let meringueorceCDN: string = (typeof window.meringueForceCDN === 'undefined') ? '' : window.meringueForceCDN;
let meringueUseMin: string = (typeof window.meringueUseMin === 'undefined') ? '' : window.meringueUseMin;
let cdn: string | undefined  = (window.meringueForceCDN === '') ? meringuePath.split('/').slice(0, -1).join('/') + '/' : window.meringueForceCDN;

let alreadyLaunch: number = (typeof window.alreadyLaunch === 'undefined') ? 0 : window.alreadyLaunch;
let meringueForceLanguage: string = (typeof window.meringueForceLanguage === 'undefined') ? '' : window.meringueForceLanguage;

let meringueForceExpire: string = (typeof window.meringueForceExpire === 'undefined') ? '' : window.meringueForceExpire;
let meringueCustomText: string = (typeof window.meringueCustomText === 'undefined') ? '' : window.meringueCustomText;

let meringueExpireInDay: boolean = (typeof window.meringueExpireInDay === 'undefined' || typeof window.meringueExpireInDay !== "boolean") ? true : window.meringueExpireInDay;
let timeExpire: number = 31536000000; // Valeur fixe pour l'expiration (1 an en millisecondes)

let meringueNoAdBlocker: boolean = (typeof window.meringueNoAdBlocker === 'undefined') ? false : window.meringueNoAdBlocker;
let meringueIsLoaded: boolean = (typeof window.meringueIsLoaded === 'undefined') ? false : window.meringueIsLoaded;


export default class Meringue {
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

    private listeners: Record<string, Function[]> = {}; // Stockage des écouteurs

    constructor(params: MeringueParams = {}) {
        this.version = 1.19;
        this.cdn = undefined;
        this.user = {};
        this.lang = {};
        this.services = {};
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
        this.isAdBlock = false;
        this.parameters = this.setParameters(params);
    }

    /*
    private createProxy(target: any) {
        const handler = {
            set: (obj: any, prop: string, value: any) => {
                obj[prop] = value;
                console.log(prop, value);

                this.emit('propertyChange', prop, value); // Émettre un événement lorsque la propriété change
                return true;
            }
        };
    
        return new Proxy(target, handler);
    }*/

    emit(event: string, ...args: any[]) {
        console.log(`Emitting event: ${event}`, this.listeners);
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(...args));
        }
    }
    
    on(event: string, listener: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
        console.log(`Listener added for event: ${event}`, this.listeners);
    }
    
    off(event: string, listener: Function) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        console.log(`Listener removed for event: ${event}`, this.listeners);
    }

    // Méthode pour modifier une propriété
    setProperty(key: keyof this, value: any) {
        if (key === 'listeners') {
            console.warn('Attempt to modify listeners was prevented');
            return;
        }
        (this as any)[key] = value;
        this.emit('propertyChange', key, value);
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

    private async load() {
        if (meringueIsLoaded) return;

        console.log('Meringue loading...');
        
        this.language = this.getLanguage();
        await this.loadLang();

        meringueIsLoaded = true;

        this.setOrientation();
        this.sortCategories();

        setTimeout(() => {
            console.log('Setting isAdBlock to true');
            this.setProperty('isAdBlock', true); // Utilisation de setProperty pour modifier isAdBlock
        }, 3000);

        try {
            await this.loadFile(`./meringue.advertising.js`);

            console.log('ici man broooooo');

        } catch (err) {
            console.log('Ad block is enabled.');
            this.isAdBlock = true;
        }
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
}

