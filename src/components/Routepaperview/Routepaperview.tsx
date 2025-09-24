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

    // Grain mapping for Marathi names
    const mrGrainColumns = [
        { key: 'तांदुळ', aliases: ['तांदुळ', 'rice', 'चावल'] },
        { key: 'मुगदाळ', aliases: ['मुगदाळ', 'मुग डाळ', 'moong dal', 'मूगडाळ'] },
        { key: 'मसूरदाळ', aliases: ['मसूरदाळ', 'मसूर डाळ', 'masoor dal'] },
        { key: 'तूरदाळ', aliases: ['तूरदाळ', 'तूर डाळ', 'toor dal', 'अरहर'] },
        { key: 'हरभरा', aliases: ['हरभरा', 'चना', 'chana', 'gram'] },
        { key: 'चवळी', aliases: ['चवळी', 'chawli', 'लोबिया', 'cowpea'] },
        { key: 'मटकी', aliases: ['मटकी', 'matki'] },
        { key: 'मुग', aliases: ['मुग', 'moong'] },
        { key: 'वाटणा', aliases: ['वाटाणा', 'वाटणा', 'vatana', 'peas'] },
        { key: 'सोया वडी', aliases: ['सोया वडी', 'soya chunks', 'soy wadi'] },
        { key: 'मसाला', aliases: ['मसाला', 'spices'] },
        { key: 'सोया तेल', aliases: ['सोया तेल', 'refined oil', 'soy oil', 'तेल'] },
        { key: 'हळद', aliases: ['हळद', 'turmeric', 'haldi'] },
        { key: 'मीठ', aliases: ['मीठ', 'salt'] },
        { key: 'मोहरी', aliases: ['मोहरी', 'mustard'] },
    ];

    // Calculate grain totals for a dispatch group
    const sumGrainsForGroup = (items: Array<{ name: string; qty: number }>) => {
        const sums: Record<string, number> = {};
        items.forEach(it => {
            const nm = (it.name || '').toLowerCase().trim();
            const match = mrGrainColumns.find(c => c.aliases.some(a => nm.includes(a.toLowerCase())));
            const key = match ? match.key : it.name;
            sums[key] = (sums[key] || 0) + Number(it.qty || 0);
        });
        return sums;
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
        const talukaName = first?.taluka || '';
        const orderNo = first?.order_no || '';
        const dcNo = first?.dispatch_code || '';
        const vehicleNo = first?.truckNo || '';
        const dateStr = first?.create_at ? formatDate(first.create_at) : '';
        const periodText = first?.period || 'Aug-Sept-2025';
        const daysText = first?.no_of_days ? `${first.no_of_days} Days` : '42 Days';

        // Prepare rows
        const knownKeys = mrGrainColumns.map(g => g.key);
        const ordered: Array<{ name: string; qty: number }> = [];
        mrGrainColumns.forEach(g => {
            const q = Number(sums[g.key] || 0);
            if (q > 0) ordered.push({ name: g.key, qty: q });
        });
        Object.keys(sums)
            .filter(k => !knownKeys.includes(k))
            .sort()
            .forEach(k => ordered.push({ name: k, qty: Number(sums[k] || 0) }));

        const MAX_ROWS = 15;
        const rows = ordered.slice(0, MAX_ROWS);
        const overflow = ordered.slice(MAX_ROWS);
        if (overflow.length > 0) {
            const extra = overflow.reduce((a, r) => a + (r.qty || 0), 0);
            if (rows.length === MAX_ROWS) {
                const last = rows[MAX_ROWS - 1];
                rows[MAX_ROWS - 1] = {
                    name: last?.name ? last.name + ' / इतर' : 'इतर',
                    qty: (last?.qty || 0) + extra
                };
            } else {
                rows.push({ name: 'इतर', qty: extra });
            }
        }
        while (rows.length < MAX_ROWS) rows.push({ name: '', qty: 0 });

        const grandTotal = ordered.reduce((a, r) => a + (r.qty || 0), 0);

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
        <html>
        <head>
            <title>Print DC - ${routeNumber}</title>
            <style>
                @page { size: A4 portrait; margin: 10mm; }
                body { font-family: "Kruti Dev", "Mangal", Arial, sans-serif; font-size: 12px; }
    
                .header { text-align:center; line-height:1.3; }
                .header p { margin: 2px 0; font-weight: 600; }
                .box-title {
                    display:inline-block;
                    border:1px solid #000;
                    padding:2px 10px;
                    margin:5px 0;
                    font-weight:bold;
                }
    
                .meta { width:100%; font-size:12px; margin-top:4px; }
                .meta td { padding:2px; }
    
                .table-outer { border:1.5px solid #000; margin-top:6px; }
                table.dc { border-collapse:collapse; width:100%; font-size:12px; }
                table.dc th, table.dc td {
                    border:1px solid #000;
                    padding:4px 6px;
                    text-align:center;
                }
                table.dc th { font-weight:bold; }
    
                .total-bar {
                    text-align:right;
                    font-weight:bold;
                    font-size:13px;
                    margin-top:6px;
                }
                .total-bar span {
                    border:1.5px solid #000;
                    padding:4px 8px;
                    display:inline-block;
                    min-width:60px;
                }
    
                .note {
                    font-size:11px;
                    line-height:1.4;
                    text-align:justify;
                    margin-top:8px;
                }
    
                .signs {
                    display:flex;
                    justify-content:space-between;
                    margin-top:15px;
                }
                .sign-box {
                    width:45%;
                    text-align:center;
                }
                .sign-line {
                    border-top:1px solid #000;
                    margin-top:35px;
                    font-size:11px;
                    padding-top:2px;
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
                    <td><b>${periodText} (${daysText})</b></td>
                    <td style="text-align:right;">तालुका: ${talukaName}</td>
                </tr>
                <tr>
                    <td>Order No. ${orderNo}</td>
                    <td style="text-align:right;">Date ${dateStr}</td>
                </tr>
                <tr>
                    <td>पावती क्रमांक: ${dcNo}</td>
                    <td style="text-align:right;">गाडी नं. ${vehicleNo}</td>
                </tr>
            </table>
    
            <div class="table-outer">
                <table class="dc">
                    <thead>
                        <tr>
                            <th style="width:10%;">अ. क्र.</th>
                            <th style="text-align:left;">धान्यादी वस्तूचे नाव</th>
                            <th style="width:25%;">वजन</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((r, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td style="text-align:left;">${r.name || ''}</td>
                                <td style="text-align:right;">${r.name ? Number(r.qty || 0).toFixed(1) : ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
    
            <div class="total-bar">
                <span>एकूण ${grandTotal.toFixed(1)}</span>
            </div>
            <div class="note">
                शाळेकडून शालेय पोषण आहार योजनेअंतर्गत माल पोहोच करुन देण्याकरीता तपशिलाप्रमाणे माल बाब्यात मिळाला. 
                तसेच सोबत दिलेल्या शाळेच्या यादीनुसार माल उतरवून पोहचवून आणून देण्याची जबाबदारी माझी (ड्रायव्हरची) राहील.
            </div>
    
            <div class="signs">
                <div class="sign-box">
                    <div class="sign-line">माल ताब्यात घेणाऱ्याचे नाव सही</div>
                </div>
                <div class="sign-box">
                    <div class="sign-line">माल ताब्यात देणाऱ्याचे नाव सही</div>
                </div>
            </div>
    
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(()=>window.close(), 600);
                }
            </script>
        </body>
        </html>
        `);
    };

    // Print function for route number
    const handlePrint = (routeNumber: string) => {
        const routeData = getDataByRouteNumber(routeNumber);
        if (routeData.length === 0) {
            toast.error('Route data not found for printing');
            return;
        }

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
                    // added: collect unique receipts (dispatch_code)
                    receipts: new Set<string>(),
                });
            }
            // add items
            schoolsMap.get(schoolKey).items.push({
                name: row.item_name,
                qty: row.qty_dispatch,
                unit: row.unit
            });
            // added: collect पावती क्रमांक
            if (row.dispatch_code) {
                schoolsMap.get(schoolKey).receipts.add(String(row.dispatch_code));
            }
        });

        const schools = Array.from(schoolsMap.values());

        // Calculate grand totals
        const grandTotals = mrGrainColumns.map(grain => {
            const total = schools.reduce((sum, school) => {
                const schoolSums = sumGrainsForGroup(school.items);
                return sum + (schoolSums[grain.key] || 0);
            }, 0);
            return { grain: grain.key, total };
        });

        const overallTotal = grandTotals.reduce((sum, item) => sum + item.total, 0);

        // Prepare print data
        const printDate = new Date().toLocaleDateString('en-IN');
        const dispatchDate = routeData[0]?.create_at ? formatDate(routeData[0].create_at) : '';

        // Get center name for the route
        const centerName = routeData[0]?.center_name || '';

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
                            .header { 
                                text-align: center; 
                                margin-bottom: 15px;
                                border-bottom: 2px solid #000;
                                padding-bottom: 10px;
                            }
                            .header h2 { 
                                margin: 5px 0; 
                                font-size: 18px;
                            }
                            .header p { 
                                margin: 2px 0; 
                                font-size: 12px;
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
                            .school-header {
                                background-color: #d9edf7;
                                font-weight: bold;
                                text-align: left;
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
                        <div class="header">
                            <h2>जिल्हा परिषद प्राथमिक शाळा</h2>
                            <h2>Route Paper - Route ${routeNumber}</h2>
                            <p>Center: ${centerName} | Dispatch Date: ${dispatchDate} | Print Date: ${printDate}</p>
                        </div>
                        
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
                                    ${mrGrainColumns.map(grain =>
                `<th class="grain-column">${grain.key}</th>`
            ).join('')}
                                                                   ).join('')}

                                   <th class="center-align">एकूण</th>
                                    <th class="center-align">हेड मास्टर मोबाइल No.</th>
                                    <th class="center-align">हेड मास्टर मोबाइल No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                                               ${schools.map((school, index) => {
                const grainSums = sumGrainsForGroup(school.items);
                const schoolTotal = Object.values(grainSums).reduce((sum, qty) => sum + qty, 0);

                // added: build receipt list text
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
                                            ${mrGrainColumns.map(grain =>
                    `<td class="right-align">${grainSums[grain.key] ? grainSums[grain.key].toFixed(2) : '0.00'}</td>`
                ).join('')}
                                            <td class="right-align">${schoolTotal.toFixed(2)}</td>
                                            <td class="center-align">-</td>
                                        </tr>
                                    `;
            }).join('')}
                                
                                                                                              <!-- Grand Total Row -->
                                <tr class="total-row">
                                 <td colspan="7" class="right-align"><strong>एकूण:</strong></td>
                                    <td class="center-align"></td>
                                    ${grandTotals.map(item => 
                                        `<td class="right-align"><strong>${item.total.toFixed(2)}</strong></td>`
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
            // printWindow.document.close();
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
                        Print
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