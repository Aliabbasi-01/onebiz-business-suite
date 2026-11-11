"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getKOTById, updateKOTStatus } from "@/lib/kot";
import type { KOT } from "@/types/kot";
import { Printer, ArrowLeft } from "lucide-react";

function KOTContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [kot, setKot] = useState<KOT | null>(null);
  const redirecting = useRef(false);

  useEffect(() => {
    setKot(getKOTById(id));
  }, [id]);

  const printKOT = () => {
    if (redirecting.current || !kot) return;

    redirecting.current = true;

    const handleAfterPrint = () => {
      updateKOTStatus(id, "Printed");

      if (kot.orderType === "Dine In") {
        router.replace("/tables");
      } else {
        // Start a fresh order. Previous order remains pending.
        router.replace("/pos?newOrder=1");
      }
    };

    window.addEventListener("afterprint", handleAfterPrint, {
      once: true,
    });

    window.print();
  };

  if (!kot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="font-semibold text-gray-700">KOT not found.</p>
          <button
            onClick={() => router.replace("/pos?newOrder=1")}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to POS
          </button>
        </div>
      </div>
    );
  }

  const date = new Date(kot.createdAt);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .kot-paper {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-md">
        <div className="no-print mb-5 flex justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            onClick={printKOT}
            disabled={redirecting.current}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-white disabled:opacity-50"
          >
            <Printer size={18} />
            Print / Save PDF
          </button>
        </div>

        <div className="kot-paper rounded-lg bg-white p-7 text-black shadow-xl">
          <h1 className="text-center text-2xl font-black">
            {kot.businessName}
          </h1>

          <p className="mt-1 text-center text-sm font-bold">
            KITCHEN ORDER TICKET
          </p>

          <div className="my-4 border-y border-dashed border-black py-3 text-sm">
            <div className="flex justify-between">
              <span>KOT Number</span>
              <strong>#{String(kot.kotNumber).padStart(3, "0")}</strong>
            </div>

            <div className="mt-2 flex justify-between">
              <span>Order Number</span>
              <strong>{kot.orderId}</strong>
            </div>

            <div className="mt-2 flex justify-between">
              <span>Order Type</span>
              <strong>{kot.orderType}</strong>
            </div>

            <div className="mt-2 flex justify-between">
              <span>Table</span>
              <strong>{kot.tableNumber || "N/A"}</strong>
            </div>

            <div className="mt-2 flex justify-between">
              <span>Date</span>
              <strong>{date.toLocaleDateString()}</strong>
            </div>

            <div className="mt-2 flex justify-between">
              <span>Time</span>
              <strong>
                {date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </div>
          </div>

          <h2 className="mb-3 text-lg font-black">ORDER ITEMS</h2>

          <div className="space-y-3">
            {kot.items.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex items-center justify-between border-b border-dashed border-gray-300 pb-2"
              >
                <span className="font-semibold">{item.name}</span>
                <span className="text-xl font-black">x {item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-dashed border-black pt-4 text-center">
            <p className="font-black">PLEASE PREPARE THIS ORDER</p>
            <p className="mt-2 text-xs">Powered by OneBiz</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KOTPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading Kitchen Order...
        </div>
      }
    >
      <KOTContent />
    </Suspense>
  );
}