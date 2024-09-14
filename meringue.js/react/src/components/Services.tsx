import { useEffect, useState } from 'react';
import { useMeringue } from '../MeringueContext';

export default function Services() {
    const { meringue } = useMeringue();
    const [serviceState, setServiceState] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        // Gestion de l'ajout de services
        const handleServiceAdded = (serviceId: string, isAllowed: boolean) => {
            setServiceState(prevState => ({
                ...prevState,
                [serviceId]: isAllowed
            }));
        };

        meringue.on('serviceStatus', handleServiceAdded);

        return () => {
            meringue.off('serviceStatus', handleServiceAdded);
        };
    }, [meringue]);

    // Fonction pour permettre ou refuser un service
    const handleServiceAction = (serviceId: string, allow: boolean) => {
        if (allow) {
            meringue.allowService(serviceId);  // Méthode pour autoriser un service
        } else {
            meringue.disallowService(serviceId);  // Méthode pour refuser un service
        }
    };

    return (
        <div>
            {Object.entries(serviceState).map(([serviceId, isAllowed]) => (
                <div key={serviceId}>
                    <span>{serviceId}: {isAllowed ? 'Allowed' : 'Denied'}</span>
                    <button onClick={() => handleServiceAction(serviceId, true)}>Allow</button>
                    <button onClick={() => handleServiceAction(serviceId, false)}>Disallow</button>
                </div>
            ))}
        </div>
    );
}
