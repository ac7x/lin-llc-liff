'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import {
	TestWorkEpicEntity,
	createTestEpic,
	createTestWorkLoad,
	deleteTestWorkLoad,
	getAllTestEpics,
	updateTestWorkLoad
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

export default function TestWorkScheduleAdminPage() {
	const [epics, setEpics] = useState<TestWorkEpicEntity[]>([]);
	const [loading, setLoading] = useState(true);
	const [, startTransition] = useTransition();
	const timelineRef = useRef<HTMLDivElement>(null);
	const loadToEpicMap = useRef<Record<string, string>>({});
	const [epicTitle, setEpicTitle] = useState('');
	const [workEpicId, setWorkEpicId] = useState('');
	const [workTitle, setWorkTitle] = useState('');
	const [workStart, setWorkStart] = useState('');
	const [workEnd, setWorkEnd] = useState('');

	function refresh() {
		setLoading(true);
		getAllTestEpics().then(({ epics }) => {
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
	}

	useEffect(() => {
		refresh();
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

		timeline.on('change', async (event: TimelineChangeEvent) => {
			for (const itemId of event.items) {
				const itemData = event.data[itemId];
				if (!itemData) continue;
				const fromEpicId = loadToEpicMap.current[itemId];
				const toEpicId = itemData.group;
				await updateTestWorkLoad(
					fromEpicId,
					itemId,
					toEpicId,
					itemData.start.toISOString(),
					itemData.end ? itemData.end.toISOString() : null
				);
			}
			startTransition(refresh);
		});

		// 解除排程（只清空時間）或改成徹底刪除
		timeline.on('remove', async (event: TimelineRemoveEvent) => {
			for (const itemId of event.items) {
				// await unplanTestWorkLoad(itemId); // 只清空時間
				await deleteTestWorkLoad(itemId);   // 徹底刪除
			}
			startTransition(refresh);
		});

		return () => timeline.destroy();
		// eslint-disable-next-line
	}, [epics.length]);

	// 建立 Epic
	async function handleCreateEpic() {
		if (!epicTitle.trim()) return;
		await createTestEpic(epicTitle.trim());
		setEpicTitle('');
		startTransition(refresh);
	}

	// 建立工作
	async function handleCreateWork() {
		if (!workEpicId || !workTitle.trim() || !workStart) return;
		await createTestWorkLoad(workEpicId, workTitle.trim(), workStart, workEnd);
		setWorkTitle('');
		setWorkStart('');
		setWorkEnd('');
		startTransition(refresh);
	}

	return (
		<div style={{
			width: '100vw',
			margin: '0 auto',
			height: '80vh',
			overflowX: 'hidden',
			background: 'black',
			borderRadius: '32px',
			boxShadow: '0 0 40px rgba(0,0,0,0.5)',
			padding: '16px 0',
		}}>
			<div style={{ padding: 16, color: 'white' }}>
				<div>
					<input
						placeholder="新 Epic 標題"
						value={epicTitle}
						onChange={e => setEpicTitle(e.target.value)}
						style={{ marginRight: 8 }}
					/>
					<button onClick={handleCreateEpic}>建立 Epic</button>
				</div>
				<div style={{ marginTop: 12 }}>
					<select value={workEpicId} onChange={e => setWorkEpicId(e.target.value)}>
						<option value="">選擇 Epic</option>
						{epics.map(epic => (
							<option key={epic.epicId} value={epic.epicId}>{epic.title}</option>
						))}
					</select>
					<input
						placeholder="工作名稱"
						value={workTitle}
						onChange={e => setWorkTitle(e.target.value)}
						style={{ marginLeft: 8 }}
					/>
					<input
						type="datetime-local"
						value={workStart}
						onChange={e => setWorkStart(e.target.value)}
						style={{ marginLeft: 8 }}
					/>
					<input
						type="datetime-local"
						value={workEnd}
						onChange={e => setWorkEnd(e.target.value)}
						style={{ marginLeft: 8 }}
					/>
					<button onClick={handleCreateWork} style={{ marginLeft: 8 }}>建立工作</button>
				</div>
			</div>
			{loading && <div style={{ color: 'white', textAlign: 'center' }}>Loading...</div>}
			<div
				ref={timelineRef}
				style={{
					width: '100%',
					height: 'calc(100% - 110px)',
					overflowX: 'auto',
					background: 'black',
				}}
			/>
		</div>
	);
}