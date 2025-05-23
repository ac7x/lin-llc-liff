"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/adminApp";
import type { WorkFlowEntity } from "./workflow.action";

export interface WorkTypeTemplate {
    typeId: string;
    title: string;
    requiredSkills: string[];
}
export interface WorkTypeEntity extends WorkTypeTemplate {
    defaultWorkflow?: string;
    flows?: WorkFlowEntity[];
}
export type WorkType = WorkTypeTemplate | WorkTypeEntity;

export async function getAllWorkTypes(isEntity: boolean = false): Promise<WorkTypeTemplate[] | WorkTypeEntity[]> {
    const snapshot = await firestoreAdmin.collection("workType").get();
    return isEntity
        ? snapshot.docs.map(doc => doc.data() as WorkTypeEntity)
        : snapshot.docs.map(doc => doc.data() as WorkTypeTemplate);
}
export async function addWorkType(type: WorkTypeTemplate | WorkTypeEntity): Promise<void> {
    await firestoreAdmin.collection("workType").doc(type.typeId).set(type);
}
export async function updateWorkType(typeId: string, updates: Partial<WorkTypeEntity>): Promise<void> {
    await firestoreAdmin.collection("workType").doc(typeId).update(updates);
}
export async function deleteWorkType(typeId: string): Promise<void> {
    await firestoreAdmin.collection("workType").doc(typeId).delete();
}