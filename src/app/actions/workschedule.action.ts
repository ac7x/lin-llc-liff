"use server";

/**
 * 取得指定偏移量的日期範圍。
 * @param offset 偏移量（以天為單位）
 * @returns 日期範圍的字串陣列
 */
export async function getDateRange(offset: number): Promise<string[]> {
    const today = new Date();
    const dates = [];
    for (let i = -7; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i + offset);
        dates.push(date.toISOString().split("T")[0]); // 格式化為 YYYY-MM-DD
    }
    return dates;
}
