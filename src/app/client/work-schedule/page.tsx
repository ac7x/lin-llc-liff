"use client";

import { getAllWorkEpics, WorkEpicEntity } from "@/app/actions/workepic.action";
import { WorkLoadEntity } from "@/app/actions/workload.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import React, { useEffect, useState } from "react";
import Timeline, { TimelineGroupBase, TimelineItemBase } from "react-calendar-timeline";
import "react-calendar-timeline/lib/Timeline.css";

type Group = TimelineGroupBase & { id: string; title: string };
type Item = TimelineItemBase & { id: string; group: string; title: string; start_time: Date; end_time: Date };

const WorkSchedulePage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [defaultTimeStart, setDefaultTimeStart] = useState<Date>(new Date());
  const [defaultTimeEnd, setDefaultTimeEnd] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // +1 week

  useEffect(() => {
    getAllWorkEpics(false).then((epics) => {
      const epicArr = epics as WorkEpicEntity[];
      setGroups(
        epicArr.map((epic) => ({
          id: epic.epicId,
          title: epic.title,
        }))
      );
      setItems(
        epicArr.flatMap((epic) =>
          (epic.workLoads || []).map((load: WorkLoadEntity) => ({
            id: load.loadId,
            group: epic.epicId,
            title: load.title ?? "(無標題)",
            start_time: new Date(load.plannedStartTime),
            end_time: load.plannedEndTime ? new Date(load.plannedEndTime) : new Date(load.plannedStartTime),
          }))
        )
      );
    });
  }, []);

  return (
    <>
      <div className="border border-gray-300 dark:border-neutral-700 rounded-lg p-4 m-4">
        <h1 className="text-2xl font-bold mb-4">工作排班表</h1>
        <Timeline
          groups={groups}
          items={items}
          defaultTimeStart={defaultTimeStart}
          defaultTimeEnd={defaultTimeEnd}
          groupRenderer={({ group }) => <span style={{ fontWeight: "bold" }}>{group.title}</span>}
          itemRenderer={({ item, getItemProps }) => (
            <div {...getItemProps()} style={{ ...getItemProps().style, background: "#3182ce", color: "#fff" }}>
              <div style={{ fontWeight: 600 }}>{item.title}</div>
            </div>
          )}
        />
      </div>
      <ClientBottomNav />
    </>
  );
};

export default WorkSchedulePage;