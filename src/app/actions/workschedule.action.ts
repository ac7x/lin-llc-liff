"use server";

type WorkAssignment = {
    location: string;
    groupName: string;
    members: string[];
};

type DailyWorkSchedule = {
    date: string;
    assignments: WorkAssignment[];
};

/**
 * 擴充為支援不同橫軸維度的資料結構（雖然目前仍回傳相同格式，但邏輯具備擴展性）
 */
export async function getWorkSchedules(
    offset: number,
    range: number,
    horizontalAxis: "date" | "location" = "date"
): Promise<DailyWorkSchedule[]> {
    const today = new Date();
    const schedules: DailyWorkSchedule[] = [];

    // 模擬資料：15 個地點
    const locations = Array.from({ length: 15 }, (_, i) => `地點${i + 1}`);

    // 根據 horizontalAxis 決定資料生成邏輯
    if (horizontalAxis === "date") {
        for (let i = 0; i < range; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + offset + i);
            const isoDate = date.toISOString().split("T")[0];

            const assignments: WorkAssignment[] = locations.map((location, index) => ({
                location,
                groupName: `第${(index + i) % 5 + 1}組`,
                members: [
                    `員${(index + i * 3) % 70 + 1}`,
                    `員${(index + i * 3 + 1) % 70 + 1}`,
                ],
            }));

            schedules.push({ date: isoDate, assignments });
        }
    } else {
        for (let i = 0; i < range; i++) {
            const location = locations[i % locations.length];
            const assignments: WorkAssignment[] = [{
                location,
                groupName: `第${i % 5 + 1}組`,
                members: [
                    `員${(i * 3) % 70 + 1}`,
                    `員${(i * 3 + 1) % 70 + 1}`,
                ],
            }];

            schedules.push({ date: today.toISOString().split("T")[0], assignments });
        }
    }

    return schedules;
}