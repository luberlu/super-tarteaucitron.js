import { createContext, useContext, ReactNode } from 'react';
import Meringue from './api/index';

interface MeringueContextProps {
  meringue: Meringue;
}

const MeringueContext = createContext<MeringueContextProps | undefined>(undefined);

export function useMeringue() {
  const context = useContext(MeringueContext);
  if (!context) {
    throw new Error('useMeringue must be used within a MeringueProvider');
  }
  return context;
}

interface MeringueProviderProps {
  children: ReactNode;
}

export const MeringueProvider = ({ children }: MeringueProviderProps) => {
  const meringue = 
    new Meringue(
        { 
            showAlertSmall: false, 
            privacyUrl: '/privacy' 
        }
    ).addJobs('youtube', 'twitch', 'wouala')
    .init();

  return (
    <MeringueContext.Provider value={{ meringue }}>
      {children}
    </MeringueContext.Provider>
  );
};
