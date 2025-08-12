"use client";

import PathHandler from '@/components/common/PathHandler';

import { Documents } from '@/components/Documentsdata/documents';
import { FarmdersType } from '@/components/farmersdata/farmers';
import { Schemecategorytype } from '@/components/Schemecategory/Schemecategory';
import { Schemesdatas } from '@/components/schemesdata/schemes';
import { Schemesubcategorytype } from '@/components/Schemesubcategory/Schemesubcategory';
import { Taluka } from '@/components/Taluka/Taluka';
import { UserCategory } from '@/components/usercategory/userCategory';
import { Village } from '@/components/Village/village';
import { Scheme_year } from '@/components/Yearmaster/yearmaster';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

interface AllFarmersData {
    users: UserCategory[];
    schemes: Schemesdatas[];
    farmers: FarmdersType[];
    schemescrud: Schemecategorytype[];
    schemessubcategory: Schemesubcategorytype[];
    yearmaster: Scheme_year[];
    documents: Documents[];
    taluka: Taluka[];
    villages: Village[];
}

const DoTalukadata = ({ farmersData }: { farmersData: AllFarmersData }) => {
    const [filters, setFilters] = useState({
        categoryName: null as string | null,
    });

    useEffect(() => {
        setFilters({
            categoryName: sessionStorage.getItem('category_id'),
        });
    }, []);
    if (!["8", "32", "4"].includes(filters.categoryName ?? "")) return null;

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
               Taluka wise Addhar & not aadhar IFR holders
                </h2>
               
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">

                    {farmersData.taluka.map((metric, index) => (
                        <MetricCard
                            key={index}
                            {...metric}
                            farmers={farmersData.farmers}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

const MetricCard = ({
    taluka_id,
    name,
    farmers,
}: {
    taluka_id: number;
    name: string;
    farmers: FarmdersType[];
}) => {
    const [filters, setFilters] = useState({
        categoryName: null as string | null,
    });

    useEffect(() => {
        setFilters({
            categoryName: sessionStorage.getItem('category_id'),
        });
    }, []);

    const farmersCount = farmers.filter(farmer => farmer.taluka_id == String(taluka_id)).length;
    const aadharCount = farmers.filter(farmer => farmer.taluka_id == String(taluka_id) && farmer.aadhaar_no !== "").length;
    const withoutAadharCount = farmers.filter(farmer => farmer.taluka_id == String(taluka_id) && farmer.aadhaar_no === "").length;

    const handleClick = (talukaid: number) => {
        sessionStorage.setItem('taluka_id', talukaid.toString());
        sessionStorage.setItem('village_id', "");
        sessionStorage.setItem("aadharcount", "0")
    };
    const handleClickaadhar = (talukaid: number) => {

        sessionStorage.setItem('aadharcount', "1");
        sessionStorage.setItem('taluka_id', talukaid.toString());
        sessionStorage.setItem('village_id', "");
    };
    const handleClickaadharwithout = (talukaid: number) => {

        sessionStorage.setItem('taluka_id', talukaid.toString());
        sessionStorage.setItem('village_id', "");
        sessionStorage.setItem('aadharcount', "");
    };

    if (!["8", "32", "4"].includes(filters.categoryName ?? "")) return null;

    return (
        <>


            <div

                className="rounded-xl border border-gray-200 bg-white shadow-md p-5 hover:shadow-lg transition-shadow cursor-pointer"
            >

                <div onClick={() => handleClick(taluka_id)}>

                    <Link href="/farmerspage">
                        <PathHandler>
                            <div className="flex flex-col space-y-2">
                                <div className="text-sm text-gray-600">{name}</div>
                                <div className="text-2xl font-bold text-gray-800">{farmersCount}</div>
                            </div>
                        </PathHandler>
                    </Link>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between text-xs text-gray-600">
                    <div className="text-center" onClick={() => handleClickaadhar(taluka_id)}>
                        <Link href="/farmerspage">
                            <PathHandler>

                                <div className="font-medium text-green-600">With Aadhar</div>
                                <div>{aadharCount}</div>
                            </PathHandler>
                        </Link>
                    </div>
                    <div className="text-center" onClick={() => handleClickaadharwithout(taluka_id)}>
                        <Link href="/farmerspage">
                            <PathHandler>
                                <div className="font-medium text-red-600">No Aadhar</div>
                                <div>{withoutAadharCount}</div>
                            </PathHandler>
                        </Link>
                    </div>
                </div>
            </div >
        </>
    );
};

export default DoTalukadata;
