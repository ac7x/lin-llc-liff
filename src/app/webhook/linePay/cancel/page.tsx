import Link from 'next/link';

export default function LinePayCancelPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                <h1 className="text-2xl font-bold mb-4 text-center">
                    交易已取消
                </h1>
                <p className="text-center text-gray-600">您已取消本次儲值。</p>
                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                        返回首頁
                    </Link>
                </div>
            </div>
        </div>
    );
}
