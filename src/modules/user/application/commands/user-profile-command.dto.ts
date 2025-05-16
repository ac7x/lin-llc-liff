// 用戶 profile 命令 DTO
export interface SaveUserProfileCommand {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
}
