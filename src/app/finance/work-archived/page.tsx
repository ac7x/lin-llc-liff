
/**
 * 已竣工封存資料頁面
 */
const WorkArchivedPage = () => {
    // 假資料，實際應由 API 取得
    const archivedData = [
        { id: 1, name: "專案A", completedDate: "2024-05-01" },
        { id: 2, name: "專案B", completedDate: "2024-05-10" }
    ]

    return (
        <div>
            <h1>{"已竣工封存資料"}</h1>
            <p>{"此頁面顯示所有已竣工並封存的專案資料。"}</p>
            <table>
                <thead>
                    <tr>
                        <th>{"編號"}</th>
                        <th>{"名稱"}</th>
                        <th>{"竣工日期"}</th>
                    </tr>
                </thead>
                <tbody>
                    {archivedData.map(item => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
                            <td>{item.completedDate}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default WorkArchivedPage
