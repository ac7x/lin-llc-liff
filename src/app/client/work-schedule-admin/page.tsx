'use client';

import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav';
import { useEffect, useRef, useState, useTransition } from 'react';
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import {
	getAllEpics,
	unplanWorkLoad,
	updateWorkLoad,
	WorkEpicEntity,
	WorkLoadEntity,
} from './work-schedule-admin.action';

interface VisItem {
	id: string;
	group: string;
	type: 'range';
	content: string;
	start: Date;
	end?: Date;
}

interface VisGroup {
	id: string;
	content: string;
}

export default function WorkScheduleAdminPage() {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([]);
	const [unplanned, setUnplanned] = useState<(WorkLoadEntity & { epicId: string; epicTitle: string })[]>([]);
	const [loading, setLoading] = useState(true);
	const [, startTransition] = useTransition();
	const timelineRef = useRef<HTMLDivElement>(null);
	const loadToEpicMap = useRef<Record<string, string>>({}); // loadId => epicId

	// 初始化與資料拉取
	useEffect(() => {
		setLoading(true);
		getAllEpics().then(({ epics, unplanned }) => {
			setEpics(epics);
			setUnplanned(unplanned);

			// 建立 loadId -> epicId 對照表
			const map: Record<string, string> = {};
			epics.forEach((epic) =>
				(epic.workLoads || []).forEach((wl) => {
					map[wl.loadId] = epic.epicId;
				})
			);
			loadToEpicMap.current = map;
			setLoading(false);
		});
	}, []);

	// 監控 epics 變動，初始化 vis-timeline
	useEffect(() => {
		if (!timelineRef.current || epics.length === 0) return;

		// Groups
		const groups: VisGroup[] = epics.map((epic) => ({
			id: epic.epicId,
			content: `<b>${epic.title}</b>`,
		}));

		// Items
		const items: VisItem[] = epics.flatMap((epic) =>
			(epic.workLoads || [])
				.filter((wl) => wl.plannedStartTime && wl.plannedStartTime !== '')
				.map((wl) => ({
					id: wl.loadId,
					group: epic.epicId,
					type: 'range',
					content: `<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`,
					start: new Date(wl.plannedStartTime),
					end: wl.plannedEndTime && wl.plannedEndTime !== '' ? new Date(wl.plannedEndTime) : undefined,
				}))
		);

		const visGroups = new DataSet(groups);
		const visItems = new DataSet(items);

		const timeline = new Timeline(timelineRef.current, visItems, visGroups, {
			stack: true,
			orientation: 'top',
			editable: { updateTime: true, updateGroup: true, remove: true },
			locale: 'zh-tw',
			zoomMin: 24 * 60 * 60 * 1000,
			zoomMax: 90 * 24 * 60 * 60 * 1000,
		} as TimelineOptions);

		// 變更（移動/改時間/換分組）同步 Firestore
		timeline.on('change', async (event: any) => {
			for (const itemId of event.items) {
				const itemData = event.data[itemId];
				if (!itemData) continue;

				const fromEpicId = loadToEpicMap.current[itemId];
				const toEpicId = itemData.group;
				await updateWorkLoad(
					fromEpicId,
					itemId,
					toEpicId,
					itemData.start,
					itemData.end ?? null
				);
			}

			// 變更後刷新資料
			startTransition(() => {
				setLoading(true);
				getAllEpics().then(({ epics, unplanned }) => {
					setEpics(epics);
					setUnplanned(unplanned);

					const map: Record<string, string> = {};
					epics.forEach((epic) =>
						(epic.workLoads || []).forEach((wl) => {
							map[wl.loadId] = epic.epicId;
						})
					);
					loadToEpicMap.current = map;
					setLoading(false);
				});
			});
		});

		// 移除（unplan）
		timeline.on('remove', async (event: any) => {
			for (const itemId of event.items) {
				await unplanWorkLoad(itemId);
			}
			startTransition(() => {
				setLoading(true);
				getAllEpics().then(({ epics, unplanned }) => {
					setEpics(epics);
					setUnplanned(unplanned);

					const map: Record<string, string> = {};
					epics.forEach((epic) =>
						(epic.workLoads || []).forEach((wl) => {
							map[wl.loadId] = epic.epicId;
						})
					);
					loadToEpicMap.current = map;
					setLoading(false);
				});
			});
		});

		return () => timeline.destroy();
		// eslint-disable-next-line
	}, [epics.length]);

	return (
		<div className="min-h-screen w-full bg-black flex flex-col">
			<div className="flex-none h-[20vh]" />
			<div className="flex-none h-[60vh] w-full flex items-center justify-center relative">
				{loading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
						<div className="text-white">資料載入中...</div>
					</div>
				)}
				<div
					className="w-full h-full rounded-2xl bg-white border border-gray-300 shadow overflow-hidden"
					ref={timelineRef}
					style={{ minWidth: '100vw' }}
				/>
			</div>
			<div className="flex-none h-[20vh] w-full bg-black px-4 py-2 overflow-y-auto">
				<div className="max-w-7xl mx-auto h-full flex flex-col">
					<h2 className="text-lg font-bold text-center text-white mb-2">未排班工作</h2>
					<div className="flex flex-wrap gap-2 justify-center overflow-auto max-h-full">
						{unplanned.length === 0 ? (
							<div className="text-gray-400">（無）</div>
						) : (
							unplanned.map((wl) => (
								<div
									key={wl.loadId}
									className="bg-yellow-50 border rounded px-3 py-2 text-sm"
									title={`來自 ${wl.epicTitle}`}
								>
									<div>{wl.title || '(無標題)'}</div>
									<div className="text-xs text-gray-400">
										{Array.isArray(wl.executor)
											? wl.executor.join(', ')
											: wl.executor || '(無執行者)'}
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
			<ClientBottomNav />
		</div>
	);
}