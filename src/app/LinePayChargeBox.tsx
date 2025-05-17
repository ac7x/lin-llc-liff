"use client";
import { createLinePayCharge } from "@/app/actions/linepay-charge.action";
import { useState } from "react";

export function LinePayChargeBox() {
    const [amount, setAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await createLinePayCharge(amount);
            window.location.href = res.paymentUrl;
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="my-4 p-3 bg-blue-100 rounded flex gap-2 items-center">
            <input
                type="number"
                min={1}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="border px-2 py-1 rounded w-24"
                placeholder="金額"
                required
            />
            <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded" disabled={loading}>
                {loading ? "請稍候..." : "LINE Pay 儲值"}
            </button>
            {error && <span className="text-red-600 ml-2">{error}</span>}
        </form>
    );
}
