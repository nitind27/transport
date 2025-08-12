"use client";
import React, { useEffect, useState } from 'react';
import { Column } from '../tables/tabletype';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { FarmdersType } from '../farmersdata/farmers';
import { Documents } from '../Documentsdata/documents';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface AllFarmersData {
    farmers: FarmdersType[];
    documents: Documents[];
    taluka: Taluka[];
    villages: Village[];
}

interface DocumentUsage {
    document: Documents;
    countHas: number;
    countNotHas: number;
    countUpdationNeeded: number;
}

type ModalType = 'has' | 'not' | 'updation';

const parseFarmerDocuments = (docString: string | undefined): Record<string, { check: string, updation: string, available: string }> => {
    const result: Record<string, { check: string, updation: string, available: string }> = {};
    if (!docString) return result;
    docString.split('|').forEach(segment => {
        const [id, status] = segment.split('--');
        if (!id || !status) return;
        const [check, updation, available] = status.split('-');
        if (check && updation && available) {
            result[id.trim()] = {
                check: check.trim(),
                updation: updation.trim(),
                available: available.trim()
            };
        }
    });
    return result;
};

const rowsPerPage = 10;

const Documentstabview = ({ farmersData }: { farmersData: AllFarmersData }) => {
    const [datafarmers, setDatafarmers] = useState<FarmdersType[]>([]);
    const [documents, setDocuments] = useState<Documents[]>([]);
    const [documentUsageList, setDocumentUsageList] = useState<DocumentUsage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalFarmers, setModalFarmers] = useState<FarmdersType[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (farmersData) {
            setDatafarmers(farmersData.farmers);
            setDocuments(farmersData.documents);
        }
    }, [farmersData]);

    useEffect(() => {
        if (datafarmers.length === 0 || documents.length === 0) {
            setDocumentUsageList([]);
            return;
        }

        const farmersDocsParsed = datafarmers.map(farmer =>
            parseFarmerDocuments(typeof farmer.documents === 'string' ? farmer.documents : '')
        );

        const usageList: DocumentUsage[] = documents.map(doc => {
            let countHas = 0;
            let countNotHas = 0;
            let countUpdationNeeded = 0;

            datafarmers.forEach((farmer, idx) => {
                const docEntry = farmersDocsParsed[idx][String(doc.id)];
                if (docEntry) {
                    if (docEntry.available === 'Yes') {
                        countHas++;
                    } else {
                        countNotHas++;
                    }
                    if (docEntry.updation === 'Yes') {
                        countUpdationNeeded++;
                    }
                } else {
                    countNotHas++;
                }
            });

            return {
                document: doc,
                countHas,
                countNotHas,
                countUpdationNeeded
            };
        });

        setDocumentUsageList(usageList);
    }, [datafarmers, documents]);

    // Modal logic
    const openModal = (docId: number, docName: string, type: ModalType) => {
        setModalTitle(`${docName} - ${type === 'has' ? 'Available' : type === 'not' ? 'Not Available' : 'Updation Needed'}`);
        // Filter farmers
        const filteredFarmers = datafarmers.filter(farmer => {
            const docMap = parseFarmerDocuments(farmer.documents);
            const entry = docMap[String(docId)];
            if (type === 'has') return entry && entry.available === 'Yes';
            if (type === 'not') return !entry || entry.available !== 'Yes';
            if (type === 'updation') return entry && entry.updation === 'Yes';
            return false;
        });
        setModalFarmers(filteredFarmers);
        setCurrentPage(1);
        setIsModalOpen(true);
    };

    const totalPages = Math.ceil(modalFarmers.length / rowsPerPage);
    const paginatedFarmers = modalFarmers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    // Excel download handler
    const handleDownloadExcel = () => {
        const excelData = modalFarmers.map((farmer, idx) => ({
            "Sr.No": idx + 1,
            "IFR Holder": farmer.name,
            "Contact No": farmer.contact_no || "-",
            "Taluka": farmersData.taluka.find(t => t.taluka_id === Number(farmer.taluka_id))?.name || "",
            "Village": farmersData.villages.find(v => v.village_id === Number(farmer.village_id))?.marathi_name || ""
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Farmers");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, `${modalTitle.replace(/\s+/g, "_")}_Farmers.xlsx`);
    };

    const columns: Column<DocumentUsage>[] = [
        {
            key: 'documentName',
            label: 'Document Name',
            accessor: 'document',
            render: (usage) => <span>{usage.document.document_name}</span>
        },
        {
            key: 'available',
            label: 'Available',
            accessor: 'countHas',
            render: (usage) => (
                <span
                    className="text-green-700 font-bold cursor-pointer underline"
                    onClick={() => openModal(usage.document.id, usage.document.document_name, 'has')}
                >
                    {usage.countHas}
                </span>
            )
        },
        {
            key: 'notavailable',
            label: 'Not Available',
            accessor: 'countNotHas',
            render: (usage) => (
                <span
                    className="text-red-700 font-bold cursor-pointer underline"
                    onClick={() => openModal(usage.document.id, usage.document.document_name, 'not')}
                >
                    {usage.countNotHas}
                </span>
            )
        },
        {
            key: 'updationNeeded',
            label: 'Updation Needed',
            accessor: 'countUpdationNeeded',
            render: (usage) => (
                <span
                    className="text-yellow-700 font-bold cursor-pointer underline"
                    onClick={() => openModal(usage.document.id, usage.document.document_name, 'updation')}
                >
                    {usage.countUpdationNeeded}
                </span>
            )
        }
    ];

    return (
        <div className='bg-white'>
            <Simpletableshowdata
                data={documentUsageList}
                columns={columns}
                title=""
                filterOptions={[]}
                searchKey="document"
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
                                                Contact No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Taluka
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Village
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedFarmers.map((farmer, index) => (
                                            <tr key={farmer.farmer_id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(currentPage - 1) * rowsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.contact_no || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmersData.taluka.find((data) => data.taluka_id === Number(farmer.taluka_id))?.name || ""}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmersData.villages.find((data) => data.village_id === Number(farmer.village_id))?.marathi_name || ""}
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

export default Documentstabview;
