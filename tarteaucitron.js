/*jslint browser: true, evil: true */
/* min ready */

var scripts = document.getElementsByTagName('script'),
    tarteaucitronPath = (document.currentScript || scripts[scripts.length - 1]).src.split('?')[0],
    tarteaucitronForceCDN = (tarteaucitronForceCDN === undefined) ? '' : tarteaucitronForceCDN,
    tarteaucitronUseMin = (tarteaucitronUseMin === undefined) ? '' : tarteaucitronUseMin,
    cdn = (tarteaucitronForceCDN === '') ? tarteaucitronPath.split('/').slice(0, -1).join('/') + '/' : tarteaucitronForceCDN,
    alreadyLaunch = (alreadyLaunch === undefined) ? 0 : alreadyLaunch,
    tarteaucitronForceLanguage = (tarteaucitronForceLanguage === undefined) ? '' : tarteaucitronForceLanguage,
    // forceexpire, variable a ajouté à l'initialisation
    tarteaucitronForceExpire = (tarteaucitronForceExpire === undefined) ? '' : tarteaucitronForceExpire,
    tarteaucitronCustomText = (tarteaucitronCustomText === undefined) ? '' : tarteaucitronCustomText,
    // tarteaucitronExpireInDay: true for day(s) value - false for hour(s) value
    tarteaucitronExpireInDay = (tarteaucitronExpireInDay === undefined || typeof tarteaucitronExpireInDay !== "boolean") ? true : tarteaucitronExpireInDay,
    timeExpire = 31536000000,
    tarteaucitronProLoadServices,
    tarteaucitronNoAdBlocker = false,
    tarteaucitronIsLoaded = false;

