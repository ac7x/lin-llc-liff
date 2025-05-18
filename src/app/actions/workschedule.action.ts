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

export async function getWorkSchedules(offset: number, range: number): Promise<DailyWorkSchedule[]> {
    const today = new Date();
    const schedules: DailyWorkSchedule[] = [];

    const locations = Array.from({ length: 15 }, (_, i) => `地點${i + 1}`);

    for (let i = 0; i < range; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + offset + i);
        const isoDate = date.toISOString().split("T")[0];

        const assignments: WorkAssignment[] = locations.map((location, index) => ({
            location,
            groupName: `第${(index + i) % 5 + 1}組`,
            members: [`員${(index + i * 3) % 70 + 1}`, `員${(index + i * 3 + 1) % 70 + 1}`],
        }));

        schedules.push({ date: isoDate, assignments });
    }

    return schedules;
}
