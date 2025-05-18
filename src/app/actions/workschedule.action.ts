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
    const locations = Array.from({ length: 15 }, (_, i) => `地點${i + 1}`);

    return Array.from({ length: range }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + offset + i);
        const isoDate = date.toISOString().split("T")[0];

        const assignments = horizontalAxis === "date"
            ? locations.map((location, index) => ({
                location,
                groupName: `第${(index + i) % 5 + 1}組`,
                members: [
                    `員${(index + i * 3) % 70 + 1}`,
                    `員${(index + i * 3 + 1) % 70 + 1}`,
                ],
            }))
            : [{
                location: locations[i % locations.length],
                groupName: `第${i % 5 + 1}組`,
                members: [
                    `員${(i * 3) % 70 + 1}`,
                    `員${(i * 3 + 1) % 70 + 1}`,
                ],
            }];

        return { date: isoDate, assignments };
    });
}