"use client";
import React, { useEffect, useState } from 'react';
import { UserCategory } from '../usercategory/userCategory';
import { Column } from '../tables/tabletype';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { Schemesdatas } from '../schemesdata/schemes';
import { FarmdersType } from '../farmersdata/farmers';
import SchemesDataModel from '../example/ModalExample/SchemesDataModel';
import { Schemecategorytype } from '../Schemecategory/Schemecategory';
import { Schemesubcategorytype } from '../Schemesubcategory/Schemesubcategory';
import { Scheme_year } from '../Yearmaster/yearmaster';
import { Documents } from '../Documentsdata/documents';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface AllFarmersData {
    users: UserCategory[];
    schemes: Schemesdatas[];
    farmers: FarmdersType[];
    schemescrud: Schemecategorytype[];
    schemessubcategory: Schemesubcategorytype[];
    yearmaster: Scheme_year[];
    documents: Documents[];
}

// Helper function to parse farmer's schemes string to extract statuses per schemeId based on your format
function parseFarmerSchemeStatuses(schemesString?: string) : Record<string, 'Applied' | 'Benefited' | 'NotApplied'> {
    const statusMap: Record<string, 'Applied' | 'Benefited' | 'NotApplied'> = {};
    if (!schemesString) return statusMap;
    const entries = schemesString.split('|');
    entries.forEach(entry => {
        // schemeId is digits before first hyphen
        const idMatch = entry.match(/^(\d+)-/);
        if (!idMatch) return;
        const schemeId = idMatch[1];
        // status is last part after last hyphen, case insensitive and trimmed
        const lastHyphen = entry.lastIndexOf('-');
        if (lastHyphen === -1) return;
        const rawStatus = entry.substring(lastHyphen + 1).trim().toLowerCase();
        // Map possible statuses
        if (rawStatus === 'benefit received') {
            statusMap[schemeId] = 'Benefited';
        } else if (rawStatus === 'applyed' || rawStatus === 'applied') {
            statusMap[schemeId] = 'Applied';
        } else {
            statusMap[schemeId] = 'NotApplied';
        }
    });
    return statusMap;
}

