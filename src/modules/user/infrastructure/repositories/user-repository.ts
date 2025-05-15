import { writeData } from '../../../shared/infrastructure/persistence/firebase/firebase-admin';
import { UserAggregate } from '../../domain/models/user.aggregate';
import { UserRepository } from '../../domain/repositories/user-repository.interface';

export class FirebaseUserRepository implements UserRepository {
    async save(user: UserAggregate): Promise<void> {
        await writeData('users', user.userId, {
            userId: user.userId,
            displayName: user.displayName,
            pictureUrl: user.pictureUrl,
            email: user.email,
        });
    }
}
