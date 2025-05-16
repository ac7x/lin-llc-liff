import { NextRequest, NextResponse } from 'next/server';
// TODO: 實作查詢服務與儲存庫
// import { UserQueryService } from '@/modules/user/application/queries/user-query.service';
// import { FirebaseUserQueryRepository } from '@/modules/user/infrastructure/repositories/user-query.repository';

export async function GET(req: NextRequest) {
    // 範例：從 query string 取得 userId
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
        return NextResponse.json({ error: 'userId 必填' }, { status: 400 });
    }
    // TODO: 實際查詢邏輯
    // const repo = new FirebaseUserQueryRepository();
    // const service = new UserQueryService(repo);
    // const profile = await service.getUserProfile(userId);
    // return NextResponse.json(profile);
    return NextResponse.json({ message: '查詢尚未實作', userId });
}
