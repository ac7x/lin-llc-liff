export interface WorkLevel {
    levelID: string; // 唯一識別碼
    title: string; // 等級名稱，例如 "初級"、"高級"
    experiencePoints: number; // 經驗值，用於升級
    nextLevelThreshold: number; // 下一等級門檻，升級所需的經驗值
    rewards: string; // 升級後可獲得的獎勵，例如加薪或新技能解鎖
    maxLevel: number; // 最高等級，固定為 60 級
}
