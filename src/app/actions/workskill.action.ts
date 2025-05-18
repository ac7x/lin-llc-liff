export interface WorkSkill {
    skillID: string; // 唯一識別碼
    name: string; // 技能名稱，例如 "焊接"、"電器"
    description: string; // 技能的詳細說明
    category: string; // 技能類別，例如 "技術"、"管理"
    level: number; // 技能等級，整數值，表示熟練程度（如 1-10）
    isMandatory: boolean; // 是否必須，表示是否為某些工作類型的必備技能
}
