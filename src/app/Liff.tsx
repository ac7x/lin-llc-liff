'use client'

import liff from "@line/liff";
import { createContext, useEffect, useState } from "react";

export const LiffContext = createContext<{ liff: typeof liff | null; liffError: string | null }>({
    liff: null,
    liffError: null,
});

export function LiffProvider({ children }: { children: React.ReactNode }) {
    const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
    const [liffError, setLiffError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        liff
            .init({ liffId: process.env.LIFF_ID as string })
            .then(() => {
                setLiffObject(liff);
            })
            .catch((error: Error) => {
                if (!process.env.LIFF_ID) {
                    console.info(
                        "LIFF Starter: Please make sure that you provided `LIFF_ID` as an environmental variable."
                    );
                }
                setLiffError(error.toString());
            });
    }, []);

    return (
        <LiffContext.Provider value={{ liff: liffObject, liffError }}>
            {children}
        </LiffContext.Provider>
    );
}