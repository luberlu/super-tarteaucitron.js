import { useEffect, useState } from 'react';
import { useMeringue } from '../MeringueContext';

interface ServiceState {
    [serviceId: string]: any;
}

export default function Services() {
    const { meringue } = useMeringue();
    const [serviceState, setServiceState] = useState<ServiceState>({});

    useEffect(() => {
        const handleServiceStatus = (serviceId: string) => {
            const updatedService = meringue.serviceManager.get(serviceId);

            console.log('updateddd ', updatedService)

            setServiceState(prevState => ({
                ...prevState,
                [serviceId]: updatedService
            }));
        };

        meringue.serviceManager.on('serviceUpdate', handleServiceStatus);

        return () => {
            meringue.serviceManager.off('serviceUpdate', handleServiceStatus);
        };
    }, [meringue]);

    return (
        <div>
            {Object.entries(serviceState).map(([serviceId, service]) => (
                <div key={serviceId}>
                    <h3>{service.name}</h3>
                    <p>Type: {service.type}</p>
                    <p>Status: {service.status}</p>
                    <p>URI: {service.uri}</p>
                    <button onClick={() => meringue.serviceManager.allow(serviceId)}>Allow</button>
                    <button onClick={() => meringue.serviceManager.disallow(serviceId)}>Disallow</button>
                </div>
            ))}
        </div>
    );
}
