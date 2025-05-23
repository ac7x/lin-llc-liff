/**
 * Timeline 群組元件
 */

import React from 'react';
import { TimelineGroup as TimelineGroupType } from '../../types/TimelineGroup';

interface GroupProps {
  /**
   * 群組資料
   */
  group: TimelineGroupType;
  
  /**
   * 點擊處理函數
   */
  onClick?: (group: TimelineGroupType) => void;
  
  /**
   * 右鍵選單處理函數
   */
  onContextMenu?: (e: React.MouseEvent, group: TimelineGroupType) => void;
  
  /**
   * 是否可編輯
   */
  editable?: boolean;
  
  /**
   * 是否顯示子群組
   */
  showNestedGroups?: boolean;
  
  /**
   * 是否展開子群組
   */
  nestedGroupsExpanded?: boolean;
  
  /**
   * 切換子群組展開狀態處理函數
   */
  onToggleNestedGroups?: (group: TimelineGroupType) => void;
  
  /**
   * 子群組元件
   */
  nestedGroups?: React.ReactNode;
  
  /**
   * 自訂類別名稱
   */
  className?: string;
  
  /**
   * 自訂樣式
   */
  style?: React.CSSProperties;
}

/**
 * Timeline 群組元件
 */
const Group: React.FC<GroupProps> = ({
  group,
  onClick,
  onContextMenu,
  editable = false,
  showNestedGroups = false,
  nestedGroupsExpanded = true,
  onToggleNestedGroups,
  nestedGroups,
  className = '',
  style = {}
}) => {
  // 處理點擊
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(group);
    }
  };

  // 處理右鍵選單
  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      onContextMenu(e, group);
    }
  };

  // 切換子群組展開狀態
  const toggleNestedGroups = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleNestedGroups) {
      onToggleNestedGroups(group);
    }
  };

  // 合併群組樣式
  const groupStyle = {
    ...style,
    ...(group.style ? { ...JSON.parse(`{${group.style}}`) } : {})
  };

  // 組合 CSS 類別
  const groupClassName = [
    'timeline-group',
    editable ? 'editable' : '',
    group.className || '',
    className
  ].filter(Boolean).join(' ');

  // 判斷是否有子群組
  const hasNestedGroups = Array.isArray(group.nestedGroups) && group.nestedGroups.length > 0;

  return (
    <div className="timeline-group-container">
      <div
        className={groupClassName}
        style={groupStyle}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        title={group.title}
      >
        {/* 群組內容 */}
        <div className="timeline-group-content">
          {typeof group.content === 'string' ? (
            <span>{group.content}</span>
          ) : (
            group.content
          )}
        </div>

        {/* 子群組切換按鈕 */}
        {showNestedGroups && hasNestedGroups && (
          <div className="toggle-nested-groups" onClick={toggleNestedGroups}>
            {nestedGroupsExpanded ? '▼' : '►'}
          </div>
        )}
      </div>

      {/* 子群組 */}
      {showNestedGroups && hasNestedGroups && nestedGroupsExpanded && (
        <div className="nested-groups-container">
          {nestedGroups}
        </div>
      )}
    </div>
  );
};

export default Group;
