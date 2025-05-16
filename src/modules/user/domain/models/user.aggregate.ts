import { SaveUserProfileCommand } from '../../application/commands/user-profile-command.dto';

export class UserAggregate {
    public readonly userId: string;
    public readonly displayName: string;
    public readonly pictureUrl?: string;
    public readonly statusMessage?: string;

    private constructor(props: SaveUserProfileCommand) {
        this.userId = props.userId;
        this.displayName = props.displayName;
        this.pictureUrl = props.pictureUrl;
        this.statusMessage = props.statusMessage;
    }

    static create(props: SaveUserProfileCommand): UserAggregate {
        // 可加業務驗證
        return new UserAggregate(props);
    }
}
