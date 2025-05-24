'use client'

import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/clientApp'
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { addDays, subDays } from 'date-fns'
import { collection, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore'
import { DataSet, Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

interface WorkLoadEntity {
	loadId: string
	title: string
	executor: string[]
	plannedStartTime: string
	plannedEndTime: string
}

interface WorkEpicEntity {
	epicId: string
	title: string
	workLoads?: WorkLoadEntity[]
}

type LooseWorkLoad = WorkLoadEntity & { epicId: string, epicTitle: string }

function parseEpicSnapshot(
	docs: QueryDocumentSnapshot<DocumentData, DocumentData>[]
): { epics: WorkEpicEntity[]; unplanned: LooseWorkLoad[] } {
	const epics: WorkEpicEntity[] = docs.map(
		doc => ({ ...doc.data(), epicId: doc.id } as WorkEpicEntity)
	)
	const unplanned: LooseWorkLoad[] = epics.flatMap(e =>
		(e.workLoads || [])
			.filter(l => !l.plannedStartTime || l.plannedStartTime === '')
			.map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
	)
	return { epics, unplanned }
}

const getWorkloadContent = (wl: Pick<WorkLoadEntity, 'title' | 'executor'>) =>
	`<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`

const ClientWorkSchedulePage = () => {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([])
	const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
	const timelineRef = useRef<HTMLDivElement>(null)
	const [epicSnapshot, epicLoading] = useCollection(collection(firestore, 'workEpic'))

	useEffect(() => {
		if (!epicSnapshot) return
		const { epics, unplanned } = parseEpicSnapshot(epicSnapshot.docs)
		setEpics(epics)
		setUnplanned(unplanned)
	}, [epicSnapshot])

	useEffect(() => {
		if (!timelineRef.current || !epics.length) return
		const groups = new DataSet(epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` })))
		const items = new DataSet(
			epics.flatMap(e =>
				(e.workLoads || [])
					.filter(l => l.plannedStartTime && l.plannedStartTime !== '')
					.map(l => ({
						id: l.loadId,
						group: e.epicId,
						type: 'range',
						content: getWorkloadContent(l),
						start: new Date(l.plannedStartTime),
						end: l.plannedEndTime && l.plannedEndTime !== ''
							? new Date(l.plannedEndTime)
							: addDays(new Date(l.plannedStartTime), 1)
					}))
			)
		)

		const now = new Date()
		const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		const start = subDays(today0, 3)
		const end = addDays(today0, 4)
		end.setHours(23, 59, 59, 999)

		const tl = new Timeline(timelineRef.current, items, groups, {
			stack: true,
			orientation: 'top',
			editable: false,
			locale: 'zh-tw',
			locales: {
				'zh-tw': {
					current: '當前',
					year: '年',
					month: '月',
					week: '週',
					day: '日',
					hour: '時',
					minute: '分',
					second: '秒',
					millisecond: '毫秒',
					months: [
						'一月', '二月', '三月', '四月', '五月', '六月',
						'七月', '八月', '九月', '十月', '十一月', '十二月'
					],
					monthsShort: [
						'1月', '2月', '3月', '4月', '5月', '6月',
						'7月', '8月', '9月', '10月', '11月', '12月'
					],
					days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
					daysShort: ['日', '一', '二', '三', '四', '五', '六'],
				}
			},
			zoomMin: 7 * 24 * 60 * 60 * 1000,
			zoomMax: 30 * 24 * 60 * 60 * 1000,
			timeAxis: { scale: 'day', step: 1 },
			format: {
				minorLabels: {
					minute: '',
					hour: '',
					day: 'D',
					month: 'MMM',
					year: 'YYYY'
				},
				majorLabels: {
					day: 'YYYY/MM/DD',
					month: 'YYYY/MM',
					year: 'YYYY'
				}
			}
		})
		tl.setWindow(start, end, { animation: false })

		return () => { tl.destroy() }
	}, [epics])

	return (
		<div className="min-h-screen w-full bg-gradient-to-b from-blue-100 via-white to-blue-50 flex flex-col">
			<div className="flex-none h-[70vh] w-full flex items-center justify-center">
				{epicLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 rounded-2xl">
						<div className="text-white">資料載入中...</div>
					</div>
				)}
				<div
					className="w-full h-full rounded-2xl bg-white border border-gray-200 shadow-md overflow-hidden"
					ref={timelineRef}
					style={{ minWidth: '100vw', height: '100%' }}
				/>
			</div>
			<div className="flex-none h-[30vh] w-full px-4 py-4 bg-blue-50 rounded-t-3xl shadow-inner">
				<div className="w-full h-full flex flex-col">
					<h2 className="text-lg font-bold text-center text-blue-800 mb-2 tracking-wide">未排班工作</h2>
					<div className="flex flex-wrap justify-center gap-4 overflow-auto max-h-full w-full">
						{unplanned.length === 0 ? (
							<div className="text-gray-400 text-center w-full">（無）</div>
						) : unplanned.map(wl => (
							<div
								key={wl.loadId}
								className="
									bg-white border border-blue-200 rounded-xl px-4 py-3 text-base shadow-sm
									hover:bg-blue-100 transition-colors flex flex-col justify-between
									min-w-[220px]
								"
								style={{ maxWidth: 320 }}
								title={`來自 ${wl.epicTitle}`}
							>
								<div className="font-medium text-gray-700">{wl.title || '(無標題)'}</div>
								<div className="text-xs text-blue-500 mt-1">
									{Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
			<ClientBottomNav />
		</div>
	)
}

export default ClientWorkSchedulePage