const SchemesDashboardcounting = ({ farmersData }: { farmersData: AllFarmersData }) => {
    const [dataschems, setDataschems] = useState<Schemesdatas[]>([]);
    const [dataschemsyear, setDataschemsyear] = useState<Scheme_year[]>([]);
    const [datafarmers, setDatafarmers] = useState<FarmdersType[]>([]);
    const [datadocuments, setDocumentsdata] = useState<Documents[]>([]);
    const [dataSchemecategory, setDataSchemecategory] = useState<Schemecategorytype[]>([]);
    const [dataSchemesubcategory, setDataSchemesubcategory] = useState<Schemesubcategorytype[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [filteredFarmers, setFilteredFarmers] = useState<FarmdersType[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
        if (farmersData) {
            setDataschems(farmersData.schemes);
            setDatafarmers(farmersData.farmers);
            setDataSchemecategory(farmersData.schemescrud);
            setDataSchemesubcategory(farmersData.schemessubcategory);
            setDataschemsyear(farmersData.yearmaster);
            setDocumentsdata(farmersData.documents);
        }
    }, [farmersData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredFarmers]);

    const alldata = datafarmers.filter(farmer => farmer.schemes?.trim() !== "");

    // Filter schemes if farmers have schemes string (dummy filter)
    const matches = dataschems.filter(scheme =>
        alldata.some(farmer => farmer.schemes && scheme)
    );

    const handleBenefitedClick = (schemeId: string) => {
        const benefitedFarmers = datafarmers.filter(farmer => {
            const statuses = parseFarmerSchemeStatuses(farmer.schemes);
            return statuses[schemeId] === 'Benefited';
        });
        setModalTitle(`Benefited IFR holders`);
        setFilteredFarmers(benefitedFarmers);
        setIsModalOpen(true);
    };

    const handleAppliedClick = (schemeId: string) => {
        const appliedFarmers = datafarmers.filter(farmer => {
            const statuses = parseFarmerSchemeStatuses(farmer.schemes);
            return statuses[schemeId] === 'Applied';
        });
        setModalTitle(`Applied IFR holders`);
        setFilteredFarmers(appliedFarmers);
        setIsModalOpen(true);
    };

    const handleNotBenefitedClick = (schemeId: string) => {
        const notBenefited = datafarmers.filter(farmer => {
            const statuses = parseFarmerSchemeStatuses(farmer.schemes);
            // Farmer is not Benefited or Applied for this scheme
            return !(statuses[schemeId] === 'Benefited' || statuses[schemeId] === 'Applied');
        });
        setModalTitle('Non-Benefited IFR Holders');
        setFilteredFarmers(notBenefited);
        setIsModalOpen(true);
    };

    const totalPages = Math.ceil(filteredFarmers.length / rowsPerPage);
    const paginatedFarmers = filteredFarmers.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    // Excel download handler
    const handleDownloadExcel = () => {
        const excelData = filteredFarmers.map((farmer, idx) => ({
            "Sr.No": (currentPage - 1) * rowsPerPage + idx + 1,
            "IFR Holder": farmer.name,
            "Type": farmer.adivasi,
            "Contact No": farmer.contact_no || "-",
            "Vanksetra": farmer.vanksetra
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Farmers");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, `${modalTitle.replace(/\s+/g, "_")}_Farmers.xlsx`);
    };

    /* Count functions for each scheme and status */
    const countBenefited = (schemeId: string) => {
        return datafarmers.reduce((count, farmer) => {
            const statuses = parseFarmerSchemeStatuses(farmer.schemes);
            return statuses[schemeId] === 'Benefited' ? count + 1 : count;
        }, 0);
    };

    const countApplied = (schemeId: string) => {
        return datafarmers.reduce((count, farmer) => {
            const statuses = parseFarmerSchemeStatuses(farmer.schemes);
            return statuses[schemeId] === 'Applied' ? count + 1 : count;
        }, 0);
    };

    const countNotBenefited = (schemeId: string) => {
        return datafarmers.reduce((count, farmer) => {
            const statuses = parseFarmerSchemeStatuses(farmer.schemes);
            if (!statuses[schemeId] || statuses[schemeId] === 'NotApplied') return count + 1;
            return count;
        }, 0);
    };

    const columns: Column<Schemesdatas>[] = [
        {
            key: 'scheme_name',
            label: 'Schemes Name',
            accessor: 'scheme_name',
            render: (scheme) => (
                <span>
                    <SchemesDataModel
                        schemeid={scheme.scheme_id}
                        farmername={scheme.scheme_name}
                        datascheme={dataschems}
                        schemescrud={dataSchemecategory}
                        schemessubcategory={dataSchemesubcategory}
                        dataschemsyear={dataschemsyear}
                        datadocuments={datadocuments}
                    />
                </span>
            )
        },
        {
            key: 'Benefited',
            label: 'Yes',
            render: (scheme) => (
                <button
                    onClick={() => handleBenefitedClick(scheme.scheme_id.toString())}
                    className="text-blue-700 font-bold underline cursor-pointer"
                >
                    {countBenefited(scheme.scheme_id.toString())}
                </button>
            )
        },
        {
            key: 'NotBenefited',
            label: 'No',
            render: (scheme) => (
                <button
                    onClick={() => handleNotBenefitedClick(scheme.scheme_id.toString())}
                    className="text-red-700 font-bold underline cursor-pointer"
                >
                    {countNotBenefited(scheme.scheme_id.toString())}
                </button>
            )
        },
        {
            key: 'Applied',
            label: 'Applied',
            render: (scheme) => (
                <button
                    onClick={() => handleAppliedClick(scheme.scheme_id.toString())}
                    className="text-green-700 font-bold underline cursor-pointer"
                >
                    {countApplied(scheme.scheme_id.toString())}
                </button>
            )
        }
    ];

    return (
        <div className='bg-white'>
            <Simpletableshowdata
                data={matches}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                        <div className="col-span-1"></div>
                    </div>
                }
                columns={columns}
                title="Scheme Beneficiaries"
                filterOptions={[]}
                searchKey="beneficiery_name"
            />

            {isModalOpen && (
                <div className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-4 z-999999">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl max-h-[90vh] overflow-auto z-999999">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">{modalTitle}</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4">
                            <button
                                onClick={handleDownloadExcel}
                                className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                डाउनलोड करा
                            </button>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sr.No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                IFR holders
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vanksetra
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedFarmers.map((farmer, index) => (
                                            <tr key={farmer.farmer_id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(currentPage -1)*rowsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.adivasi}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.contact_no || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.vanksetra}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchemesDashboardcounting;
