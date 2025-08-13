"use client";

import React, { useEffect, useState } from "react";
import { BoxIconLine, UserIcon } from "@/icons";
import Link from "next/link";
import PathHandler from "../common/PathHandler";
// import { FarmdersType } from "../farmersdata/farmers";
import { Schemesdatas } from "../schemesdata/schemes";
import { UserData } from "../usersdata/Userdata";

interface Metrics {

  schemes: Schemesdatas[];
  users: UserData[];
}

export const EcommerceMetrics = ({ metrics }: { metrics: Metrics }) => {
  console.log(metrics)
  const [filters, setFilters] = useState({
    talukaId: null as string | null,
    villageId: null as string | null,
    categoryName: null as string | null
  });

  useEffect(() => {
    setFilters({
      talukaId: sessionStorage.getItem('taluka_id'),
      villageId: sessionStorage.getItem('village_id'),
      categoryName: sessionStorage.getItem('category_id')
    });
  }, []);



  // const counts = {


  //   schemes: metrics?.schemes.length ?? 0,
  //   users: metrics?.users.length ?? 0,

  // };


  const metricsConfig = [

    {
      icon: <BoxIconLine className="w-7 h-7 text-gray-600 dark:text-gray-200" />,
      label: "Total Inward",
      // value: counts.schemes,
      value: "0",
      href: "/",
      show: true
    },
    {
      icon: <UserIcon className="w-7 h-7 text-gray-600 dark:text-gray-200" />,
      label: "Total Outward",
      // value: counts.users
      value: "0",
      href: "/",
      show: filters.categoryName === "1"
    },
  ];

  return (
    <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${filters.categoryName === "1" || filters.categoryName === "8" || filters.categoryName === "32" || filters.categoryName === "4" ? "sm:grid-cols-2" : "sm:grid-cols-2"
      }`}>
      {metricsConfig.map((metric, index) => metric.show && (
        <>{
          filters.categoryName != "32" &&
          <MetricCard key={index} {...metric} />
        }
        </>
      ))}
    </div>
  );
};

const MetricCard = ({ icon, label, value, href }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  href: string

}
) => (
  <>
    {


      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow">
        <Link href={href}>
          <PathHandler>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-lg dark:bg-gray-800">
                {icon}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {label}
                </span>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {value}
                </h4>
              </div>
            </div>
          </PathHandler>
        </Link>
      </div>
    }

  </>
);
