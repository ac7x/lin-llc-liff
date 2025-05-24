'use client'

import { LineBotStatus } from "@/modules/line/lineBot/interfaces/LineBot";
import { LinePayChargeBox } from "@/modules/line/linePay/interfaces/LinePayChargeBox";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";

export default function HomePage() {
  return (
    <main className="p-4 text-center">
      <LineBotStatus />
      <LinePayChargeBox />
      <ClientBottomNav />
    </main>
  );
}
