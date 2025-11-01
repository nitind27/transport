"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

// Types
interface RoutePaperDetail {
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
    truck_id: number;
    truckNo?: string;
    ownerId?: number;
    ownerName?: string;
    item_name: string;
    unit: string;
    qty_dispatch: number;
    patsankhya?: string;
    udaisno?: string;
    class_range?: string;
    created_at: string;
    route_number?: string;
}

interface Owner {
    id: number;
    name: string;
    status?: string;
}

interface Truck {
    id: number;
    truckNo: string;
    ownerId: number;
    ownerName?: string;
    status: string;
}

interface PivotedRow {
    center_id: number;
    center_name: string;
    school_id: number;
    schoolname: string;
    class_range: string;
    patsankhya: string;
    pavti_no: string;
    udaisno: string;
    taluka_name: string;
    date: string;
    items: Record<string, number>;
}

interface ColumnTotals {
    patsankhya: number;
    items: Record<string, number>;
}

interface ExportRowData {
    'Sr No': number | string;
    'Date': string;
    'Taluka': string;
    'Center Name': string;
    'Class': string;
    'Name of school': string;
    'UDIAS Number': string;
    'Pavti Number': string;
    'पट संख्या': string | number;
    [key: string]: string | number;
}

const Transportationdetials = () => {
    // Temporary filter states (for UI - not applied until search is clicked)
    const [tempSelectedOrderNo, setTempSelectedOrderNo] = useState<string>('');
    const [tempSelectedTruckOwnerId, setTempSelectedTruckOwnerId] = useState<string>('');
    const [tempSelectedTruckId, setTempSelectedTruckId] = useState<string>('');
    const [tempSelectedItemCategory, setTempSelectedItemCategory] = useState<string>('all');
    
    // Active filter states (applied to data filtering)
    const [selectedOrderNo, setSelectedOrderNo] = useState<string>('');
    const [selectedTruckOwnerId, setSelectedTruckOwnerId] = useState<string>('');
    const [selectedTruckId, setSelectedTruckId] = useState<string>('');
    const [selectedItemCategory, setSelectedItemCategory] = useState<string>('all');

    // Data states
    const [routePaperData, setRoutePaperData] = useState<RoutePaperDetail[]>([]);
    const [ownerList, setOwnerList] = useState<Owner[]>([]);
    const [truckList, setTruckList] = useState<Truck[]>([]);
    const [orderNumbersList, setOrderNumbersList] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch all required data on component mount
    useEffect(() => {
        fetchRoutePaperDetails();
        fetchOwners();
        fetchTrucks();
        fetchOrderNumbers();
    }, []);

    const fetchRoutePaperDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/transportationdetails');
            if (res.ok) {
                const data = await res.json();
                console.log('Route paper data fetched:', data?.length || 0);
                setRoutePaperData(data || []);
                if (!data || data.length === 0) {
                    console.warn('No route paper data found');
                    toast.info('No route paper data available');
                }
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error('Failed to fetch route paper details:', errorData);
                toast.error('Failed to fetch route paper details');
                setRoutePaperData([]);
            }
        } catch (error) {
            console.error('Error fetching route paper details:', error);
            toast.error('Error loading data');
            setRoutePaperData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchOwners = async () => {
        try {
            const res = await fetch('/api/ownerdata');
            if (res.ok) {
                const data = await res.json();
                console.log('Owners fetched:', data?.length || 0);
                setOwnerList(data || []);
            } else {
                console.error('Failed to fetch owners');
                toast.error('Failed to load truck owners');
                setOwnerList([]);
            }
        } catch (error) {
            console.error('Error fetching owners:', error);
            toast.error('Error loading truck owners');
            setOwnerList([]);
        }
    };

    const fetchTrucks = async () => {
        try {
            const res = await fetch('/api/truckdata');
            if (res.ok) {
                const data = await res.json();
                console.log('Trucks fetched:', data?.length || 0);
                setTruckList(data || []);
            } else {
                console.error('Failed to fetch trucks');
                toast.error('Failed to load trucks');
                setTruckList([]);
            }
        } catch (error) {
            console.error('Error fetching trucks:', error);
            toast.error('Error loading trucks');
            setTruckList([]);
        }
    };

    const fetchOrderNumbers = async () => {
        try {
            const res = await fetch('/api/zporderdetails');
            if (res.ok) {
                const data = await res.json();
                console.log('ZP Order Details fetched:', data?.length || 0);
                
                // Extract unique order numbers from zp_order_details
                const orders = new Set<string>();
                if (Array.isArray(data)) {
                    data.forEach((item) => {
                        if (item.order_no && String(item.order_no).trim() !== '' && item.status === 'Active') {
                            orders.add(String(item.order_no).trim());
                        }
                    });
                }
                const uniqueOrders = Array.from(orders).sort();
                console.log('Unique order numbers found:', uniqueOrders.length);
                setOrderNumbersList(uniqueOrders);
            } else {
                console.error('Failed to fetch order numbers');
                toast.error('Failed to load order numbers');
                setOrderNumbersList([]);
            }
        } catch (error) {
            console.error('Error fetching order numbers:', error);
            toast.error('Error loading order numbers');
            setOrderNumbersList([]);
        }
    };

    // 1. Order numbers are now fetched directly from zp_order_details API
    const orderNumbers = useMemo(() => {
        return orderNumbersList;
    }, [orderNumbersList]);

    // Get truck owners - show all owners, but filter route paper data by selected owner
    const availableOwners = useMemo(() => {
        // Show all owners from the database
        return ownerList;
    }, [ownerList]);

    // 2. Filter trucks by selected owner (use temp state for dropdown)
    const filteredTrucks = useMemo(() => {
        if (!tempSelectedTruckOwnerId) {
            // If no owner selected, return all trucks
            return truckList;
        }
        
        // Return trucks of selected owner
        return truckList.filter(truck => 
            String(truck.ownerId) === String(tempSelectedTruckOwnerId)
        );
    }, [tempSelectedTruckOwnerId, truckList]);

    // 3. Filter data for table display
    const tableData = useMemo(() => {
        // Check if any filter is applied (excluding default 'all' for item category)
        const hasFilterApplied = selectedOrderNo || selectedTruckOwnerId || (selectedTruckId && selectedTruckId !== 'all');
        
        // If no filter is applied, return empty array
        if (!hasFilterApplied) {
            return [];
        }

        let filtered = routePaperData;

        if (selectedOrderNo) {
            filtered = filtered.filter(item => item.order_no === selectedOrderNo);
        }

        if (selectedTruckOwnerId) {
            // Filter by truck owner - get all truck IDs for this owner
            const ownerTruckIds = truckList
                .filter(truck => String(truck.ownerId) === String(selectedTruckOwnerId))
                .map(truck => truck.id);
            
            if (ownerTruckIds.length > 0) {
                filtered = filtered.filter(item => ownerTruckIds.includes(item.truck_id));
            } else {
                // If no trucks found for owner, return empty array
                filtered = [];
            }
        }

        if (selectedTruckId && selectedTruckId !== 'all') {
            filtered = filtered.filter(item => item.truck_id === Number(selectedTruckId));
        }

        if (selectedItemCategory && selectedItemCategory !== 'all') {
            if (selectedItemCategory === 'rice') {
                filtered = filtered.filter(item => {
                    const itemName = item.item_name.toLowerCase();
                    return itemName.includes('rice') ||
                        itemName.includes('तांदुळ') ||
                        itemName.includes('चावल') ||
                        itemName.includes('तांदूळ');
                });
            } else if (selectedItemCategory === 'kirana') {
                filtered = filtered.filter(item => {
                    const itemName = item.item_name.toLowerCase();
                    return !itemName.includes('rice') &&
                        !itemName.includes('तांदुळ') &&
                        !itemName.includes('चावल') &&
                        !itemName.includes('तांदूळ');
                });
            }
        }

        return filtered;
    }, [routePaperData, selectedOrderNo, selectedTruckOwnerId, selectedTruckId, selectedItemCategory, truckList]);

    // Group and pivot data for display - separate row for each taluka (6 talukas from database)
    const pivotedData = useMemo(() => {
        const grouped = new Map<string, PivotedRow>();

        tableData.forEach(item => {
            // Remove taluka from grouping key - same school/center/class can appear in multiple talukas, but we'll group by taluka for display
            const key = `${item.center_id}-${item.class_range || 'NA'}-${item.school_id}-${item.dispatch_code}-${item.taluka_id || item.taluka_name || 'NA'}`;
            
            if (!grouped.has(key)) {
                const dateStr = item.created_at 
                    ? new Date(item.created_at).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                    })
                    : '';
                
                grouped.set(key, {
                    center_id: item.center_id,
                    center_name: item.center_name || '',
                    school_id: item.school_id,
                    schoolname: item.schoolname || '',
                    class_range: item.class_range || '',
                    patsankhya: item.patsankhya || '',
                    pavti_no: item.dispatch_code || '',
                    udaisno: item.udaisno || '',
                    taluka_name: item.taluka_name || '',
                    date: dateStr,
                    items: {}
                });
            }

            const group = grouped.get(key);
            if (group) {
                // Add item quantities - filter will change only item values
                const currentQty = Number(item.qty_dispatch) || 0;
                group.items[item.item_name] = (Number(group.items[item.item_name]) || 0) + currentQty;
            }
        });

        return Array.from(grouped.values()).sort((a, b) => {
            if (a.taluka_name !== b.taluka_name) {
                return a.taluka_name.localeCompare(b.taluka_name);
            }
            if (a.center_name !== b.center_name) {
                return a.center_name.localeCompare(b.center_name);
            }
            if (a.class_range !== b.class_range) {
                return (a.class_range || '').localeCompare(b.class_range || '');
            }
            return (a.schoolname || '').localeCompare(b.schoolname || '');
        });
    }, [tableData]);

    // Calculate taluka rowspans for grouped display
    const talukaRowSpans = useMemo(() => {
        const rowSpans = new Map<number, number>();
        const firstRowIndex = new Map<string, number>();
        
        pivotedData.forEach((row, index) => {
            const talukaKey = row.taluka_name;
            
            if (!firstRowIndex.has(talukaKey)) {
                firstRowIndex.set(talukaKey, index);
                rowSpans.set(index, 1);
            } else {
                const firstIndex = firstRowIndex.get(talukaKey)!;
                const currentSpan = rowSpans.get(firstIndex) || 1;
                rowSpans.set(firstIndex, currentSpan + 1);
            }
        });
        
        return rowSpans;
    }, [pivotedData]);

    // Get unique item names for column headers
    const itemColumns = useMemo(() => {
        const items = new Set<string>();
        tableData.forEach(item => {
            items.add(item.item_name);
        });
        return Array.from(items).sort();
    }, [tableData]);

    // Calculate column totals - Total excluding पट संख्या
    const columnTotals = useMemo(() => {
        const totals: ColumnTotals = {
            patsankhya: 0,
            items: {}
        };

        pivotedData.forEach(row => {
            const patsankhyaNum = Number(row.patsankhya) || 0;
            totals.patsankhya += patsankhyaNum;

            Object.keys(row.items).forEach(itemName => {
                const itemValue = Number(row.items[itemName]) || 0;
                totals.items[itemName] = (Number(totals.items[itemName]) || 0) + itemValue;
            });
        });

        return totals;
    }, [pivotedData]);

    const handleOrderChange = (value: string) => {
        setTempSelectedOrderNo(value);
    };

    const handleTruckOwnerChange = (value: string) => {
        setTempSelectedTruckOwnerId(value);
        setTempSelectedTruckId(''); // Reset truck selection when owner changes
    };

    const handleTruckChange = (value: string) => {
        setTempSelectedTruckId(value);
    };

    // Search handler - applies temporary filters to active filters
    const handleSearch = () => {
        setSelectedOrderNo(tempSelectedOrderNo);
        setSelectedTruckOwnerId(tempSelectedTruckOwnerId);
        setSelectedTruckId(tempSelectedTruckId);
        setSelectedItemCategory(tempSelectedItemCategory);
    };

    // Export to Excel function
    const exportToExcel = () => {
        if (pivotedData.length === 0) {
            toast.warning('No data to export');
            return;
        }

        const exportData: ExportRowData[] = pivotedData.map((row, index) => {
            const rowData: ExportRowData = {
                'Sr No': index + 1,
                'Date': row.date,
                'Taluka': row.taluka_name,
                'Center Name': row.center_name,
                'Class': row.class_range || '',
                'Name of school': row.schoolname,
                'UDIAS Number': row.udaisno,
                'Pavti Number': row.pavti_no,
                'पट संख्या': row.patsankhya,
            };

            itemColumns.forEach(itemName => {
                rowData[itemName] = row.items[itemName] || 0;
            });

            const rowTotal = Object.values(row.items).reduce((sum: number, value: number) => {
                return sum + (Number(value) || 0);
            }, 0);
            rowData['Total'] = rowTotal.toFixed(3);

            return rowData;
        });

        const totalsRow: ExportRowData = {
            'Sr No': '',
            'Date': '',
            'Taluka': '',
            'Center Name': '',
            'Class': '',
            'Name of school': '',
            'UDIAS Number': '',
            'Pavti Number': 'Total',
            'पट संख्या': columnTotals.patsankhya,
        };

        itemColumns.forEach(itemName => {
            totalsRow[itemName] = columnTotals.items[itemName] || 0;
        });

        const totalExcludingPatsankhya = Object.values(columnTotals.items).reduce((sum: number, value: number) => 
            sum + (Number(value) || 0), 0
        );
        totalsRow['Total'] = totalExcludingPatsankhya;

        exportData.push(totalsRow);

        const ws = XLSX.utils.json_to_sheet(exportData);
        const colWidths = [
            { wch: 8 },  // Sr No
            { wch: 12 }, // Date
            { wch: 15 }, // Taluka
            { wch: 25 }, // Center Name
            { wch: 15 }, // Class
            { wch: 30 }, // School Name
            { wch: 15 }, // UDIAS No
            { wch: 15 }, // Pavti No
            { wch: 12 }, // पट संख्या
        ];
        
        itemColumns.forEach(() => colWidths.push({ wch: 15 }));
        colWidths.push({ wch: 12 });
        
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transportation Details');

        const filename = `Transportation_Details_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, filename);
        toast.success('Excel file exported successfully!');
    };

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="p-7">
                {/* Note */}
                <div className="mb-4">
                
                  
                </div>

                {/* Filter Section */}
                <div className="mb-6 flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                        {/* 1. Select Order Number */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                 Select Order Number
                            </label>
                            <select
                                value={tempSelectedOrderNo}
                                onChange={(e) => handleOrderChange(e.target.value)}
                                className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
                            >
                                <option value="">-- Order Number --</option>
                                {orderNumbers.length > 0 ? (
                                    orderNumbers.map(orderNo => (
                                        <option key={orderNo} value={orderNo}>
                                            {orderNo}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No order numbers available</option>
                                )}
                            </select>
                        </div>

                        {/* 2. Select Truck Owner */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                 Select Truck Owner
                            </label>
                            <select
                                value={tempSelectedTruckOwnerId}
                                onChange={(e) => handleTruckOwnerChange(e.target.value)}
                                className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
                            >
                                <option value="">-- Select Truck Owner --</option>
                                {availableOwners.length > 0 ? (
                                    availableOwners.map(owner => (
                                        <option key={owner.id} value={owner.id}>
                                            {owner.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No truck owners available</option>
                                )}
                            </select>
                        </div>

                        {/* 3. Select Truck Number */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Select Truck Number
                            </label>
                            <select
                                value={tempSelectedTruckId}
                                onChange={(e) => handleTruckChange(e.target.value)}
                                disabled={!tempSelectedTruckOwnerId}
                                className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">-- Select Truck Number --</option>
                                {tempSelectedTruckOwnerId && (
                                    <>
                                        <option value="all">All Trucks of Selected Owner</option>
                                        {filteredTrucks.length > 0 ? (
                                            filteredTrucks.map(truck => (
                                                <option key={truck.id} value={truck.id}>
                                                    {truck.truckNo}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No trucks found</option>
                                        )}
                                    </>
                                )}
                            </select>
                        </div>

                        {/* 4. Select Item */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                 Select Item
                            </label>
                            <select
                                value={tempSelectedItemCategory}
                                onChange={(e) => setTempSelectedItemCategory(e.target.value)}
                                className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
                            >
                                <option value="all">All Items (Kirana and Rice)</option>
                                <option value="kirana">Kirana (किराणा)</option>
                                <option value="rice">Rice (तांदुळ)</option>
                            </select>
                        </div>

                        {/* 5. Search Button */}
                        <div className="flex items-end">
                            <button
                                onClick={handleSearch}
                                className="w-full inline-flex items-center justify-center gap-2 rounded bg-brand-500 px-6 py-3 font-medium text-white hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg"
                            >
                              
                                Search
                            </button>
                        </div>
                    </div>

                

                    {pivotedData.length > 0 && (
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={exportToExcel}
                                className="inline-flex items-center gap-2 rounded bg-green-500 px-6 py-3 font-medium text-white hover:bg-opacity-90 transition-all"
                            >
                                Export to Excel
                            </button>
                        </div>
                    )}
                </div>

                {/* Table Section */}
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                    </div>
                ) : pivotedData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto border-collapse border border-stroke dark:border-strokedark">
                            <thead>
                                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                    <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Sr No</th>
                                    <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Date</th>
                                    <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Taluka</th>
                                    <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Center Name</th>
                                    <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Class</th>
                                    <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Name of school</th>
                                    <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">UDIAS Number</th>
                                    <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">Pavti Number</th>
                                    <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">पट संख्या</th>
                                    {itemColumns.map(itemName => (
                                        <th key={itemName} className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">
                                            {itemName}
                                        </th>
                                    ))}
                                    <th className="border border-stroke px-4 py-4 font-medium text-black dark:text-white dark:border-strokedark">
                                        Total
                                        <span className="block text-xs text-green-600 mt-1">
                                            (Note: Total excluding पट संख्या)
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pivotedData.map((row, index) => {
                                    const rowTotal = Object.values(row.items).reduce((sum: number, value: number) => {
                                        return sum + (Number(value) || 0);
                                    }, 0);

                                    // Check if this is the first row of a taluka group
                                    const talukaRowSpan = talukaRowSpans.get(index);
                                    const isFirstRowOfTaluka = talukaRowSpan !== undefined;

                                    return (
                                        <tr key={index} className="border-b border-stroke dark:border-strokedark">
                                            <td className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                {index + 1}
                                            </td>
                                            <td className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark">
                                                {row.date}
                                            </td>
                                            {isFirstRowOfTaluka ? (
                                                <td 
                                                    rowSpan={talukaRowSpan} 
                                                    className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark align-top"
                                                >
                                                    {row.taluka_name}
                                                </td>
                                            ) : null}
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
                                    <td colSpan={8} className="border border-stroke px-4 py-5 text-center text-black dark:text-white dark:border-strokedark">
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
                                    <td className="border border-stroke px-4 py-5 text-black dark:text-white dark:border-strokedark bg-green-100 dark:bg-green-900">
                                        {Object.values(columnTotals.items).reduce((sum: number, value: number) => 
                                            sum + (Number(value) || 0), 0
                                        ).toFixed(3)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        No data found. Please select filters to view transportation details.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Transportationdetials;
