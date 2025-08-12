"use client";

import React, { useEffect, useState } from "react";

import Link from "next/link";
import PathHandler from "../common/PathHandler";
import { FarmdersType } from "../farmersdata/farmers";
import { Schemesdatas } from "../schemesdata/schemes";
import { UserData } from "../usersdata/Userdata";

import { VscGitStashApply } from "react-icons/vsc";
import { FaNairaSign } from "react-icons/fa6";
import { FaHandHoldingUsd } from "react-icons/fa";
interface Metrics {
    farmers: FarmdersType[];
    schemes: Schemesdatas[];
    users: UserData[];
}

export const SchemeSaturation = ({ metrics }: { metrics: Metrics }) => {
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

    // const filteredFarmers = metrics?.farmers.filter(f =>
    //     f.taluka_id === filters.talukaId &&
    //     f.village_id === filters.villageId
    // ) || [];
    // const filteredFarmersbdo = metrics?.farmers.filter(f =>
    //     f.taluka_id === filters.talukaId
    // ) || [];
    const filteredapplied = metrics?.farmers.filter(f =>
        f.schemes != ""
    ) || [];
    const filterednotapplied = metrics?.farmers.filter(f =>
        f.schemes == ""
    ) || [];
    const filteredrecevied = metrics?.farmers.filter(f => {
        // Make sure f.schemes exists and is an array
        const schemes = Array.isArray(f.schemes) ? f.schemes : [];
        // Get last scheme (or undefined if empty)
        const lastScheme = schemes[schemes.length - 1];
        // Check if lastScheme is 'received'
        return lastScheme === 'received';
    }) || [];
    const counts = {



        farmers: filteredapplied.length ?? 0,

        schemes: filterednotapplied.length ?? 0,
        users: filteredrecevied.length ?? 0
    };


    const metricsConfig = [
        {
            icon: <VscGitStashApply size={20} />,
            label: "Applied",
            value: counts.farmers,
            href: "/",
            show: true,
            bgcolor: "bg-red-600"
        },
        {
            icon: <FaHandHoldingUsd size={20} />,
            label: "Yes",
            value: counts.users,
            href: "/",
            show: filters.categoryName === "1" || filters.categoryName === "8" || filters.categoryName === "32" || filters.categoryName === "4",
            bgcolor: "bg-blue-600"
        },
        {
            icon: <FaNairaSign size={20} />,
            label: "No",
            value: counts.schemes,
            href: "/",
            show: true,
            bgcolor: "bg-green-600"
        },

    ];
    if (!["8", "32", "4"].includes(filters.categoryName ?? "")) return null;
    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Scheme Saturation
                </h2>
                <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${filters.categoryName === "1" || filters.categoryName === "8" || filters.categoryName === "32" || filters.categoryName === "4" ? "sm:grid-cols-3" : "sm:grid-cols-2"
                    }`}>
                    {metricsConfig.map((metric, index) => metric.show && (
                        <MetricCard key={index} {...metric} />
                    ))}
                </div>
            </div>
        </>
    );
};

const MetricCard = ({ icon, label, value, href, bgcolor }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    href: string;
    bgcolor: React.ReactNode;
}) => (
    <>

        <div className={`rounded-xl border border-gray-200 ${bgcolor}  p-4 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow text-white`}>
            <Link href={href}>
                <PathHandler>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg dark:bg-gray-800">
                            {icon}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white dark:text-gray-400">
                                {label}
                            </span>
                            <h4 className="text-lg font-semibold text-white dark:text-white/90">
                                {value}
                            </h4>
                        </div>
                    </div>
                </PathHandler>
            </Link>
        </div>
    </>
);
