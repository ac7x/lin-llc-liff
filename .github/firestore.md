/WorkEpics/{epicId}
  - Title
  - StartDate
  - EndDate
  - Owner
  - Status
  - Priority
  - location
  - InsuranceStatus
  - ↓ 子集合：
    /WorkItems/{itemId}
      - FlowID
      - CurrentStep
      - AssignedTo
      - Status
      - ↓ 子集合：
        /WorkTasks/{taskId}
          - TargetQuantity
          - CompletedQuantity
          - Unit
          - Status
          - ↓ 子集合：
            /WorkLoads/{loadId}
              - Executor
              - PlannedQuantity
              - ActualQuantity
              - TimeRange
              - Notes

/WorkTypes/{typeId}
  - Title
  - RequiredSkills
  - DefaultWorkflow

/WorkFlows/{flowId}
  - WorkTypeID
  - Steps: [
      {
        StepName: '切割',
        Order: 1,
        RequiredSkills: ['焊接']
      },
      ...
    ]

/WorkMembers/{memberId}
  - Name
  - Role
  - Skills: [{ name: '焊接', level: 3 }]
  - SkillScore
  - TaskCompletionRate
  - AssignedEpicIDs
  - ContactInfo
  - Status
  - Availability
  - LastActiveTime
  - IsActive
  - ExperiencePoints
  - Level
  - ExperienceToNextLevel
  - LastExperienceGainTime
  - ↓ 子集合：
    /ExperienceHistory/{recordId}
      - Timestamp
      - Amount
      - Source (taskId/ref)
      - Reason