var tarteaucitron = {
    "version": 1.19,
    "cdn": cdn,
    "user": {},
    "lang": {},
    "services": {},
    // stocke tous les services ajoutés (boolean)
    "added": [],
    "idprocessed": [],
    // stocke les states de chaque services
    "state": {},
    // stocke tous les services non launchés (boolean)
    "launch": [],
    "parameters": {},
    "isAjax": false,
    "reloadThePage": false,
    "events": {
        "init": function () {},
        "load": function () {},
    },
    // première function pour initialiser le plugin
    /** params : paramètres à passer à l'initialisation du plugin */
    "init": function (params) {
        "use strict";
        var origOpen;

        // ajouter les paramètres dans l'objet tarteaucitron
        tarteaucitron.parameters = params;

        // n'executer l'initialisation qu'une seule fois
        if (alreadyLaunch === 0) {
            alreadyLaunch = 1;

            // ajout des listeners

            // après chargement de la page, 
            window.addEventListener("load", function () {

                // lancement de la fonction loadEvent, qui load le plugin.
                tarteaucitron.initEvents.loadEvent(false);

            }, false);

            // listener pour le scroll
            window.addEventListener("scroll", function () {
                tarteaucitron.initEvents.scrollEvent();
            }, false);

            // listener pour les touches du clavier
            window.addEventListener("keydown", function (evt) {
                tarteaucitron.initEvents.keydownEvent(evt);
            }, false);

            // listener pour le changement du hash
            window.addEventListener("hashchange", function () {
                tarteaucitron.initEvents.hashchangeEvent();
            }, false);

            // listener pour le resize de la fenêtre du navigateur
            window.addEventListener("resize", function () {

                // on lance le resizeEvent
                tarteaucitron.initEvents.resizeEvent();
            }, false);
            //

            // pro services, pas utile
            /*
            if (typeof XMLHttpRequest !== 'undefined') {
                origOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function () {

                    if (window.addEventListener) {
                        this.addEventListener("load", function () {
                            if (typeof tarteaucitronProLoadServices === 'function') {
                                tarteaucitronProLoadServices();
                            }
                        }, false);
                    } else if (typeof this.attachEvent !== 'undefined') {
                        this.attachEvent("onload", function () {
                            if (typeof tarteaucitronProLoadServices === 'function') {
                                tarteaucitronProLoadServices();
                            }
                        });
                    } else {
                        if (typeof tarteaucitronProLoadServices === 'function') {
                            setTimeout(tarteaucitronProLoadServices, 1000);
                        }
                    }

                    try {
                        origOpen.apply(this, arguments);
                    } catch (err) {}
                };
            }*/
        }

        // si une fonction d'initialisation custom a été ajoutée à l'objet, execution de celle-ci
        if(tarteaucitron.events.init) {
            tarteaucitron.events.init();
        }
    },
    "initEvents": {
        // Fonction qui load le plugin
        "loadEvent": function () {
            // Chargement complet du plugin
            tarteaucitron.load();

            // Ajout d'un listener si l'élement contient la classe "tarteaucitronOpenPanel"
            tarteaucitron.fallback(['tarteaucitronOpenPanel'], function (elem) {
                elem.addEventListener("click", function (event) {

                    // Ouverture du panel
                    tarteaucitron.userInterface.openPanel();
                    event.preventDefault();
                }, false);
            }, true);
        },
        // fonction pour les evenements claviers
        "keydownEvent": function (evt) {
            // A l'appui d'escape, fermeture du panel
            if (evt.keyCode === 27) {
                tarteaucitron.userInterface.closePanel();
            }
        },

        // fonction pour le changement du hash
        "hashchangeEvent": function () {

            // si l'url comprends le hash #tarteaucitron, on ouvre la fenêtre du plugin
            if (document.location.hash === tarteaucitron.hashtag && tarteaucitron.hashtag !== '') {
                tarteaucitron.userInterface.openPanel();
            }
        },
        // fonction pour le resize de la fenêtre
        "resizeEvent": function () {
    
            // div panel config 
            var tacElem = document.getElementById('tarteaucitron');

            // liste des cookies
            var tacCookieContainer = document.getElementById('tarteaucitronCookiesListContainer');

            // ajuster la fenetre en fonction du resize
            if (tacElem && tacElem.style.display === 'block') {
                tarteaucitron.userInterface.jsSizing('main');
            }

            // ajuster la fenetre cookies en fonction du resize
            if (tacCookieContainer && tacCookieContainer.style.display === 'block') {
                tarteaucitron.userInterface.jsSizing('cookie');
            }
        },
        // fonction executée au scroll de la page
        "scrollEvent": function () {
            // renvoie le nombre de pixels que le document a défilé verticalement
            var scrollPos = document.documentElement.scrollTop;
            var heightPosition;
            var tacPercentage = document.getElementById('tarteaucitronPercentage');
            var tacAlertBig = document.getElementById('tarteaucitronAlertBig');

            // Si highPrivacy est à false et que la fenêtre plugin est active (si pas encore validé quoi), 
            // on active le consentement au scroll, non valide en UE
            if (tacAlertBig && !tarteaucitron.highPrivacy) {

                // Si la fenetre est visible
                if (tacAlertBig.style.display === 'block') {

                    // hauteur de l'élément par rapport à la mise en page.
                    heightPosition = tacAlertBig.offsetHeight + 'px';

                    // Si on dépasse deux écrans au scroll
                    if (scrollPos > (screen.height * 2)) {

                        // On accepte tous les cookies
                        tarteaucitron.userInterface.respondAll(true);
                    
                    // Sinon on mentionne les utilisateurs que le consentement 
                    // va être activé au scroll automatiquement, après quelques pixels (> écran/2) 
                    // en changeant le texte
                    } else if (scrollPos > (screen.height / 2)) {
                        document.getElementById('tarteaucitronDisclaimerAlert').innerHTML = '<strong>' + tarteaucitron.lang.alertBigScroll + '</strong> ' + tarteaucitron.lang.alertBig;
                    }

                    // Si l'élément html pour le scroll percentage est présent
                    if (tacPercentage) {

                        // si la fenêtre est placée en haut de page, on place l'élement 
                        // après la fenetre plugin
                        if (tarteaucitron.orientation === 'top') {
                            tacPercentage.style.top = heightPosition;
                        // sinon on le place n'importe comment     
                        } else {
                            tacPercentage.style.bottom = heightPosition;
                        }

                        // pourcentage du scroll
                        tacPercentage.style.width = ((100 / (screen.height * 2)) * scrollPos) + '%';
                    }
                }
            }
        },
    },
    "load": function () {
        "use strict";

        // si load déjà executé
        if (tarteaucitronIsLoaded === true) {
            return;
        }

        // initialiser la variable cdn par sa valeur dans window
        var cdn = tarteaucitron.cdn,
            // trouver le langage
            language = tarteaucitron.getLanguage(),

            // charger les fichiers annexes en fonction de si CDN / minifiés ou pas
            useMinifiedJS = ((cdn.indexOf('cdn.jsdelivr.net') >= 0) || (tarteaucitronPath.indexOf('.min.') >= 0) || (tarteaucitronUseMin !== '')),
            pathToLang = cdn + 'lang/tarteaucitron.' + language + (useMinifiedJS ? '.min' : '') + '.js',
            pathToServices = cdn + 'tarteaucitron.services' + (useMinifiedJS ? '.min' : '') + '.js',

            // création d'un element link
            linkElement = document.createElement('link'),
            // initialiser les valeurs par défaut du plugin (paramètres)
            defaults = {
                "adblocker": false,
                "hashtag": '#tarteaucitron',
                "cookieName": 'tarteaucitron',
                "highPrivacy": true,
                "orientation": "middle",
                "bodyPosition": "bottom",
                "removeCredit": false,
                "showAlertSmall": false,
                "showDetailsOnClick": true,
                "showIcon": true,
                "iconPosition": "BottomRight",
                "cookieslist": false,
                "handleBrowserDNTRequest": false,
                "DenyAllCta": true,
                "AcceptAllCta" : true,
                "moreInfoLink": true,
                "privacyUrl": "",
                "useExternalCss": false,
                "useExternalJs": false,
                "mandatory": true,
                "mandatoryCta": true,
                "closePopup": false,
                "groupServices": false,
                "serviceDefaultState": 'wait',
                "googleConsentMode": true,
                "partnersList": false,
                "alwaysNeedConsent": false
            },
            // récupérer les paramètres envoyés
            params = tarteaucitron.parameters;

        // flag the tac load (déclarer le plugin loadé)
        tarteaucitronIsLoaded = true;

        // Ne pas afficher la popup au milieu si on est sur la page privacy policy ou la page pour en savoir plus
        if (((tarteaucitron.parameters.readmoreLink !== undefined && window.location.href == tarteaucitron.parameters.readmoreLink) || window.location.href == tarteaucitron.parameters.privacyUrl) && tarteaucitron.parameters.orientation == "middle") {
            // par défaut en bas
            tarteaucitron.parameters.orientation = "bottom";
        }

        // Actionner le premium, pas utile
        /* if (typeof tarteaucitronCustomPremium !== 'undefined') {
            tarteaucitronCustomPremium();
        }*/

        // Step 0: get params
        // si des params ont été passés à l'initialisation du plugin
        if (params !== undefined) {

            // ajouter les paramètres par défaut s'ils n'ont pas été setup à l'initialisation
            for (var k in defaults) {
                if(!tarteaucitron.parameters.hasOwnProperty(k)) {
                    tarteaucitron.parameters[k] = defaults[k];
                }
            }
        }

        // ajout des variables globales
        tarteaucitron.orientation = tarteaucitron.parameters.orientation;

        // Open the panel with this hashtag
        tarteaucitron.hashtag = tarteaucitron.parameters.hashtag;

        // hightPrivacy à false active le consentement au scroll, non valide en UE
        tarteaucitron.highPrivacy = tarteaucitron.parameters.highPrivacy;

        // lire la valeur Do Not Track du navigateur ou pas
        tarteaucitron.handleBrowserDNTRequest = tarteaucitron.parameters.handleBrowserDNTRequest;

        // Custom element ID used to open the panel
        tarteaucitron.customCloserId = tarteaucitron.parameters.customCloserId;

        // Si le google consent mode est activé (Le mode Consentement vous permet de communiquer à 
        // Google l'état du consentement de vos utilisateurs concernant les cookies ou les identifiants d'applications)
        if (tarteaucitron.parameters.googleConsentMode === true) {

            // initialisation du dataLayer
            // set the dataLayer and a function to update
            window.dataLayer = window.dataLayer || [];
            window.tac_gtag = function tac_gtag() {
                dataLayer.push(arguments);
            };

            // default consent to denied
            window.tac_gtag('consent', 'default', {
                ad_storage: 'denied',
                analytics_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                wait_for_update: 800
            });

            // si le service googleads a été ajouté via ce tag
            /* 
                <script type="text/javascript">
                    tarteaucitron.user.googleadsId = 'AW-XXXXXXXXX';
                    (tarteaucitron.job = tarteaucitron.job || []).push('googleads');
                </script>
            */

            // if google ads, add a service for personalized ads
            document.addEventListener('googleads_added', function() {

                // le tableau added stocke plus tard tous les services qui ont été ajoutés
                // skip if already added
                if (tarteaucitron.added["gcmads"] === true) {
                    return;
                }

                // ajout d'un service au tableau services
                // simple service to control gcm with event
                tarteaucitron.services.gcmads = {
                    "key": "gcmads",
                    "type": "ads",
                    "name": "Google Ads (personalized ads)",
                    "uri": "https://support.google.com/analytics/answer/9976101",
                    "needConsent": true,
                    "cookies": [],
                    "js": function() {},
                    "fallback": function() {}
                };

                // ajout d'un service dans l'array job via la méthode push
                tarteaucitron.job.push('gcmads');

                // Ajout des listeners sur les boutons allow ou deny
                // fix the event handler on the buttons
                var i,
                    allowBtns = document.getElementsByClassName("tarteaucitronAllow"),
                    denyBtns = document.getElementsByClassName("tarteaucitronDeny");
                for (i = 0; i < allowBtns.length; i++) {
                    tarteaucitron.addClickEventToElement(allowBtns[i], function() {
                        tarteaucitron.userInterface.respond(this, true);
                    });
                }
                for (i = 0; i < denyBtns.length; i++) {
                    tarteaucitron.addClickEventToElement(denyBtns[i], function() {
                        tarteaucitron.userInterface.respond(this, false);
                    });
                }
            });

            // when personalized ads are accepted, accept googleads
            document.addEventListener('gcmads_allowed', function() {
                tarteaucitron.setConsent('googleads', true);
            });

            // personalized ads loaded/allowed, set gcm to granted
            document.addEventListener('gcmads_loaded', function() {
                window.tac_gtag('consent', 'update', {
                    ad_user_data: 'granted',
                    ad_personalization: 'granted'
                });
            });
            document.addEventListener('gcmads_allowed', function() {
                window.tac_gtag('consent', 'update', {
                    ad_user_data: 'granted',
                    ad_personalization: 'granted'
                });
            });

            // personalized ads disallowed, set gcm to denied
            document.addEventListener('gcmads_disallowed', function() {
                window.tac_gtag('consent', 'update', {
                    ad_user_data: 'denied',
                    ad_personalization: 'denied'
                });
            });

            // google ads loaded/allowed, set gcm to granted
            document.addEventListener('googleads_loaded', function() {
                window.tac_gtag('consent', 'update', {
                    ad_storage: 'granted'
                });
            });
            document.addEventListener('googleads_allowed', function() {
                window.tac_gtag('consent', 'update', {
                    ad_storage: 'granted'
                });
            });

            // google ads disallowed, disable personalized ads and update gcm
            document.addEventListener('googleads_disallowed', function() {
                tarteaucitron.setConsent('gcmads', false);
                window.tac_gtag('consent', 'update', {
                    ad_storage: 'denied'
                });
            });

            // ga4 loaded/allowed, set gcm to granted
            document.addEventListener('gtag_loaded', function() {
                window.tac_gtag('consent', 'update', {
                    analytics_storage: 'granted'
                });
            });
            document.addEventListener('gtag_allowed', function() {
                window.tac_gtag('consent', 'update', {
                    analytics_storage: 'granted'
                });
            });

            // ga4 disallowed, update gcm
            document.addEventListener('gtag_disallowed', function() {
                window.tac_gtag('consent', 'update', {
                    analytics_storage: 'denied'
                });
            });

            // multiple ga4 loaded/allowed, set gcm to granted
            document.addEventListener('multiplegtag_loaded', function() {
                window.tac_gtag('consent', 'update', {
                    analytics_storage: 'granted'
                });
            });
            document.addEventListener('multiplegtag_allowed', function() {
                window.tac_gtag('consent', 'update', {
                    analytics_storage: 'granted'
                });
            });

            // multiple ga4 disallowed, update gcm
            document.addEventListener('multiplegtag_disallowed', function() {
                window.tac_gtag('consent', 'update', {
                    analytics_storage: 'denied'
                });
            });

            // allow gtag/googleads by default if consent mode is on
            window.addEventListener('tac.root_available', function() {
                if (typeof tarteaucitron_block !== 'undefined') {
                    tarteaucitron_block.unblock(/www\.googletagmanager\.com\/gtag\/js/);
                    tarteaucitron_block.unblock(/www\.googleadservices\.com\/pagead\/conversion/);
                    tarteaucitron_block.unblock(/AW-/);
                    tarteaucitron_block.unblock(/google-analytics\.com\/analytics\.js/);
                    tarteaucitron_block.unblock(/google-analytics\.com\/ga\.js/);
                }
            });
        }

        // Step 1: load css
        if ( !tarteaucitron.parameters.useExternalCss ) {
            linkElement.rel = 'stylesheet';
            linkElement.type = 'text/css';
            linkElement.href = cdn + 'css/tarteaucitron' + (useMinifiedJS ? '.min' : '') + '.css';
            document.getElementsByTagName('head')[0].appendChild(linkElement);
        }
        // Step 2: load language and services
        tarteaucitron.addInternalScript(pathToLang, '', function () {

          if(tarteaucitronCustomText !== ''){
            tarteaucitron.lang = tarteaucitron.AddOrUpdate(tarteaucitron.lang, tarteaucitronCustomText);
          }
            tarteaucitron.addInternalScript(pathToServices, '', function () {

                // css for the middle bar TODO: add it on the css file
                if (tarteaucitron.orientation === 'middle') {
                    var customThemeMiddle = document.createElement('style'),
                        cssRuleMiddle = 'div#tarteaucitronRoot.tarteaucitronBeforeVisible:before {content: \'\';position: fixed;width: 100%;height: 100%;background: white;top: 0;left: 0;z-index: 999;opacity: 0.5;}div#tarteaucitronAlertBig:before {content: \'' + tarteaucitron.lang.middleBarHead + '\';font-size: 35px;}body #tarteaucitronRoot div#tarteaucitronAlertBig {width: 60%;min-width: 285px;height: auto;margin: auto;left: 50%;top: 50%;transform: translate(-50%, -50%);box-shadow: 0 0 9000px #000;border-radius: 20px;padding: 35px 25px;}span#tarteaucitronDisclaimerAlert {padding: 0 30px;}#tarteaucitronRoot span#tarteaucitronDisclaimerAlert {margin: 10px 0 30px;display: block;text-align: center;font-size: 21px;}@media screen and (max-width: 900px) {div#tarteaucitronAlertBig button {margin: 0 auto 10px!important;display: block!important;}}';

                    customThemeMiddle.type = 'text/css';
                    if (customThemeMiddle.styleSheet) {
                        customThemeMiddle.styleSheet.cssText = cssRuleMiddle;
                    } else {
                        customThemeMiddle.appendChild(document.createTextNode(cssRuleMiddle));
                    }
                    document.getElementsByTagName('head')[0].appendChild(customThemeMiddle);
                }

                // disable the expand option if services grouped by category
                if (tarteaucitron.parameters.groupServices == true) {
                    tarteaucitron.parameters.showDetailsOnClick = true;
                }

                // css for the popup bar TODO: add it on the css file
                if (tarteaucitron.orientation === 'popup') {
                    var customThemePopup = document.createElement('style'),
                        cssRulePopup = 'div#tarteaucitronAlertBig:before {content: \'' + tarteaucitron.lang.middleBarHead + '\';font-size: 22px;}body #tarteaucitronRoot div#tarteaucitronAlertBig {bottom: 0;top: auto!important;left: 8px!important;right: auto!important;transform: initial!important;border-radius: 5px 5px 0 0!important;max-width: 250px!important;width: calc(100% - 16px)!important;min-width: 0!important;padding: 25px 0;}span#tarteaucitronDisclaimerAlert {padding: 0 30px;font-size: 15px!important;}#tarteaucitronRoot span#tarteaucitronDisclaimerAlert {margin: 10px 0 30px;display: block;text-align: center;font-size: 21px;}div#tarteaucitronAlertBig button {margin: 0 auto 10px!important;display: block!important;width: calc(100% - 60px);box-sizing: border-box;}';

                    customThemePopup.type = 'text/css';
                    if (customThemePopup.styleSheet) {
                        customThemePopup.styleSheet.cssText = cssRulePopup;
                    } else {
                        customThemePopup.appendChild(document.createTextNode(cssRulePopup));
                    }
                    document.getElementsByTagName('head')[0].appendChild(customThemePopup);
                }

                var body = document.body,
                    div = document.createElement('div'),
                    html = '',
                    index,
                    orientation = 'Top',
                    modalAttrs = '',
                    cat = ['ads', 'analytic', 'api', 'comment', 'social', 'support', 'video', 'other', 'google'],
                    i;

                cat = cat.sort(function (a, b) {
                    if (tarteaucitron.lang[a].title > tarteaucitron.lang[b].title) { return 1; }
                    if (tarteaucitron.lang[a].title < tarteaucitron.lang[b].title) { return -1; }
                    return 0;
                });

                // Step 3: prepare the html
                html += '<div role="heading" aria-level="1" id="tac_title" class="tac_visually-hidden">' + tarteaucitron.lang.title + '</div>';
                html += '<div id="tarteaucitronPremium"></div>';
                if (tarteaucitron.reloadThePage) {
                    html += '<button type="button" id="tarteaucitronBack" aria-label="' + tarteaucitron.lang.close + ' (' + tarteaucitron.lang.reload + ')" title="' + tarteaucitron.lang.close + ' (' + tarteaucitron.lang.reload + ')"></button>';
                } else {
                    html += '<button type="button" id="tarteaucitronBack" aria-label="' + tarteaucitron.lang.close + '" title="' + tarteaucitron.lang.close + '"></button>';
                }
                html += '<div id="tarteaucitron" role="dialog" aria-modal="true" aria-labelledby="dialogTitle" tabindex="-1">';
                if (tarteaucitron.reloadThePage) {
                    html += '   <button type="button" id="tarteaucitronClosePanel" aria-label="' + tarteaucitron.lang.close + ' (' + tarteaucitron.lang.reload + ')" title="' + tarteaucitron.lang.close + ' (' + tarteaucitron.lang.reload + ')">';
                } else {
                    html += '   <button type="button" id="tarteaucitronClosePanel">';
                }
                html += '       ' + tarteaucitron.lang.close;
                html += '   </button>';
                html += '   <div id="tarteaucitronServices">';
                html += '      <div class="tarteaucitronLine tarteaucitronMainLine" id="tarteaucitronMainLineOffset">';
                html += '         <span class="tarteaucitronH1" role="heading" aria-level="1" id="dialogTitle">'+ tarteaucitron.lang.title + '</span>';
                html += '         <div id="tarteaucitronInfo">';
                html += '         ' + tarteaucitron.lang.disclaimer;
                if (tarteaucitron.parameters.privacyUrl !== "") {
                    html += '   <br/><br/>';
                    html += '   <button type="button" id="tarteaucitronPrivacyUrlDialog" role="link">';
                    html += '       ' + tarteaucitron.lang.privacyUrl;
                    html += '   </button>';
                }
                html += '         </div>';
                html += '         <div class="tarteaucitronName">';
                html += '            <span class="tarteaucitronH2" role="heading" aria-level="2">' + tarteaucitron.lang.all + '</span>';
                html += '         </div>';
                html += '         <div class="tarteaucitronAsk" id="tarteaucitronScrollbarAdjust">';
                html += '            <button type="button" id="tarteaucitronAllAllowed" class="tarteaucitronAllow">';
                html += '               <span class="tarteaucitronCheck" aria-hidden="true"></span> ' + tarteaucitron.lang.allowAll;
                html += '            </button> ';
                html += '            <button type="button" id="tarteaucitronAllDenied" class="tarteaucitronDeny">';
                html += '               <span class="tarteaucitronCross" aria-hidden="true"></span> ' + tarteaucitron.lang.denyAll;
                html += '            </button>';
                html += '         </div>';
                html += '      </div>';
                html += '      <div class="tarteaucitronBorder">';
                html += '         <div class="clear"></div><ul>';


                if (tarteaucitron.parameters.mandatory == true) {
                   html += '<li id="tarteaucitronServicesTitle_mandatory">';
                   html += '<div class="tarteaucitronTitle">';
                    if(tarteaucitron.parameters.showDetailsOnClick){
                        html += '   <button type="button" tabindex="-1"><span class="tarteaucitronPlus" aria-hidden="true"></span> ' + tarteaucitron.lang.mandatoryTitle + '</button>';
                    }else{
                        html += '   <span class="asCatToggleBtn">' + tarteaucitron.lang.mandatoryTitle + '</span>';
                    }
                   html += '</div>';
                   html += '<ul id="tarteaucitronServices_mandatory">';
                   html += '<li class="tarteaucitronLine">';
                   html += '   <div class="tarteaucitronName">';
                   html += '       <span class="tarteaucitronH3" role="heading" aria-level="3">' + tarteaucitron.lang.mandatoryText + '</span>';
                   html += '       <span class="tarteaucitronListCookies" aria-hidden="true"></span><br/>';
                   html += '   </div>';
                   if (tarteaucitron.parameters.mandatoryCta == true) {
                       html += '   <div class="tarteaucitronAsk">';
                       html += '       <button type="button" class="tarteaucitronAllow" tabindex="-1" disabled>';
                       html += '           <span class="tarteaucitronCheck" aria-hidden="true"></span> ' + tarteaucitron.lang.allow;
                       html += '       </button> ';
                       html += '       <button type="button" class="tarteaucitronDeny" tabindex="-1">';
                       html += '           <span class="tarteaucitronCross" aria-hidden="true"></span> ' + tarteaucitron.lang.deny;
                       html += '       </button> ';
                       html += '   </div>';
                   }
                   html += '</li>';
                   html += '</ul></li>';
                }

                for (i = 0; i < cat.length; i += 1) {
                    html += '         <li id="tarteaucitronServicesTitle_' + cat[i] + '" class="tarteaucitronHidden">';
                    html += '            <div class="tarteaucitronTitle" role="heading" aria-level="2">';
                    if(tarteaucitron.parameters.showDetailsOnClick)
                    {
                        html += '               <button type="button" class="catToggleBtn" aria-expanded="false" data-cat="tarteaucitronDetails' + cat[i] + '"><span class="tarteaucitronPlus" aria-hidden="true"></span> ' + tarteaucitron.lang[cat[i]].title + '</button>';
                    }else{
                        html += '               <span class="asCatToggleBtn" data-cat="tarteaucitronInlineDetails' + cat[i] + '">' + tarteaucitron.lang[cat[i]].title + '</span>';
                    }
                    html += '            </div>';
                    html += '            <div id="tarteaucitronDetails' + cat[i] + '" class="tarteaucitronDetails '+ (tarteaucitron.parameters.showDetailsOnClick ? 'tarteaucitronInfoBox' : 'tarteaucitronDetailsInline')+'">';
                    html += '               ' + tarteaucitron.lang[cat[i]].details;
                    html += '            </div>';
                    html += '         <ul id="tarteaucitronServices_' + cat[i] + '"></ul></li>';
                }
                html += '             <li id="tarteaucitronNoServicesTitle" class="tarteaucitronLine">' + tarteaucitron.lang.noServices + '</li>';
                html += '         </ul>';
                html += '         <div class="tarteaucitronHidden tarteaucitron-spacer-20" id="tarteaucitronScrollbarChild"></div>';
                if (tarteaucitron.parameters.removeCredit === false) {
                    html += '     <a class="tarteaucitronSelfLink" href="https://tarteaucitron.io/" rel="nofollow noreferrer noopener" target="_blank" title="tarteaucitron ' + tarteaucitron.lang.newWindow + '"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHcAAAAeCAYAAAAWwoEYAAADl0lEQVRoge1Y0W3bQAx9CjKARlC+9GVUmqDJBHEmiDyB6wkcTxBngtgTxJ0gzgQW4C/9aYOmE6g4lTQo+k6y3Rb94QOERNQd+cjj8XiGwWAwGAwGg8FgMBgMBoPB8F8RNRXe+whEKe7c36ZCAeCRxC9Rig2PUd8kPgAsoxSfQ3YAzAA8D/HwYYCb05kBKKO0teFkmbC1jlKsAnq/Abjn+QBqAIsoRS30ttwG/HNz1wH/XIxWTicLdvtW7xTAGEAMtP685CNsBTe2d/BLydfXAG57SEnMAST0zgYZSUCPk02bCvkJduIzuJzDLfPolbY+tLKmar+/8+IRePy4qdpE03qHuH8fipFb4N2+XdA3AJ/0vaQxt7s9FvkIS2XvtqnwM0rxpOQfbnE5G2LhTCmUO2fHIngOmcv+KG3HafDchB6ntwjYqenR2PqC7sOZ3E7FXHB0vqxoFyUyLh7OEH7LOGouvhhN3eIBeKXv0n5MsufdHqXcwYR5U2EbpV35lSspVPJmQj4TcgRK7jTg5IzmPUhhwM5a2WHUFCx+NgiDucmgh7idikLovHFlL0pxQ9xzX+IIP9Y6FrJsqhjlQpZRAkFVDCjZfcCHt6bqJDmuh5ylCWx0RVnk3oumaknqTH5sqrY0fBWyULaHUIgAgxb46MxV3DbieAhxOxUxjSuljig9lMQ/Bcfoi9BTEv9aLORSndVxYOH525sUDC6u2gWxcNzBNRxPanyh3ktKinOgy3WoxPbtUM0t6RkbQnzBnFPgi9GCOEubY9UffIryz9iKRe8s/FUfEWosJJGxagp85bpUO3VywQ46lOtAWfNxKwa4JXQ+628+bpxYGXXMzp5rXH401VEyXwIdowXFaKWSMFHvMTVmGnc+P3oXV2QOiBCfgex8QtcQCbcQE/H+eoHzrkFo1KM7zVO4jVVj5s6lRiWF7zyXyfRMc97J3tzj87mYqZ7E2YjzUct9GUi4tjHLR8dVkBLjQcuHFleWvQfRNEhFR7uX7pkctOwvZXsft7sAtyldEUIN2UTeLxnEfxKYswzdi88BdbZ8hifUoSMftQvP+muRwN6+Q3DeqqRExP9QmTtcheiHh0Ot1x2i2km1bP9pbufw5zZdyWsOrh7vQae5OZWbsMv30pi7cd/CKj3coPEVaCP4Zhx4eQWhOZ1Y9MTXGyP8/iGjEyfa1T4fO/4Lea9vBoPBYDAYDAaDwWAwGAwGwz8GgF8siXCCbrSRhgAAAABJRU5ErkJggg==" alt="tarteaucitron.io" /></a>';
                }
                html += '       </div>';
                html += '   </div>';
                html += '</div>';

                if (tarteaucitron.parameters.orientation === 'bottom') {
                    orientation = 'Bottom';
                }

                if (tarteaucitron.parameters.orientation === 'middle' || tarteaucitron.parameters.orientation === 'popup') {
                    modalAttrs = ' role="dialog" aria-modal="true" aria-labelledby="tac_title"';
                }

                if (tarteaucitron.parameters.highPrivacy && !tarteaucitron.parameters.AcceptAllCta) {
                    html += '<div tabindex="-1" id="tarteaucitronAlertBig" class="tarteaucitronAlertBig' + orientation + '"' + modalAttrs + '>';
                    //html += '<div class="tarteaucitronAlertBigWrapper">';
                    html += '   <span id="tarteaucitronDisclaimerAlert" role="paragraph">';
                    html += '       ' + tarteaucitron.lang.alertBigPrivacy;
                    html += '   </span>';
                    //html += '   <span class="tarteaucitronAlertBigBtnWrapper">';
                    html += '   <button type="button" id="tarteaucitronPersonalize" aria-label="' + tarteaucitron.lang.personalize + ' ' + tarteaucitron.lang.modalWindow + '" title="' + tarteaucitron.lang.personalize + ' ' + tarteaucitron.lang.modalWindow + '">';
                    html += '       ' + tarteaucitron.lang.personalize;
                    html += '   </button>';

                    if (tarteaucitron.parameters.privacyUrl !== "") {
                        html += '   <button role="link" type="button" id="tarteaucitronPrivacyUrl">';
                        html += '       ' + tarteaucitron.lang.privacyUrl;
                        html += '   </button>';
                    }

                    //html += '   </span>';
                    //html += '</div>';
                    html += '</div>';
                } else {
                    html += '<div tabindex="-1" id="tarteaucitronAlertBig" class="tarteaucitronAlertBig' + orientation + '"' + modalAttrs + '>';
                    //html += '<div class="tarteaucitronAlertBigWrapper">';
                    html += '   <span id="tarteaucitronDisclaimerAlert" role="paragraph">';

                    if (tarteaucitron.parameters.highPrivacy) {
                        html += '       ' + tarteaucitron.lang.alertBigPrivacy;
                    } else {
                        html += '       ' + tarteaucitron.lang.alertBigClick + ' ' + tarteaucitron.lang.alertBig;
                    }

                    html += '   </span>';
                    //html += '   <span class="tarteaucitronAlertBigBtnWrapper">';
                    html += '   <button type="button" class="tarteaucitronCTAButton tarteaucitronAllow" id="tarteaucitronPersonalize2">';
                    html += '       <span class="tarteaucitronCheck" aria-hidden="true"></span> ' + tarteaucitron.lang.acceptAll;
                    html += '   </button>';


                    if (tarteaucitron.parameters.DenyAllCta) {
                        if (tarteaucitron.reloadThePage) {
                                    html += '   <button type="button" class="tarteaucitronCTAButton tarteaucitronDeny" id="tarteaucitronAllDenied2" aria-label="' + tarteaucitron.lang.denyAll + ' (' + tarteaucitron.lang.reload + ')" title="' + tarteaucitron.lang.denyAll + ' (' + tarteaucitron.lang.reload + ')">';
                        } else {
                                    html += '   <button type="button" class="tarteaucitronCTAButton tarteaucitronDeny" id="tarteaucitronAllDenied2">';
                        }
                                    html += '       <span class="tarteaucitronCross" aria-hidden="true"></span> ' + tarteaucitron.lang.denyAll;
                                    html += '   </button>';
                                    //html += '   <br/><br/>';
                    }

                    html += '   <button type="button" id="tarteaucitronCloseAlert" aria-label="' + tarteaucitron.lang.personalize + ' ' + tarteaucitron.lang.modalWindow + '" title="' + tarteaucitron.lang.personalize + ' ' + tarteaucitron.lang.modalWindow + '">';
                    html += '       ' + tarteaucitron.lang.personalize;
                    html += '   </button>';

                    if (tarteaucitron.parameters.privacyUrl !== "") {
                        html += '   <button type="button" id="tarteaucitronPrivacyUrl" role="link">';
                        html += '       ' + tarteaucitron.lang.privacyUrl;
                        html += '   </button>';
                    }

                    //html += '   </span>';
                    //html += '</div>';
                    html += '</div>';
                    html += '<div id="tarteaucitronPercentage"></div>';
                }

                if (tarteaucitron.parameters.showIcon === true) {
                    html += '<div id="tarteaucitronIcon" class="tarteaucitronIcon' + tarteaucitron.parameters.iconPosition + '">';
                    html += '   <button type="button" id="tarteaucitronManager" aria-label="' + tarteaucitron.lang.icon + ' ' + tarteaucitron.lang.modalWindow + '" title="' + tarteaucitron.lang.icon + ' ' + tarteaucitron.lang.modalWindow + '">';
                    html += '       <img src="' + (tarteaucitron.parameters.iconSrc ? tarteaucitron.parameters.iconSrc : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAGA0lEQVRoge1a207bWBRdBtJwLYZhKDMVmlSK1LxNkPo+ZH6g8B6p5AuALwC+APoFoVLeoT8whPeRSt+CZKmZVu3AiIsRlEtCktGyjy8xzuXYhvahS0JJHJ/4rLP3XnuffcAPfGdQ7mM6jRLSAF4BxqsbewB2lRS2o35mpEQaJcwCyANIdLi1DGBNSWEzqmdHRqRRwjqAJclhtExOSUEP+/xIiDRKhhUWfL7ShTtBuJnqcw+/z4Ql0xNmMEwSSz4kuNIzSgpjSsqYJP/GeE185wYJroedRyiLNEpGLLzzrHSuk+83SgbxvOcyyRaDziWsRVZkSRDinpzPbwVGWIucuohsKynMS47fAQyls/BMSRmKJo3AFhG5wm2N1wF+Zs3zebbFfR0RxrXcJHQlgH+LMW616pR/WiIMEXfW3mtzXyeEGWsjKot8c4TOI98L+iKaR5PS6IUk88RLAO9F8UjrbYoYMOosNavpfmODIiwRXRR/G3ohaWVo1RU/c30jV8ab2mV8qVGzHWBOLyTLZiWs5Rolg/C3ySOi0tXP/k4aEwOwSBKPJs7Rp16ABJTe+p1xVX0It/owqqdDEMRoqd3RFxqDPh20Ig6VEPVC0i5RSCD+6wl6HlW7GksSlUMV11/GrUs5NasFLusDE9ELSVphXemtJwaT/8JyIRvxNNCfBmIiNdR04LII3DSrbe0yjqvyJF/ppptqVlt+MCLCEh/oOkPPP6N38Mb5cnQBGFsEqmXg5j3QMwoMzwGnr4HYbybBq13gZAOom/FO63zdf2qQArCsZrUN2TlJy69eSDKYV+6Q4MpP75ivHzPA53ngaBW4eGuSOt0A/lsGPmXMz0+3TFJcTfFbPfFbfnwlhON+iQhlWmA82CQ4ocQ7c6KcfL3DHuls0yT6Sx4YnLXJDCQOIRRv5yGIJBgP8Sdisj2qubpc5UGJmo+W49ifVmzL8HcpGhQPvZCUKiCliIhEN0tr2OCqHuSA8gwQ/92MkU7gxEmeVqGrTTgpxPXbUrtGWYus0I9thRIraagRQUIDf7Qn4yZhKRiFQIyhfMfUr3yblokVWSJ6k8xSnc7eNN/RjowfCYiFoDUFer1S3gW6JiJ8Nt30EMbEhU+vzSIztuRYjRLsR8IHLjlf7HZ+MrWWEXxNmbvapt4jGSqZRYSkGUetSNTPzHsui5YMQ2ajJUNks6mw4wT54Ok2ShnzzIPCUGshzawCRKy5FqvrTZe0RWzQGvw79m67XZjKmxJrLsICjtZa55gxXy+6F4sYsEtxTqhXdRTLC8ulSDaWoCLsolfN+8YUhOsJV709H7Cudr0LlVEtzqBcN+shEyThdR941OnAbF8pirKJqXyupTRTtQSReiVmXW1j7oBErB0d9xM2WEd5J9ZKYtuR4WKwwBSoORbpGrJ5ZI9lt71irJmGX1px0JYE26uNErawr2zfIcP4OHEKXm66PA3wjpCNEfpJunI4muifPjKvsFCkGjExTq63yxMJsZNMYF/J4HmDC5A3Yq36jy0ClePHVhwuu/b1HSFlEfHD5ZtD1bEK44Qu1mWys6tbWmZyPWckzlPTGiRw/XHCuk+q4Rek+mVrVL/UppwrdDEGNV2kpyuhccgc5Oxm9vWnn+19vJrVpLor0kTUrGacMplb1CfOFyTD4o9uNrHqr2Z+ZMSp1c2XcVSORnh9Q81q3k599ETgkNnjg0nGzi10K7rX+bZpHbrblPcY5A4Zxk2xcjzCvTpd9027Aa0QtouyyrKFRR6D/04DwkFGvHPXM3Qda/Jb4nPgI7hQLVM1q5HIBt2MzQNa57Z1DiiLAGa5Mi+O4Sz3Mpp6laPHO6InII3ITnX1QtI+EOX+m9ZxleOZ/j9PiuKoLi3aqXPuEoSye/Vhkm+LalbLtHhMS0R6zu7aZ3vP2jOjL7QVv4McxhcDnZIelAQibGIbULOapf3PuE1Vs9qeaOTdkVKr00gCQiw4NlBzDvf1Lxx+uP5r3Dgv5KQZRzWn+GRwz8jmDS8itUg7iB6vLuJCF5Uty4A9mVKkFR6MiJDachST/oHvHgD+B4SoUIitpF05AAAAAElFTkSuQmCC') + '" alt="' + tarteaucitron.lang.icon + ' ' + tarteaucitron.lang.modalWindow + '" title="' + tarteaucitron.lang.icon + ' ' + tarteaucitron.lang.modalWindow + '">';
                    html += '   </button>';
                    html += '</div>';
                }

                if (tarteaucitron.parameters.showAlertSmall === true) {
                    html += '<div id="tarteaucitronAlertSmall" class="tarteaucitronAlertSmall' + orientation + '">';
                    html += '   <button type="button" id="tarteaucitronManager" aria-label="' + tarteaucitron.lang.alertSmall + ' ' + tarteaucitron.lang.modalWindow + '" title="' + tarteaucitron.lang.alertSmall + ' ' + tarteaucitron.lang.modalWindow + '">';
                    html += '       ' + tarteaucitron.lang.alertSmall;
                    html += '       <span id="tarteaucitronDot">';
                    html += '           <span id="tarteaucitronDotGreen"></span>';
                    html += '           <span id="tarteaucitronDotYellow"></span>';
                    html += '           <span id="tarteaucitronDotRed"></span>';
                    html += '       </span>';
                    if (tarteaucitron.parameters.cookieslist === true) {
                        html += '   </button><!-- @whitespace';
                        html += '   --><button type="button" id="tarteaucitronCookiesNumber" aria-expanded="false" aria-controls="tarteaucitronCookiesListContainer">0</button>';
                        html += '   <div id="tarteaucitronCookiesListContainer">';
                        if (tarteaucitron.reloadThePage) {
                            html += '       <button type="button" id="tarteaucitronClosePanelCookie" aria-label="' + tarteaucitron.lang.close + ' (' + tarteaucitron.lang.reload + ')" title="' + tarteaucitron.lang.close + ' (' + tarteaucitron.lang.reload + ')">';
                        } else {
                            html += '       <button type="button" id="tarteaucitronClosePanelCookie">';
                        }
                        html += '           ' + tarteaucitron.lang.close;
                        html += '       </button>';
                        html += '       <div class="tarteaucitronCookiesListMain" id="tarteaucitronCookiesTitle">';
                        html += '            <span class="tarteaucitronH2" role="heading" aria-level="2" id="tarteaucitronCookiesNumberBis">0 cookie</span>';
                        html += '       </div>';
                        html += '       <div id="tarteaucitronCookiesList"></div>';
                        html += '    </div>';
                    } else {
                        html += '   </div>';
                    }
                    html += '</div>';
                }

                tarteaucitron
                    .addInternalScript(tarteaucitron.cdn + 'advertising' + (useMinifiedJS ? '.min' : '') + '.js', '', 
                    function () {
                    // si ce fichier est chargé, c'est qu'Ad blocker premium n'est pas actif, donc mise à jour de cette variable
                    if (tarteaucitronNoAdBlocker === true || tarteaucitron.parameters.adblocker === false) {

                        div.id = 'tarteaucitronRoot';
                        if (tarteaucitron.parameters.bodyPosition === 'top') {
                            // Prepend tarteaucitron: #tarteaucitronRoot first-child of the body for better accessibility
                            var bodyFirstChild = body.firstChild;
                            body.insertBefore(div, bodyFirstChild);
                        }
                        else {
                            // Append tarteaucitron: #tarteaucitronRoot last-child of the body
                            body.appendChild(div, body);
                        }

                        div.setAttribute('data-nosnippet', 'true');
                        div.setAttribute('lang', language);
                        div.setAttribute('role', 'region');
                        div.setAttribute('aria-labelledby', 'tac_title');

                        div.innerHTML = html;

                        //ie compatibility
                        var tacRootAvailableEvent;
                        if(typeof(Event) === 'function') {
                            tacRootAvailableEvent = new Event("tac.root_available");
                        }else if (typeof(document.createEvent) === 'function'){
                            tacRootAvailableEvent = document.createEvent('Event');
                            tacRootAvailableEvent.initEvent("tac.root_available", true, true);
                        }
                        //end ie compatibility

                        if (typeof(window.dispatchEvent) === 'function') {window.dispatchEvent(tacRootAvailableEvent);}

                        if (tarteaucitron.job !== undefined) {
                            tarteaucitron.job = tarteaucitron.cleanArray(tarteaucitron.job);
                            for (index = 0; index < tarteaucitron.job.length; index += 1) {
                                tarteaucitron.addService(tarteaucitron.job[index]);
                            }
                        } else {
                            tarteaucitron.job = [];
                        }

                        if (tarteaucitron.job.length === 0) {
                            tarteaucitron.userInterface.closeAlert();
                        }

                        tarteaucitron.isAjax = true;

                        // méthode push, avec pour paramètre le nom du services
                        tarteaucitron.job.push = function (id) {

                            // ie <9 hack, pas utile
                            /* if (typeof tarteaucitron.job.indexOf === 'undefined') {
                                tarteaucitron.job.indexOf = function (obj, start) {
                                    var i,
                                        j = this.length;
                                    for (i = (start || 0); i < j; i += 1) {
                                        if (this[i] === obj) { return i; }
                                    }
                                    return -1;
                                };
                            } */

                            // si le service n'existe pas, ajout
                            if (tarteaucitron.job.indexOf(id) === -1) {
                                Array.prototype.push.call(this, id);
                            }


                            tarteaucitron.launch[id] = false;
                            tarteaucitron.addService(id);
                        };

                        if (document.location.hash === tarteaucitron.hashtag && tarteaucitron.hashtag !== '') {
                            tarteaucitron.userInterface.openPanel();
                        }

                        tarteaucitron.cookie.number();
                        setInterval(tarteaucitron.cookie.number, 60000);
                    }
                }, tarteaucitron.parameters.adblocker);

                // Show a Warning if an adblocker is detected
                if (tarteaucitron.parameters.adblocker === true) {
                    console.log('on en est la')
                    setTimeout(function () {
                        console.log('tarteaucitronNoAdBlocker', tarteaucitronNoAdBlocker)
                        if (tarteaucitronNoAdBlocker === false) {
                            console.log('et ici ?')
                            html = '<div id="tarteaucitronAlertBig" class="tarteaucitronAlertBig' + orientation + ' tarteaucitron-display-block" role="alert" aria-live="polite">';
                            html += '   <p id="tarteaucitronDisclaimerAlert">';
                            html += '       ' + tarteaucitron.lang.adblock + '<br/>';
                            html += '       <strong>' + tarteaucitron.lang.adblock_call + '</strong>';
                            html += '   </p>';
                            html += '   <button type="button" class="tarteaucitronCTAButton" id="tarteaucitronCTAButton">';
                            html += '       ' + tarteaucitron.lang.reload;
                            html += '   </button>';
                            html += '</div>';
                            html += '<div role="heading" aria-level="1" id="tac_title" class="tac_visually-hidden">' + tarteaucitron.lang.title + '</div>';
                            html += '<div id="tarteaucitronPremium"></div>';

                            div.id = 'tarteaucitronRoot';
                            if (tarteaucitron.parameters.bodyPosition === 'top') {
                                // Prepend tarteaucitron: #tarteaucitronRoot first-child of the body for better accessibility
                                var bodyFirstChild = body.firstChild;
                                body.insertBefore(div, bodyFirstChild);
                            }
                            else {
                                // Append tarteaucitron: #tarteaucitronRoot last-child of the body
                                body.appendChild(div, body);
                            }

                            div.setAttribute('data-nosnippet', 'true');
                            div.setAttribute('lang', language);
                            div.setAttribute('role', 'region');
                            div.setAttribute('aria-labelledby', 'tac_title');

                            div.innerHTML = html;
                        }
                    }, 1500);
                }

                // Ajout d'une croix pour fermer la popup (UI rule)
                if(tarteaucitron.parameters.closePopup === true){
                    setTimeout(function() {
                        var closeElement = document.getElementById('tarteaucitronAlertBig'),
                            closeButton = document.createElement('button');
                        if (closeElement) {
                            closeButton.innerHTML = '<span aria-hidden="true">X</span><span class="tac_visually-hidden">' + tarteaucitron.lang.closeBanner + '</span>';
                            closeButton.setAttribute('id', 'tarteaucitronCloseCross');
                            closeElement.insertAdjacentElement('beforeend', closeButton);
                        }
                    }, 100);
                }

                // grouper les services par catégorie
                if(tarteaucitron.parameters.groupServices === true) {
                    // création d'un élément html style
                    var tac_group_style = document.createElement('style');

                    // ajout d'une règle css pour masquer le titre
                    tac_group_style.innerHTML = '.tarteaucitronTitle{display:none}';

                    // ajout du custom style dans le head
                    document.head.appendChild(tac_group_style);

                    // ajout d'un setInterval, cats étant vide dans la dernière version de tarteaucitron
                    let checkExist = setInterval(function() {
                        // cherche tous les services
                        let cats = document.querySelectorAll('[id^="tarteaucitronServicesTitle_"]');

                        if (cats.length > 0) {
                            Array.prototype.forEach.call(cats, function(item) {
                 
                                var cat = item.getAttribute('id').replace(/^(tarteaucitronServicesTitle_)/, "");

                                // si la catégorie de services n'est pas "mandatory"
                                if (cat !== "mandatory") {
                                    var html = '';
                                    html += '<li  class="tarteaucitronLine">';
                                    html += '   <div class="tarteaucitronName">';
                                    html += '       <span class="tarteaucitronH3" role="heading" aria-level="2">'+tarteaucitron.lang[cat].title+'</span>';
                                    html += '       <span>'+tarteaucitron.lang[cat].details+'</span>';
                                    html += '   <button type="button" aria-expanded="false" class="tarteaucitron-toggle-group" id="tarteaucitron-toggle-group-'+cat+'">'+tarteaucitron.lang.alertSmall+' ('+document.getElementById("tarteaucitronServices_"+cat).childElementCount+')</button>';
                                    html += '   </div>';
                                    html += '   <div class="tarteaucitronAsk" id="tarteaucitron-group-'+cat+'">';
                                    html += '       <button type="button" aria-label="' + tarteaucitron.lang.allow + ' ' + tarteaucitron.lang[cat].title + '" class="tarteaucitronAllow" id="tarteaucitron-accept-group-'+cat+'">';
                                    html += '           <span class="tarteaucitronCheck" aria-hidden="true"></span> ' + tarteaucitron.lang.allow;
                                    html += '       </button> ';
                                    html += '       <button type="button" aria-label="' + tarteaucitron.lang.deny + ' ' + tarteaucitron.lang[cat].title + '" class="tarteaucitronDeny" id="tarteaucitron-reject-group-'+cat+'">';
                                    html += '           <span class="tarteaucitronCross" aria-hidden="true"></span> ' + tarteaucitron.lang.deny;
                                    html += '       </button>';
                                    html += '   </div>';
                                    html += '</li>';
                                    var ul = document.createElement('ul');
                                    ul.innerHTML = html;
                                    item.insertBefore(ul, item.querySelector('#tarteaucitronServices_'+cat+''));
                                    document.querySelector('#tarteaucitronServices_' + cat).style.display = 'none';
                                    tarteaucitron.addClickEventToId("tarteaucitron-toggle-group-" + cat, function () {
                                        tarteaucitron.userInterface.toggle('tarteaucitronServices_' + cat);
                                       if (document.getElementById('tarteaucitronServices_' + cat).style.display == 'block') {
                                            tarteaucitron.userInterface.addClass('tarteaucitronServicesTitle_' + cat, 'tarteaucitronIsExpanded');
                                            document.getElementById('tarteaucitron-toggle-group-'+cat).setAttribute('aria-expanded', 'true');
                                        } else {
                                            tarteaucitron.userInterface.removeClass('tarteaucitronServicesTitle_' + cat, 'tarteaucitronIsExpanded');
                                            document.getElementById('tarteaucitron-toggle-group-'+cat).setAttribute('aria-expanded', 'false');
                                        }
                                        //tarteaucitron.initEvents.resizeEvent();
                                    });

                                    // Ajout d'évènement pour accepter un groupe entier

                                    tarteaucitron.addClickEventToId("tarteaucitron-accept-group-" + cat, function () {
                                        tarteaucitron.userInterface.respondAll(true, cat);
                                    });
                                    tarteaucitron.addClickEventToId("tarteaucitron-reject-group-" + cat, function () {
                                        tarteaucitron.userInterface.respondAll(false, cat);
                                    });
                                }
                            });

                            clearInterval(checkExist); // Arrête l'intervalle lorsque les éléments sont trouvés
                        }
                    }, 500);
                }

                // add info about the services on the main banner
                if (tarteaucitron.parameters.partnersList === true && (tarteaucitron.parameters.orientation === "middle" || tarteaucitron.parameters.orientation === "popup")) {
                    setTimeout(function() {
                        var liPartners = "";
                        var tarteaucitronPartnersCat = [];
                        tarteaucitron.job.forEach(function (id) {
                            if (tarteaucitronPartnersCat[tarteaucitron.services[id].type] === undefined) {
                                tarteaucitronPartnersCat[tarteaucitron.services[id].type] = true;
                                liPartners += "<li>" + tarteaucitron.lang[tarteaucitron.services[id].type].title + "</li>";
                            }
                        });
                        var tacPartnersInfoParent = document.getElementById('tarteaucitronDisclaimerAlert');
                        if (tacPartnersInfoParent !== null) {
                            tacPartnersInfoParent.insertAdjacentHTML('beforeend', '<div class="tarteaucitronPartnersList"><b>' + tarteaucitron.lang.ourpartners + ' (' + tarteaucitron.job.length + ')</b> <ul>' + liPartners + '</ul></div>');
                        }
                    }, 100);
                }

                // add a save button
                setTimeout(function() {
                    var tacSaveButtonParent = document.getElementById('tarteaucitronServices');
                    if (tacSaveButtonParent !== null) {
                        tacSaveButtonParent.insertAdjacentHTML('beforeend', '<div id="tarteaucitronSave"><button class="tarteaucitronAllow" id="tarteaucitronSaveButton">' + tarteaucitron.lang.save + '</button></div>');
                    }
                }, 100);

                tarteaucitron.userInterface.color("", true);

                // add a little timeout to be sure everything is accessible
                setTimeout(function () {

                    // Setup events
                    tarteaucitron.addClickEventToId("tarteaucitronCloseCross", function () {
                        tarteaucitron.userInterface.closeAlert();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronPersonalize", function () {
                        tarteaucitron.userInterface.openPanel();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronPersonalize2", function () {
                        tarteaucitron.userInterface.respondAll(true);
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronManager", function () {
                        tarteaucitron.userInterface.openPanel();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronBack", function () {
                        tarteaucitron.userInterface.closePanel();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronClosePanel", function () {
                        tarteaucitron.userInterface.closePanel();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronClosePanelCookie", function () {
                        tarteaucitron.userInterface.closePanel();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronPrivacyUrl", function () {
                        document.location = tarteaucitron.parameters.privacyUrl;
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronPrivacyUrlDialog", function () {
                        document.location = tarteaucitron.parameters.privacyUrl;
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronCookiesNumber", function () {
                        tarteaucitron.userInterface.toggleCookiesList();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronAllAllowed", function () {
                        tarteaucitron.userInterface.respondAll(true);
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronAllDenied", function () {
                        tarteaucitron.userInterface.respondAll(false);
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronAllDenied2", function () {
                        tarteaucitron.userInterface.respondAll(false, '', true);
                        if (tarteaucitron.reloadThePage === true) {
                            window.location.reload();
                        }
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronCloseAlert", function () {
                        tarteaucitron.userInterface.openPanel();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronCTAButton", function () {
                        location.reload();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronSaveButton", function () {
                        var timeoutSaveButton = 0;
                        tarteaucitron.job.forEach(function(id) {
                            if (tarteaucitron.state[id] !== true && tarteaucitron.state[id] !== false) {
                                timeoutSaveButton = 500;
                                tarteaucitron.setConsent(id, false);
                            }
                        });
                        setTimeout(tarteaucitron.userInterface.closePanel, timeoutSaveButton);
                    });
                    var toggleBtns = document.getElementsByClassName("catToggleBtn"), i;
                    for (i = 0; i < toggleBtns.length; i++) {
                        toggleBtns[i].dataset.index = i;
                        tarteaucitron.addClickEventToElement(toggleBtns[i], function () {
                            if(!tarteaucitron.parameters.showDetailsOnClick) return false;
                            tarteaucitron.userInterface.toggle('tarteaucitronDetails' + cat[this.dataset.index], 'tarteaucitronInfoBox');
                            if (document.getElementById('tarteaucitronDetails' + cat[this.dataset.index]).style.display === 'block') {
                                this.setAttribute('aria-expanded', 'true');
                            } else {
                                this.setAttribute('aria-expanded', 'false');
                            }
                            return false;
                        });
                    }

                    // accessibility: on click on "Allow" in the site (not in TAC module), move focus to the loaded service's parent 
                    var allowBtnsInSite = document.querySelectorAll(".tac_activate .tarteaucitronAllow");
                    for (i = 0; i < allowBtnsInSite.length; i++) {
                        tarteaucitron.addClickEventToElement(allowBtnsInSite[i], function () {
                            if(this.closest('.tac_activate') !== null && this.closest('.tac_activate').parentNode !== null) {
                                this.closest('.tac_activate').parentNode.setAttribute("tabindex", "-1");
                                this.closest('.tac_activate').parentNode.focus();
                            }
                        });
                    }

                    var allowBtns = document.getElementsByClassName("tarteaucitronAllow");
                    for (i = 0; i < allowBtns.length; i++) {
                        tarteaucitron.addClickEventToElement(allowBtns[i], function () {
                            tarteaucitron.userInterface.respond(this, true);
                        });
                    }
                    var denyBtns = document.getElementsByClassName("tarteaucitronDeny");
                    for (i = 0; i < denyBtns.length; i++) {
                        tarteaucitron.addClickEventToElement(denyBtns[i], function () {
                            tarteaucitron.userInterface.respond(this, false);
                        });
                    }
                    if(tarteaucitron.events.load) {
                        tarteaucitron.events.load();
                    }
                }, 500);

            });
        });
    },
    // Fonction pour ajouter un service de cookies
    "addService": function (serviceId) {
        "use strict";
        var html = '',
            s = tarteaucitron.services,
            service = s[serviceId];

        if (tarteaucitron.parameters.alwaysNeedConsent === true) {
            service.needConsent = true;
        }

        var cookie = tarteaucitron.cookie.read(),
            hostname = document.location.hostname,
            hostRef = document.referrer.split('/')[2],
            isNavigating = (hostRef === hostname && window.location.href !== tarteaucitron.parameters.privacyUrl),
            isAutostart = (!service.needConsent),
            isWaiting = (cookie.indexOf(service.key + '=wait') >= 0),
            isDenied = (cookie.indexOf(service.key + '=false') >= 0),
            isAllowed = ((cookie.indexOf(service.key + '=true') >= 0) || (!service.needConsent && cookie.indexOf(service.key + '=false') < 0)),
            isResponded = (cookie.indexOf(service.key + '=false') >= 0 || cookie.indexOf(service.key + '=true') >= 0),
            isDNTRequested = (navigator.doNotTrack === "1" || navigator.doNotTrack === "yes" || navigator.msDoNotTrack === "1" || window.doNotTrack === "1"),
            currentStatus = (isAllowed) ? tarteaucitron.lang.allowed : tarteaucitron.lang.disallowed,
            state = (undefined !== service.defaultState) ? service.defaultState :
                    (undefined !== tarteaucitron.parameters.serviceDefaultState ? tarteaucitron.parameters.serviceDefaultState : 'wait');


        if (tarteaucitron.added[service.key] !== true) {
            tarteaucitron.added[service.key] = true;

            html += '<li id="' + service.key + 'Line" class="tarteaucitronLine">';
            html += '   <div class="tarteaucitronName">';
            html += '       <span class="tarteaucitronH3" role="heading" aria-level="3">' + service.name + '</span>';
            html += '       <div class="tarteaucitronStatusInfo">';
            html += '          <span class="tacCurrentStatus" id="tacCurrentStatus' + service.key + '">'+currentStatus+'</span>';
            html += '          <span class="tarteaucitronReadmoreSeparator"> - </span>';
            html += '          <span id="tacCL' + service.key + '" class="tarteaucitronListCookies"></span>';
            html += '       </div>';
            if (tarteaucitron.parameters.moreInfoLink == true) {

                var link = 'https://tarteaucitron.io/service/' + service.key + '/';
                if (service.readmoreLink !== undefined && service.readmoreLink !== '') {
                    link = service.readmoreLink;
                }
                if (tarteaucitron.parameters.readmoreLink !== undefined && tarteaucitron.parameters.readmoreLink !== '') {
                    link = tarteaucitron.parameters.readmoreLink;
                }
                html += '       <a href="' + link + '" target="_blank" rel="noreferrer noopener nofollow" title="' + tarteaucitron.lang.more + ' : '+ tarteaucitron.lang.cookieDetail + ' ' + service.name + ' ' + tarteaucitron.lang.ourSite + ' ' + tarteaucitron.lang.newWindow +'" class="tarteaucitronReadmoreInfo">' + tarteaucitron.lang.more + '</a>';
                html += '       <span class="tarteaucitronReadmoreSeparator"> - </span>';
                html += '       <a href="' + service.uri + '" target="_blank" rel="noreferrer noopener" title="' + tarteaucitron.lang.source + ' ' + service.name + ' ' + tarteaucitron.lang.newWindow + '" class="tarteaucitronReadmoreOfficial">' + tarteaucitron.lang.source + '</a>';
            }

            html += '   </div>';
            html += '   <div class="tarteaucitronAsk">';
            html += '       <button type="button" aria-label="' + tarteaucitron.lang.allow + ' ' + service.name + '" id="' + service.key + 'Allowed" class="tarteaucitronAllow">';
            html += '           <span class="tarteaucitronCheck" aria-hidden="true"></span> ' + tarteaucitron.lang.allow;
            html += '       </button> ';
            html += '       <button type="button" aria-label="' + tarteaucitron.lang.deny + ' ' + service.name + '" id="' + service.key + 'Denied" class="tarteaucitronDeny">';
            html += '           <span class="tarteaucitronCross" aria-hidden="true"></span> ' + tarteaucitron.lang.deny;
            html += '       </button>';
            html += '   </div>';
            html += '</li>';

            tarteaucitron.userInterface.css('tarteaucitronServicesTitle_' + service.type, 'display', 'block');

            if (document.getElementById('tarteaucitronServices_' + service.type) !== null) {
                document.getElementById('tarteaucitronServices_' + service.type).innerHTML += html;
            }

            tarteaucitron.userInterface.css('tarteaucitronNoServicesTitle', 'display', 'none');

            tarteaucitron.userInterface.order(service.type);

            tarteaucitron.addClickEventToId(service.key + 'Allowed', function () {
                tarteaucitron.userInterface.respond(this, true);
            });

            tarteaucitron.addClickEventToId(service.key + 'Denied', function () {
                tarteaucitron.userInterface.respond(this, false);
            });
        }

        // tarteaucitron.pro('!' + service.key + '=' + isAllowed);

        // allow by default for non EU
        if (isResponded === false && tarteaucitron.user.bypass === true) {
            isAllowed = true;
            tarteaucitron.cookie.create(service.key, true);
        }

        if ((!isResponded && (isAutostart || (isNavigating && isWaiting)) && !tarteaucitron.highPrivacy) || isAllowed) {
            if (!isAllowed || (!service.needConsent && cookie.indexOf(service.key + '=false') < 0)) {
                tarteaucitron.cookie.create(service.key, true);
            }
            if (tarteaucitron.launch[service.key] !== true) {
                tarteaucitron.launch[service.key] = true;
                if (typeof tarteaucitronMagic === 'undefined' || tarteaucitronMagic.indexOf("_" + service.key + "_") < 0) { service.js(); }
                tarteaucitron.sendEvent(service.key + '_loaded');
            }
            tarteaucitron.state[service.key] = true;
            tarteaucitron.userInterface.color(service.key, true);
        } else if (isDenied) {
            if (typeof service.fallback === 'function') {
                if (typeof tarteaucitronMagic === 'undefined' || tarteaucitronMagic.indexOf("_" + service.key + "_") < 0) { service.fallback(); }
            }
            tarteaucitron.state[service.key] = false;
            tarteaucitron.userInterface.color(service.key, false);
        } else if (!isResponded && isDNTRequested && tarteaucitron.handleBrowserDNTRequest) {
            tarteaucitron.cookie.create(service.key, 'false');
            if (typeof service.fallback === 'function') {
                if (typeof tarteaucitronMagic === 'undefined' || tarteaucitronMagic.indexOf("_" + service.key + "_") < 0) { service.fallback(); }
            }
            tarteaucitron.state[service.key] = false;
            tarteaucitron.userInterface.color(service.key, false);
        } else if (!isResponded) {
            tarteaucitron.cookie.create(service.key, state);
            if (typeof tarteaucitronMagic === 'undefined' || tarteaucitronMagic.indexOf("_" + service.key + "_") < 0) {
                if(true === state && typeof service.js === 'function') {
                    service.js();
                    tarteaucitron.sendEvent(service.key + '_loaded');
                } else if (typeof service.fallback === 'function') {
                    service.fallback();
                }
            }

            tarteaucitron.userInterface.color(service.key, state);

            if( 'wait' === state ) {
                tarteaucitron.userInterface.openAlert();
            }
        }

        tarteaucitron.cookie.checkCount(service.key);

        // envoyer un évènement pour avertir de l'ajout d'un service
        tarteaucitron.sendEvent(service.key + '_added');
    },
    // fonction pour envoyer un évènement javascript, inutile car >=IE9
    "sendEvent" : function(event_key) {
        if(event_key !== undefined) {
            //ie compatibility
            var send_event_item;
            if(typeof(Event) === 'function') {
                send_event_item = new Event(event_key);
            }else if (typeof(document.createEvent) === 'function'){
                send_event_item = document.createEvent('Event');
                send_event_item.initEvent(event_key, true, true);
            }
            //end ie compatibility

            document.dispatchEvent(send_event_item);
        }
    },
    // Fonction pour nettoyer un tableau en supprimant les doublons 
    // et en triant les éléments par type et clé de service
    "cleanArray": function cleanArray(arr) {
        "use strict";

        var i, // Index pour la boucle
            len = arr.length, // Longueur du tableau d'entrée
            out = [], // Tableau de sortie qui contiendra les éléments nettoyés et triés
            obj = {}, // Objet utilisé pour vérifier les doublons
            s = tarteaucitron.services; // Raccourci pour accéder aux services définis dans tarteaucitron

        // Boucle pour parcourir chaque élément du tableau d'entrée
        for (i = 0; i < len; i += 1) {

            // Si l'élément n'est pas déjà dans l'objet 'obj', c'est un nouvel élément unique
            if (!obj[arr[i]]) {

                // Marque l'élément comme traité en l'ajoutant à 'obj'
                obj[arr[i]] = {};

                // Vérifie si l'élément correspond à un service défini dans 'tarteaucitron.services'
                if (tarteaucitron.services[arr[i]] !== undefined) {

                    // Ajoute l'élément au tableau de sortie s'il est un service valide
                    out.push(arr[i]);
                }
            }
        }

        // Trie le tableau de sortie par type et clé de service
        out = out.sort(function (a, b) {

            // Compare les éléments par type et clé
            if (s[a].type + s[a].key > s[b].type + s[b].key) { return 1; } // Si l'élément a est supérieur à l'élément b, retourne 1
            if (s[a].type + s[a].key < s[b].type + s[b].key) { return -1; } // Si l'élément a est inférieur à l'élément b, retourne -1
            return 0; // Si les éléments sont égaux, retourne 0
        });

        // Retourne le tableau nettoyé et trié
        return out;
    },
    // Fonction pour envoyer un consentement, pour un autre type de bouton, 
    // execute respond sur un id précis
    "setConsent": function (id, status) {
        if (status === true) {
            tarteaucitron.userInterface.respond(document.getElementById(id + 'Allowed'), true);
        } else if (status === false) {
            tarteaucitron.userInterface.respond(document.getElementById(id + 'Denied'), false);
        }
    },
    // Objets de fonction gérant l'interface
    "userInterface": {
        // Fonction pour appliquer des styles CSS à un élément spécifié
        "css": function (id, property, value) {
            "use strict";

            // Vérifie si l'élément avec l'ID donné existe dans le document
            if (document.getElementById(id) !== null) {

                // Si la propriété est "display", la valeur est "none" et l'ID correspond à l'un des éléments spécifiques
                if (property == "display" && value == "none" && (id == "tarteaucitron" || id == "tarteaucitronBack" || id == "tarteaucitronAlertBig")) {
                    // Définit l'opacité de l'élément à 0 pour une transition en douceur
                    document.getElementById(id).style["opacity"] = "0";

                    // Définit la propriété CSS après avoir modifié l'opacité (commenté le délai)
                    document.getElementById(id).style[property] = value;

                } else {
                    // Applique la propriété CSS directement
                    document.getElementById(id).style[property] = value;

                    // Si la propriété est "display", la valeur est "block", et l'ID est "tarteaucitron" ou "tarteaucitronAlertBig"
                    if (property == "display" && value == "block" && (id == "tarteaucitron" || id == "tarteaucitronAlertBig")) {
                        // Définit l'opacité de l'élément à 1 pour le rendre complètement visible
                        document.getElementById(id).style["opacity"] = "1";
                    }

                    // Si la propriété est "display", la valeur est "block", et l'ID est "tarteaucitronBack"
                    if (property == "display" && value == "block" && id == "tarteaucitronBack") {
                        // Définit l'opacité de l'élément à 0.7 pour un effet semi-transparent
                        document.getElementById(id).style["opacity"] = "0.7";
                    }

                    // Si la propriété est "display", la valeur est "block", l'ID est "tarteaucitronAlertBig" et l'orientation est "middle" ou "popup"
                    if (property == "display" && value == "block" && id == "tarteaucitronAlertBig" && (tarteaucitron.parameters.orientation == "middle" || tarteaucitron.parameters.orientation == "popup")) {
                        // Appelle la fonction focusTrap pour gérer le focus à l'intérieur de l'élément "tarteaucitronAlertBig"
                        tarteaucitron.userInterface.focusTrap('tarteaucitronAlertBig');
                    }
                }
            }
        },
        // fonction pour ajouter une classe d'un élément ciblé par son id
        "addClass": function (id, className) {
            "use strict";
            if (document.getElementById(id) !== null && document.getElementById(id).classList !== undefined) {
                document.getElementById(id).classList.add(className);
            }
        },
        // fonction pour supprimer une classe d'un élément ciblé par son id
        "removeClass": function (id, className) {
            "use strict";
            if (document.getElementById(id) !== null && document.getElementById(id).classList !== undefined) {
                document.getElementById(id).classList.remove(className);
            }
        },
        // Fonction pour mettre à jour le statut de tous les services
        "respondAll": function (status, type, allowSafeAnalytics) {
            "use strict";

            // Variables pour stocker les services et les informations associées
            var s = tarteaucitron.services, // Obtenir tous les services configurés

                // Variable pour stocker temporairement chaque service
                service,

                 // Clé d'identification de chaque service
                key,

                // Compteur pour la boucle
                index = 0; 

            // Boucle à travers tous les services listés dans 'tarteaucitron.job'
            for (index = 0; index < tarteaucitron.job.length; index += 1) {

                // Si un type de service spécifique est défini (pour activer une catégorie) 
                // et ne correspond pas au type actuel, passer au suivant
                if (typeof type !== 'undefined' && type !== '' && s[tarteaucitron.job[index]].type !== type) {
                    continue; // Continue à la prochaine itération de la boucle
                }

                // Si 'allowSafeAnalytics' est vrai et le service actuel est marqué comme 'safeanalytic', passer au suivant
                // allowSafeAnalytics n'est pas documenté, apparemment pas utile, car il est false pour un seul service déclaré
                if (allowSafeAnalytics && typeof s[tarteaucitron.job[index]].safeanalytic !== "undefined" && s[tarteaucitron.job[index]].safeanalytic === true) {
                    continue; // Continue à la prochaine itération de la boucle
                }

                // Récupère le service actuel et sa clé
                service = s[tarteaucitron.job[index]]; // Récupérer le service courant

                // Obtenir la clé unique du service
                key = service.key; 

                // Vérifie si l'état du service doit être mis à jour
                if (tarteaucitron.state[key] !== status) {

                    // Si le service est déjà lancé et que le nouveau statut est 'false', marquer la page pour rechargement
                    if (status === false && tarteaucitron.launch[key] === true) {

                        // Indique qu'une actualisation de la page est nécessaire
                        tarteaucitron.reloadThePage = true;

                        // Met à jour les attributs ARIA et le titre du bouton de fermeture pour indiquer que la page sera rechargée
                        if (tarteaucitron.checkIfExist('tarteaucitronClosePanel')) {
                            var ariaCloseValue = document.getElementById('tarteaucitronClosePanel').textContent.trim() + ' (' + tarteaucitron.lang.reload + ')';
                            document.getElementById('tarteaucitronClosePanel').setAttribute("aria-label", ariaCloseValue);
                            document.getElementById('tarteaucitronClosePanel').setAttribute("title", ariaCloseValue);
                        }
                    }

                    // Si le service n'a pas encore été lancé et que le nouveau statut est 'true', lancer le service
                    if (tarteaucitron.launch[key] !== true && status === true) {

                        // Marque le service comme lancé
                        tarteaucitron.launch[key] = true;

                        // Si 'tarteaucitronMagic' n'est pas défini, objet premium non utile
                        /* if (typeof tarteaucitronMagic === 'undefined' || tarteaucitronMagic.indexOf("_" + key + "_") < 0) {
                            tarteaucitron.services[key].js(); // Exécute la fonction JavaScript associée au service
                        } */

                        // éxecuter le service
                        tarteaucitron.services[key].js();

                        // Envoie un événement indiquant que le service a été chargé
                        tarteaucitron.sendEvent(key + '_loaded');
                    }

                    // Récupère l'élément HTML pour afficher le statut actuel du service
                    var itemStatusElem = document.getElementById('tacCurrentStatus' + key);

                    // Met à jour l'état du service dans l'objet 'tarteaucitron' -> state
                    tarteaucitron.state[key] = status;

                    // Crée ou met à jour le cookie associé au service avec le nouveau statut
                    tarteaucitron.cookie.create(key, status);

                    // Met à jour l'interface utilisateur pour refléter le nouveau statut du service
                    tarteaucitron.userInterface.color(key, status);

                    // Met à jour le texte de l'élément HTML avec le statut actuel du service et envoie un événement
                    if (status == true) {
                        itemStatusElem.innerHTML = tarteaucitron.lang.allowed; // Met à jour le texte pour indiquer que le service est autorisé
                        tarteaucitron.sendEvent(key + '_allowed'); // Envoie un événement indiquant que le service est autorisé
                    } else {
                        itemStatusElem.innerHTML = tarteaucitron.lang.disallowed; // Met à jour le texte pour indiquer que le service est refusé
                        tarteaucitron.sendEvent(key + '_disallowed'); // Envoie un événement indiquant que le service est refusé
                    }
                }
            }
        },
        // Fonction pour mettre a jour le statut d'un service
        "respond": function (el, status) {
            "use strict";

            // Si l'élément HTML envoyé en paramètre n'a pas d'id, on return
            if (el.id === '') {
                return;
            }

            /*
            Prend l'identifiant (id) d'un élément HTML.
            Utilise une expression régulière pour trouver et supprimer toutes les occurrences de :
            "Eng" suivi d'un ou plusieurs chiffres, suivi de "ed" (par exemple, "Eng123ed").
            "Allowed".
            "Denied".
            Après avoir remplacé ces occurrences par une chaîne vide, le résultat est stocké dans la variable key.
            */
            var key = el.id.replace(new RegExp("(Eng[0-9]+|Allow|Deni)ed", "g"), '');

            /*
            Si la chaîne key commence par 'tarteaucitron'. Ou si key est une chaîne vide.
            On return
            */
            if (key.substring(0, 13) === 'tarteaucitron' || key === '') {return;}

            // si le state du service est le même (on appuie deux fois sur le bouton 'autoriser' par ex), return
            // return if same state
            if (tarteaucitron.state[key] === status) {
                return;
            }

            // si on desactive alors que c'était actif (le changement ne sera actif qu'après chargement de la page)
            if (status === false && tarteaucitron.launch[key] === true) {

                // on active le reload de la page
                tarteaucitron.reloadThePage = true;

                // on checke si l'element tarteaucitronClosePanel existe, soit le bouton pour fermer le panel    
                if (tarteaucitron.checkIfExist('tarteaucitronClosePanel')) {
                    var ariaCloseValue = document.getElementById('tarteaucitronClosePanel').textContent.trim() + ' (' + tarteaucitron.lang.reload + ')';
         
                    // IMPORTANT : on change les valeurs aria-label et title du bouton pour l'accessibilité
                    document.getElementById('tarteaucitronClosePanel').setAttribute("aria-label", ariaCloseValue);
                    document.getElementById('tarteaucitronClosePanel').setAttribute("title", ariaCloseValue);
                }
            }

            // si le service n'était pas actif, on le lance..
            if (status === true) {

                // on vérifié que le service n'est pas déjà actif
                if (tarteaucitron.launch[key] !== true) {

                    // tarteaucitron.pro('!' + key + '=engage');

                    // on déclare le service launché
                    tarteaucitron.launch[key] = true;


                    /* condition pour un ancien objet ou premium, pas utile
                    if (typeof tarteaucitronMagic === 'undefined' || tarteaucitronMagic.indexOf("_" + key + "_") < 0){             
                        tarteaucitron.services[key].js(); 
                    }*/

                    // execution du service par sa fonction js(), 
                    // déclarée pour chaque service dans tarteaucitron.services.js   
                    tarteaucitron.services[key].js();

                    // envoie de l'évènement service_key_loaded, pour une customisation possible
                    tarteaucitron.sendEvent(key + '_loaded');
                }
            }

            // status du service en cours (contenu html)
            var itemStatusElem = document.getElementById('tacCurrentStatus' + key);

            // on change le status du service en cours dans l'array state
            tarteaucitron.state[key] = status;

            // on modifie le cookie tarteaucitron pour le status du service en cours
            tarteaucitron.cookie.create(key, status);

            // on modifie les couleurs pour le service en cours (allow/deny vert/rouge)
            tarteaucitron.userInterface.color(key, status);

            if (status == true) {
                itemStatusElem.innerHTML = tarteaucitron.lang.allowed;
                tarteaucitron.sendEvent(key + '_allowed');
            } else {
                itemStatusElem.innerHTML = tarteaucitron.lang.disallowed;
                tarteaucitron.sendEvent(key + '_disallowed');
            }
        },
        // Fonction pour gérer les couleurs et l'état des services dans l'interface utilisateur
        "color": function (key, status) {
            "use strict";

            var c = 'tarteaucitron',

                nbDenied = 0,
                nbPending = 0,
                nbAllowed = 0,
                // nombre de services ajoutés
                sum = tarteaucitron.job.length,
                index,
                s = tarteaucitron.services;

            // s'il y a une key passée en paramètre
            if (key !== "") {

                // changement de l'UI en fonction du status, ainsi que les attributs d'accessibilité
                if (status === true) {
                    tarteaucitron.userInterface.addClass(key + 'Line', 'tarteaucitronIsAllowed');
                    tarteaucitron.userInterface.removeClass(key + 'Line', 'tarteaucitronIsDenied');
                    document.getElementById(key + 'Allowed').setAttribute('aria-pressed', 'true');
                    document.getElementById(key + 'Denied').setAttribute('aria-pressed', 'false');
                } else if (status === false) {
                    tarteaucitron.userInterface.removeClass(key + 'Line', 'tarteaucitronIsAllowed');
                    tarteaucitron.userInterface.addClass(key + 'Line', 'tarteaucitronIsDenied');
                    document.getElementById(key + 'Allowed').setAttribute('aria-pressed', 'false');
                    document.getElementById(key + 'Denied').setAttribute('aria-pressed', 'true');
                } else {
                    document.getElementById(key + 'Allowed').setAttribute('aria-pressed', 'false');
                    document.getElementById(key + 'Denied').setAttribute('aria-pressed', 'false');
                }

                // check if all services are allowed (save nbr of denied, pending and allowed)
                var sumToRemove = 0;
                for (index = 0; index < sum; index += 1) {

                    // ne pas prendre en compte les services dont la valeur safeanalytic est à true
                    if (typeof s[tarteaucitron.job[index]].safeanalytic !== "undefined" && s[tarteaucitron.job[index]].safeanalytic === true) {
                        sumToRemove += 1;
                        continue;
                    }

                    if (tarteaucitron.state[tarteaucitron.job[index]] === false) {
                        nbDenied += 1;
                    } else if (tarteaucitron.state[tarteaucitron.job[index]] === undefined) {
                        nbPending += 1;
                    } else if (tarteaucitron.state[tarteaucitron.job[index]] === true) {
                        nbAllowed += 1;
                    }
                }

                // supprimer sur le total ceux inutiles à la comptabilité
                sum -= sumToRemove;

                // Pour la fenêtre ShowAlertSmall à true, changer l'UI
                tarteaucitron.userInterface.css(c + 'DotGreen', 'width', ((100 / sum) * nbAllowed) + '%');
                tarteaucitron.userInterface.css(c + 'DotYellow', 'width', ((100 / sum) * nbPending) + '%');
                tarteaucitron.userInterface.css(c + 'DotRed', 'width', ((100 / sum) * nbDenied) + '%');

                if (nbDenied === 0 && nbPending === 0) {
                    tarteaucitron.userInterface.removeClass(c + 'AllDenied', c + 'IsSelected');
                    tarteaucitron.userInterface.addClass(c + 'AllAllowed', c + 'IsSelected');

                    tarteaucitron.userInterface.addClass(c + 'MainLineOffset', c + 'IsAllowed');
                    tarteaucitron.userInterface.removeClass(c + 'MainLineOffset', c + 'IsDenied');

                    document.getElementById(c + 'AllDenied').setAttribute('aria-pressed', 'false');
                    document.getElementById(c + 'AllAllowed').setAttribute('aria-pressed', 'true');

                } else if (nbAllowed === 0 && nbPending === 0) {
                    tarteaucitron.userInterface.removeClass(c + 'AllAllowed', c + 'IsSelected');
                    tarteaucitron.userInterface.addClass(c + 'AllDenied', c + 'IsSelected');

                    tarteaucitron.userInterface.removeClass(c + 'MainLineOffset', c + 'IsAllowed');
                    tarteaucitron.userInterface.addClass(c + 'MainLineOffset', c + 'IsDenied');

                    document.getElementById(c + 'AllDenied').setAttribute('aria-pressed', 'true');
                    document.getElementById(c + 'AllAllowed').setAttribute('aria-pressed', 'false');

                } else {
                    tarteaucitron.userInterface.removeClass(c + 'AllAllowed', c + 'IsSelected');
                    tarteaucitron.userInterface.removeClass(c + 'AllDenied', c + 'IsSelected');

                    tarteaucitron.userInterface.removeClass(c + 'MainLineOffset', c + 'IsAllowed');
                    tarteaucitron.userInterface.removeClass(c + 'MainLineOffset', c + 'IsDenied');

                    document.getElementById(c + 'AllDenied').setAttribute('aria-pressed', 'false');
                    document.getElementById(c + 'AllAllowed').setAttribute('aria-pressed', 'false');
                }

                // Si un choix a été fait, il n'y a plus de pending, 
                // donc la fenêtre de cookie est fermée
                // close the alert if all service have been reviewed
                if (nbPending === 0) {
                    tarteaucitron.userInterface.closeAlert();
                }

                // Si le service en cours a des cookies d'ajoutés, et que le status passe à false
                if (tarteaucitron.services[key].cookies.length > 0 && status === false) {

                    // purge des cookies
                    tarteaucitron.cookie.purge(tarteaucitron.services[key].cookies);
                }

                // si le status passe à true, mettre à jour le comptage de cookies (fonctionnalité masquée)
                if (status === true) {

                    // on ajoute ... le temps que les cookies s'ajoutent
                    if (document.getElementById('tacCL' + key) !== null) {
                        document.getElementById('tacCL' + key).innerHTML = '...';
                    }

                    // 2.5 secondes plus tard, on mets à jour la valeur via la fonction checkCount()
                    setTimeout(function () {
                        tarteaucitron.cookie.checkCount(key);
                    }, 2500);

                // sinon, pas besoin d'attendre, ça a été supprimé en synchrone, on mets à jour la valeur    
                } else {
                    tarteaucitron.cookie.checkCount(key);
                }

            }

	        // Sélectionne tous les éléments dont l'id commence par "tarteaucitronServicesTitle_"
            var cats = document.querySelectorAll('[id^="tarteaucitronServicesTitle_"]');

            // Parcourt chaque élément sélectionné
            Array.prototype.forEach.call(cats, function(item) {

                // Extrait la partie de l'id après "tarteaucitronServicesTitle_"
                var cat = item.getAttribute('id').replace(/^(tarteaucitronServicesTitle_)/, ""),

                    // Récupère le nombre total d'enfants de l'élément correspondant
                    total = document.getElementById("tarteaucitronServices_" + cat).childElementCount;
                
                // Référence à l'élément contenant les services pour cette catégorie
                var doc = document.getElementById("tarteaucitronServices_" + cat),

                    // Compteurs pour les services refusés et acceptés
                    groupdenied = 0,
                    groupallowed = 0;

                // Parcourt chaque enfant de l'élément de la catégorie de services pour compter les services acceptés et refusés
                for (var ii = 0; ii < doc.children.length; ii++) {

                    // Si le service est refusé, incrémente le compteur des refusés
                    if (doc.children[ii].className == "tarteaucitronLine tarteaucitronIsDenied") {
                        groupdenied++;
                    }
                    // Si le service est accepté, incrémente le compteur des acceptés
                    if (doc.children[ii].className == "tarteaucitronLine tarteaucitronIsAllowed") {
                        groupallowed++;
                    }
                }

                // Si tous les services de la catégorie sont acceptés
                if (total === groupallowed) {

                    // Si les services sont en mode groupés

                    // Met à jour l'interface utilisateur pour indiquer que tous les services de la catégorie sont acceptés
                    tarteaucitron.userInterface.removeClass('tarteaucitron-group-' + cat, 'tarteaucitronIsDenied');
                    tarteaucitron.userInterface.addClass('tarteaucitron-group-' + cat, 'tarteaucitronIsAllowed');

                    // Met à jour les attributs ARIA pour les boutons accepter/refuser du groupe
                    if (document.getElementById('tarteaucitron-reject-group-' + cat)) {
                        document.getElementById('tarteaucitron-reject-group-' + cat).setAttribute('aria-pressed', 'false');
                        document.getElementById('tarteaucitron-accept-group-' + cat).setAttribute('aria-pressed', 'true');
                    }
                }

                // Si tous les services de la catégorie sont refusés
                if (total === groupdenied) {

                    // Si les services sont en mode groupés

                    // Met à jour l'interface utilisateur pour indiquer que tous les services de la catégorie sont refusés
                    tarteaucitron.userInterface.addClass('tarteaucitron-group-' + cat, 'tarteaucitronIsDenied');
                    tarteaucitron.userInterface.removeClass('tarteaucitron-group-' + cat, 'tarteaucitronIsAllowed');

                    // Met à jour les attributs ARIA pour les boutons accepter/refuser du groupe
                    if (document.getElementById('tarteaucitron-reject-group-' + cat)) {
                        document.getElementById('tarteaucitron-reject-group-' + cat).setAttribute('aria-pressed', 'true');
                        document.getElementById('tarteaucitron-accept-group-' + cat).setAttribute('aria-pressed', 'false');
                    }
                }

                // Si tous les services ne sont ni tous acceptés ni tous refusés
                if (total !== groupdenied && total !== groupallowed) {

                    // Si les services sont en mode groupés

                    // Met à jour l'interface utilisateur pour indiquer un état indéterminé (ni tout accepté ni tout refusé)
                    tarteaucitron.userInterface.removeClass('tarteaucitron-group-' + cat, 'tarteaucitronIsDenied');
                    tarteaucitron.userInterface.removeClass('tarteaucitron-group-' + cat, 'tarteaucitronIsAllowed');

                    // Met à jour les attributs ARIA pour les boutons accepter/refuser du groupe
                    if (document.getElementById('tarteaucitron-reject-group-' + cat)) {
                        document.getElementById('tarteaucitron-reject-group-' + cat).setAttribute('aria-pressed', 'false');
                        document.getElementById('tarteaucitron-accept-group-' + cat).setAttribute('aria-pressed', 'false');
                    }
                }

                // Réinitialise les compteurs pour la prochaine itération
                groupdenied = 0;
                groupallowed = 0;
            });


        },
        // Fonction d'ouverture du panel de config
        "openPanel": function () {
            "use strict";

            tarteaucitron.userInterface.css('tarteaucitron', 'display', 'block');
            tarteaucitron.userInterface.css('tarteaucitronBack', 'display', 'block');
            tarteaucitron.userInterface.css('tarteaucitronCookiesListContainer', 'display', 'none');

            document.getElementById('tarteaucitronClosePanel').focus();
            if (document.getElementsByTagName('body')[0].classList !== undefined) {
                document.getElementsByTagName('body')[0].classList.add('tarteaucitron-modal-open');
            }
            tarteaucitron.userInterface.focusTrap('tarteaucitron');
            tarteaucitron.userInterface.jsSizing('main');

            //ie compatibility
            var tacOpenPanelEvent;
            if(typeof(Event) === 'function') {
                tacOpenPanelEvent = new Event("tac.open_panel");
            }else if (typeof(document.createEvent) === 'function'){
                tacOpenPanelEvent = document.createEvent('Event');
                tacOpenPanelEvent.initEvent("tac.open_panel", true, true);
            }
            //end ie compatibility

            if (typeof(window.dispatchEvent) === 'function') {window.dispatchEvent(tacOpenPanelEvent);}
        },
       // Fonction pour fermer le panneau de consentement et gérer l'accessibilité 
       // et le rechargement de la page si nécessaire
        "closePanel": function () {
            "use strict";

            // Si l'URL actuelle contient le hashtag spécifique de tarteaucitron
            if (document.location.hash === tarteaucitron.hashtag) {

                // Vérifie si l'objet history est disponible pour manipuler l'historique du navigateur
                if (window.history) {

                    // Remplace l'état de l'historique pour retirer le hashtag sans recharger la page
                    window.history.replaceState('', document.title, window.location.pathname + window.location.search);
                } else {
                    // Si history n'est pas disponible, retire le hashtag en modifiant l'URL
                    document.location.hash = '';
                }
            }

            // Vérifie si l'élément avec l'ID 'tarteaucitron' existe dans le DOM
            if (tarteaucitron.checkIfExist('tarteaucitron')) {

                // Accessibilité : gère le focus lors de la fermeture du panneau
                if (tarteaucitron.checkIfExist('tarteaucitronCloseAlert')) {

                    // Si l'élément 'tarteaucitronCloseAlert' existe, déplace le focus dessus
                    document.getElementById('tarteaucitronCloseAlert').focus();

                } else if (tarteaucitron.checkIfExist('tarteaucitronManager')) {

                    // Sinon, si l'élément 'tarteaucitronManager' existe, déplace le focus dessus
                    document.getElementById('tarteaucitronManager').focus();
                } else if (tarteaucitron.customCloserId && tarteaucitron.checkIfExist(tarteaucitron.customCloserId)) {

                    // Sinon, si un ID de fermeture personnalisé est défini et existe, déplace le focus dessus
                    document.getElementById(tarteaucitron.customCloserId).focus();
                }

                // Modifie le style CSS de l'élément 'tarteaucitron' pour le masquer
                tarteaucitron.userInterface.css('tarteaucitron', 'display', 'none');
            }

            // Vérifie si les éléments 'tarteaucitronCookiesListContainer' et 'tarteaucitronCookiesNumber' existent dans le DOM
            if (tarteaucitron.checkIfExist('tarteaucitronCookiesListContainer') && tarteaucitron.checkIfExist('tarteaucitronCookiesNumber')) {
                // Accessibilité : gère le focus lors de la fermeture de la liste des cookies
                document.getElementById('tarteaucitronCookiesNumber').focus(); // Déplace le focus sur 'tarteaucitronCookiesNumber'
                document.getElementById('tarteaucitronCookiesNumber').setAttribute("aria-expanded", "false"); // Met à jour l'attribut ARIA pour indiquer que la liste des cookies est fermée
                tarteaucitron.userInterface.css('tarteaucitronCookiesListContainer', 'display', 'none'); // Masque la liste des cookies
            }

            // Utilise la fonction de rappel pour masquer tous les éléments avec la classe 'tarteaucitronInfoBox'
            tarteaucitron.fallback(['tarteaucitronInfoBox'], function (elem) {
                elem.style.display = 'none'; // Masque chaque élément
            }, true);

            // Vérifie si la page doit être rechargée en fonction des actions de l'utilisateur
            if (tarteaucitron.reloadThePage === true) {
                window.location.reload(); // Recharge la page si nécessaire
            } else {
                // Si le rechargement de la page n'est pas nécessaire, masque l'élément 'tarteaucitronBack'
                tarteaucitron.userInterface.css('tarteaucitronBack', 'display', 'none');
            }

            // Supprime la classe 'tarteaucitron-modal-open' du body si elle est présente
            if (document.getElementsByTagName('body')[0].classList !== undefined) {
                document.getElementsByTagName('body')[0].classList.remove('tarteaucitron-modal-open');
            }

            // Compatibilité avec Internet Explorer pour créer et déclencher un événement personnalisé
            /*
            var tacClosePanelEvent;
            if (typeof(Event) === 'function') {
                // Crée un nouvel événement si le constructeur 'Event' est supporté
                tacClosePanelEvent = new Event("tac.close_panel");
            } else if (typeof(document.createEvent) === 'function') {
                // Crée un événement pour les navigateurs plus anciens
                tacClosePanelEvent = document.createEvent('Event');
                tacClosePanelEvent.initEvent("tac.close_panel", true, true);
            }*/

             // Crée un nouvel événement si le constructeur 'Event' est supporté
             let tacClosePanelEvent = new Event("tac.close_panel");

            // Déclenche l'événement 'tac.close_panel' si la méthode 'dispatchEvent' est supportée
            /*if (typeof(window.dispatchEvent) === 'function') {
                window.dispatchEvent(tacClosePanelEvent);
            }*/

            // Déclenche l'événement 'tac.close_panel'
            window.dispatchEvent(tacClosePanelEvent);
        },
        // Fonction pour créer un piège à focus, empêchant le focus de sortir 
        // d'un élément parent spécifique
        "focusTrap": function(parentElement) {
            "use strict"; 

            // Contiendra tous les éléments focusables dans le parent
            var focusableEls,
                // Premier élément focusable
                firstFocusableEl,
                // Dernier élément focusable
                lastFocusableEl,
                // Liste des éléments focusables visibles
                filtered;

            // Sélectionne tous les liens et boutons focusables dans l'élément parent spécifié par l'ID `parentElement`
            // c'est à dire les liens et les boutons
            focusableEls = document.getElementById(parentElement).querySelectorAll('a[href], button');

            filtered = []; // Initialise un tableau vide pour stocker les éléments visibles

            // Boucle pour filtrer les éléments focusables visibles
            for (var i = 0, max = focusableEls.length; i < max; i++) {

                // Vérifie si l'élément est visible en s'assurant que sa hauteur est supérieure à 0
                if (focusableEls[i].offsetHeight > 0) {

                    // Ajoute l'élément à la liste des éléments visibles    
                    filtered.push(focusableEls[i]);
                }
            }

            // Détermine le premier et le dernier élément focusable visible
            firstFocusableEl = filtered[0]; // Premier élément focusable visible
            lastFocusableEl = filtered[filtered.length - 1]; // Dernier élément focusable visible

            // Ajoute un écouteur d'événements "keydown" à l'élément parent pour gérer le piège à focus
            document.getElementById(parentElement).addEventListener("keydown", function (evt) {

                // Vérifie si la touche pressée est la touche Tabulation
                if (evt.key === 'Tab' || evt.keyCode === 9) {
                    
                    // Si la touche Shift est également enfoncée (Shift + Tab)
                    if (evt.shiftKey) {

                        // Si l'élément actif est le premier élément focusable visible, 
                        // déplacer le focus sur le dernier élément
                        if (document.activeElement === firstFocusableEl) {
                            lastFocusableEl.focus(); // Déplace le focus sur le dernier élément focusable visible
                            evt.preventDefault(); // Empêche le comportement par défaut de la touche Tab
                        }
                    } else {
                        // Si seule la touche Tab est enfoncée
                        // Si l'élément actif est le dernier élément focusable visible, déplacer le focus sur le premier élément
                        if (document.activeElement === lastFocusableEl) {
                            firstFocusableEl.focus(); // Déplace le focus sur le premier élément focusable visible
                            evt.preventDefault(); // Empêche le comportement par défaut de la touche Tab
                        }
                    }
                }
            });
        },
        // Fonction pour rendre visible la première popup
        "openAlert": function () {
            "use strict";
            var c = 'tarteaucitron';
            tarteaucitron.userInterface.css(c + 'Percentage', 'display', 'block');
            tarteaucitron.userInterface.css(c + 'AlertSmall', 'display', 'none');
            tarteaucitron.userInterface.css(c + 'Icon', 'display', 'none');
            tarteaucitron.userInterface.css(c + 'AlertBig',   'display', 'block');
            tarteaucitron.userInterface.addClass(c + 'Root',   'tarteaucitronBeforeVisible');

            //ie compatibility
            var tacOpenAlertEvent;
            if(typeof(Event) === 'function') {
                tacOpenAlertEvent = new Event("tac.open_alert");
            }else if (typeof(document.createEvent) === 'function'){
                tacOpenAlertEvent = document.createEvent('Event');
                tacOpenAlertEvent.initEvent("tac.open_alert", true, true);
            }
            //end ie compatibility

            if (document.getElementById('tarteaucitronAlertBig') !== null && tarteaucitron.parameters.orientation === 'middle') {
                document.getElementById('tarteaucitronAlertBig').focus();
            }

            if (typeof(window.dispatchEvent) === 'function') {window.dispatchEvent(tacOpenAlertEvent);}
        },
        // Fonction pour masquer la première popup
        "closeAlert": function () {
            "use strict";
            var c = 'tarteaucitron';

            // masquer l'alert (première popup, ainsi que les différents éléments reliés)
            tarteaucitron.userInterface.css(c + 'Percentage', 'display', 'none');
            tarteaucitron.userInterface.css(c + 'AlertSmall', 'display', 'block');
            tarteaucitron.userInterface.css(c + 'Icon', 'display', 'block');
            tarteaucitron.userInterface.css(c + 'AlertBig',   'display', 'none');
            tarteaucitron.userInterface.removeClass(c + 'Root',   'tarteaucitronBeforeVisible');
            tarteaucitron.userInterface.jsSizing('box');

            //ie compatibility
            /* var tacCloseAlertEvent;
            if(typeof(Event) === 'function') {
                tacCloseAlertEvent = new Event("tac.close_alert");
            }else if (typeof(document.createEvent) === 'function'){
                tacCloseAlertEvent = document.createEvent('Event');
                tacCloseAlertEvent.initEvent("tac.close_alert", true, true);
            } */
            //end ie compatibility

            let tacCloseAlertEvent = new Event("tac.close_alert");

            window.dispatchEvent(tacCloseAlertEvent);

            /*if (typeof(window.dispatchEvent) === 'function') {window.dispatchEvent(tacCloseAlertEvent);} */
        },
        // Fonction pour toggle les cookies (UI)
        "toggleCookiesList": function () {
            "use strict";
            var div = document.getElementById('tarteaucitronCookiesListContainer'),
                togglediv = document.getElementById('tarteaucitronCookiesNumber');

            if (div === null) {
                return;
            }

            if (div.style.display !== 'block') {
                tarteaucitron.cookie.number();
                div.style.display = 'block';
                togglediv.setAttribute("aria-expanded", "true");
                tarteaucitron.userInterface.jsSizing('cookie');
                tarteaucitron.userInterface.css('tarteaucitron', 'display', 'none');
                tarteaucitron.userInterface.css('tarteaucitronBack', 'display', 'block');
                tarteaucitron.fallback(['tarteaucitronInfoBox'], function (elem) {
                    elem.style.display = 'none';
                }, true);
            } else {
                div.style.display = 'none';
                togglediv.setAttribute("aria-expanded", "false");
                tarteaucitron.userInterface.css('tarteaucitron', 'display', 'none');
                tarteaucitron.userInterface.css('tarteaucitronBack', 'display', 'none');
            }
        },
        // Fonction pour toggle un élément (par id ou class)
        "toggle": function (id, closeClass) {
            "use strict";
            var div = document.getElementById(id);

            if (div === null) {
                return;
            }

            if (closeClass !== undefined) {
                tarteaucitron.fallback([closeClass], function (elem) {
                    if (elem.id !== id) {
                        elem.style.display = 'none';
                    }
                }, true);
            }

            if (div.style.display !== 'block') {
                div.style.display = 'block';
            } else {
                div.style.display = 'none';
            }
        },
        // Fonction pour trier les enfants d'un élément parent par ordre alphabétique basé sur le nom du service (id)
        "order": function (id) {
            "use strict";

            // Récupère l'élément parent basé sur l'ID fourni
            var main = document.getElementById('tarteaucitronServices_' + id),
                allDivs, // Variable pour stocker tous les enfants de l'élément parent
                store = [], // Tableau temporaire pour stocker les éléments pendant le tri
                i; // Index pour les boucles

            // Si l'élément parent n'existe pas, quitter la fonction
            if (main === null) {
                return;
            }

            // Récupère tous les nœuds enfants de l'élément parent
            allDivs = main.childNodes;

            // Vérifie si la méthode 'map' est disponible sur les tableaux et que 'Enumerable' n'est pas défini
            if (typeof Array.prototype.map === 'function' && typeof Enumerable === 'undefined') {

                // Utilise 'Array.prototype.map' pour convertir les enfants en objets et les trier
                Array.prototype.map.call(main.children, Object).sort(function (a, b) {
                    // Comparaison alphabétique basée sur le nom des services
                    if (tarteaucitron.services[a.id.replace(/Line/g, '')].name > tarteaucitron.services[b.id.replace(/Line/g, '')].name) {
                        return 1; // Retourne 1 si le nom du service de 'a' est supérieur à celui de 'b'
                    }
                    if (tarteaucitron.services[a.id.replace(/Line/g, '')].name < tarteaucitron.services[b.id.replace(/Line/g, '')].name) {
                        return -1; // Retourne -1 si le nom du service de 'a' est inférieur à celui de 'b'
                    }
                    return 0; // Retourne 0 si les noms des services sont identiques
                }).forEach(function (element) {
                    // Pour chaque élément trié, l'ajoute à la fin de l'élément parent
                    main.appendChild(element);
                });
            }
        },
        "jsSizing": function (type) {
            "use strict";
            var scrollbarMarginRight = 10,
                scrollbarWidthParent,
                scrollbarWidthChild,
                servicesHeight,
                e = window,
                a = 'inner',
                windowInnerHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
                mainTop,
                mainHeight,
                closeButtonHeight,
                headerHeight,
                cookiesListHeight,
                cookiesCloseHeight,
                cookiesTitleHeight,
                paddingBox,
                alertSmallHeight,
                cookiesNumberHeight;

            if (type === 'box') {
                if (document.getElementById('tarteaucitronAlertSmall') !== null && document.getElementById('tarteaucitronCookiesNumber') !== null) {

                    // reset
                    tarteaucitron.userInterface.css('tarteaucitronCookiesNumber', 'padding', '0px 10px');

                    // calculate
                    alertSmallHeight = document.getElementById('tarteaucitronAlertSmall').offsetHeight;
                    cookiesNumberHeight = document.getElementById('tarteaucitronCookiesNumber').offsetHeight;
                    paddingBox = (alertSmallHeight - cookiesNumberHeight) / 2;

                    // apply
                    tarteaucitron.userInterface.css('tarteaucitronCookiesNumber', 'padding', paddingBox + 'px 10px');
                }
            } else if (type === 'main') {

                // get the real window width for media query
                if (window.innerWidth === undefined) {
                    a = 'client';
                    e = document.documentElement || document.body;
                }

                // height of the services list container
                if (document.getElementById('tarteaucitron') !== null && document.getElementById('tarteaucitronClosePanel') !== null && document.getElementById('tarteaucitronMainLineOffset') !== null) {

                    // reset
                    tarteaucitron.userInterface.css('tarteaucitronServices', 'height', 'auto');

                    // calculate
                    mainHeight = document.getElementById('tarteaucitron').offsetHeight;
                    closeButtonHeight = document.getElementById('tarteaucitronClosePanel').offsetHeight;

                    // apply
                    servicesHeight = (mainHeight - closeButtonHeight + 4);
                    tarteaucitron.userInterface.css('tarteaucitronServices', 'height', servicesHeight + 'px');
                    tarteaucitron.userInterface.css('tarteaucitronServices', 'overflow-x', 'auto');
                }

                // align the main allow/deny button depending on scrollbar width
                if (document.getElementById('tarteaucitronServices') !== null && document.getElementById('tarteaucitronScrollbarChild') !== null) {

                    // media query
                    if (e[a + 'Width'] <= 479) {
                        //tarteaucitron.userInterface.css('tarteaucitronScrollbarAdjust', 'marginLeft', '11px');
                    } else if (e[a + 'Width'] <= 767) {
                        scrollbarMarginRight = 12;
                    }

                    scrollbarWidthParent = document.getElementById('tarteaucitronServices').offsetWidth;
                    scrollbarWidthChild = document.getElementById('tarteaucitronScrollbarChild').offsetWidth;
                    //tarteaucitron.userInterface.css('tarteaucitronScrollbarAdjust', 'marginRight', ((scrollbarWidthParent - scrollbarWidthChild) + scrollbarMarginRight) + 'px');
                }

                // center the main panel
                if (document.getElementById('tarteaucitron') !== null) {

                    // media query
                    if (e[a + 'Width'] <= 767) {
                        mainTop = 0;
                    } else {
                        mainTop = ((windowInnerHeight - document.getElementById('tarteaucitron').offsetHeight) / 2) - 21;
                    }

                    if (document.getElementById('tarteaucitronMainLineOffset') !== null) {
                        if (document.getElementById('tarteaucitron').offsetHeight < (windowInnerHeight / 2)) {
                            mainTop -= document.getElementById('tarteaucitronMainLineOffset').offsetHeight;
                        }
                    }

                    // correct
                    if (mainTop < 0) {
                        mainTop = 0;
                    }

                    // apply
                    tarteaucitron.userInterface.css('tarteaucitron', 'top', mainTop + 'px');
                }


            } else if (type === 'cookie') {

                // put cookies list at bottom
                if (document.getElementById('tarteaucitronAlertSmall') !== null) {
                    tarteaucitron.userInterface.css('tarteaucitronCookiesListContainer', 'bottom', (document.getElementById('tarteaucitronAlertSmall').offsetHeight) + 'px');
                }

                // height of cookies list
                if (document.getElementById('tarteaucitronCookiesListContainer') !== null) {

                    // reset
                    tarteaucitron.userInterface.css('tarteaucitronCookiesList', 'height', 'auto');

                    // calculate
                    cookiesListHeight = document.getElementById('tarteaucitronCookiesListContainer').offsetHeight;
                    cookiesCloseHeight = document.getElementById('tarteaucitronClosePanelCookie').offsetHeight;
                    cookiesTitleHeight = document.getElementById('tarteaucitronCookiesTitle').offsetHeight;

                    // apply
                    tarteaucitron.userInterface.css('tarteaucitronCookiesList', 'height', (cookiesListHeight - cookiesCloseHeight - cookiesTitleHeight - 2) + 'px');
                }
            }
        }
    },
    "cookie": {
        "owner": {},
        // fonction permettant d'ajouter un cookie tarteaucitron 
        // avec toutes les valeurs allow/deny de chaque service
        "create": function (key, status) {
            "use strict";

            // si on a setup une valeur d'expiration
            if (tarteaucitronForceExpire !== '') {

                // The number of day(s)/hour(s) can't be higher than 1 year
                if ((tarteaucitronExpireInDay && tarteaucitronForceExpire < 365) || (!tarteaucitronExpireInDay && tarteaucitronForceExpire < 8760)) {

                    // si on a setup pour une valeur en jour ou heure
                    if (tarteaucitronExpireInDay) {
                        // Multiplication to tranform the number of days to milliseconds
                        // 1 jour = 86400000 ms
                        timeExpire = tarteaucitronForceExpire * 86400000;
                    } else {
                        // Multiplication to tranform the number of hours to milliseconds
                        // 1 heure = 3600000 ms
                        timeExpire = tarteaucitronForceExpire * 3600000;
                    }
                }
            }

            // initialisation d'un objet Date à valeur de maintenant
            var d = new Date(),

                // Milliseconds since Jan 1, 1970, 00:00:00.000 GMT
                time = d.getTime(),

                // On ajoute à time la valeur de timeExpire, par défaut à 365 jours
                expireTime = time + timeExpire, // 365 days

                // création d'une regex pour trouver le service en cours
                regex = new RegExp("!" + key + "=(wait|true|false)", "g"),

                // suppression de la valeur du cookie pour le service en cours
                cookie = tarteaucitron.cookie.read().replace(regex, ""),

                // valeur du cookie + service en cours
                value = tarteaucitron.parameters.cookieName + '=' + cookie + '!' + key + '=' + status,

                // ajout de la valeur domain si multisites    
                domain = (tarteaucitron.parameters.cookieDomain !== undefined && tarteaucitron.parameters.cookieDomain !== '') ? '; domain=' + tarteaucitron.parameters.cookieDomain : '',

                // Si le site est https, ajout de la valeur Secure
                secure = location.protocol === 'https:' ? '; Secure' : '';

            // On set le time à la valeur d'expiration pour le cookie    
            d.setTime(expireTime);

            // On ajoute le cookie au navigateur
            document.cookie = value + '; expires=' + d.toGMTString() + '; path=/' + domain + secure + '; samesite=lax';


            // On envoie l'évènement tac.consent_updated
            tarteaucitron.sendEvent('tac.consent_updated');
        },
        // fonction pour lire la valeur du cookie tarteaucitron=
       "read": function () {
            "use strict";

            // Définit le nom du cookie avec un signe égal pour faciliter la recherche
            var nameEQ = tarteaucitron.parameters.cookieName + "=",

                // Divise la chaîne de cookies document.cookie en un tableau en utilisant le point-virgule comme séparateur
                ca = document.cookie.split(';'),
                i,
                // Variable pour stocker chaque cookie lors de la boucle
                c;

            // Parcourt tous les cookies dans le tableau
            for (i = 0; i < ca.length; i += 1) {

                c = ca[i]; // Récupère le cookie actuel

                // Supprime les espaces au début du cookie
                while (c.charAt(0) === ' ') {

                    // Enlève le premier caractère si c'est un espace
                    c = c.substring(1, c.length);
                }

                // Vérifie si le cookie commence par le nom du cookie recherché
                if (c.indexOf(nameEQ) === 0) {

                    // Retourne la valeur du cookie en supprimant le nom et l'égal
                    return c.substring(nameEQ.length, c.length);
                }
            }

            // Retourne une chaîne vide si le cookie n'est pas trouvé
            return '';
        },
        // fonction qui permet de purge les cookies passés en paramètre
        /* exemple : 
        "_ga"
        "_gat"
        "_gid"
        "__utma"
        "__utmb"
        "__utmc"
        "_gat_gtag_G_20ZX3F8KTE"
        "_ga_20ZX3F8KTE"
        "_gcl_au"
        */
        "purge": function (arr) {
            "use strict";
            var i;

            for (i = 0; i < arr.length; i += 1) {

                // création d'une regex pour le cookie ciblé
                var rgxpCookie = new RegExp("^(.*;)?\\s*" + arr[i] + "\\s*=\\s*[^;]+(.*)?$");

                // Vérifie si un cookie correspondant au motif rgxpCookie existe dans document.cookie
                if (document.cookie.match(rgxpCookie)) {
                    // Tente de supprimer le cookie en le définissant avec une date d'expiration passée
                    // et en spécifiant le chemin pour tous les chemins du site web
                    document.cookie = arr[i] + '=; expires=Thu, 01 Jan 2000 00:00:00 GMT; path=/;';
                    
                    // Tente de supprimer le cookie en le définissant avec une date d'expiration passée,
                    // en spécifiant le chemin pour tous les chemins du site web
                    // et en utilisant le domaine complet de l'hôte actuel (par exemple, www.example.com)
                    document.cookie = arr[i] + '=; expires=Thu, 01 Jan 2000 00:00:00 GMT; path=/; domain=.' + location.hostname + ';';
                    
                    // Tente de supprimer le cookie en le définissant avec une date d'expiration passée,
                    // en spécifiant le chemin pour tous les chemins du site web
                    // et en utilisant seulement le domaine de deuxième niveau (par exemple, example.com)
                    document.cookie = arr[i] + '=; expires=Thu, 01 Jan 2000 00:00:00 GMT; path=/; domain=.' + location.hostname.split('.').slice(-2).join('.') + ';';
                }
            }
        },
        // Fonction pour mettre à jour le nombre de cookies d'un service (key) côté UI
        "checkCount": function (key) {
            "use strict";

            // Récupère la liste des cookies associés au service spécifié par la clé (key)
            var arr = tarteaucitron.services[key].cookies,
                // Nombre total de cookies dans la liste
                nb = arr.length,
                // Compteur de cookies actuellement présents dans le navigateur
                nbCurrent = 0,
                // Chaîne HTML pour afficher le résultat
                html = '',
                i,

                // Vérifie si le cookie pour le service donné est présent dans document.cookie
                status = document.cookie.indexOf(key + '=true'),

                // Label par défaut pour "cookie"
                cookieLabel = "cookie";

            // Si la langue du site est l'allemand, modifie le label du cookie
            if (tarteaucitron.getLanguage() === "de") {
                cookieLabel = "Cookie";
            }

            // Si le cookie du service est présent dans "tarteaucitron=" et qu'il n'y a aucun cookie dans la liste
            if (status >= 0 && nb === 0) {

                // Utilise le message indiquant qu'aucun cookie n'est utilisé
                html += tarteaucitron.lang.useNoCookie;

            // Si le cookie du service est présent dans "tarteaucitron=" et qu'il y a des cookies dans la liste    
            } else if (status >= 0) {
             
                // Parcourt tous les cookies dans la liste
                for (i = 0; i < nb; i += 1) {

                    // Vérifie si chaque cookie du service est présent dans document.cookie
                    if (document.cookie.indexOf(arr[i] + '=') !== -1) {

                        // Incrémente le compteur de cookies actuellement présents
                        nbCurrent += 1;

                        // Si le cookie n'a pas encore de service associé, initialise un tableau pour lui (tableau inversé)
                        if (tarteaucitron.cookie.owner[arr[i]] === undefined) {
                            tarteaucitron.cookie.owner[arr[i]] = [];
                        }

                        // Si le nom du service n'est pas encore associé au cookie, l'ajoute à la liste des propriétaires
                        // Cela crée une relation cookie_name->[service], utile pour des recherches futures
                        if (tarteaucitron.cookie.crossIndexOf(tarteaucitron.cookie.owner[arr[i]], tarteaucitron.services[key].name) === false) {
                            tarteaucitron.cookie.owner[arr[i]].push(tarteaucitron.services[key].name);
                        }
                    }
                }

                // Si des cookies sont actuellement présents
                if (nbCurrent > 0) {

                    // Construit le message indiquant combien de cookies sont utilisés actuellement
                    html += tarteaucitron.lang.useCookieCurrent + ' ' + nbCurrent + ' ' + cookieLabel;
                    if (nbCurrent > 1) {
                        html += 's'; // Ajoute un "s" pour le pluriel si plus d'un cookie
                    }
                    html += '.';
                } else {
                    // Si aucun cookie n'est actuellement présent, indique qu'aucun cookie n'est utilisé
                    html += tarteaucitron.lang.useNoCookie;
                }
            } else if (nb === 0) {
                // Si le cookie du service n'est pas présent et qu'il n'y a aucun cookie dans la liste
                // Utilise le message indiquant qu'il n'y a pas de cookies
                html = tarteaucitron.lang.noCookie;
            } else {
                // Si le cookie du service n'est pas présent et qu'il y a des cookies dans la liste
                // Construit le message indiquant combien de cookies sont utilisés par le service
                html += tarteaucitron.lang.useCookie + ' ' + nb + ' ' + cookieLabel;
                if (nb > 1) {
                    html += 's'; // Ajoute un "s" pour le pluriel si plus d'un cookie
                }
                html += '.';
            }

            // Met à jour le contenu HTML de l'élément avec l'ID 'tacCL' suivi de la clé (key)
            if (document.getElementById('tacCL' + key) !== null) {
                document.getElementById('tacCL' + key).innerHTML = html;
            }
        },
        // Fonction pour vérifier si l'élement existe dans le tableau
        "crossIndexOf": function (arr, match) {
            "use strict";

            var i; // Déclare une variable pour la boucle

            // Parcourt tous les éléments du tableau arr
            for (i = 0; i < arr.length; i += 1) {
                // Vérifie si l'élément courant du tableau est égal à la valeur recherchée (match)
                if (arr[i] === match) {
                    return true; // Si une correspondance est trouvée, retourne true
                }
            }

            return false; // Si aucune correspondance n'est trouvée après avoir parcouru tout le tableau, retourne false
        },

        "number": function () {
            "use strict";
            var cookies = document.cookie.split(';'),
                nb = (document.cookie !== '') ? cookies.length : 0,
                html = '',
                i,
                name,
                namea,
                nameb,
                c,
                d,
                s = (nb > 1) ? 's' : '',
                savedname,
                regex = /^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i,
                regexedDomain = (tarteaucitron.cdn.match(regex) !== null) ? tarteaucitron.cdn.match(regex)[1] : tarteaucitron.cdn,
                host = (tarteaucitron.domain !== undefined) ? tarteaucitron.domain : regexedDomain;

            cookies = cookies.sort(function (a, b) {
                namea = a.split('=', 1).toString().replace(/ /g, '');
                nameb = b.split('=', 1).toString().replace(/ /g, '');
                c = (tarteaucitron.cookie.owner[namea] !== undefined) ? tarteaucitron.cookie.owner[namea] : '0';
                d = (tarteaucitron.cookie.owner[nameb] !== undefined) ? tarteaucitron.cookie.owner[nameb] : '0';
                if (c + a > d + b) { return 1; }
                if (c + a < d + b) { return -1; }
                return 0;
            });

            if (document.cookie !== '') {
                for (i = 0; i < nb; i += 1) {
                    name = cookies[i].split('=', 1).toString().replace(/ /g, '');
                    if (tarteaucitron.cookie.owner[name] !== undefined && tarteaucitron.cookie.owner[name].join(' // ') !== savedname) {
                        savedname = tarteaucitron.cookie.owner[name].join(' // ');
                        html += '<div class="tarteaucitronHidden">';
                        html += '     <span class="tarteaucitronTitle tarteaucitronH3" role="heading" aria-level="3">';
                        html += '        ' + tarteaucitron.cookie.owner[name].join(' // ');
                        html += '    </span>';
                        html += '</div><ul class="cookie-list">';
                    } else if (tarteaucitron.cookie.owner[name] === undefined && host !== savedname) {
                        savedname = host;
                        html += '<div class="tarteaucitronHidden">';
                        html += '     <span class="tarteaucitronTitle tarteaucitronH3" role="heading" aria-level="3">';
                        html += '        ' + host;
                        html += '    </span>';
                        html += '</div><ul class="cookie-list">';
                    }
                    html += '<li class="tarteaucitronCookiesListMain">';
                    html += '    <div class="tarteaucitronCookiesListLeft"><button type="button" class="purgeBtn" data-cookie="' + tarteaucitron.fixSelfXSS(cookies[i].split('=', 1)) + '"><strong>&times;</strong></button> <strong>' + tarteaucitron.fixSelfXSS(name) + '</strong>';
                    html += '    </div>';
                    html += '    <div class="tarteaucitronCookiesListRight">' + tarteaucitron.fixSelfXSS(cookies[i].split('=').slice(1).join('=')) + '</div>';
                    html += '</li>';
                }
                html += '</ul>';
            } else {
                html += '<div class="tarteaucitronCookiesListMain">';
                html += '    <div class="tarteaucitronCookiesListLeft"><strong>-</strong></div>';
                html += '    <div class="tarteaucitronCookiesListRight"></div>';
                html += '</div>';
            }

            html += '<div class="tarteaucitronHidden tarteaucitron-spacer-20"></div>';

            if (document.getElementById('tarteaucitronCookiesList') !== null) {
                document.getElementById('tarteaucitronCookiesList').innerHTML = html;
            }

            if (document.getElementById('tarteaucitronCookiesNumber') !== null) {
                document.getElementById('tarteaucitronCookiesNumber').innerHTML = nb;
                document.getElementById('tarteaucitronCookiesNumber').setAttribute("aria-label", nb + ' cookie' + s + " - " + tarteaucitron.lang.toggleInfoBox);
                document.getElementById('tarteaucitronCookiesNumber').setAttribute("title", nb + ' cookie' + s + " - " + tarteaucitron.lang.toggleInfoBox);
            }

            if (document.getElementById('tarteaucitronCookiesNumberBis') !== null) {
                document.getElementById('tarteaucitronCookiesNumberBis').innerHTML = nb + ' cookie' + s;
            }

            var purgeBtns = document.getElementsByClassName("purgeBtn");
            for (i = 0; i < purgeBtns.length; i++) {
                tarteaucitron.addClickEventToElement(purgeBtns[i], function () {
                    tarteaucitron.cookie.purge([this.dataset.cookie]);
                    tarteaucitron.cookie.number();
                    tarteaucitron.userInterface.jsSizing('cookie');
                    return false;
                });
            }

            for (i = 0; i < tarteaucitron.job.length; i += 1) {
                tarteaucitron.cookie.checkCount(tarteaucitron.job[i]);
            }
        }
    },
    "fixSelfXSS": function(html) {
        return html.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    },
    // fonction qui renvoie la langue en fonction de plusieurs conditions
    "getLanguage": function () {
        "use strict";

        var availableLanguages = 'ar,bg,ca,cn,cs,da,de,et,el,en,es,fi,fr,hr,hu,it,ja,ko,lb,lt,lv,nl,no,oc,pl,pt,ro,ru,se,sk,sv,tr,uk,vi,zh',
            defaultLanguage = 'en';

        // si la variable tarteaucitronForceLanguage contient une langue par défaut (soit initialisée avant le plugin)  
        if (tarteaucitronForceLanguage !== '') {

            // tester si cette langue est contenue dans availableLanguages 
            if (availableLanguages.indexOf(tarteaucitronForceLanguage) !== -1) {
                // si oui, renvoyer celle-ci
                return tarteaucitronForceLanguage;
            }
        }

        // renvoyer le html lang si disponible
        if (document.documentElement.getAttribute("lang") !== undefined && document.documentElement.getAttribute("lang") !== null) {
            if (availableLanguages.indexOf(document.documentElement.getAttribute("lang").substr(0, 2)) !== -1) {
                return document.documentElement.getAttribute("lang").substr(0, 2);
            }
        }

        // L'interface Navigator représente l'état et l'identité de l'agent utilisateur courant (navigateur). 
        // Si pas dispo, renvoyer le default
        if (!navigator) { return defaultLanguage; }

        var lang = navigator.language || navigator.browserLanguage ||
                navigator.systemLanguage || navigator.userLang || null,
            userLanguage = lang ? lang.substr(0, 2) : null;

        if (availableLanguages.indexOf(userLanguage) !== -1) {
            return userLanguage;
        }

        return defaultLanguage;
    },
    "getLocale": function () {
        "use strict";
        if (!navigator) { return 'en_US'; }

        var lang = navigator.language || navigator.browserLanguage ||
                navigator.systemLanguage || navigator.userLang || null,
            userLanguage = lang ? lang.substr(0, 2) : null;

        if (userLanguage === 'fr') {
            return 'fr_FR';
        } else if (userLanguage === 'en') {
            return 'en_US';
        } else if (userLanguage === 'de') {
            return 'de_DE';
        } else if (userLanguage === 'es') {
            return 'es_ES';
        } else if (userLanguage === 'it') {
            return 'it_IT';
        } else if (userLanguage === 'pt') {
            return 'pt_PT';
        } else if (userLanguage === 'nl') {
            return 'nl_NL';
        } else if (userLanguage === 'el') {
            return 'el_EL';
        } else {
            return 'en_US';
        }
    },
    "addScript": function (url, id, callback, execute, attrName, attrVal, internal) {
        "use strict";
        var script,
            done = false;

        if (execute === false) {
            if (typeof callback === 'function') {
                callback();
            }
        } else {
            script = document.createElement('script');
            if (id !== undefined) {
                script.id = id;
            }
            script.async = true;
            script.src = url;

            if (attrName !== undefined && attrVal !== undefined) {
                script.setAttribute(attrName, attrVal);
            }

            if (typeof callback === 'function') {
                if ( !tarteaucitron.parameters.useExternalJs || !internal ) {
                    script.onreadystatechange = script.onload = function () {
                        var state = script.readyState;
                        if (!done && (!state || /loaded|complete/.test(state))) {
                            done = true;
                            callback();
                        }
                    };
                } else {
                    callback();
                }
            }

            if ( !tarteaucitron.parameters.useExternalJs || !internal ) {
                document.getElementsByTagName('head')[0].appendChild(script);
            }
        }
    },
    "addInternalScript": function (url, id, callback, execute, attrName, attrVal) {
        tarteaucitron.addScript(url, id, callback, execute, attrName, attrVal, true);
    },
    // fonction pour checker si un element existe de part son id
    "checkIfExist": function (elemId) {
        "use strict";
        return document.getElementById(elemId) !== null && document.getElementById(elemId).offsetWidth !== 0 && document.getElementById(elemId).offsetHeight !== 0;
    },
    "makeAsync": {
        "antiGhost": 0,
        "buffer": '',
        "init": function (url, id) {
            "use strict";
            var savedWrite = document.write,
                savedWriteln = document.writeln;

            document.write = function (content) {
                tarteaucitron.makeAsync.buffer += content;
            };
            document.writeln = function (content) {
                tarteaucitron.makeAsync.buffer += content.concat("\n");
            };

            setTimeout(function () {
                document.write = savedWrite;
                document.writeln = savedWriteln;
            }, 20000);

            tarteaucitron.makeAsync.getAndParse(url, id);
        },
        "getAndParse": function (url, id) {
            "use strict";
            if (tarteaucitron.makeAsync.antiGhost > 9) {
                tarteaucitron.makeAsync.antiGhost = 0;
                return;
            }
            tarteaucitron.makeAsync.antiGhost += 1;
            tarteaucitron.addInternalScript(url, '', function () {
                if (document.getElementById(id) !== null) {
                    document.getElementById(id).innerHTML += "<span class='tarteaucitron-display-none'>&nbsp;</span>" + tarteaucitron.makeAsync.buffer;
                    tarteaucitron.makeAsync.buffer = '';
                    tarteaucitron.makeAsync.execJS(id);
                }
            });
        },
        "execJS": function (id) {
            /* not strict because third party scripts may have errors */
            var i,
                scripts,
                childId,
                type;

            if (document.getElementById(id) === null) {
                return;
            }

            scripts = document.getElementById(id).getElementsByTagName('script');
            for (i = 0; i < scripts.length; i += 1) {
                type = (scripts[i].getAttribute('type') !== null) ? scripts[i].getAttribute('type') : '';
                if (type === '') {
                    type = (scripts[i].getAttribute('language') !== null) ? scripts[i].getAttribute('language') : '';
                }
                if (scripts[i].getAttribute('src') !== null && scripts[i].getAttribute('src') !== '') {
                    childId = id + Math.floor(Math.random() * 99999999999);
                    document.getElementById(id).innerHTML += '<div id="' + childId + '"></div>';
                    tarteaucitron.makeAsync.getAndParse(scripts[i].getAttribute('src'), childId);
                } else if (type.indexOf('javascript') !== -1 || type === '') {
                    eval(scripts[i].innerHTML);
                }
            }
        }
    },
    // Fonction pour effectuer une action de repli sur des éléments ayant une ou plusieurs classes spécifiques
    "fallback": function (matchClass, content, noInner) {
        "use strict";

        // Récupère tous les éléments de la page
        var elems = document.getElementsByTagName('*'),
            // Variable pour parcourir les éléments
            i,
            // Compteur pour les classes
            index = 0;

        // Boucle à travers tous les éléments trouvés sur la page
        for (i in elems) {

            // Vérifie si l'élément est défini
            if (elems[i] !== undefined) {

                // Boucle à travers toutes les classes à rechercher
                for (index = 0; index < matchClass.length; index += 1) {

                    // Vérifie si l'élément contient la classe spécifiée
                    if ((' ' + elems[i].className + ' ').indexOf(' ' + matchClass[index] + ' ') > -1) {

                        // Si 'content' est une fonction, exécute-la
                        if (typeof content === 'function') {

                            // Si 'noInner' est à true, exécute la fonction 'content' sans modifier 'innerHTML'
                            if (noInner === true) {

                                // Appelle la fonction avec l'élément comme argument
                                content(elems[i]);
                            } else {

                                // Sinon, définit 'innerHTML' de l'élément en appelant la fonction 'content'
                                elems[i].innerHTML = content(elems[i]);
                            }
                        } else {
                            // Si 'content' n'est pas une fonction, définit directement 'innerHTML' de l'élément
                            elems[i].innerHTML = content;
                        }
                    }
                }
            }
        }
    },
    "engage": function (id) {
        "use strict";
        var html = '',
            r = Math.floor(Math.random() * 100000),
            engage = tarteaucitron.services[id].name + ' ' + tarteaucitron.lang.fallback;

        if (tarteaucitron.lang['engage-' + id] !== undefined) {
            engage = tarteaucitron.lang['engage-' + id];
        }

        html += '<div class="tac_activate tac_activate_' + id + '">';
        html += '   <div class="tac_float">';
        html += '      ' + engage;
        html += '      <button type="button" class="tarteaucitronAllow" id="Eng' + r + 'ed' + id + '">';
        html += '          <span class="tarteaucitronCheck" aria-hidden="true"></span> ' + tarteaucitron.lang.allow;
        html += '       </button>';
        html += '   </div>';
        html += '</div>';

        return html;
    },
    "extend": function (a, b) {
        "use strict";
        var prop;
        for (prop in b) {
            if (b.hasOwnProperty(prop)) {
                a[prop] = b[prop];
            }
        }
    },
    // les fonctions pour le chargement du premium, pas utile
    /*"proTemp": '',
    "proTimer": function () {
        "use strict";
        setTimeout(tarteaucitron.proPing, (Math.floor(Math.random() * (1200 - 500 + 1)) + 500));
    },
    "pro": function (list) {
        "use strict";
        tarteaucitron.proTemp += list;
        clearTimeout(tarteaucitron.proTimer);
        tarteaucitron.proTimer = setTimeout(tarteaucitron.proPing, (Math.floor(Math.random() * (1200 - 500 + 1)) + 500));
    },
    "proPing": function () {
        "use strict";
        if (tarteaucitron.uuid !== '' && tarteaucitron.uuid !== undefined && tarteaucitron.proTemp !== '' && tarteaucitronStatsEnabled) {
            var div = document.getElementById('tarteaucitronPremium'),
                timestamp = new Date().getTime(),
                url = 'https://tarteaucitron.io/log/?';

            if (div === null) {
                return;
            }

            url += 'account=' + tarteaucitron.uuid + '&';
            url += 'domain=' + tarteaucitron.domain + '&';
            url += 'status=' + encodeURIComponent(tarteaucitron.proTemp) + '&';
            url += '_time=' + timestamp;

            div.innerHTML = '<img src="' + url + '" class="tarteaucitron-display-none" alt="" />';

            tarteaucitron.proTemp = '';
        }

        tarteaucitron.cookie.number();
    },
    */
    "AddOrUpdate" : function(source, custom){
        /**
         Utility function to Add or update the fields of obj1 with the ones in obj2
         */
        for(var key in custom){
            if(custom[key] instanceof Object){
                source[key] = tarteaucitron.AddOrUpdate(source[key], custom[key]);
            }else{
                source[key] = custom[key];
            }
        }
        return source;
    },
    "getElemWidth": function(elem) {
        return tarteaucitron.getElemAttr(elem, 'width') || elem.clientWidth;
    },
    "getElemHeight": function(elem) {
        return tarteaucitron.getElemAttr(elem, 'height') || elem.clientHeight;
    },
    "getElemAttr": function (elem, attr) {
        var attribute = elem.getAttribute('data-' + attr) || elem.getAttribute(attr);

        if (typeof attribute === 'string') {
            return tarteaucitron.fixSelfXSS(attribute);
        }

        return "";
    },
    "addClickEventToId": function (elemId, func) {
        tarteaucitron.addClickEventToElement(document.getElementById(elemId), func);
    },
    // pour la compatibilité <IE9
    "addClickEventToElement": function (e, func) {
        if (e) {
            if (e.addEventListener) {
                e.addEventListener("click", func);
            } else {
                e.attachEvent("onclick", func);
            }
        }
    },
    "triggerJobsAfterAjaxCall": function() {
        tarteaucitron.job.forEach(function(e) { tarteaucitron.job.push(e) });
        var i;
        var allowBtns = document.getElementsByClassName("tarteaucitronAllow");
        for (i = 0; i < allowBtns.length; i++) {
            tarteaucitron.addClickEventToElement(allowBtns[i], function () {
                tarteaucitron.userInterface.respond(this, true);
            });
        }
        var denyBtns = document.getElementsByClassName("tarteaucitronDeny");
        for (i = 0; i < denyBtns.length; i++) {
            tarteaucitron.addClickEventToElement(denyBtns[i], function () {
                tarteaucitron.userInterface.respond(this, false);
            });
        }
    }
};