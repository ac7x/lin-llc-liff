"use server";

export interface WorkLoadTemplate {
    loadId: string;
    taskId: string;
    plannedQuantity: number;
    unit: string;
    plannedStartTime: string;
    plannedEndTime: string;
    executor?: string | string[];
}

export interface WorkLoadEntity extends WorkLoadTemplate {
    actualQuantity: number;
    executor: string[];
    title: string;
    notes?: string;
    epicIds: string[];
}
