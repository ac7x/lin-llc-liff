// src/app/client/work-schedule-admin/work-schedule-admin.action.ts

// 用記憶體暫存資料（重啟伺服器就會歸零）
let epics: TestWorkEpicEntity[] = []

export interface TestWorkLoadEntity {
  loadId: string
  plannedStartTime: string
  plannedEndTime: string
  title: string
}

export interface TestWorkEpicEntity {
  epicId: string
  title: string
  workLoads?: TestWorkLoadEntity[]
}

export async function getAllTestEpics(): Promise<{ epics: TestWorkEpicEntity[] }> {
  return { epics }
}

export async function createTestEpic(title: string): Promise<void> {
  epics.push({
    epicId: Math.random().toString(36).slice(2, 10),
    title,
    workLoads: [],
  })
}

export async function createTestWorkLoad(epicId: string, title: string, start: string, end: string): Promise<void> {
  const epic = epics.find(e => e.epicId === epicId)
  if (epic) {
    epic.workLoads = epic.workLoads || []
    epic.workLoads.push({
      loadId: Math.random().toString(36).slice(2, 10),
      title,
      plannedStartTime: start,
      plannedEndTime: end,
    })
  }
}

export async function deleteTestWorkLoad(loadId: string): Promise<void> {
  for (const epic of epics) {
    if (!epic.workLoads) continue
    const idx = epic.workLoads.findIndex(wl => wl.loadId === loadId)
    if (idx !== -1) {
      epic.workLoads.splice(idx, 1)
      break
    }
  }
}