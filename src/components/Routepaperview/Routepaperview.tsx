"use client";

import { useEffect, useState, useRef } from 'react';
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';

import { Filterroutepaper } from '../tables/Filterroutepaper';
import { formatDate } from '@/lib/utils';

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
    create_at: string;
    school_count: number;
    total_items: number;
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
    qty_dispatch: number;
    bal_qty: number;
    status: string;
    create_at: string;
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

    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    const datePickerRef = useRef<HTMLInputElement>(null);
    const flatpickrInstanceRef = useRef<flatpickr.Instance | null>(null);

    // Masters
    const [talukaList, setTalukaList] = useState<TalukaRow[]>([]);
    // const [centerList, setCenterList] = useState<CenterRow[]>([]);
    const [schoolDataById, setSchoolDataById] = useState<Map<number, SchoolDataRow>>(new Map());
    const [dispatchList, setDispatchList] = useState<DispatchListRow[]>([]);
    const [filteredDispatchList, setFilteredDispatchList] = useState<DispatchListRow[]>([]);

    // Initialize Flatpickr for date picker
    useEffect(() => {
        if (datePickerRef.current) {
            const flatPickr = flatpickr(datePickerRef.current, {
                dateFormat: "Y-m-d",
                defaultDate: selectedDate ? new Date(selectedDate) : undefined,
                onChange: function (selectedDates, dateStr) {
                    setSelectedDate(dateStr);
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

            flatpickrInstanceRef.current = flatPickr;

            return () => {
                flatPickr.destroy();
                flatpickrInstanceRef.current = null;
            };
        }
    }, []);

    // Filter dispatch list based on date
    useEffect(() => {
        let filtered = [...dispatchList];

        if (selectedDate && selectedDate.trim() !== '') {
            const selectedDateObj = new Date(selectedDate);
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.create_at);
                return itemDate.toDateString() === selectedDateObj.toDateString();
            });
        }

        setFilteredDispatchList(filtered);
    }, [dispatchList, selectedDate]);

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
            const res = await fetch('/api/taluka');
            if (res.ok) setTalukaList(await res.json());
        } catch {
            toast.error('Failed to load taluka');
        }
    };

    const fetchDispatchList = async () => {
        try {
            const res = await fetch('/api/routeview');
            if (res.ok) {
                const data = await res.json();
                const dataWithRoute = data.map((item: DispatchListRow) => ({
                    ...item,
                    route_number: item.route_number || item.dispatch_code,
                    create_at: item.create_at || item.create_at || '',
                }));
                setDispatchList(dataWithRoute);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSchoolDataMap = async () => {
        try {
            const res = await fetch('/api/scooldata');
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

    useEffect(() => {
        fetchTalukas();
        // fetchCenters();
        fetchDispatchList();
        fetchSchoolDataMap();
    }, []);

    // Enhanced grain mapping for Marathi names - Added more comprehensive aliases
    const mrGrainColumns = [
        { key: 'तांदुळ', aliases: ['तांदुळ', 'rice', 'चावल', 'tandul', 'rice grains'] },
        { key: 'मुगदाळ', aliases: ['मुगदाळ', 'मुग डाळ', 'moong dal', 'मूगडाळ', 'green dal'] },
        { key: 'मसूरदाळ', aliases: ['मसूरदाळ', 'मसूर डाळ', 'masoor dal', 'red dal', 'red lentil'] },
        { key: 'तूरदाळ', aliases: ['तूरदाळ', 'तूर डाळ', 'toor dal', 'अरहर', 'tur dal'] },
        { key: 'हरभरा', aliases: ['हरभरा', 'चना', 'chana', 'gram', 'bengal gram', 'besan'] },
        { key: 'चवळी', aliases: ['चवळी', 'chawli', 'लोबिया', 'cowpea', 'black eyed peas'] },
        { key: 'मटकी', aliases: ['मटकी', 'matki', 'moth beans'] },
        { key: 'मुग', aliases: ['मुग', 'moong', 'green gram', 'whole moong'] },
        { key: 'वाटणा', aliases: ['वाटाणा', 'वाटणा', 'vatana', 'peas', 'green peas'] },
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
    const getUniqueRouteNumbers = () => {
        const routeNumbers = new Set<string>();
        filteredDispatchList.forEach(item => {
            if (item.route_number) {
                routeNumbers.add(item.route_number);
            }
        });
        return Array.from(routeNumbers).sort();
    };

    // Get data for a specific route number
    const getDataByRouteNumber = (routeNumber: string) => {
        return filteredDispatchList.filter(item => item.route_number === routeNumber);
    };

    function formatDateToDDMMYYYY(dateString: string | undefined | null): string {
        if (!dateString) return '';
        const date: Date = new Date(dateString);   // `Date` type here
        if (isNaN(date.getTime())) return '';      // Invalid date check
        const day: string = String(date.getDate()).padStart(2, '0');
        const month: string = String(date.getMonth() + 1).padStart(2, '0');
        const year: number = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
      
      const handlePrintDc = (routeNumber: string) => {
        const routeData = getDataByRouteNumber(routeNumber);
      
        if (routeData.length === 0) {
            toast.error('Route data not found for DC printing');
            return;
        }
    
        // Aggregate items across all schools in the route
        const allItems = routeData.map(r => ({ name: r.item_name, qty: r.qty_dispatch }));
        const sums = sumGrainsForGroup(allItems);
    
        // Top meta from first row
        const first = routeData[0];
        const talukaName = first?.taluka_name || '';
        const orderNo = first?.order_no || '';
        const dcNo = first?.dispatch_code || '';
        const vehicleNo = first?.truckNo || '';
        const dateStr = first?.create_at ? formatDateToDDMMYYYY(first.create_at) : '';
        const periodText = first?.period || 'Aug-Sept-2025';
        const daysText = first?.no_of_days ? `${first.no_of_days} Days` : '42 Days';
    
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
                    margin: 10mm; 
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
                    margin-bottom: 10px;
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
                    padding: 2px; 
                    vertical-align: top;
                }
    
                .table-outer { 
                    border: 1.5px solid #000; 
                    margin-top: 6px; 
                    margin-bottom: 10px;
                }
                table.dc { 
                    border-collapse: collapse; 
                    width: 100%; 
                    font-size: 12px; 
                }
                table.dc th, table.dc td {
                    border: 1px solid #000;
                    padding: 4px 6px;
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
                    margin-top: 25px;
                }
                .sign-box {
                    width: 45%;
                    text-align: center;
                }
                .sign-line {
                    border-top: 1px solid #000;
                    margin-top: 35px;
                    font-size: 11px;
                    padding-top: 2px;
                }
                
                /* Ensure proper printing */
                @media print {
                    body { 
                        margin: 0; 
                        padding: 0;
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
                        <strong>Date:</strong> ${dateStr}
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>DC पावती क्रमांक:</strong> ${dcNo}
                    </td>
                    <td style="text-align: right;">
                        <strong>गाडी नं.:</strong> ${vehicleNo}
                    </td>
                </tr>
            </table>
    
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
                        ${rows.map((r, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td style="text-align: left;">${r.name}</td>
                                <td style="text-align: right;">${r.qty.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
    
            <div class="total-bar">
                <span>एकूण: ${grandTotal.toFixed(2)} किलो</span>
            </div>
    
         
    
            <div class="signs">
                <div class="sign-box">
                    <div class="sign-line">माल ताब्यात घेणाऱ्याचे नाव सही</div>
                </div>
                <div class="sign-box">
                    <div class="sign-line">माल ताब्यात देणाऱ्याचे नाव सही</div>
                </div>
            </div>
    
          
        </body>
        </html>
        `);
    };

    // Print function for route number - completely rewritten for proper totals
    const handlePrint = (routeNumber: string) => {
        const routeData = getDataByRouteNumber(routeNumber);
        if (routeData.length === 0) {
            toast.error('Route data not found for printing');
            return;
        }

        // Get all unique items in the route
        const allItemNames = getAllItemNames(routeData);

        // Group by school and calculate totals
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
                    items: [],
                    receipts: new Set<string>(),
                });
            }
            
            schoolsMap.get(schoolKey).items.push({
                name: row.item_name,
                qty: row.qty_dispatch,
                unit: row.unit
            });
            
            if (row.dispatch_code) {
                schoolsMap.get(schoolKey).receipts.add(String(row.dispatch_code));
            }
        });

        const schools = Array.from(schoolsMap.values());

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
        const dispatchDate = firstRouteItem?.create_at ? formatDate(firstRouteItem.create_at) : '';
        const orderNo = firstRouteItem?.order_no || '';
        const dispatchCode = firstRouteItem?.dispatch_code || '';
        const vehicleNo = firstRouteItem?.truckNo || '';
        const periodText = firstRouteItem?.period || 'Aug-Sept-2025';
        const daysText = firstRouteItem?.no_of_days ? `${firstRouteItem.no_of_days} Days` : '42 Days';

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
                                min-width: 60px;
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
                                border-top: 1px solid #000;
                                padding-top: 5px;
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
                                            Dispatch No. - ${dispatchCode}<br>
                                            Dispatch date - ${dispatchDate}<br>
                                            पुरवठा माहे - ${periodText} (${daysText})<br>
                                            Order No. - ${orderNo}<br>
                                            Total Weight - <b>${overallTotal.toFixed(2)}</b>
                                        </div>
                                        <div>
                                            <img src="/images/login/logo.png" alt="Logo" class="header-logo" />
                                        </div>
                                        <div>
                                            Driver MOTIRAM PADAVI<br>
                                            Mob 9022899429<br>
                                            Vehicle No ${vehicleNo}<br>
                                            <div class="header-center"> तळोदे जि. नंदुरबार</div>
                                        </div>
                                    </div>
                                    <div class="center-title">
                                        मध्यदाय भोजन योजना <br> Mid Day Meal Scheme 
                                    </div>
                                </td>
                            </tr>
                        </table>
                
                        <table class="table">
                            <thead>
                                <tr>
                                    <th class="serial-column">अ. क्र.</th>
                                    <th class="left-align">तालुका</th>
                                    <th class="left-align">पावती क्रमांक</th>
                                    <th class="left-align">केंद्र</th>
                                    <th class="left-align">UDISE Code</th>
                                    <th class="left-align">शाळा</th>
                                    <th class="center-align">वर्ग</th>
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
                                            <td class="left-align">${school.taluka_name || '-'}</td>
                                            <td class="left-align">${receipts}</td>
                                            <td class="left-align">${school.center_name}</td>
                                            <td class="center-align">${school.udise_number || '-'}</td>
                                            <td class="left-align">${school.schoolname}</td>
                                            <td class="center-align">${school.class_range}</td>
                                            <td class="center-align">${school.patsankhya || '-'}</td>
                                            ${allItemNames.map(item =>
                                                `<td class="right-align">${grainSums[item] ? grainSums[item].toFixed(2) : '0.00'}</td>`
                                            ).join('')}
                                            <td class="right-align">${schoolTotal.toFixed(2)}</td>
                                            <td class="center-align">-</td>
                                        </tr>
                                    `;
                                }).join('')}
                                <tr class="total-row">
                                    <td colspan="8" class="right-align"><strong>एकूण:</strong></td>
                                    ${allItemNames.map(item =>
                                        `<td class="right-align"><strong>${grandTotals[item] ? grandTotals[item].toFixed(2) : '0.00'}</strong></td>`
                                    ).join('')}
                                    <td class="right-align"><strong>${overallTotal.toFixed(2)}</strong></td>
                                    <td class="center-align"></td>
                                </tr>
                            </tbody>
                        </table>
                
                        <div class="footer">
                            <table style="width: 100%; margin-top: 20px;">
                                <tr>
                                    <td style="width: 33%; text-align: center;">
                                        <p>तपासणी अधिकारी</p>
                                        <p>___________________________________</p>
                                    </td>
                                    <td style="width: 33%; text-align: center;">
                                        <p>वाहन चालक</p>
                                        <p>___________________________________</p>
                                    </td>
                                    <td style="width: 33%; text-align: center;">
                                        <p>सह्या</p>
                                        <p>___________________________________</p>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin-top: 10px;">Generated by System - जिल्हा परिषद प्राथमिक शाळा</p>
                            <p style="margin-top: 5px;">Route: ${routeNumber} | Total Items: ${allItemNames.length} | Total Weight: ${overallTotal.toFixed(2)} Kg</p>
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

    // Create grouped data by route_number
    const groupedByRoute: RouteGroupRow[] = getUniqueRouteNumbers().map(routeNumber => {
        const routeData = getDataByRouteNumber(routeNumber);
        const firstItem = routeData[0];

        return {
            route_number: routeNumber,
            dispatch_code: firstItem?.dispatch_code || '',
            order_no: firstItem?.order_no || '',
            taluka: firstItem?.taluka || '',
            center_name: firstItem?.center_name || '',
            truckNo: firstItem?.truckNo || '',
            class_range: firstItem?.class_range || '',
            create_at: firstItem?.create_at || '',
            school_count: new Set(routeData.map(item => item.school_id)).size,
            total_items: routeData.length
        };
    });

    // Table columns for route grouping
    // Table columns for route grouping
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
                </div>
            )
        },
        {
            key: 'route_number',
            label: 'Route Number',
            render: (r) => <span className="font-semibold">{r.route_number}</span>,
        },

        {
            key: 'order_no',
            label: 'Order No',
            render: (r) => <span>{r.order_no || ''}</span>
        },


        {
            key: 'school_count',
            label: 'Schools',
            render: (r) => <span>{r.school_count} Schools</span>
        },

        {
            key: 'truckNo',
            label: 'Truck',
            render: (r) => <span>{r.truckNo || ''}</span>
        },
        {
            key: 'create_at',
            label: 'Date',
            render: (r) => <span>{formatDate(r.create_at)}</span>
        },
    ];

    // Simplified toolbar with only date filter
    const toolbar = (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1 text-left">Date Filter</span>
                    <div className="relative">
                        <input
                            ref={datePickerRef}
                            type="text"
                            placeholder="Select Date"
                            className="h-10 rounded-md border px-3 pr-8 text-sm w-48"
                            readOnly
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedDate('');
                                if (flatpickrInstanceRef.current) {
                                    flatpickrInstanceRef.current.clear();
                                }
                            }}
                            className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                            title="Clear Date Filter"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex items-end">
                    <button
                        type="button"
                        onClick={fetchDispatchList}
                        className="h-10 px-4 rounded-md bg-blue-600 text-white text-sm font-medium"
                    >
                        Refresh Data
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="">
            <Filterroutepaper
                data={groupedByRoute}
                columns={listColumns}
                filterOptions={[]}
                filterKey={undefined}
                toolbar={toolbar}
                groupByKey="route_number"
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