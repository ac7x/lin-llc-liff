import { UserAggregate } from '../../domain/models/user.aggregate';
import { UserRepository } from '../../domain/repositories/user-repository.interface';
import { SaveUserProfileCommand } from './user-profile-command.dto';

export class UserCommandService {
    constructor(private readonly userRepo: UserRepository) { }

    async saveUserProfile(cmd: SaveUserProfileCommand): Promise<void> {
        // 聚合工廠方法，封裝 profile 業務邏輯
        const user = UserAggregate.create(cmd);
        await this.userRepo.save(user);
    }
}
