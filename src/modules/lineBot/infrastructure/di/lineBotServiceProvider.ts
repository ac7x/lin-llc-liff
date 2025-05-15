import { LineBotApplicationService } from '@/modules/c-lineBot/application/services/LineBotApplicationService';
import { BotVerificationService } from '@/modules/c-lineBot/domain/services/BotVerificationService';
import { LineBotService } from '@/modules/c-lineBot/domain/services/LineBotService';
import { LineBotApiService } from '@/modules/c-lineBot/infrastructure/services/LineBotApiService';

// 單例模式
let applicationService: LineBotApplicationService | null = null;

export function getLineBotApplicationService(): LineBotApplicationService {
  if (!applicationService) {
    const channelId = process.env.LINE_CHANNEL_ID || '';
    const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

    // 建立領域服務
    const lineBotService = new LineBotService(channelId);

    // 建立基礎設施服務
    const botApiService = new LineBotApiService(channelAccessToken, channelSecret);
    const verificationService = new BotVerificationService(channelSecret);

    // 建立應用服務
    applicationService = new LineBotApplicationService(
      lineBotService,
      botApiService,
      verificationService
    );
  }

  return applicationService;
}
