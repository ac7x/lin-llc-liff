import { SaveUserProfileCommand } from '../../application/commands/user-profile-command.dto';

export class UserAggregate {
    public readonly userId: string;
    public readonly displayName: string;
    public readonly pictureUrl?: string;
    public readonly email?: string;

    private constructor(props: SaveUserProfileCommand) {
        this.userId = props.userId;
        this.displayName = props.displayName;
        this.pictureUrl = props.pictureUrl;
        this.email = props.email;
    }

    static create(props: SaveUserProfileCommand): UserAggregate {
        // 可加業務驗證
        return new UserAggregate(props);
    }
}
