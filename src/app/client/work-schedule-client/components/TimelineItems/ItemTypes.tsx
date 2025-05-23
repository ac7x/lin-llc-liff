/**
 * Timeline 項目類型定義和工廠函數
 */

import React from 'react';
import { TimelineItem as TimelineItemType } from '../../types/TimelineItem';
import { TimelineItemType as ItemTypeEnum } from '../../constants';
import Item from './Item';

interface ItemTypesProps {
  /**
   * 項目資料
   */
  item: TimelineItemType;
  
  /**
   * 其他屬性
   */
  [key: string]: any;
}

/**
 * 盒狀項目（預設）
 */
const BoxItem: React.FC<ItemTypesProps> = ({ item, ...props }) => {
  return <Item item={item} {...props} />;
};

/**
 * 點狀項目
 */
const PointItem: React.FC<ItemTypesProps> = ({ item, ...props }) => {
  return <Item item={item} {...props} />;
};

/**
 * 範圍項目
 */
const RangeItem: React.FC<ItemTypesProps> = ({ item, ...props }) => {
  return <Item item={item} {...props} />;
};

/**
 * 背景項目
 */
const BackgroundItem: React.FC<ItemTypesProps> = ({ item, ...props }) => {
  return <Item item={item} {...props} />;
};

/**
 * 根據項目類型建立對應的元件
 * @param type 項目類型
 * @param item 項目資料
 * @param props 其他屬性
 * @returns 對應類型的項目元件
 */
const createItemByType = (
  type: string = ItemTypeEnum.BOX,
  item: TimelineItemType,
  props: any
) => {
  switch (type) {
    case ItemTypeEnum.POINT:
      return <PointItem item={item} {...props} />;
    case ItemTypeEnum.RANGE:
      return <RangeItem item={item} {...props} />;
    case ItemTypeEnum.BACKGROUND:
      return <BackgroundItem item={item} {...props} />;
    case ItemTypeEnum.BOX:
    default:
      return <BoxItem item={item} {...props} />;
  }
};

/**
 * 項目類型元件
 */
const ItemTypes = {
  BoxItem,
  PointItem,
  RangeItem,
  BackgroundItem,
  createItemByType
};

export default ItemTypes;
