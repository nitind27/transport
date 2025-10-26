"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'react-toastify';

import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { formatDateToDDMMYYYY } from '@/lib/utils';
import Loader from '@/common/Loader';

// Add proper type declarations for flatpickr
declare module 'flatpickr' {
    interface Instance {
        destroy(): void;
        clear(): void;
        setDate(date: string | Date | string[] | Date[], triggerChange?: boolean, jumpToDate?: boolean): void;
    }

    interface BaseOptions {
        dateFormat?: string;
        defaultDate?: Date | string | number | Date[] | string[] | number[];
        onChange?: (selectedDates: Date[], dateStr: string, instance: Instance) => void;
        static?: boolean;
        monthSelectorType?: "static" | "dropdown";
        enableTime?: boolean;
        allowInput?: boolean;
        clickOpens?: boolean;
        mode?: "single" | "range";
        locale?: {
            firstDayOfWeek?: number;
        };
    }
}



type DispatchListRow = {
    id: number;
    dispatch_code: string;
    order_id: number;
    school_id: number;
    center_id: number;
    truck_id: number;
    item_name: string;
    unit: string;
    total_qty: number;
    qty_dispatch: number;
    new_qty_dispatch: number;
    bal_qty: number;
    dispatch_return: number;
    status: string;
    created_at: string;
    order_no?: string;
    schoolname?: string;
    center_name?: string;
    truckNo?: string;
    class_range?: string;
    taluka?: string;
    period?: string;
    no_of_days?: number;
    financial_year?: string;
    udaisno?: string;
    patsankhya?: string;
};

