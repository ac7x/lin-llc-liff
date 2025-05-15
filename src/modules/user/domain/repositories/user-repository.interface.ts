import { UserAggregate } from '../models/user.aggregate';

export interface UserRepository {
    save(user: UserAggregate): Promise<void>;
}
