/**
 * Timeline 基本項目元件
 */

import React from 'react';
import { TimelineItem as TimelineItemType } from '../../types/TimelineItem';
import { TimelineItemType as ItemTypeEnum } from '../../constants';

interface ItemProps {
  /**
   * 項目資料
   */
  item: TimelineItemType;
  
  /**
   * 點擊處理函數
   */
  onClick?: (item: TimelineItemType) => void;
  
  /**
   * 雙擊處理函數
   */
  onDoubleClick?: (item: TimelineItemType) => void;
  
  /**
   * 右鍵選單處理函數
   */
  onContextMenu?: (e: React.MouseEvent, item: TimelineItemType) => void;
  
  /**
   * 是否被選中
   */
  selected?: boolean;
  
  /**
   * 是否可編輯
   */
  editable?: boolean;
  
  /**
   * 是否顯示刪除按鈕
   */
  showDeleteButton?: boolean;
  
  /**
   * 刪除處理函數
   */
  onDelete?: (item: TimelineItemType) => void;
  
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
 * Timeline 項目元件
 */
const Item: React.FC<ItemProps> = ({
  item,
  onClick,
  onDoubleClick,
  onContextMenu,
  selected = false,
  editable = false,
  showDeleteButton = false,
  onDelete,
  className = '',
  style = {}
}) => {
  // 處理點擊
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(item);
    }
  };

  // 處理雙擊
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (onDoubleClick) {
      onDoubleClick(item);
    }
  };

  // 處理右鍵選單
  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      onContextMenu(e, item);
    }
  };

  // 處理刪除
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(item);
    }
  };

  // 合併項目樣式
  const itemStyle = {
    ...style,
    ...(item.style ? { ...JSON.parse(`{${item.style}}`) } : {})
  };

  // 組合 CSS 類別
  const itemClassName = [
    'timeline-item',
    item.type || ItemTypeEnum.BOX,
    selected ? 'selected' : '',
    editable ? 'editable' : '',
    item.className || '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={itemClassName}
      style={itemStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      title={item.title}
    >
      {/* 項目內容 */}
      <div className="timeline-item-content">
        {item.content}
      </div>

      {/* 刪除按鈕 */}
      {editable && showDeleteButton && selected && (
        <div className="delete-button" onClick={handleDelete}>
          ×
        </div>
      )}
    </div>
  );
};

export default Item;
