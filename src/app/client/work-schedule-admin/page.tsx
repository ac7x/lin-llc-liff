'use client';

import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav';
import { useEffect, useRef, useState, useTransition } from 'react';
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import {
	getAllEpics,
	unplanWorkLoad,
	updateWorkLoad,
	WorkEpicEntity
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

interface TimelineChangeEvent {
	items: string[];
	data: Record<string, VisItem>;
}

interface TimelineRemoveEvent {
	items: string[];
}

export default function WorkScheduleAdminPage() {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([]);
	const [loading, setLoading] = useState(true);
	const [, startTransition] = useTransition();
	const timelineRef = useRef<HTMLDivElement>(null);
	const loadToEpicMap = useRef<Record<string, string>>({});

	// 初始化與載入
	useEffect(() => {
		setLoading(true);
		getAllEpics().then(({ epics }) => {
			setEpics(epics);
			const map: Record<string, string> = {};
			epics.forEach(epic =>
				(epic.workLoads || []).forEach(wl => {
					map[wl.loadId] = epic.epicId;
				})
			);
			loadToEpicMap.current = map;
			setLoading(false);
		});
	}, []);

	useEffect(() => {
		if (!timelineRef.current || epics.length === 0) return;

		const groups: VisGroup[] = epics.map(epic => ({
			id: epic.epicId,
			content: epic.title,
		}));

		const items: VisItem[] = epics.flatMap(epic =>
			(epic.workLoads || [])
				.filter(wl => wl.plannedStartTime && wl.plannedStartTime !== '')
				.map(wl => ({
					id: wl.loadId,
					group: epic.epicId,
					type: 'range',
					content: wl.title || '(無標題)',
					start: new Date(wl.plannedStartTime),
					end: wl.plannedEndTime && wl.plannedEndTime !== '' ? new Date(wl.plannedEndTime) : undefined,
				}))
		);

		const visGroups = new DataSet<VisGroup>(groups);
		const visItems = new DataSet<VisItem>(items);

		const timeline = new Timeline(timelineRef.current, visItems, visGroups, {
			stack: true,
			orientation: 'top',
			editable: { updateTime: true, updateGroup: true, remove: true },
			locale: 'zh-tw',
		} as TimelineOptions);

		// 明確型別，避免 ESLint any
		timeline.on('change', async (event: TimelineChangeEvent) => {
			for (const itemId of event.items) {
				const itemData = event.data[itemId];
				if (!itemData) continue;
				const fromEpicId = loadToEpicMap.current[itemId];
				const toEpicId = itemData.group;
				await updateWorkLoad(
					fromEpicId,
					itemId,
					toEpicId,
					itemData.start.toISOString(),
					itemData.end ? itemData.end.toISOString() : null
				);
			}
			startTransition(() => {
				setLoading(true);
				getAllEpics().then(({ epics }) => {
					setEpics(epics);
					const map: Record<string, string> = {};
					epics.forEach(epic =>
						(epic.workLoads || []).forEach(wl => {
							map[wl.loadId] = epic.epicId;
						})
					);
					loadToEpicMap.current = map;
					setLoading(false);
				});
			});
		});

		timeline.on('remove', async (event: TimelineRemoveEvent) => {
			for (const itemId of event.items) {
				await unplanWorkLoad(itemId);
			}
			startTransition(() => {
				setLoading(true);
				getAllEpics().then(({ epics }) => {
					setEpics(epics);
					const map: Record<string, string> = {};
					epics.forEach(epic =>
						(epic.workLoads || []).forEach(wl => {
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
		<div
			style={{
				width: '100%',
				maxWidth: '100vw',
				margin: '0 auto',
				height: '70vh',
				overflowX: 'hidden',
				background: 'black', // 電影屏風格
				borderRadius: '32px',
				boxShadow: '0 0 40px rgba(0,0,0,0.5)',
				padding: '16px 0',
			}}
		>
			{loading && <div style={{ color: 'white', textAlign: 'center' }}>Loading...</div>}
			<div
				ref={timelineRef}
				style={{
					width: '100%',
					height: '100%',
					overflowX: 'auto',
					background: 'black',
				}}
			/>
			<ClientBottomNav />
		</div>
	);
}