// filepath: /home/ac/GitHub/lin-llc-liff/src/app/client/work-schedule/page.tsx
import { getAllWorkSchedules } from "@/app/actions/workschedule.action";
import WorkScheduleClient from "./WorkScheduleClient";

export default async function WorkSchedulePage() {
  const epics = await getAllWorkSchedules();
  return <WorkScheduleClient epics={epics} />;
}