'use client'

import { LineBotStatus } from "@/modules/line/lineBot/interfaces/LineBot";
import { LinePayChargeBox } from "@/modules/line/linePay/interfaces/LinePayChargeBox";
import { UserBottomNav } from "@/modules/shared/interfaces/navigation/user-bottom-nav";

export default function HomePage() {
  return (
    <main className="p-4 text-center">
      <LineBotStatus />
      <LinePayChargeBox />
      <UserBottomNav />
    </main>
  );
}
