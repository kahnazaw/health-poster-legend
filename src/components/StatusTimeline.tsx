"use client";

import React from "react";
import StatusBadge, { StatusType } from "./StatusBadge";

interface StatusTimelineProps {
  status: StatusType;
  rejectionReason?: string | null;
  approvedAt?: string | null;
}

const statusOrder: StatusType[] = ["draft", "submitted", "approved", "rejected"];

export default function StatusTimeline({ status, rejectionReason, approvedAt }: StatusTimelineProps) {
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {statusOrder.map((s, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? isCurrent
                        ? s === "approved"
                          ? "bg-green-500 text-white"
                          : s === "rejected"
                          ? "bg-red-500 text-white"
                          : s === "submitted"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-500 text-white"
                        : "bg-emerald-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                {index < statusOrder.length - 1 && (
                  <div
                    className={`w-8 h-0.5 transition-all duration-200 ${
                      index < currentIndex ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={status} size="md" />
        {status === "rejected" && rejectionReason && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200 flex-1">
            <span className="font-semibold">سبب الرفض:</span> {rejectionReason}
          </div>
        )}
        {status === "approved" && approvedAt && (
          <div className="text-sm text-green-600">
            <span className="font-semibold">اعتمد في:</span> {new Date(approvedAt).toLocaleDateString("ar-IQ")}
          </div>
        )}
      </div>
    </div>
  );
}

