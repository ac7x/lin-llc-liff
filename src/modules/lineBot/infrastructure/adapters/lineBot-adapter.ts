import { ClientConfig } from '@line/bot-sdk';

export class LineBotAdapter {
    private static instance: ClientConfig | null = null;

    static initialize(config: ClientConfig): void {
        if (!this.instance) {
            this.instance = config;
        }
    }

    static getConfig(): ClientConfig {
        if (!this.instance) {
            throw new Error('LineBotAdapter is not initialized.');
        }
        return this.instance;
    }
}
