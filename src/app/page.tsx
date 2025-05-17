'use client'

import { LineBotStatus } from "@/app/LineBotStatus";
import { LinePayChargeBox } from "@/app/LinePayChargeBox";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";

export default function HomePage() {
  return (
    <main className="p-4">
      <LineBotStatus />
      <LinePayChargeBox />
      <GlobalBottomNav />
    </main>
  );
}