const Salesview = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [dispatchList, setDispatchList] = useState<DispatchListRow[]>([]);
    const [filteredDispatchList, setFilteredDispatchList] = useState<DispatchListRow[]>([]);

    // Date range filter state
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    
    const fromDatePickerRef = useRef<HTMLInputElement>(null);
    const toDatePickerRef = useRef<HTMLInputElement>(null);
    const flatpickrFromInstanceRef = useRef<flatpickr.Instance | null>(null);
    const flatpickrToInstanceRef = useRef<flatpickr.Instance | null>(null);

    // Initialize Flatpickr for date range pickers
    useEffect(() => {
        if (fromDatePickerRef.current && !flatpickrFromInstanceRef.current) {
            const flatPickr = flatpickr(fromDatePickerRef.current, {
                dateFormat: "Y-m-d",
                defaultDate: fromDate ? new Date(fromDate) : undefined,
                onChange: function (selectedDates, dateStr) {
                    setFromDate(dateStr);
                },
                static: true,
                monthSelectorType: "static",
                enableTime: false,
                allowInput: true,
                clickOpens: true,
                locale: {
                    firstDayOfWeek: 1
                }
            });
            flatpickrFromInstanceRef.current = flatPickr;
        }

        if (toDatePickerRef.current && !flatpickrToInstanceRef.current) {
            const flatPickr = flatpickr(toDatePickerRef.current, {
                dateFormat: "Y-m-d",
                defaultDate: toDate ? new Date(toDate) : undefined,
                onChange: function (selectedDates, dateStr) {
                    setToDate(dateStr);
                },
                static: true,
                monthSelectorType: "static",
                enableTime: false,
                allowInput: true,
                clickOpens: true,
                locale: {
                    firstDayOfWeek: 1
                }
            });
            flatpickrToInstanceRef.current = flatPickr;
        }

        return () => {
            if (flatpickrFromInstanceRef.current) {
                flatpickrFromInstanceRef.current.destroy();
                flatpickrFromInstanceRef.current = null;
            }
            if (flatpickrToInstanceRef.current) {
                flatpickrToInstanceRef.current.destroy();
                flatpickrToInstanceRef.current = null;
            }
        };
    }, []);

    // Filter dispatch list based on date range
    useEffect(() => {
        let filtered = [...dispatchList];

        if (fromDate && fromDate.trim() !== '') {
            const fromDateObj = new Date(fromDate);
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.created_at);
                return itemDate >= fromDateObj;
            });
        }

        if (toDate && toDate.trim() !== '') {
            const toDateObj = new Date(toDate);
            toDateObj.setHours(23, 59, 59, 999);
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.created_at);
                return itemDate <= toDateObj;
            });
        }

        setFilteredDispatchList(filtered);
    }, [dispatchList, fromDate, toDate]);

    // const fetchItemMaster = async () => {
    //     try {
    //         await fetch('/api/itemgrains');
    //     } catch { }
    // };

    const fetchDispatchList = async () => {
        try {
            const res = await fetch('/api/dispatchdetails');
            if (res.ok) setDispatchList(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    // fetchItemMaster(),
                    fetchDispatchList(),
                ]);
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load data. Please refresh the page.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // Get ALL unique item names from the complete dispatch list
    const allItemNames = useMemo(() => {
        const allItems = new Set<string>();
        dispatchList.forEach(row => {
            if (row.item_name) {
                allItems.add(row.item_name);
            }
        });
        return Array.from(allItems).sort();
    }, [dispatchList]);

    // Get unique dispatch codes that have returns
    const dispatchCodesWithReturns = useMemo(() => {
        const codes = new Set<string>();
        filteredDispatchList.forEach(item => {
            if (item.dispatch_return && item.dispatch_return > 0) {
                codes.add(item.dispatch_code);
            }
        });
        return Array.from(codes);
    }, [filteredDispatchList]);

    // Group by dispatch code and get all items for each dispatch
    const groupedReturns = useMemo(() => {
        return dispatchCodesWithReturns.map(dispatchCode => {
            // Get ALL items for this dispatch
            const allItemsForDispatch = filteredDispatchList.filter(d => d.dispatch_code === dispatchCode);
            
            const firstItem = allItemsForDispatch[0];
            
            // Calculate total weight - sum of all item values
            let totalWeight = 0;
            const items = new Map<string, { value: number; hasReturn: boolean }>();
            
            allItemsForDispatch.forEach(item => {
                // If item has return, show return value, otherwise show dispatch value
                const value = item.dispatch_return > 0 ? item.dispatch_return : item.qty_dispatch;
                totalWeight += Number(value) || 0; // Ensure it's a number
                items.set(item.item_name, {
                    value: value,
                    hasReturn: item.dispatch_return > 0
                });
            });

            return {
                dispatch_code: dispatchCode,
                date: firstItem.created_at,
                schoolname: firstItem.schoolname,
                center_name: firstItem.center_name,
                truckNo: firstItem.truckNo,
                class_range: firstItem.class_range,
                udaisno: firstItem.udaisno,
                patsankhya: firstItem.patsankhya,
                total_weight: totalWeight, // This is the sum of all items
                items: items,
            };
        });
    }, [filteredDispatchList, dispatchCodesWithReturns]);

    const toolbar = (
        <div className="flex gap-4 items-end mb-4">
            <div className="flex flex-col">
                <span className="text-xs text-gray-600 mb-1 text-left">From Date</span>
                <div className="relative">
                    <input
                        ref={fromDatePickerRef}
                        type="text"
                        placeholder="From Date"
                        className="h-10 rounded-md border px-3 pr-8 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setFromDate('');
                            if (flatpickrFromInstanceRef.current) {
                                flatpickrFromInstanceRef.current.clear();
                            }
                        }}
                        className="absolute inset-y-0 right-0 flex items-center pr-2 text-red-500 hover:text-red-700"
                        title="Clear From Date"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex flex-col">
                <span className="text-xs text-gray-600 mb-1 text-left">End Date</span>
                <div className="relative">
                    <input
                        ref={toDatePickerRef}
                        type="text"
                        placeholder="End Date"
                        className="h-10 rounded-md border px-3 pr-8 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setToDate('');
                            if (flatpickrToInstanceRef.current) {
                                flatpickrToInstanceRef.current.clear();
                            }
                        }}
                        className="absolute inset-y-0 right-0 flex items-center pr-2 text-red-500 hover:text-red-700"
                        title="Clear End Date"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <button
                type="button"
                className="h-10 px-6 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                onClick={async () => {
                    if (!fromDate || !toDate) {
                        toast.error('Please select both From Date and End Date');
                        return;
                    }
                    if (new Date(fromDate) > new Date(toDate)) {
                        toast.error('From Date cannot be greater than End Date');
                        return;
                    }
                }}
            >
                Search
            </button>
        </div>
    );

    return (
        <div className="">
            {isLoading && <Loader />}

            <div className="bg-white rounded-2xl shadow-md border p-4">
                <div className="mb-4">{toolbar}</div>

                {groupedReturns.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {fromDate && toDate ? `No returns found between ${formatDateToDDMMYYYY(fromDate)} and ${formatDateToDDMMYYYY(toDate)}` : 'Select From Date and End Date to view sales return details'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                      
                        <table className="min-w-full border border-gray-200 dark:border-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Sr No</th>
                                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">PAVTI NO</th>
                                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Date</th>
                                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">School</th>
                                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Center</th>
                                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Truck</th>
                                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Class</th>
                                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">पट संख्या</th>
                                    <th colSpan={allItemNames.length} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Item Details</th>
                                    <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">एकूण वजन</th>
                                </tr>
                                <tr>
                                    {allItemNames.map(item => (
                                        <th key={item} className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase border">
                                            {item}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {groupedReturns.map((group, index) => (
                                    <tr key={group.dispatch_code}>
                                        <td className="px-4 py-3 border text-center">{index + 1}</td>
                                        <td className="px-4 py-3 border">{group.dispatch_code}</td>
                                        <td className="px-4 py-3 border">{formatDateToDDMMYYYY(group.date)}</td>
                                        <td className="px-4 py-3 border">{group.schoolname}</td>
                                        <td className="px-4 py-3 border">{group.center_name}</td>
                                        <td className="px-4 py-3 border">{group.truckNo}</td>
                                        <td className="px-4 py-3 border">{group.class_range || '-'}</td>
                                        <td className="px-4 py-3 border text-center">{group.patsankhya || '-'}</td>
                                        {allItemNames.map(item => {
                                            const itemData = group.items.get(item);
                                            return (
                                                <td key={item} className="px-2 py-3 border text-center">
                                                    {itemData ? (
                                                        <span className={itemData.hasReturn ? "text-red-600 font-semibold" : "text-blue-600"}>
                                                            {itemData.value}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 border text-center font-semibold text-green-600">
                                            {parseFloat(group.total_weight.toString()).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Salesview;