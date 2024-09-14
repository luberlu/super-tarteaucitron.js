import { Cookies } from "./Cookies";
import { EventEmitter } from "./EventEmitter";
import { Service } from './types';

export class ServiceManager extends EventEmitter {
    private services: Record<string, Service>;
    private cookiesManager: Cookies;

    constructor(services: Record<string, Service>, cookiesManager: Cookies) {
        super();
        this.services = services;
        this.cookiesManager = cookiesManager;
    }

    public get(serviceId: string) {
        return this.services[serviceId];
    }

    // Autoriser un service et mettre à jour son statut
    public allow(serviceId: string) {
        const service = this.services[serviceId];
        if (service) {
            service.status = 'allowed';
            this.cookiesManager.create(serviceId, 'true');

            if (typeof service.js === 'function') {
                service.js();
            }

            this.emit('serviceUpdate', serviceId); // Émet l'événement avec le statut
        }
    }

    // Refuser un service et mettre à jour son statut
    public disallow(serviceId: string) {
        const service = this.services[serviceId];
        if (service) {
            service.status = 'denied';
            this.cookiesManager.create(serviceId, 'false');

            if (typeof service.fallback === 'function') {
                service.fallback();
            }

            this.emit('serviceUpdate', serviceId); // Émet l'événement avec le statut
        }
    }

    // Ajouter un service, définir son statut initial et mettre à jour la vue
    public add(serviceId: string) {
        const service = this.services[serviceId];
        if (!service) return;

        const cookie = this.cookiesManager.read();
        const isAllowed = cookie.includes(`${service.key}=true`);
        const isDenied = cookie.includes(`${service.key}=false`);

        if (isAllowed) {
            service.status = 'allowed';
        } else if (isDenied) {
            service.status = 'denied';
        } else {
            service.status = 'wait';
        }

        // Exécuter les actions liées au service selon son statut
        if (service.status === 'allowed') {
            if (typeof service.js === 'function') service.js();
        } else if (service.status === 'denied') {
            if (typeof service.fallback === 'function') service.fallback();
        }

        this.emit('serviceUpdate', serviceId); 
    }

    // Méthode pour obtenir le statut d'un service
    public getStatus(serviceId: string): 'allowed' | 'denied' | 'wait' {
        return this.services[serviceId]?.status ?? 'wait';
    }
}
