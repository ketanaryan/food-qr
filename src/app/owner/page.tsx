"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OwnerRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center p-12 text-[#A18D6D]">
      <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
