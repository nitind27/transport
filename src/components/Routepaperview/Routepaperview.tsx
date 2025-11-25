"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
// import { TrashBinIcon } from '@/icons';
import { Filterroutepaper } from '../tables/Filterroutepaper';
import { formatDate, formatDateToDDMMYYYY } from '@/lib/utils';
import Loader from '@/common/Loader';

// Add proper type declarations for flatpickr
declare module 'flatpickr' {
    interface Instance {
        destroy(): void;
        clear(): void;
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
        locale?: {
            firstDayOfWeek?: number;
        };
    }
}
// add near DispatchListRow
type RouteGroupRow = {
    route_number: string;
    dispatch_code: string;
    order_no?: string;
    taluka?: string;
    center_name?: string;
    truckNo?: string;
    class_range?: string;
    created_at: string;
    school_count: number;
    total_items: number;
    total_weight?: number; // Add this field
};
// interface CenterRow {
//     center_id: number;
//     name: string;
//     marathi_name?: string;
//     status?: string;
//     taluka_id?: number;
// }

interface TalukaRow {
    taluka_id: number;
    name: string;
    name_en?: string;
    dist_id?: number;
    status?: string;
}

interface SchoolDataRow {
    schoolid: number;
    center: number;
    taluka_id: number;
    schoolname: string;
    udaisno: string;
}

type SchoolDataApiRow = {
    schoolid: number | string;
    center: number | string | null;
    taluka_id: number | string | null;
    schoolname?: string | null;
    udaisno?: string | null;
};

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
    new_qty_dispatch: number;
    bal_qty: number;
    qty_dispatch: number;
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
    taluka_name?: string;
    patsankhya?: string;
    group_id?: number | null;
    route_number?: string;
};

