import { Suspense } from "react";
import MerchantPage from "@/components/MenuInterface";

export default function MenuRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">Loading menu...</div>}>
      <MerchantPage merchantId="1" />
    </Suspense>
  );
}
