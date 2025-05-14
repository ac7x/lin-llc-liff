import { LiffUserEntity } from '../../domain/entities/liff-user.entity';
import { LineUserIdValueObject } from '../../domain/valueObjects/liff-id.value-object';
import { LiffProfileDto } from '../dtos/liff-profile.dto';

/**
 * LIFF 配置訊息映射器
 * 負責轉換 LIFF SDK 回傳的資料格式到領域模型
 */
export class LiffProfileMapper {
  /**
   * 將 LIFF SDK 的 Profile 資料轉換為領域實體
   */
  public static toDomain(dto: LiffProfileDto): LiffUserEntity {
    return LiffUserEntity.create({
      id: new LineUserIdValueObject(dto.userId),
      displayName: dto.displayName,
      pictureUrl: dto.pictureUrl,
      email: dto.email,
      isLoggedIn: true
    });
  }

  /**
   * 將領域實體轉換為 DTO
   */
  public static toDto(entity: LiffUserEntity): LiffProfileDto {
    return {
      userId: entity.id,
      displayName: entity.displayName,
      pictureUrl: entity.pictureUrl,
      email: entity.email
    };
  }
}