const Routepaperview = () => {
    const [isLoading, setIsLoading] = useState(false);

    const [fromDate, setFromDate] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    const [endDate, setEndDate] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    const fromDatePickerRef = useRef<HTMLInputElement>(null);
    const endDatePickerRef = useRef<HTMLInputElement>(null);
    const flatpickrFromInstanceRef = useRef<flatpickr.Instance | null>(null);
    const flatpickrEndInstanceRef = useRef<flatpickr.Instance | null>(null);

    // Masters
    const [talukaList, setTalukaList] = useState<TalukaRow[]>([]);
    // const [centerList, setCenterList] = useState<CenterRow[]>([]);
    const [schoolDataById, setSchoolDataById] = useState<Map<number, SchoolDataRow>>(new Map());
    const [dispatchList, setDispatchList] = useState<DispatchListRow[]>([]);
    const [filteredDispatchList, setFilteredDispatchList] = useState<DispatchListRow[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(50);
    const [companyName, setCompanyName] = useState<string>('Mid Day Meal Scheme'); // Default fallback
    
    // Truck data for driver information
    interface TruckRow {
        id: number;
        truckNo: string;
        driverName?: string;
        driverMobile?: string;
    }
    const [truckList, setTruckList] = useState<TruckRow[]>([]);

    // Initialize Flatpickr for From Date picker
    useEffect(() => {
        if (fromDatePickerRef.current) {
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

            return () => {
                flatPickr.destroy();
                flatpickrFromInstanceRef.current = null;
            };
        }
    }, []);

    // Initialize Flatpickr for End Date picker
    useEffect(() => {
        if (endDatePickerRef.current) {
            const flatPickr = flatpickr(endDatePickerRef.current, {
                dateFormat: "Y-m-d",
                defaultDate: endDate ? new Date(endDate) : undefined,
                onChange: function (selectedDates, dateStr) {
                    setEndDate(dateStr);
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

            flatpickrEndInstanceRef.current = flatPickr;

            return () => {
                flatPickr.destroy();
                flatpickrEndInstanceRef.current = null;
            };
        }
    }, []);

    // If API handles filtering, you can just use dispatchList directly
    // Or keep filteredDispatchList but remove date filtering since API does it
    useEffect(() => {
        // If you still want client-side filtering for other criteria, keep this
        // but remove the date filtering part since API handles it
        setFilteredDispatchList(dispatchList);
    }, [dispatchList]);

    // Fetch data functions
    // const fetchCenters = async () => {
    //     try {
    //         const res = await fetch('/api/centerapi');
    //         setCenterList(await res.json());
    //     } catch {
    //         toast.error('Failed to load centers');
    //     }
    // };

    const fetchTalukas = async () => {
        try {
            // Get user_id, company_id, and category_id from sessionStorage
            const userId = sessionStorage.getItem('userid');
            const companyId = sessionStorage.getItem('company_id');
            const categoryId = sessionStorage.getItem('category_id');

            const params = new URLSearchParams();
            // Only add if exists and not empty string
            if (userId && userId.trim() !== '') params.append('user_id', userId.trim());
            if (companyId && companyId.trim() !== '') params.append('company_id', companyId.trim());
            if (categoryId && categoryId.trim() !== '') params.append('category_id', categoryId.trim());

            const res = await fetch(`/api/taluka${params.toString() ? '?' + params.toString() : ''}`);
            if (res.ok) setTalukaList(await res.json());
        } catch {
            toast.error('Failed to load taluka');
        }
    };

    const fetchTrucks = async () => {
        try {
            // Get user_id, company_id, and category_id from sessionStorage
            const userId = sessionStorage.getItem('userid');
            const companyId = sessionStorage.getItem('company_id');
            const categoryId = sessionStorage.getItem('category_id');

            const params = new URLSearchParams();
            // Only add if exists and not empty string
            if (userId && userId.trim() !== '') params.append('user_id', userId.trim());
            if (companyId && companyId.trim() !== '') params.append('company_id', companyId.trim());
            if (categoryId && categoryId.trim() !== '') params.append('category_id', categoryId.trim());

            const res = await fetch(`/api/truckdata${params.toString() ? '?' + params.toString() : ''}`);
            if (res.ok) {
                const trucks = await res.json();
                setTruckList(trucks);
            }
        } catch {
            toast.error('Failed to load trucks');
        }
    };
    // Delete handler function
    // const handleDeleteRoute = async (routeNumber: string) => {
    //     if (!confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
    //         return;
    //     }

    //     try {
    //         // Get all dispatch codes for this route
    //         const routeData = getDataByRouteNumber(routeNumber);
    //         const dispatchCodes = [...new Set(routeData.map(item => item.dispatch_code))];

    //         // Delete each dispatch code
    //         for (const dispatchCode of dispatchCodes) {
    //             const response = await fetch(`/api/routeview`, {
    //                 method: 'DELETE',
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                 },
    //                 body: JSON.stringify({ dispatch_code: dispatchCode }),
    //             });

    //             if (!response.ok) {
    //                 const errorData = await response.json();
    //                 throw new Error(errorData.message || 'Failed to delete dispatch');
    //             }
    //         }

    //         // Remove deleted items from local state
    //         setDispatchList(prev => prev.filter(item => item.route_number !== routeNumber));
    //         setFilteredDispatchList(prev => prev.filter(item => item.route_number !== routeNumber));

    //         toast.success('Route deleted successfully!');
    //     } catch (error) {
    //         console.error('Error deleting route:', error);
    //         toast.error('Failed to delete route');
    //     }
    // };
    const fetchDispatchList = useCallback(async (opts?: { page?: number; limit?: number }) => {
        try {
            setIsLoading(true);
            const effectivePage = opts?.page ?? currentPage;
            const effectiveLimit = opts?.limit ?? perPage;

            // Get user_id, company_id, and category_id from sessionStorage
            const userId = sessionStorage.getItem('userid');
            const companyId = sessionStorage.getItem('company_id');
            const categoryId = sessionStorage.getItem('category_id');

            console.log('Fetching dispatch list with filters - fromDate:', fromDate, 'endDate:', endDate, 'page:', effectivePage, 'limit:', effectiveLimit, 'user_id:', userId, 'company_id:', companyId, 'category_id:', categoryId);

            // Build query parameters with date filters and user/company/category filters
            const params = new URLSearchParams();
            if (fromDate && fromDate.trim() !== '') {
                params.append('fromDate', fromDate.trim());
            }
            if (endDate && endDate.trim() !== '') {
                params.append('endDate', endDate.trim());
            }
            // Only add if exists and not empty string
            if (userId && userId.trim() !== '') params.append('user_id', userId.trim());
            if (companyId && companyId.trim() !== '') params.append('company_id', companyId.trim());
            if (categoryId && categoryId.trim() !== '') params.append('category_id', categoryId.trim());
            params.append('page', String(effectivePage));
            params.append('limit', String(effectiveLimit));

            const queryString = params.toString();
            const url = `/api/routeview/pagination?${queryString}`;

            console.log('Fetching from URL:', url);
            const res = await fetch(url);
            console.log('API Response status:', res.status, res.statusText);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('API Error:', res.status, errorText);
                toast.error(`Failed to load data: ${res.status} ${res.statusText}`);
                setIsLoading(false);
                return;
            }

            const payload = await res.json();
            const data = Array.isArray(payload) ? payload : payload.rows;
            const total = Array.isArray(payload) ? data.length : Number(payload.total || 0);
            const page = Array.isArray(payload) ? effectivePage : Number(payload.page || effectivePage);
            const limit = Array.isArray(payload) ? effectiveLimit : Number(payload.limit || effectiveLimit);
            console.log('API Data received:', data.length, 'items', 'total:', total, 'page:', page, 'limit:', limit);
            if (data.length > 0) {
                console.log('Sample item:', data[0]);
                console.log('Sample created_at:', data[0]?.created_at);
            }

            const dataWithRoute = data.map((item: DispatchListRow) => ({
                ...item,
                route_number: item.route_number || item.dispatch_code,
                created_at: item.created_at || '',
            }));

            console.log('Processed data with route:', dataWithRoute.length, 'items');

            setDispatchList(dataWithRoute);
            setTotalCount(total);
            setCurrentPage(page);
            setPerPage(limit);
        } catch (e) {
            console.error('Error fetching dispatch list:', e);
            toast.error('Failed to load dispatch data. Please check console for details.');
        } finally {
            setIsLoading(false);
        }
    }, [fromDate, endDate, currentPage, perPage]);

    const fetchSchoolDataMap = async () => {
        try {
            // Get user_id, company_id, and category_id from sessionStorage
            const userId = sessionStorage.getItem('userid');
            const companyId = sessionStorage.getItem('company_id');
            const categoryId = sessionStorage.getItem('category_id');

            const params = new URLSearchParams();
            // Only add if exists and not empty string
            if (userId && userId.trim() !== '') params.append('user_id', userId.trim());
            if (companyId && companyId.trim() !== '') params.append('company_id', companyId.trim());
            if (categoryId && categoryId.trim() !== '') params.append('category_id', categoryId.trim());

            const res = await fetch(`/api/scooldata${params.toString() ? '?' + params.toString() : ''}`);
            if (!res.ok) return;
            const rows: SchoolDataApiRow[] = await res.json();
            const map = new Map<number, SchoolDataRow>();
            rows.forEach(r => {
                if (r?.schoolid) {
                    map.set(Number(r.schoolid), {
                        schoolid: Number(r.schoolid),
                        center: Number(r.center),
                        taluka_id: Number(r.taluka_id),
                        schoolname: String(r.schoolname || ''),
                        udaisno: String(r.udaisno || ''),
                    });
                }
            });
            setSchoolDataById(map);
        } catch {
            // silent
        }
    };

    const fetchCompanyName = async () => {
        try {
            const companyId = sessionStorage.getItem('company_id');
            if (companyId && companyId.trim() !== '') {
                const res = await fetch(`/api/company?id=${companyId.trim()}`);
                if (res.ok) {
                    const company = await res.json();
                    if (company && company.name) {
                        setCompanyName(company.name);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching company name:', error);
            // Keep default fallback
        }
    };

    // Initial data fetch on mount
    useEffect(() => {
        fetchTalukas();
        fetchTrucks();
        // fetchCenters();
        fetchSchoolDataMap();
        fetchCompanyName();
    }, []);

    // Remove auto-fetch on date change; fetch will be triggered explicitly on Search click

    const onSearchClick = useCallback(() => {
        if (!fromDate || !endDate) {
            toast.error('Please select both From Date and End Date');
            return;
        }
        if (fromDate > endDate) {
            toast.error('From Date cannot be after End Date');
            return;
        }
        // reset to first page on new search
        setCurrentPage(1);
        fetchDispatchList({ page: 1, limit: perPage });
    }, [fromDate, endDate, fetchDispatchList, perPage]);

    // Initial fetch for today's date range so default data shows
    useEffect(() => {
        fetchDispatchList({ page: 1, limit: perPage });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Refresh when a dispatch is submitted elsewhere in the app
    useEffect(() => {
        const onSubmitted = () => {
            setCurrentPage(1);
            fetchDispatchList({ page: 1, limit: perPage });
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('dispatch:submitted', onSubmitted as EventListener);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('dispatch:submitted', onSubmitted as EventListener);
            }
        };
    }, [fetchDispatchList, perPage]);

    // Enhanced grain mapping for Marathi names - Added more comprehensive aliases
    const mrGrainColumns = [
        { key: 'तांदुळ', aliases: ['तांदुळ', 'rice', 'चावल', 'tandul', 'rice grains'] },
        { key: 'मुगदाळ', aliases: ['मुगदाळ', 'मुग डाळ', 'moong dal', 'मुगडाळ', 'green dal'] },
        { key: 'मसूरदाळ', aliases: ['मसूरदाळ', 'मसूर डाळ', 'masoor dal', 'red dal', 'red lentil'] },
        { key: 'तूरदाळ', aliases: ['तूरदाळ', 'तूर डाळ', 'toor dal', 'अरहर', 'tur dal'] },
        { key: 'हरभरा', aliases: ['हरभरा', 'चना', 'chana', 'gram', 'bengal gram', 'besan'] },
        { key: 'चवळी', aliases: ['चवळी', 'chawli', 'लोबिया', 'cowpea', 'black eyed peas'] },
        { key: 'मटकी', aliases: ['मटकी', 'matki', 'moth beans'] },
        { key: 'मुग', aliases: ['मुग', 'moong', 'green gram', 'whole moong'] },
        { key: 'वाटाणा', aliases: ['वाटाणा', 'वाटाणा', 'vatana', 'peas', 'green peas'] },
        { key: 'सोया वडी', aliases: ['सोया वडी', 'soya chunks', 'soy wadi', 'सोया चंक्स'] },
        { key: 'मसाला', aliases: ['मसाला', 'spices', 'गरम मसाला'] },
        { key: 'सोया तेल', aliases: ['सोया तेल', 'refined oil', 'soy oil', 'तेल', 'vegetable oil'] },
        { key: 'हळद', aliases: ['हळद', 'turmeric', 'haldi', 'turmeric powder'] },
        { key: 'मीठ', aliases: ['मीठ', 'salt', 'common salt'] },
        { key: 'मोहरी', aliases: ['मोहरी', 'mustard', 'mustard seeds'] },
    ];

    // Enhanced function to calculate grain totals - includes all items
    const sumGrainsForGroup = (items: Array<{ name: string; qty: number }>) => {
        const sums: Record<string, number> = {};
        const mappedItems: string[] = [];

        items.forEach(it => {
            if (!it.name || it.qty === 0) return;

            const nm = (it.name || '').toLowerCase().trim();
            const match = mrGrainColumns.find(c => c.aliases.some(a => nm.includes(a.toLowerCase())));

            if (match) {
                const key = match.key;
                sums[key] = (sums[key] || 0) + Number(it.qty || 0);
                mappedItems.push(key);
            } else {
                // For unmapped items, keep the original name
                sums[it.name] = (sums[it.name] || 0) + Number(it.qty || 0);
            }
        });

        return sums;
    };

    // Get all unique item names from the data (both mapped and unmapped)
    // const getAllItemNames = (data: DispatchListRow[]) => {
    //     const allItems = new Map<string, boolean>();

    //     data.forEach(row => {
    //         if (row.item_name) {
    //             const nm = row.item_name.toLowerCase().trim();
    //             const match = mrGrainColumns.find(c => c.aliases.some(a => nm.includes(a.toLowerCase())));

    //             if (match) {
    //                 allItems.set(match.key, true);
    //             } else {
    //                 allItems.set(row.item_name, true);
    //             }
    //         }
    //     });

    //     // Create array with mapped items first, then unmapped items
    //     const mappedKeys = mrGrainColumns.map(g => g.key);
    //     const orderedItems: string[] = [];

    //     // Add mapped items in order
    //     mappedKeys.forEach(key => {
    //         if (allItems.has(key)) {
    //             orderedItems.push(key);
    //             allItems.delete(key);
    //         }
    //     });

    //     // Add unmapped items alphabetically
    //     const unmappedItems = Array.from(allItems.keys()).sort();
    //     orderedItems.push(...unmappedItems);

    //     return orderedItems;
    // };

    // Get taluka name by school ID
    const getTalukaNameBySchoolId = (schoolId: number): string => {
        const schoolData = schoolDataById.get(schoolId);
        if (schoolData) {
            const taluka = talukaList.find(t => t.taluka_id === schoolData.taluka_id);
            return taluka?.name || '';
        }
        return '';
    };

    // Get UDISE number by school ID
    const getUdiseNumberBySchoolId = (schoolId: number): string => {
        const schoolData = schoolDataById.get(schoolId);
        return schoolData?.udaisno || '';
    };

    // Get unique route numbers from filtered data
    const getUniqueRouteNumbers = useMemo(() => {
        const routeNumbers = new Set<string>();
        filteredDispatchList.forEach(item => {
            if (item.route_number) {
                routeNumbers.add(item.route_number);
            }
        });

        const uniqueRoutes = Array.from(routeNumbers).sort((a, b) => {
            // Convert to number if it's a numeric string, otherwise extract number from string
            let numA = parseInt(a, 10);
            let numB = parseInt(b, 10);

            // If parseInt failed (NaN), try to extract numeric part
            if (isNaN(numA)) {
                const matchA = a.match(/\d+/);
                numA = matchA ? parseInt(matchA[0], 10) : 0;
            }

            if (isNaN(numB)) {
                const matchB = b.match(/\d+/);
                numB = matchB ? parseInt(matchB[0], 10) : 0;
            }

            // Descending order: b - a means higher numbers first
            return numB - numA;
        });

        console.log('Unique route numbers found:', uniqueRoutes.length, uniqueRoutes);
        return uniqueRoutes;
    }, [filteredDispatchList]);

    // Get data for a specific route number
    const getDataByRouteNumber = (routeNumber: string) => {
        return filteredDispatchList.filter(item => item.route_number === routeNumber);
    };

    // function formatDateToDDMMYYYY(dateString: string | undefined | null): string {
    //     if (!dateString) return '';
    //     const date: Date = new Date(dateString);   // `Date` type here
    //     if (isNaN(date.getTime())) return '';      // Invalid date check
    //     const day: string = String(date.getDate()).padStart(2, '0');
    //     const month: string = String(date.getMonth() + 1).padStart(2, '0');
    //     const year: number = date.getFullYear();
    //     return `${day}-${month}-${year}`;
    //   }

    const handlePrintDc = (routeNumber: string) => {
        const routeData = getDataByRouteNumber(routeNumber);

        if (routeData.length === 0) {
            toast.error('Route data not found for DC printing');
            return;
        }

        // Aggregate items across all schools in the route
        const allItems = routeData.map(r => ({ name: r.item_name, qty: r.new_qty_dispatch }));
        const sums = sumGrainsForGroup(allItems);

        // Top meta from first row
        const first = routeData[0];
        const talukaName = first?.taluka_name || '';
        const orderNo = first?.order_no || '';
        // const dcNo = first?.dispatch_code || '';
        const vehicleNo = first?.truckNo || '';
        const dateStr = first?.created_at ? first.created_at : '';
        const periodText = first?.period || 'Aug-Sept-2025';
        const daysText = first?.no_of_days ? `${first.no_of_days} Days` : '42 Days';
        const centerName = first?.center_name || '';

        // Prepare rows with only items that have quantity > 0
        const rows: Array<{ name: string; qty: number }> = [];

        // Add mapped grains that have quantity > 0
        mrGrainColumns.forEach(g => {
            const qty = Number(sums[g.key] || 0);
            if (qty > 0) {
                rows.push({ name: g.key, qty: qty });
            }
        });

        // Add unmapped items that have quantity > 0
        const knownKeys = mrGrainColumns.map(g => g.key);
        Object.keys(sums)
            .filter(k => !knownKeys.includes(k) && Number(sums[k] || 0) > 0)
            .sort()
            .forEach(k => {
                rows.push({ name: k, qty: Number(sums[k] || 0) });
            });

        // Calculate grand total from all items that will be displayed
        const grandTotal = rows.reduce((total, row) => total + (row.qty || 0), 0);

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
        <html>
        <head>
            <title>Print DC - ${routeNumber}</title>
            <style>
                @page { 
                    size: A4 portrait; 
                    margin: 5mm; 
                }
                body { 
                    font-family: "Kruti Dev", "Mangal", Arial, sans-serif; 
                    font-size: 12px; 
                    margin: 0;
                    padding: 10px;
                }
    
                .header { 
                    text-align: center; 
                    line-height: 1.3; 
                    margin-bottom: 1px;
                }
                .header p { 
                    margin: 2px 0; 
                    font-weight: 600; 
                }
                .box-title {
                    display: inline-block;
                    border: 1px solid #000;
                    padding: 2px 10px;
                    margin: 5px 0;
                    font-weight: bold;
                }
    
                .meta { 
                    width: 100%; 
                    font-size: 12px; 
                    margin-top: 4px; 
                    margin-bottom: 10px;
                }
                .meta td { 
                    padding: 1px; 
                    vertical-align: top;
                }
    
                .tables-container {
                    display: flex;
                    gap: 10px;
                    margin-top: 2px;
                    margin-bottom: 10px;
                }
                .table-outer { 
                    border: 1.5px solid #000; 
                    flex: 1;
                }
                table.dc { 
                    border-collapse: collapse; 
                    width: 100%; 
                    font-size: 10px; 
                }
                table.dc th, table.dc td {
                    border: 1px solid #000;
                    padding: 1px 2px;
                    text-align: center;
                }
                table.dc th { 
                    font-weight: bold; 
                    background-color: #f5f5f5;
                }
                table.dc td {
                    text-align: left;
                }
                table.dc td:last-child {
                    text-align: right;
                }
    
                .total-bar {
                    text-align: right;
                    font-weight: bold;
                    font-size: 13px;
                    margin-right: 20px;
                    margin-top: 10px;
                    margin-bottom: 15px;
                }
                .total-bar span {
                    border: 1.5px solid #000;
                    padding: 6px 12px;
                    display: inline-block;
                    min-width: 80px;
                    background-color: #f9f9f9;
                }
    
                .note {
                    font-size: 11px;
                    line-height: 1.4;
                    text-align: justify;
                    margin-top: 15px;
                    margin-bottom: 20px;
                    padding: 8px;
                    border: 1px dashed #666;
                    background-color: #f8f8f8;
                }
    
                .signs {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 1px;
                }
                .sign-box {
                    width: 45%;
                    text-align: center;
                }
                .sign-line {
                    border-top: 1px solid #000;
                    margin-top: 5px;
                    font-size: 11px;
                    padding-top: 2px;
                }
                
                /* Ensure proper printing */
                @media print {
                    body { 
                        margin: 0; 
                        padding: 0;
                    }
                    .tables-container {
                        gap: 8px;
                    }
                    .table-outer { 
                        border-width: 1.5px; 
                    }
                    .note {
                        background-color: transparent;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                
                <p>गौरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था</p>
                <p>शालेय पोषण आहार योजना</p>
                <p>शिक्षण विभाग (प्राथमिक), जिल्हा परिषद, नंदुरबार</p>
                <div class="box-title">ड्रायव्हर समरी चार्ट / जावक</div>
                <p>${companyName}</p>
            </div>
    
            <table class="meta">
                <tr>
                    <td style="width: 60%;">
                        <strong>${periodText} (${daysText})</strong>
                    </td>
                    <td style="text-align: right; width: 40%;">
                        <strong>तालुका:</strong> ${talukaName}
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>Order No:</strong> ${orderNo}
                    </td>
                    <td style="text-align: right;">
                        <strong>Date:</strong> ${formatDateToDDMMYYYY(dateStr)}
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>केंद्र:</strong> ${centerName}
                    </td>
                    <td style="text-align: right;">
                        <strong>गाडी नं.:</strong> ${vehicleNo}
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>DC पावती क्रमांक:</strong> ${routeNumber}
                    </td>
                    <td style="text-align: right;">
                    </td>
                </tr>
            </table>
    
            <div class="tables-container">
                <div class="table-outer">
                    <table class="dc">
                        <thead>
                            <tr>
                                <th style="width: 10%;">अ. क्र.</th>
                                <th style="text-align: left; width: 65%;">धान्यादी वस्तूचे नाव</th>
                                <th style="width: 25%;">वजन (किलो)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.slice(0, 8).map((r, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td style="text-align: left;">${r.name}</td>
                                    <td style="text-align: center;">${r.qty.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="table-outer">
                    <table class="dc">
                        <thead>
                            <tr>
                                <th style="width: 10%;">अ. क्र.</th>
                                <th style="text-align: left; width: 65%;">धान्यादी वस्तूचे नाव</th>
                                <th style="width: 25%;">वजन (किलो)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.slice(8, 15).map((r, i) => `
                                <tr>
                                    <td>${8 + i + 1}</td>
                                    <td style="text-align: left;">${r.name}</td>
                                    <td style="text-align: center;">${r.qty.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
    
            <div class="total-bar">
                <span>एकूण: ${grandTotal.toFixed(2)} किलो</span>
            </div>
    
         
    
            <div class="signs">
                <div class="sign-box">
                    <div class="">माल ताब्यात घेणाऱ्याचे नाव सही</div>
                </div>
                <div class="sign-box">
                    <div class="">माल ताब्यात देणाऱ्याचे नाव सही</div>
                </div>
            </div>
    
          
        </body>
        </html>
        `);
    };

    const getAllItemNames = (data: DispatchListRow[]) => {
        const allItems = new Map<string, boolean>();

        data.forEach(row => {
            if (row.item_name) {
                const nm = row.item_name.toLowerCase().trim();
                const match = mrGrainColumns.find(c => c.aliases.some(a => nm.includes(a.toLowerCase())));

                if (match) {
                    allItems.set(match.key, true);
                } else {
                    allItems.set(row.item_name, true);
                }
            }
        });

        // Create array with mapped items first, then unmapped items
        const mappedKeys = mrGrainColumns.map(g => g.key);
        const orderedItems: string[] = [];

        // Add mapped items in order
        mappedKeys.forEach(key => {
            if (allItems.has(key)) {
                orderedItems.push(key);
                allItems.delete(key);
            }
        });

        // Add unmapped items alphabetically
        const unmappedItems = Array.from(allItems.keys()).sort();
        orderedItems.push(...unmappedItems);

        return orderedItems;
    };


    // Update the handlePrint function around line 644
    const handlePrint = (routeNumber: string) => {
        const routeData = getDataByRouteNumber(routeNumber);
        if (routeData.length === 0) {
            toast.error('Route data not found for printing');
            return;
        }

        // Get all unique items in the route
        const allItemNames = getAllItemNames(routeData);

        // Group by school and calculate totals - FIXED to prevent double counting
        const schoolsMap = new Map();
        routeData.forEach(row => {
            const schoolKey = `${row.school_id}-${row.class_range || ''}`;
            if (!schoolsMap.has(schoolKey)) {
                const talukaName = getTalukaNameBySchoolId(row.school_id);
                const udiseNumber = getUdiseNumberBySchoolId(row.school_id);
                schoolsMap.set(schoolKey, {
                    schoolname: row.schoolname || '',
                    class_range: row.class_range || '',
                    center_name: row.center_name || '',
                    taluka_name: talukaName,
                    udise_number: udiseNumber,
                    patsankhya: row.patsankhya || '',
                    items: new Map(), // Use Map to prevent duplicate items
                    receipts: new Set<string>(),
                });
            }

            // Use Map to aggregate quantities for the same item
            const schoolData = schoolsMap.get(schoolKey);
            if (!schoolData) return; // Safety check

            const itemKey = `${row.item_name}-${row.unit}`;

            if (schoolData.items.has(itemKey)) {
                // If item already exists, add to existing quantity
                const existingItem = schoolData.items.get(itemKey);
                if (existingItem) {
                    existingItem.qty += Number(row.qty_dispatch) || 0;
                }
            } else {
                // Add new item
                schoolData.items.set(itemKey, {
                    name: row.item_name,
                    qty: Number(row.qty_dispatch) || 0,
                    unit: row.unit
                });
            }

            if (row.dispatch_code) {
                schoolData.receipts.add(String(row.dispatch_code));
            }
        });

        // Convert Map items back to array for processing
        const schools = Array.from(schoolsMap.values()).map(school => ({
            ...school,
            items: Array.from(school.items.values())
        })).sort((a, b) => {
            // Sort by पावती क्रमांक (Receipt Number) in descending order
            const aReceipts = Array.from(a.receipts || new Set<string>()).sort().reverse();
            const bReceipts = Array.from(b.receipts || new Set<string>()).sort().reverse();

            // Compare the first (highest) receipt number
            const aFirstReceipt = aReceipts[0] || '';
            const bFirstReceipt = bReceipts[0] || '';

            // Extract numeric part for proper sorting
            const getReceiptNumber = (receipt: string) => {
                if (!receipt || typeof receipt !== 'string') return 0;
                const match = receipt.match(/(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            };

            const aNum = getReceiptNumber(String(aFirstReceipt));
            const bNum = getReceiptNumber(String(bFirstReceipt));

            return bNum - aNum; // Descending order (highest first)
        });

        // Calculate grand totals for all items
        const grandTotals: Record<string, number> = {};

        schools.forEach(school => {
            const schoolSums = sumGrainsForGroup(school.items);
            Object.entries(schoolSums).forEach(([itemName, qty]) => {
                grandTotals[itemName] = (grandTotals[itemName] || 0) + qty;
            });
        });

        // Calculate overall total
        const overallTotal = Object.values(grandTotals).reduce((sum, qty) => sum + qty, 0);

        // Get dynamic data from first route item
        const firstRouteItem = routeData[0];
        const dispatchDate = firstRouteItem?.created_at ? formatDateToDDMMYYYY(firstRouteItem.created_at) : '';
        const orderNo = firstRouteItem?.order_no || '';
        // const dispatchCode = firstRouteItem?.dispatch_code || '';
        const vehicleNo = firstRouteItem?.truckNo || '';
        const periodText = firstRouteItem?.period || 'Aug-Sept-2025';
        const daysText = firstRouteItem?.no_of_days ? `${firstRouteItem.no_of_days} Days` : '42 Days';
        
        // Get driver information from truck data
        const truck = firstRouteItem?.truck_id ? truckList.find(t => t.id === firstRouteItem.truck_id) : null;
        const driverName = truck?.driverName; // Fallback to default
        const driverMobile = truck?.driverMobile; // Fallback to default

        // Open print window with Excel-style formatting
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Route Paper - ${routeNumber}</title>
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                margin: 10px; 
                                font-size: 12px;
                            }
                            .header-table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-bottom: 14px;
                            }
                            .header-table td {
                                vertical-align: top;
                                padding: 0 5px;
                            }
                            .header-org {
                                font-size: 13px; 
                                font-weight: bold; 
                                line-height: 1.25; 
                                text-align: center;
                                margin-bottom: 10px;
                            }
                            .header-logo {
                                width: 78px;
                                height: auto;
                                display: block;
                                margin: 6px auto 3px auto;
                            }
                            .dispatch-detail {
                                text-align: left;
                                font-size: 12px;
                                line-height: 1.55;
                            }
                            .driver-detail {
                                text-align: right;
                                font-size: 12px;
                                line-height: 1.55;
                            }
                            .header-center { 
                                font-size: 12px;
                                font-weight: bold;
                                text-align: right;
                                margin-top: 6px; 
                            }
                            .dataflex {
                                display: flex;
                                justify-content: space-around;
                                align-items: flex-start;
                                margin-top: 10px;
                                width: 100%;
                            }
                            .dataflex > div {
                                flex: 1;
                                text-align: center;
                                padding: 0 10px;
                            }
                            .dataflex > div:first-child {
                                text-align: left;
                            }
                            .dataflex > div:last-child {
                                text-align: right;
                            }
                            .center-title {
                                font-size: 12px;
                                font-weight: bold;
                                text-align: center;
                                margin-top: 10px;
                            }
                            .table { 
                                width: 100%; 
                                border-collapse: collapse; 
                                border: 1px solid #000;
                            }
                            .table th, .table td { 
                                border: 1px solid #000; 
                                padding: 4px 6px; 
                                text-align: center;
                                font-size: 11px;
                            }
                            .table th { 
                                background-color: #f0f0f0; 
                                font-weight: bold;
                            }
                            .total-row { 
                                background-color: #e6e6e6; 
                                font-weight: bold;
                            }
                            .grain-column {
                                min-width: 25px;
                            }
                            .serial-column {
                                min-width: 30px;
                            }
                            .center-align {
                                text-align: center;
                            }
                            .left-align {
                                text-align: left;
                            }
                            .right-align {
                                text-align: right;
                            }
                            .footer { 
                                margin-top: 15px; 
                                text-align: center;
                                font-size: 11px;
                               
                                padding-top: 1px;
                            }
                            @media print {
                                body { margin: 5mm; }
                                .table { font-size: 10px; }
                            }
                        </style>
                    </head>
                    <body>
                        <table class="header-table">
                            <tr>
                                <td style="width:44%; text-align:center;">
                                    <div class="header-org">
                                        मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजुर , ता . भोकरधन, जि. जालना <br>
                                        शालेय पोषण आहार योजना, शिक्षण विभाग ( प्राथमिक, जिल्हा परिषद नंदुरबार
                                    </div>
                                    <div class="dataflex">
                                        <div>
                                            Route No. - ${routeNumber}<br>
                                            Route Date - ${dispatchDate}<br>
                                            पुरवठा माहे - ${periodText} (${daysText})<br>
                                            Order No. - ${orderNo}<br>
                                            Total Weight - <b>${overallTotal.toFixed(2)}</b>
                                        </div>
                                        <div>
                                            <img src="/images/login/logo.png" alt="Logo" class="header-logo" />
                                        </div>
                                        <div>
                                            Driver: ${driverName}<br>
                                            Mob: ${driverMobile}<br>
                                            Vehicle No: ${vehicleNo}<br>
                                            <div class="header-center"> तालुका:  ${firstRouteItem?.taluka_name || ''}</div>
                                        </div>
                                    </div>
                                    <div class="center-title">
                                        मध्यदाय भोजन योजना <br> ${companyName}
                                    </div>
                                </td>
                            </tr>
                        </table>
                
                        <table class="table">
                            <thead>
                                <tr>
                                    <th class="serial-column">अ. क्र.</th>
                                   
                                    <th class="left-align">पावती क्रमांक</th>
                                    <th class="left-align">केंद्र</th>
                                    <th class="left-align">UDISE Code</th>
                                    <th class="left-align">शाळा</th>
                                    <th class="center-align whitespace-nowrap"> वर्ग </th>
                                    <th class="center-align">पट संख्या</th>
                                    ${allItemNames.map(item =>
                `<th class="grain-column">${item}</th>`
            ).join('')}
                                    <th class="center-align">एकूण</th>
                                    <th class="center-align">हेड मास्टर मोबाइल No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${schools.map((school, index) => {
                const grainSums = sumGrainsForGroup(school.items);
                const schoolTotal = Object.values(grainSums).reduce((sum, qty) => sum + qty, 0);
                const receipts = school.receipts ? Array.from(school.receipts).join(', ') : '-';
                return `
                                        <tr>
                                            <td class="center-align">${index + 1}</td>
                                   
                                            <td class="left-align">${receipts}</td>
                                            <td class="left-align">${school.center_name}</td>
                                            <td class="center-align">${school.udise_number || '-'}</td>
                                            <td class="left-align">${school.schoolname}</td>
                                       <td class="center-align w-20 min-w-0" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${school.class_range}</td>
                                            <td class="center-align">${school.patsankhya || '-'}</td>
                                            ${allItemNames.map(item =>
                    `<td class="right-align">${grainSums[item] ? grainSums[item].toFixed(2) : '0.00'}</td>`
                ).join('')}
                                            <td class="right-align">${schoolTotal.toFixed(2)}</td>
                                            <td class="center-align"></td>
                                        </tr>
                                    `;
            }).join('')}
                                <tr class="total-row">
                                    <td colspan="7" class="right-align"><strong>एकूण:</strong></td>
                                    ${allItemNames.map(item =>
                `<td class="right-align"><strong>${grandTotals[item] ? grandTotals[item].toFixed(2) : '0.00'}</strong></td>`
            ).join('')}
                                    <td class="right-align"><strong>${overallTotal.toFixed(2)}</strong></td>
                                   
                                </tr>
                            </tbody>
                        </table>
                
                        <div class="footer">
                            <table style="width: 100%; margin-top: 2px;">
                                <tr>
                                    <td style="width: 33%; text-align: center;">
                                        <p>ड्रायव्हर सही</p>
                                        
                                    </td>
                                   
                                    <td style="width: 33%; text-align: center;">
                                        <p>प्रतिनिधी मो.</p>
                                       
                                    </td>
                                </tr>
                            </table>
                       
                        </div>
                
                        <script>
                            window.onload = function() {
                                window.print();
                                setTimeout(function() {
                                    window.close();
                                }, 1000);
                            }
                        </script>
                    </body>
                </html>
            `);
        }
    };
    // <p style="margin-top: 10px;">Generated by System - जिल्हा परिषद प्राथमिक शाळा</p>
    // <p style="margin-top: 5px;">Route: ${routeNumber} | Total Items: ${allItemNames.length} | Total Weight: ${overallTotal.toFixed(2)} Kg</p>

    // Update the groupedByRoute creation logic (around line 950)
    const groupedByRoute: RouteGroupRow[] = useMemo(() => {
        console.log('Calculating groupedByRoute from', getUniqueRouteNumbers.length, 'routes');

        const grouped = getUniqueRouteNumbers.map(routeNumber => {
            // Get data for this route from filteredDispatchList
            const routeData = filteredDispatchList.filter(item => item.route_number === routeNumber);

            if (routeData.length === 0) {
                console.warn('No data found for route:', routeNumber);
                return {
                    route_number: routeNumber,
                    dispatch_code: '',
                    order_no: '',
                    taluka: '',
                    center_name: '',
                    truckNo: '',
                    class_range: '',
                    created_at: '',
                    school_count: 0,
                    total_items: 0,
                    total_weight: 0
                };
            }

            // Group by dispatch_code to get unique dispatch codes for this route
            const uniqueDispatchCodes = [...new Set(routeData.map(item => item.dispatch_code))];

            // Get first item for basic info
            const firstItem = routeData[0];

            // Count unique school + class_range combinations
            const uniqueSchoolClassCombinations = new Set(
                routeData.map(item => `${item.school_id}_${item.class_range || ''}`)
            ).size;

            // Calculate total weight for this route
            const totalWeight = routeData.reduce((sum, item) => sum + (Number(item.new_qty_dispatch) || 0), 0);

            // Get all class ranges for this route
            const classRanges = [...new Set(routeData.map(item => item.class_range || '').filter(Boolean))];

            return {
                route_number: routeNumber,
                dispatch_code: uniqueDispatchCodes.join(', '), // Show all dispatch codes
                order_no: firstItem?.order_no || '',
                taluka: firstItem?.taluka_name || '',
                center_name: firstItem?.center_name || '',
                truckNo: firstItem?.truckNo || '',
                class_range: classRanges.join(', '), // Show all class ranges
                created_at: firstItem?.created_at || '',
                school_count: uniqueSchoolClassCombinations,
                total_items: routeData.length,
                total_weight: totalWeight
            };
        });

        console.log('Grouped by route result:', grouped.length, 'groups', grouped);
        return grouped;
    }, [getUniqueRouteNumbers, filteredDispatchList]);

    // Update the table columns to show grouped data properly
    const listColumns: Column<RouteGroupRow>[] = [
        {
            key: 'action',
            label: 'Action',
            render: (r) => (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handlePrint(r.route_number)}
                        className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                        title="Print Route Paper"
                    >
                        Print Route Paper
                    </button>
                    <button
                        onClick={() => handlePrintDc(r.route_number)}
                        className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        title="Print Driver Summary (DC)"
                    >
                        Print_Dc
                    </button>
                    {/* <button
                        onClick={() => handleDeleteRoute(r.route_number)}
                        className="px-2 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                        title="Delete Route"
                    >
                        <TrashBinIcon />
                    </button> */}


                </div>
            )
        },
        {
            key: 'route_number',
            label: 'Route Number',
            render: (r) => <span className="font-semibold text-blue-600">{r.route_number}</span>,
        },
        // {
        //     key: 'dispatch_code',
        //     label: 'Dispatch Codes',
        //     render: (r) => (
        //         <div className="max-w-xs">
        //             <span className="text-sm">{r.dispatch_code}</span>
        //         </div>
        //     )
        // },
        // {
        //     key: 'order_no',
        //     label: 'Order No',
        //     render: (r) => <span>{r.order_no || ''}</span>
        // },
        // {
        //     key: 'taluka',
        //     label: 'Taluka',
        //     render: (r) => <span>{r.taluka || ''}</span>
        // },Print Route Paper
        // {
        //     key: 'center_name',
        //     label: 'Center',
        //     render: (r) => <span>{r.center_name || ''}</span>
        // },
        {
            key: 'class_range',
            label: 'Class Ranges',
            render: () => (
                <div className="max-w-xs">
                    {/* <span className="text-sm">{r.class_range || ''}</span> */}
                    <span className="text-sm">All Class</span>
                </div>
            )
        },
        {
            key: 'school_count',
            label: 'Schools',
            render: (r) => (
                <span className="font-semibold text-green-600">
                    {r.school_count} Schools
                </span>
            )
        },
        {
            key: 'total_weight',
            label: 'Total Weight',
            render: (r) => (
                <span className="font-semibold text-orange-600">
                    {r.total_weight?.toFixed(2) || '0.00'} kg
                </span>
            )
        },
        {
            key: 'truckNo',
            label: 'Truck',
            render: (r) => <span>{r.truckNo || ''}</span>
        },
        {
            key: 'created_at',
            label: 'Date',
            render: (r) => <span>{formatDate(r.created_at)}</span>
        },
    ];

    // Simplified toolbar with From Date and End Date filters
    const toolbar = (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1 text-left">From Date</span>
                    <div className="relative">
                        <input
                            ref={fromDatePickerRef}
                            type="text"
                            placeholder="Select From Date"
                            className="h-10 rounded-md border px-3 pr-8 text-sm w-48"
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
                            className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
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
                            ref={endDatePickerRef}
                            type="text"
                            placeholder="Select End Date"
                            className="h-10 rounded-md border px-3 pr-8 text-sm w-48"
                            readOnly
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setEndDate('');
                                if (flatpickrEndInstanceRef.current) {
                                    flatpickrEndInstanceRef.current.clear();
                                }
                            }}
                            className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                            title="Clear End Date"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex items-end h-10">
                    <button
                        type="button"
                        onClick={onSearchClick}
                        disabled={isLoading}
                        className={`h-10 px-4 rounded-md text-sm font-medium text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        title="Search"
                    >
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>
        </div>
    );

    // Debug logging before render
    useEffect(() => {
        console.log('=== Routepaperview Render Debug ===');
        console.log('dispatchList count:', dispatchList.length);
        console.log('filteredDispatchList count:', filteredDispatchList.length);
        console.log('fromDate:', fromDate);
        console.log('endDate:', endDate);
        console.log('groupedByRoute count:', groupedByRoute.length);
        console.log('groupedByRoute data:', groupedByRoute);
        console.log('===================================');
    }, [dispatchList.length, filteredDispatchList.length, fromDate, endDate, groupedByRoute.length]);

    return (
        <div className="">
            {isLoading && <Loader />}
            <Filterroutepaper
                data={groupedByRoute}
                columns={listColumns}
                filterOptions={[]}
                filterKey={undefined}
                toolbar={toolbar}
                groupByKey="route_number"
                serverMode={true}
                totalItems={totalCount}
                initialPerPage={perPage}
                initialPage={currentPage}
                onPageChange={(page, limit) => {
                    setPerPage(limit);
                    setCurrentPage(page);
                    fetchDispatchList({ page, limit });
                }}
                colspanKeys={[
                    "route_number",
                    "dispatch_code",
                    "order_no",
                    "taluka",
                    "class_range",
                    "center_name",
                    "truckNo",
                ]}
                highlightGroups={[]}
            />
        </div>
    );
};

export default Routepaperview;