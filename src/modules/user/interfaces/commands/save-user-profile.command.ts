import { UserCommandService } from '../../application/commands/user-command.service';
import { SaveUserProfileCommand } from '../../application/commands/user-profile-command.dto';
import { FirebaseUserRepository } from '../../infrastructure/repositories/user-repository';

// 介面層命令函式，供 Server Action 調用
export async function saveUserProfileCommand(cmd: SaveUserProfileCommand) {
    const repo = new FirebaseUserRepository();
    const service = new UserCommandService(repo);
    await service.saveUserProfile(cmd);
}

// 新增 saveUserProfileCommand 函數
export async function saveUserProfileCommand(cmd: SaveUserProfileCommand) {
    const repo = new FirebaseUserRepository();
    const service = new UserCommandService(repo);
    await service.saveUserProfile(cmd);
}
