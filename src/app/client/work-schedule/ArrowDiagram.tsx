import { useEffect } from 'react'

/**
 * ArrowSpec 型別
 */
type ArrowSpec = {
    id: string
    idItem1: string
    idItem2: string
    title?: string
}

/**
 * ArrowDiagramComponent
 * @param timeline vis-timeline 實例
 * @param arrows 依賴關係陣列
 */
const ArrowDiagram = ({ timeline, arrows }: { timeline: any, arrows: ArrowSpec[] }) => {
    useEffect(() => {
        if (!timeline || !arrows?.length) {
            return
        }
        // 這裡可參考 timeline-arrows 的做法，建立 SVG 層並繪製箭頭
        // 目前僅預留結構，未實作繪製
    }, [timeline, arrows])

    return null // 預製組件暫不渲染內容
}

export default ArrowDiagram