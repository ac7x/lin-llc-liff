import { ClientConfig } from '@line/bot-sdk';
import React, { createContext, useContext, useEffect } from 'react';
import { LineBotAdapter } from '../../infrastructure/adapters/lineBot-adapter';

interface LineBotProviderProps {
    config: ClientConfig;
    children: React.ReactNode;
}

const LineBotContext = createContext<ClientConfig | null>(null);

export const LineBotProvider: React.FC<LineBotProviderProps> = ({ config, children }) => {
    useEffect(() => {
        LineBotAdapter.initialize(config);
    }, [config]);

    return (
        <LineBotContext.Provider value={config}>
            {children}
        </LineBotContext.Provider>
    );
};

export const useLineBotConfig = (): ClientConfig => {
    const context = useContext(LineBotContext);
    if (!context) {
        throw new Error('useLineBotConfig must be used within a LineBotProvider');
    }
    return context;
};
