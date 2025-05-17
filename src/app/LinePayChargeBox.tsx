"use client";
import { createLinePayCharge } from "@/app/actions/linepay-charge.action";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface ChargeFormData {
    amount: number;
}

export function LinePayChargeBox() {
    const { register, handleSubmit, formState: { errors } } = useForm<ChargeFormData>();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");

    const onSubmit = handleSubmit(async (data) => {
        setIsProcessing(true);
        setError("");

        try {
            const res = await createLinePayCharge(data.amount);
            window.location.href = res.paymentUrl;
        } catch (err) {
            setError(err instanceof Error ? err.message : "儲值請求失敗");
        } finally {
            setIsProcessing(false);
        }
    });

    return (
        <form onSubmit={onSubmit} className="my-4 p-3 bg-blue-100 rounded flex gap-2 items-center">
            <input
                type="number"
                min={1}
                {...register("amount", {
                    required: "請輸入金額",
                    min: { value: 1, message: "金額必須大於 0" }
                })}
                className="border px-2 py-1 rounded w-24"
                placeholder="金額"
                disabled={isProcessing}
            />
            {errors.amount && (
                <span className="text-red-600 text-sm">{errors.amount.message}</span>
            )}
            <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-1 rounded disabled:bg-blue-400"
                disabled={isProcessing}
            >
                {isProcessing ? "處理中..." : "LINE Pay 儲值"}
            </button>
            {error && <span className="text-red-600 ml-2">{error}</span>}
        </form>
    );
}
