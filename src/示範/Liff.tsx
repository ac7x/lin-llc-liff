'use client'

import liff from "@line/liff";
import { createContext, useEffect, useState } from "react";

export const LiffContext = createContext<{
    liff: typeof liff | null;
    liffError: string | null;
    isLiffInitialized: boolean;
}>({
    liff: null,
    liffError: null,
    isLiffInitialized: false,
});

export function LiffProvider({ children }: { children: React.ReactNode }) {
    const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
    const [liffError, setLiffError] = useState<string | null>(null);
    const [isLiffInitialized, setIsLiffInitialized] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        liff
            .init({ liffId: process.env.LIFF_ID as string })
            .then(() => {
                setLiffObject(liff);
                setIsLiffInitialized(true);
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
        <LiffContext.Provider value={{ liff: liffObject, liffError, isLiffInitialized }}>
            {children}
        </LiffContext.Provider>
    );
}