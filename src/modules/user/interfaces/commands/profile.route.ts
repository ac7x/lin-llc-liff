import { UserCommandService } from '@/modules/user/application/commands/user-command.service';
import { SaveUserProfileCommand } from '@/modules/user/application/commands/user-profile-command.dto';
import { FirebaseUserRepository } from '@/modules/user/infrastructure/repositories/user-repository';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, displayName, pictureUrl, statusMessage } = body;
        if (!userId || !displayName) {
            return NextResponse.json({ error: 'userId, displayName 必填' }, { status: 400 });
        }
        const repo = new FirebaseUserRepository();
        const service = new UserCommandService(repo);
        const cmd: SaveUserProfileCommand = { userId, displayName, pictureUrl, statusMessage };
        await service.saveUserProfile(cmd);
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
