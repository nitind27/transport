"use client";

import React, { useState } from "react";
import Routepaper from "@/components/Routepaper/Routepaper";
import Routepaperview from "@/components/Routepaperview/Routepaperview";

type TabKey = "prepare" | "view";

const RoutepaperTabs = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("prepare");

  return (
    <div className="">
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("prepare")}
          className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
            activeTab === "prepare"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Prepare Routepaper
        </button>
        <button
          onClick={() => setActiveTab("view")}
          className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
            activeTab === "view"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          View Routepaper
        </button>
      </div>

      {activeTab === "prepare" ? (
        <Routepaper />
      ) : (
        <Routepaperview />
      )}
    </div>
  );
};

export default RoutepaperTabs;