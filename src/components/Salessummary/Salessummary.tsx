"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

// Types
interface DispatchDetail {
    id: number;
    dispatch_code: string;
    order_id: number;
    order_no?: string;
    school_id: number;
    schoolname?: string;
    center_id: number;
    center_name?: string;
    taluka_id?: string;
    taluka_name?: string;
    item_name: string;
    unit: string;
    total_qty: number;
    qty_dispatch: number;
    class_range?: string;
    udaisno?: string;
    patsankhya?: string;
    created_at: string;
}

interface GrainData {
    [key: string]: number;
}

interface GroupedData {
    taluka: string;
    class_range: string;
    patsankhya: number;
    grains: GrainData;
}

// Add this new interface after GroupedData
interface ExportRowData {
    'Sr No': number | string;
    'Taluka': string;
    'Class': string;
    'पाट संख्या': number;
    [key: string]: number | string; // For grain columns
}

interface Taluka {
    taluka_id: number;
    name: string;
    name_en: string;
    dist_id: number;
    districtname: string;
    status: string;
}

const Salessummary = () => {
    const [selectedOrderNo, setSelectedOrderNo] = useState<string>('');
    const [dispatchData, setDispatchData] = useState<DispatchDetail[]>([]);
    const [allTalukas, setAllTalukas] = useState<Taluka[]>([]);
    const [loading, setLoading] = useState(false);

    // Define grain columns
    const grainColumns = [
        'तांदुळ', 'मुंगदाळ', 'तूरदाळ', 'मसूरदाळ', 'हरभरा', 'चवळी', 'मटकी',
        'मुग', 'वाटाणा', 'सोया वडी', 'मसाला', 'सोया तेल', 'हळद', 'मीठ',
        'मोहरी', 'चना', 'जीरा'
    ];

    useEffect(() => {
        fetchDispatchDetails();
        fetchAllTalukas();
    }, []);

    const fetchAllTalukas = async () => {
        try {
            // Get user_id and company_id from sessionStorage
            const userId = sessionStorage.getItem('userid');
            const companyId = sessionStorage.getItem('company_id');
            
            const params = new URLSearchParams();
            // Only add if exists and not empty string
            if (userId && userId.trim() !== '') params.append('user_id', userId.trim());
            if (companyId && companyId.trim() !== '') params.append('company_id', companyId.trim());
            
            const res = await fetch(`/api/taluka${params.toString() ? '?' + params.toString() : ''}`);
            if (res.ok) {
                const data = await res.json();
                setAllTalukas(data);
            } else {
                toast.error('Failed to fetch talukas');
            }
        } catch (error) {
            console.error('Error fetching talukas:', error);
            toast.error('Error loading talukas');
        }
    };

    const fetchDispatchDetails = async () => {
        setLoading(true);
        try {
            // Get user_id and company_id from sessionStorage
            const userId = sessionStorage.getItem('userid');
            const companyId = sessionStorage.getItem('company_id');
            
            const params = new URLSearchParams();
            // Only add if exists and not empty string
            if (userId && userId.trim() !== '') params.append('user_id', userId.trim());
            if (companyId && companyId.trim() !== '') params.append('company_id', companyId.trim());
            
            const res = await fetch(`/api/dispatchdetails${params.toString() ? '?' + params.toString() : ''}`);
            if (res.ok) {
                const data = await res.json();
                console.log('Fetched data:', data.slice(0, 2)); // Debug: Check first 2 rows
                setDispatchData(data);
            } else {
                toast.error('Failed to fetch dispatch details');
            }
        } catch (error) {
            console.error('Error fetching dispatch details:', error);
            toast.error('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const orderNumbers = useMemo(() => {
        const orders = new Set<string>();
        dispatchData.forEach(item => {
            if (item.order_no) orders.add(item.order_no);
        });
        return Array.from(orders).sort();
    }, [dispatchData]);

    // Helper function to check if class range is 01-05 type
    const isClass0105 = (classRange: string): boolean => {
        if (!classRange) return false;
        const normalized = classRange.toLowerCase().replace(/\s+/g, '');
        return (
            normalized.includes('1-5') || 
            normalized.includes('1-5') ||
            normalized.includes('1ली') ||
            normalized.includes('1ते5') ||
            (normalized.includes('1') && normalized.includes('5') && !normalized.includes('6'))
        );
    };

    // Helper function to check if class range is 06-08 type
    const isClass0608 = (classRange: string): boolean => {
        if (!classRange) return false;
        const normalized = classRange.toLowerCase().replace(/\s+/g, '');
        return (
            normalized.includes('6-8') || 
            normalized.includes('6-8') ||
            normalized.includes('6ली') ||
            normalized.includes('6ते8') ||
            (normalized.includes('6') && normalized.includes('8'))
        );
    };

    // Group data by Taluka and Class
    const groupedData = useMemo(() => {
        if (!selectedOrderNo) return [];

        const filtered = dispatchData.filter(item => item.order_no === selectedOrderNo);
        
        console.log('Filtered by order:', filtered.length); // Debug
        
        const grouped = new Map<string, GroupedData>();
        const schoolsPerGroup = new Map<string, Set<number>>();

        filtered.forEach(item => {
            const key = `${item.taluka_name}_${item.class_range}`;
            
            if (!grouped.has(key)) {
                grouped.set(key, {
                    taluka: item.taluka_name || '',
                    class_range: item.class_range || '',
                    patsankhya: 0,
                    grains: {}
                });
                schoolsPerGroup.set(key, new Set());
            }

            if (item.school_id) {
                schoolsPerGroup.get(key)!.add(item.school_id);
            }

            const group = grouped.get(key)!;
            const itemName = item.item_name;
            
            if (!group.grains[itemName]) {
                group.grains[itemName] = 0;
            }
            
            const qtyValue = Number(item.qty_dispatch) || 0;
            group.grains[itemName] = Number(group.grains[itemName]) + qtyValue;
        });

        schoolsPerGroup.forEach((schools, key) => {
            const group = grouped.get(key)!;
            const uniqueSchoolsInGroup = Array.from(schools);
            let totalPatsankhya = 0;
            
            uniqueSchoolsInGroup.forEach(schoolId => {
                const schoolItems = filtered.filter(item => 
                    item.school_id === schoolId && 
                    `${item.taluka_name}_${item.class_range}` === key
                );
                
                if (schoolItems.length > 0 && schoolItems[0].patsankhya) {
                    totalPatsankhya += Number(schoolItems[0].patsankhya) || 0;
                }
            });
            
            group.patsankhya = totalPatsankhya;
        });

        const result = Array.from(grouped.values()).sort((a, b) => {
            if (a.taluka < b.taluka) return -1;
            if (a.taluka > b.taluka) return 1;
            return a.class_range.localeCompare(b.class_range);
        });

        console.log('Grouped data:', result); // Debug
        return result;
    }, [selectedOrderNo, dispatchData]);

    // Helper function to create complete data with all talukas
    const createCompleteData = (data: GroupedData[], classRange: string): GroupedData[] => {
        const result: GroupedData[] = [];
        
        // Create a map of existing data by taluka name
        const dataMap = new Map<string, GroupedData>();
        data.forEach(item => {
            dataMap.set(item.taluka, item);
        });
        
        // Add all talukas
        allTalukas.forEach(taluka => {
            const talukaName = taluka.name; // Use the Marathi name
            
            if (dataMap.has(talukaName)) {
                // Taluka has data - use it
                result.push(dataMap.get(talukaName)!);
            } else {
                // Taluka has no data - create default entry with 0 values
                const emptyGrains: GrainData = {};
                grainColumns.forEach(grain => {
                    emptyGrains[grain] = 0;
                });
                
                result.push({
                    taluka: talukaName,
                    class_range: classRange,
                    patsankhya: 0,
                    grains: emptyGrains
                });
            }
        });
        
        // Sort by taluka name
        return result.sort((a, b) => a.taluka.localeCompare(b.taluka));
    };

    // Separate data for 01-05 and 06-08 - FLEXIBLE MATCHING
    const class0105Data = useMemo(() => {
        const data = groupedData.filter(row => isClass0105(row.class_range));
        console.log('Class 01-05 data:', data.length); // Debug
        
        // Only create complete data if an order is selected
        if (selectedOrderNo && allTalukas.length > 0) {
            return createCompleteData(data, '1-5');
        }
        return data;
    }, [groupedData, allTalukas, selectedOrderNo]);

    const class0608Data = useMemo(() => {
        const data = groupedData.filter(row => isClass0608(row.class_range));
        console.log('Class 06-08 data:', data.length); // Debug
        
        // Only create complete data if an order is selected
        if (selectedOrderNo && allTalukas.length > 0) {
            return createCompleteData(data, '6-8');
        }
        return data;
    }, [groupedData, allTalukas, selectedOrderNo]);

    // Calculate totals for 01-05
    const totals0105 = useMemo(() => {
        const total: GrainData = { patsankhya: 0 };
        grainColumns.forEach(grain => { total[grain] = 0; });

        class0105Data.forEach(row => {
            total.patsankhya = Number(total.patsankhya) + Number(row.patsankhya);
            grainColumns.forEach(grain => {
                const currentValue = Number(total[grain]) || 0;
                const addValue = Number(row.grains[grain]) || 0;
                total[grain] = currentValue + addValue;
            });
        });

        return total;
    }, [class0105Data, grainColumns]);

    // Calculate totals for 06-08
    const totals0608 = useMemo(() => {
        const total: GrainData = { patsankhya: 0 };
        grainColumns.forEach(grain => { total[grain] = 0; });

        class0608Data.forEach(row => {
            total.patsankhya = Number(total.patsankhya) + Number(row.patsankhya);
            grainColumns.forEach(grain => {
                const currentValue = Number(total[grain]) || 0;
                const addValue = Number(row.grains[grain]) || 0;
                total[grain] = currentValue + addValue;
            });
        });

        return total;
    }, [class0608Data, grainColumns]);

    // Calculate grand totals
    const grandTotals = useMemo(() => {
        const total: GrainData = { patsankhya: 0 };
        grainColumns.forEach(grain => { total[grain] = 0; });

        total.patsankhya = Number(totals0105.patsankhya) + Number(totals0608.patsankhya);
        grainColumns.forEach(grain => {
            total[grain] = Number(totals0105[grain] || 0) + Number(totals0608[grain] || 0);
        });

        return total;
    }, [totals0105, totals0608, grainColumns]);

    // Export to Excel
    const exportToExcel = () => {
        if (class0105Data.length === 0 && class0608Data.length === 0) {
            toast.warning('No data to export');
            return;
        }

        const exportData: ExportRowData[] = [];
        let srNo = 1;

        // Class 01-05 data
        class0105Data.forEach(row => {
            const rowData: ExportRowData = {
                'Sr No': srNo++,
                'Taluka': row.taluka,
                'Class': row.class_range,
                'पाट संख्या': Number(row.patsankhya)
            };
            grainColumns.forEach(grain => {
                rowData[grain] = Number(row.grains[grain]) || 0;
            });
            exportData.push(rowData);
        });

        // Total 01-05
        if (class0105Data.length > 0) {
            const totalRow0105: ExportRowData = {
                'Sr No': '',
                'Taluka': '',
                'Class': 'Total (01-05)',
                'पाट संख्या': Number(totals0105.patsankhya)
            };
            grainColumns.forEach(grain => {
                totalRow0105[grain] = Number(totals0105[grain]) || 0;
            });
            exportData.push(totalRow0105);
            exportData.push({} as ExportRowData); // Empty row
        }

        // Class 06-08 data
        srNo = 1; // Reset Sr No
        class0608Data.forEach(row => {
            const rowData: ExportRowData = {
                'Sr No': srNo++,
                'Taluka': row.taluka,
                'Class': row.class_range,
                'पाट संख्या': Number(row.patsankhya)
            };
            grainColumns.forEach(grain => {
                rowData[grain] = Number(row.grains[grain]) || 0;
            });
            exportData.push(rowData);
        });

        // Total 06-08
        if (class0608Data.length > 0) {
            const totalRow0608: ExportRowData = {
                'Sr No': '',
                'Taluka': '',
                'Class': 'Total (06-08)',
                'पाट संख्या': Number(totals0608.patsankhya)
            };
            grainColumns.forEach(grain => {
                totalRow0608[grain] = Number(totals0608[grain]) || 0;
            });
            exportData.push(totalRow0608);
        }

        // Grand Total
        const grandTotalRow: ExportRowData = {
            'Sr No': '',
            'Taluka': '',
            'Class': 'Grand Total',
            'पाट संख्या': Number(grandTotals.patsankhya)
        };
        grainColumns.forEach(grain => {
            grandTotalRow[grain] = Number(grandTotals[grain]) || 0;
        });
        exportData.push(grandTotalRow);

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Summary');

        const maxWidth = 15;
        const wscols = Object.keys(exportData[0] || {}).map(() => ({ wch: maxWidth }));
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `Sales_Summary_${selectedOrderNo}_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Excel downloaded successfully!');
    };

    // Render Table Component
    const renderTable = (data: GroupedData[], title: string, totals: GrainData) => (
        <div className="mb-8">
            <h4 className="mb-4 text-lg font-semibold text-black dark:text-white">{title}</h4>
            <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse border border-stroke text-sm">
                    <thead>
                        <tr className="bg-gray-2 text-center dark:bg-meta-4">
                            <th className="border border-stroke px-3 py-2 font-medium text-black dark:text-white">Sr No</th>
                            <th className="border border-stroke px-3 py-2 font-medium text-black dark:text-white">Taluka</th>
                            <th className="border border-stroke px-3 py-2 font-medium text-black dark:text-white">Class</th>
                            <th className="border border-stroke px-3 py-2 font-medium text-black dark:text-white">पाट संख्या</th>
                            {grainColumns.map(grain => (
                                <th key={grain} className="border border-stroke px-3 py-2 font-medium text-black dark:text-white">
                                    {grain}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={4 + grainColumns.length} className="border border-stroke px-4 py-5 text-center text-black dark:text-white">
                                    No data found for this class range
                                </td>
                            </tr>
                        ) : (
                            <>
                                {data.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-meta-4">
                                        <td className="border border-stroke px-3 py-2 text-center text-black dark:text-white">
                                            {index + 1}
                                        </td>
                                        <td className="border border-stroke px-3 py-2 text-black dark:text-white">
                                            {row.taluka}
                                        </td>
                                        <td className="border border-stroke px-3 py-2 text-center text-black dark:text-white">
                                            {row.class_range}
                                        </td>
                                        <td className="border border-stroke px-3 py-2 text-right text-black dark:text-white">
                                            {Number(row.patsankhya).toFixed(0)}
                                        </td>
                                        {grainColumns.map(grain => (
                                            <td key={grain} className="border border-stroke px-3 py-2 text-right text-black dark:text-white">
                                                {Number(row.grains[grain] || 0).toFixed(0)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {/* Total Row */}
                                <tr className="bg-blue-50 dark:bg-blue-900 font-bold">
                                    <td colSpan={3} className="border border-stroke px-3 py-2 text-right text-black dark:text-white">
                                        Total
                                    </td>
                                    <td className="border border-stroke px-3 py-2 text-right text-black dark:text-white">
                                        {Number(totals.patsankhya).toFixed(0)}
                                    </td>
                                    {grainColumns.map(grain => (
                                        <td key={grain} className="border border-stroke px-3 py-2 text-right text-black dark:text-white">
                                            {Number(totals[grain] || 0).toFixed(0)}
                                        </td>
                                    ))}
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                    Sales Summary Tab
                </h3>
            </div>

            <div className="p-7">
                {/* Filter Section */}
                <div className="mb-6">
                    <div className="w-full max-w-md">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Order Number 
                        </label>
                        <select
                            value={selectedOrderNo}
                            onChange={(e) => setSelectedOrderNo(e.target.value)}
                            className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
                        >
                            <option value="">-- Select Order Number --</option>
                            {orderNumbers.map(orderNo => (
                                <option key={orderNo} value={orderNo}>
                                    {orderNo}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table Section */}
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                    </div>
                ) : !selectedOrderNo ? (
                    <div className="text-center py-10 text-black dark:text-white">
                        Please select an order number
                    </div>
                ) : (
                    <>
                        {/* Table 1: Class 01-05 */}
                        {renderTable(class0105Data, 'Class 01-05', totals0105)}

                        {/* Table 2: Class 06-08 */}
                        {renderTable(class0608Data, 'Class 06-08', totals0608)}

                        {/* Grand Total Table */}
                        {(class0105Data.length > 0 || class0608Data.length > 0) && (
                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full table-auto border-collapse border border-stroke text-sm">
                                    <tbody>
                                        <tr className="bg-orange-100 dark:bg-orange-900 font-bold text-lg">
                                            <td colSpan={3} className="border border-stroke px-3 py-3 text-right text-black dark:text-white">
                                                Grand Total
                                            </td>
                                            <td className="border border-stroke px-3 py-3 text-right text-black dark:text-white">
                                                {Number(grandTotals.patsankhya).toFixed(0)}
                                            </td>
                                            {grainColumns.map(grain => (
                                                <td key={grain} className="border border-stroke px-3 py-3 text-right text-black dark:text-white">
                                                    {Number(grandTotals[grain] || 0).toFixed(0)}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Export Button */}
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={exportToExcel}
                                className="rounded bg-orange-500 px-8 py-3 text-lg font-semibold text-white hover:bg-orange-600 focus:outline-none shadow-md"
                            >
                                Export to Excel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Salessummary;