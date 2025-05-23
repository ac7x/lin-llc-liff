/**
 * Timeline 預設模板實作
 */

import React from 'react';
import { TimelineItem } from '../../types/TimelineItem';

interface DefaultTemplateProps {
  /**
   * 項目資料
   */
  item: TimelineItem;
  
  /**
   * 是否正在編輯中
   */
  isEditing?: boolean;
  
  /**
   * 編輯時的資料
   */
  editData?: any;
}

/**
 * Timeline 預設模板
 */
const DefaultTemplate: React.FC<DefaultTemplateProps> = ({
  item,
  isEditing = false,
  editData = {}
}) => {
  // 簡單渲染
  if (typeof item.content === 'string') {
    return <div className="timeline-template-default">{item.content}</div>;
  }

  // 複雜渲染
  return (
    <div className="timeline-template-default">
      {/* 標題 */}
      {item.title && (
        <div className="item-title">
          <strong>{item.title}</strong>
        </div>
      )}

      {/* 內容 */}
      <div className="item-content">
        {item.content}
      </div>

      {/* 時間資訊 */}
      {item.start && (
        <div className="item-time">
          {isEditing && editData.start
            ? formatDate(editData.start)
            : formatDate(item.start)}
          
          {item.end && (
            <>
              {' - '}
              {isEditing && editData.end
                ? formatDate(editData.end)
                : formatDate(item.end)}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 格式化日期顯示
 * @param date 日期
 * @returns 格式化的日期字串
 */
const formatDate = (date: any): string => {
  if (!date) return '';

  if (date instanceof Date) {
    return date.toLocaleString();
  }

  if (typeof date === 'string') {
    return new Date(date).toLocaleString();
  }

  if (typeof date === 'number') {
    return new Date(date).toLocaleString();
  }

  // 支援 moment 物件
  if (date && typeof date.toDate === 'function') {
    return date.toDate().toLocaleString();
  }

  return String(date);
};

export default DefaultTemplate;
