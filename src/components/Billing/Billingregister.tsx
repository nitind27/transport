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
    truck_id: number;
    truckNo?: string;
    taluka_id?: string;
    taluka_name?: string;
    item_name: string;
    unit: string;
    total_qty: number;
    qty_dispatch: number;
    new_qty_dispatch?: number;
    bal_qty: number;
    class_range?: string;
    period?: string;
    financial_year?: string;
    udaisno?: string;
    patsankhya?: string;
    created_at: string;
}

interface Taluka {
    taluka_id: number;
    name: string;
}

interface Center {
    center_id: number;
    name: string;
    marathi_name?: string;
    taluka_id?: number;
}

// Add these new types:
interface PivotedRow {
    center_id: number;
    center_name: string;
    school_id: number;
    schoolname: string;
    class_range: string;
    patsankhya: string;
    pavti_no: string;
    udaisno: string;
    items: Record<string, number>;
}

interface ColumnTotals {
    patsankhya: number;
    items: Record<string, number>;
}

interface ExportRowData {
    'Sr No': number | string;
    'Center Name': string;
    'Class': string;
    'School Name': string;
    'UDAIS No': string;
    'Pavti No': string;
    'Patsankhya': string | number;
    [key: string]: string | number; // For dynamic item columns
}

const Billingregister = () => {
    // State for dropdown selections
    const [selectedOrderNo, setSelectedOrderNo] = useState<string>('');
    const [selectedTalukaId, setSelectedTalukaId] = useState<string>('');
    const [selectedCenterId, setSelectedCenterId] = useState<string>('');
    const [selectedClassRange, setSelectedClassRange] = useState<string>('');
    const [selectedItemCategory, setSelectedItemCategory] = useState<string>('');

    // Data states
    const [dispatchData, setDispatchData] = useState<DispatchDetail[]>([]);
    const [talukaList, setTalukaList] = useState<Taluka[]>([]);
    const [centerList, setCenterList] = useState<Center[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch all required data on component mount
    useEffect(() => {
        fetchDispatchDetails();
        fetchTalukas();
        fetchCenters();
    }, []);

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

    const fetchTalukas = async () => {
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
                setTalukaList(data);
            }
        } catch (error) {
            console.error('Error fetching talukas:', error);
        }
    };

    const fetchCenters = async () => {
        try {
            // Get user_id and company_id from sessionStorage
            const userId = sessionStorage.getItem('userid');
            const companyId = sessionStorage.getItem('company_id');
            
            const params = new URLSearchParams();
            // Only add if exists and not empty string
            if (userId && userId.trim() !== '') params.append('user_id', userId.trim());
            if (companyId && companyId.trim() !== '') params.append('company_id', companyId.trim());
            
            const res = await fetch(`/api/centerapi${params.toString() ? '?' + params.toString() : ''}`);
            if (res.ok) {
                const data = await res.json();
                setCenterList(data);
            }
        } catch (error) {
            console.error('Error fetching centers:', error);
        }
    };

    // 1. Get unique order numbers from dispatch data
    const orderNumbers = useMemo(() => {
        const orders = new Set<string>();
        dispatchData.forEach(item => {
            if (item.order_no) orders.add(item.order_no);
        });
        return Array.from(orders).sort();
    }, [dispatchData]);

    // 2. Show ALL talukas from database
    const filteredTalukas = useMemo(() => {
        return talukaList;
    }, [talukaList]);

    // 3. Show ALL centers from selected taluka from database
    const filteredCenters = useMemo(() => {
        if (!selectedTalukaId) return [];

        const selectedTalukaNumber = Number(selectedTalukaId);
        
        const centers = centerList.filter(center => {
            const centerTalukaId = Number(center.taluka_id);
            return centerTalukaId === selectedTalukaNumber;
        });

        return centers;
    }, [selectedTalukaId, centerList]);

    // 4. Get class ranges filtered by previous selections
    const filteredClassRanges = useMemo(() => {
        if (!selectedTalukaId) return [];

        const classRanges = new Set<string>();
        dispatchData
            .filter(item => {
                const matchOrder = !selectedOrderNo || item.order_no === selectedOrderNo;
                const matchTaluka = item.taluka_id === selectedTalukaId;
                const matchCenter = !selectedCenterId ||
                    selectedCenterId === 'all' ||
                    item.center_id === Number(selectedCenterId);

                return matchOrder && matchTaluka && matchCenter && item.class_range;
            })
            .forEach(item => {
                if (item.class_range) classRanges.add(item.class_range);
            });

        return Array.from(classRanges).sort();
    }, [selectedOrderNo, selectedTalukaId, selectedCenterId, dispatchData]);

    // 5. Filter data for table display
    const tableData = useMemo(() => {
        let filtered = dispatchData;

        if (selectedOrderNo) {
            filtered = filtered.filter(item => item.order_no === selectedOrderNo);
        }

        if (selectedTalukaId) {
            filtered = filtered.filter(item => item.taluka_id === selectedTalukaId);
        }

        if (selectedCenterId && selectedCenterId !== 'all') {
            filtered = filtered.filter(item => item.center_id === Number(selectedCenterId));
        }

        if (selectedClassRange) {
            filtered = filtered.filter(item => item.class_range === selectedClassRange);
        }

        if (selectedItemCategory) {
            if (selectedItemCategory === 'rice') {
                filtered = filtered.filter(item => {
                    const itemName = item.item_name.toLowerCase();
                    return itemName.includes('rice') ||
                        itemName.includes('तांदुळ') ||
                        itemName.includes('चावल');
                });
            } else if (selectedItemCategory === 'kirana') {
                filtered = filtered.filter(item => {
                    const itemName = item.item_name.toLowerCase();
                    return !itemName.includes('rice') &&
                        !itemName.includes('तांदुळ') &&
                        !itemName.includes('चावल');
                });
            }
        }

        return filtered;
    }, [dispatchData, selectedOrderNo, selectedTalukaId, selectedCenterId, selectedClassRange, selectedItemCategory]);

    // Group and pivot data for display - separate row for each school
    const pivotedData = useMemo(() => {
        if (!selectedItemCategory) return [];

        const grouped = new Map<string, PivotedRow>();

        tableData.forEach(item => {
            const key = `${item.center_id}-${item.class_range || 'NA'}-${item.school_id}`;
            
            if (!grouped.has(key)) {
                grouped.set(key, {
                    center_id: item.center_id,
                    center_name: item.center_name || '',
                    school_id: item.school_id,
                    schoolname: item.schoolname || '',
                    class_range: item.class_range || '',
                    patsankhya: item.patsankhya || '',
                    pavti_no: item.dispatch_code || '',
                    udaisno: item.udaisno || '',
                    items: {}
                });
            }

            const group = grouped.get(key);
            if (group) {
                // Ensure numeric addition by converting to number
                const currentQty = Number(item.qty_dispatch) || 0;
                group.items[item.item_name] = (Number(group.items[item.item_name]) || 0) + currentQty;
            }
        });

        return Array.from(grouped.values()).sort((a, b) => {
            if (a.center_name !== b.center_name) {
                return a.center_name.localeCompare(b.center_name);
            }
            if (a.class_range !== b.class_range) {
                return (a.class_range || '').localeCompare(b.class_range || '');
            }
            return (a.schoolname || '').localeCompare(b.schoolname || '');
        });
    }, [tableData, selectedItemCategory]);

    // Get unique item names for column headers
    const itemColumns = useMemo(() => {
        if (!selectedItemCategory) return [];

        const items = new Set<string>();
        tableData.forEach(item => {
            items.add(item.item_name);
        });
        return Array.from(items).sort();
    }, [tableData, selectedItemCategory]);

    // Calculate column totals - FIXED to properly sum numbers
    const columnTotals = useMemo(() => {
        const totals: ColumnTotals = {
            patsankhya: 0,
            items: {}
        };

        pivotedData.forEach(row => {
            // Ensure numeric addition for patsankhya
            const patsankhyaNum = Number(row.patsankhya) || 0;
            totals.patsankhya += patsankhyaNum;

            // Ensure numeric addition for each item
            Object.keys(row.items).forEach(itemName => {
                const itemValue = Number(row.items[itemName]) || 0;
                totals.items[itemName] = (Number(totals.items[itemName]) || 0) + itemValue;
            });
        });

        return totals;
    }, [pivotedData]);

    const handleOrderChange = (value: string) => {
        setSelectedOrderNo(value);
    };

    const handleTalukaChange = (value: string) => {
        setSelectedTalukaId(value);
        setSelectedCenterId('');
        setSelectedClassRange('');
        setSelectedItemCategory('');
    };

    const handleCenterChange = (value: string) => {
        setSelectedCenterId(value);
        setSelectedClassRange('');
        setSelectedItemCategory('');
    };

    const handleClassRangeChange = (value: string) => {
        setSelectedClassRange(value);
        setSelectedItemCategory('');
    };

    // Export to Excel function
    const exportToExcel = () => {
        if (pivotedData.length === 0) {
            toast.warning('No data to export');
            return;
        }

        // Prepare data for export
        const exportData: ExportRowData[] = pivotedData.map((row, index) => {
            const rowData: ExportRowData = {
                'Sr No': index + 1,
                'Center Name': row.center_name,
                'Class': row.class_range || '',
                'School Name': row.schoolname,
                'UDAIS No': row.udaisno,
                'Pavti No': row.pavti_no,
                'Patsankhya': row.patsankhya,
            };

            // Add item columns
            itemColumns.forEach(itemName => {
                rowData[itemName] = row.items[itemName] || 0;
            });

            // Add row total
            const rowTotal = Object.values(row.items).reduce((sum: number, value: number) => {
                return sum + (Number(value) || 0);
            }, 0);
            rowData['Total'] = rowTotal.toFixed(3);

            return rowData;
        });

        // Add totals row
        const totalsRow: ExportRowData = {
            'Sr No': '',
            'Center Name': '',
            'Class': '',
            'School Name': '',
            'UDAIS No': '',
            'Pavti No': 'Total',
            'Patsankhya': columnTotals.patsankhya,
        };

        itemColumns.forEach(itemName => {
            totalsRow[itemName] = columnTotals.items[itemName] || 0;
        });

        totalsRow['Total'] = Object.values(columnTotals.items).reduce((sum: number, value: number) => 
            sum + (Number(value) || 0), 0
        );

        exportData.push(totalsRow);

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        const colWidths = [
            { wch: 8 },  // Sr No
            { wch: 25 }, // Center Name
            { wch: 15 }, // Class
            { wch: 30 }, // School Name
            { wch: 15 }, // UDAIS No
            { wch: 15 }, // Pavti No
            { wch: 12 }, // Patsankhya
        ];
        
        // Add width for item columns
        itemColumns.forEach(() => colWidths.push({ wch: 15 }));
        colWidths.push({ wch: 12 }); // Total column
        
        ws['!cols'] = colWidths;

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Billing Register');

        // Generate filename with current date and filters
        const filename = `Billing_Register_${selectedItemCategory}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);
        toast.success('Excel file exported successfully!');
    };

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
       

            <div className="p-7">
                {/* Filter Section with Export Button */}
                <div className="mb-6 flex flex-col gap-4">
                    {/* First row: Filter dropdowns */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                        {/* 1. Select Order Number */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Order Number
                            </label>
                            <select
                                value={selectedOrderNo}
                                onChange={(e) => handleOrderChange(e.target.value)}
                                className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
                            >
                                <option value="">-- Order Number --</option>
                                {orderNumbers.map(orderNo => (
                                    <option key={orderNo} value={orderNo}>
                                        {orderNo}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Select Taluka */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Taluka
                            </label>
                            <select
                                value={selectedTalukaId}
                                onChange={(e) => handleTalukaChange(e.target.value)}
                                className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
                            >
                                <option value="">-- Select Taluka --</option>
                                {filteredTalukas.map(taluka => (
                                    <option key={taluka.taluka_id} value={taluka.taluka_id}>
                                        {taluka.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Select Center */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Center
                            </label>
                            <select
                                value={selectedCenterId}
                                onChange={(e) => handleCenterChange(e.target.value)}
                                disabled={!selectedTalukaId}
                                className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">-- Select Center --</option>
                                <option value="all">All Centers</option>
                                {filteredCenters.map(center => (
                                    <option key={center.center_id} value={center.center_id}>
                                        {center.marathi_name || center.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 4. Select Class */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Class
                            </label>
                            <select
                                value={selectedClassRange}
                                onChange={(e) => handleClassRangeChange(e.target.value)}
                                disabled={!selectedTalukaId}
                                className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">-- Select Class Range --</option>
                                {filteredClassRanges.map(classRange => (
                                    <option key={classRange} value={classRange}>
                                        {classRange}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 5. Select Item */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Item
                            </label>
                            <select
                                value={selectedItemCategory}
                                onChange={(e) => setSelectedItemCategory(e.target.value)}
                                disabled={!selectedClassRange}
                                className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">-- All Items --</option>
                                <option value="kirana">Kirana (किराणा)</option>
                                <option value="rice">Rice (तांदुळ)</option>
                            </select>
                        </div>
                        <div>
                        {selectedItemCategory && pivotedData.length > 0 && (
                        <div className="flex justify-end">
                            <button
                                onClick={exportToExcel}
                                className="inline-flex items-center gap-2 rounded bg-green-500 px-6 py-3 font-medium text-white hover:bg-opacity-90 transition-all mt-6"
                            >
                            
                                Export to Excel
                            </button>
                        </div>
                    )}
                    </div>
                    </div>

                    {/* Second row: Export Button */}
                    
                </div>

                {/* Table Section */}
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                    </div>
                ) : selectedItemCategory ? (
                    <>
                   

                        <div className="overflow-x-auto">
                            <table className="w-full table-auto border-collapse border border-stroke dark:border-strokedark">
                                <thead>
                                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                        <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Sr No</th>
                                        <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Center Name</th>
                                        <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Class</th>
                                        <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">School Name</th>
                                        <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">UDAIS No</th>
                                        <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Pavti No</th>
                                        <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Patsankhya</th>
                                        {itemColumns.map(itemName => (
                                            <th key={itemName} className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">
                                                {itemName}
                                            </th>
                                        ))}
                                        <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pivotedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={8 + itemColumns.length} className="border border-stroke text-center px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                No data found for selected filters
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {pivotedData.map((row, index) => {
                                                // Calculate row-wise total
                                                const rowTotal = Object.values(row.items).reduce((sum: number, value: number) => {
                                                    return sum + (Number(value) || 0);
                                                }, 0);

                                                return (
                                                    <tr key={index} className="border-b border-stroke dark:border-strokedark">
                                                        <td className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                            {index + 1}
                                                        </td>
                                                        <td className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                            {row.center_name}
                                                        </td>
                                                        <td className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                            {row.class_range || ''}
                                                        </td>
                                                        <td className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                            {row.schoolname}
                                                        </td>
                                                        <td className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                            {row.udaisno}
                                                        </td>
                                                        <td className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                            {row.pavti_no}
                                                        </td>
                                                        <td className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                            {row.patsankhya}
                                                        </td>
                                                        {itemColumns.map(itemName => (
                                                            <td key={itemName} className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                                {row.items[itemName] || '0'}
                                                            </td>
                                                        ))}
                                                        <td className="border border-stroke px-4 py-5 font-bold text-black dark:text-white dark:border-strokedark">
                                                            {rowTotal.toFixed(3)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {/* Totals Row */}
                                            <tr className="bg-gray-2 dark:bg-meta-4 font-bold">
                                                <td colSpan={6} className="border border-stroke px-4 py-5 text-center text-black dark:text-white dark:border-strokedark">
                                                    Total
                                                </td>
                                                <td className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                    {columnTotals.patsankhya}
                                                </td>
                                                {itemColumns.map(itemName => (
                                                    <td key={itemName} className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                        {columnTotals.items[itemName] || 0}
                                                    </td>
                                                ))}
                                                <td className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                    {Object.values(columnTotals.items).reduce((sum: number, value: number) => sum + (Number(value) || 0), 0)}
                                                </td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* REMOVE THIS OLD EXPORT BUTTON SECTION */}
                        {/* <div className="mt-4 text-center">
                            <button
                                onClick={() => {}}
                                className="text-orange-600 font-semibold hover:underline"
                            >
                                Export to excel
                            </button>
                        </div> */}
                    </>
                ) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        Please select Item Category (Kirana or Rice) to view the table
                    </div>
                )}
            </div>
        </div>
    );
};

export default Billingregister;