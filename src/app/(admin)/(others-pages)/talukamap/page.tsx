// app/ecommerce/page.tsx
import type { Metadata } from "next";

import { Suspense } from "react";
import Loader from "@/common/Loader";


import DistrictMap from "@/components/ecommerce/DistrictMap";

export const metadata: Metadata = {
    title: "MDM",
    description:
        "Scheme Monitoring & Tracking System",
};

async function fetchFarmersData() {

    try {
        // 1. Add yearmaster fetch here (6 fetches total)
        const [usersRes, schemesRes, farmersRes, schemescrudRes, schemessubcategoryRes, yearmasterRes, documentsRes, talukaRes, villagesRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usercategorycrud`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescrud`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/farmers`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescategory`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemessubcategory`), // Assuming this is correct
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/yearmaster`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/villages`),
        ]);

        // 2. Keep 6 elements here to match
        const [users, schemes, farmers, schemescrud, schemessubcategory, yearmaster, documents, taluka, villages] = await Promise.all([
            usersRes.json(),
            schemesRes.json(),
            farmersRes.json(),
            schemescrudRes.json(),
            schemessubcategoryRes.json(),
            yearmasterRes.json(),
            documentsRes.json(),
            talukaRes.json(),
            villagesRes.json()
        ]);

        return { users, schemes, farmers, schemescrud, schemessubcategory, yearmaster, documents, taluka, villages };
    } catch (error) {
        console.error('Error fetching farmers data:', error);
        return {
            users: [],
            schemes: [],
            farmers: [],
            schemescrud: [],
            schemessubcategory: [],
            yearmaster: [], // Added missing array
            documents: [], // Added missing array
            taluka: [], // Added missing array
            villages: [], // Added missing array
        };
    }
}


export default async function Ecommerce() {

    const farmersData = await fetchFarmersData();

    return (
        <div className="grid grid-cols-6 gap-4 md:gap-6">
            <div className="col-span-12 space-y-5 xl:col-span-7 ">
                {/* <Loader /> */}
                <Suspense fallback={<Loader />}>
                    <DistrictMap farmersData={farmersData} />
                </Suspense>
            </div>
        </div>
    );
}
