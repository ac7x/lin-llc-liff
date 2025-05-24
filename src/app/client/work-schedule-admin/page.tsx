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
	updateTestWorkLoad,
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
	const dragCache = useRef<Record<string, { group: string; start: Date; end?: Date }>>({});

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

		// ----------- 這裡是 dragStart 的安全實作 -----------
		timeline.on('dragStart', function (props: { items: string[] }) {
			if (props && Array.isArray(props.items)) {
				props.items.forEach((itemId: string) => {
					const item = visItems.get(itemId);
					const singleItem = Array.isArray(item) ? item[0] : item;
					if (singleItem) {
						dragCache.current[itemId] = {
							group: singleItem.group,
							start: singleItem.start,
							end: singleItem.end,
						};
					}
				});
			}
		});

		// ----------- 這裡是 dragEnd 的安全實作 -----------
		timeline.on('dragEnd', async function (props: { items: string[] }) {
			if (props && Array.isArray(props.items)) {
				for (const itemId of props.items) {
					const old = dragCache.current[itemId];
					const item = visItems.get(itemId);
					const singleItem = Array.isArray(item) ? item[0] : item;
					if (!singleItem || !old) continue;

					const groupChanged = old.group !== singleItem.group;
					const startChanged = old.start?.toISOString() !== singleItem.start?.toISOString();
					const endChanged =
						(old.end?.toISOString?.() || '') !== (singleItem.end?.toISOString?.() || '');
					if (groupChanged || startChanged || endChanged) {
						const fromEpicId = old.group;
						const toEpicId = singleItem.group;
						try {
							await updateTestWorkLoad(
								fromEpicId,
								itemId,
								toEpicId,
								singleItem.start.toISOString(),
								singleItem.end ? singleItem.end.toISOString() : null
							);
						} catch (e) {
							alert('即時同步失敗');
							console.error(e);
						}
						startTransition(refresh);
					}
					delete dragCache.current[itemId];
				}
			}
		});

		// 變更fallback（保險）
		timeline.on('change', async (event: TimelineChangeEvent) => {
			for (const itemId of event.items) {
				const itemData = event.data[itemId];
				if (!itemData) continue;
				const fromEpicId = loadToEpicMap.current[itemId];
				const toEpicId = itemData.group;
				try {
					await updateTestWorkLoad(
						fromEpicId,
						itemId,
						toEpicId,
						itemData.start.toISOString(),
						itemData.end ? itemData.end.toISOString() : null
					);
				} catch (e) {
					alert('資料庫同步失敗');
					console.error(e);
				}
			}
			startTransition(refresh);
		});

		// 移除
		timeline.on('remove', async (event: TimelineRemoveEvent) => {
			for (const itemId of event.items) {
				try {
					await deleteTestWorkLoad(itemId);
				} catch (e) {
					alert('刪除失敗');
					console.error(e);
				}
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
			width: '100%',
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