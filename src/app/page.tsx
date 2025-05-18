'use client'

import { LineBotStatus } from "@/modules/line/lineBot/interfaces/LineBot";
import { LinePayChargeBox } from "@/modules/line/linePay/interfaces/LinePayChargeBox";
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
