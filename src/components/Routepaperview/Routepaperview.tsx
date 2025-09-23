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

// interface TruckRow {
//     id: number;
//     truckNo: string;
//     status?: string;
// }

interface CenterRow {
    center_id: number;
    name: string;
    marathi_name?: string;
    status?: string;
    taluka_id?: number;
}

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
    patsankhya?: string;
    group_id?: number | null;
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
    const [centerList, setCenterList] = useState<CenterRow[]>([]);
    // const [truckList, setTruckList] = useState<TruckRow[]>([]);
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
                const itemDate = new Date(item.created_at);
                return itemDate.toDateString() === selectedDateObj.toDateString();
            });
        }

        setFilteredDispatchList(filtered);
    }, [dispatchList, selectedDate]);

    // Fetch data functions
    // const fetchTrucks = async () => {
    //     try {
    //         // const res = await fetch('/api/truckdata');
    //         // setTruckList(await res.json());
    //     } catch {
    //         toast.error('Failed to load trucks');
    //     }
    // };

    const fetchCenters = async () => {
        try {
            const res = await fetch('/api/centerapi');
            setCenterList(await res.json());
        } catch {
            toast.error('Failed to load centers');
        }
    };

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
            if (res.ok) setDispatchList(await res.json());
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
        // fetchTrucks();
        fetchTalukas();
        fetchCenters();
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

    // Print function with Excel-style formatting
    const handlePrint = (dispatchCode: string) => {
        // Find the dispatch group to print
        const groupRows = dispatchList.filter(d => String(d.dispatch_code) === String(dispatchCode));
        if (groupRows.length === 0) {
            toast.error('Dispatch data not found for printing');
            return;
        }

        // Group by school and calculate totals
        const schoolsMap = new Map();
        groupRows.forEach(row => {
            const schoolKey = `${row.school_id}-${row.class_range || ''}`;
            if (!schoolsMap.has(schoolKey)) {
                schoolsMap.set(schoolKey, {
                    schoolname: row.schoolname || '',
                    class_range: row.class_range || '',
                    center_name: row.center_name || '',
                    items: []
                });
            }
            schoolsMap.get(schoolKey).items.push({
                name: row.item_name,
                qty: row.qty_dispatch,
                unit: row.unit
            });
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
        const dispatchDate = groupRows[0]?.created_at ? formatDate(groupRows[0].created_at) : '';

        // Open print window with Excel-style formatting
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Route Paper - ${dispatchCode}</title>
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
                            <h2>Route Paper - ${dispatchCode}</h2>
                            <p>Dispatch Date: ${dispatchDate} | Print Date: ${printDate}</p>
                        </div>
                        
                        <table class="table">
                            <thead>
                                <tr>
                                    <th class="serial-column">अ. क्र.</th>
                                    <th class="left-align">केंद्र</th>
                                    <th class="left-align">UDISE Code</th>
                                    <th class="left-align">शाळा</th>
                                    <th class="center-align">वर्ग</th>
                                    <th class="center-align">पट संख्या</th>
                                    ${mrGrainColumns.map(grain => 
                                        `<th class="grain-column">${grain.key}</th>`
                                    ).join('')}
                                    <th class="center-align">एकुण वजन</th>
                                    <th class="center-align">हेड मास्टर मोबाइल No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${schools.map((school, index) => {
                                    const grainSums = sumGrainsForGroup(school.items);
                                    const schoolTotal = Object.values(grainSums).reduce((sum, qty) => sum + qty, 0);
                                    
                                    return `
                                        <tr>
                                            <td class="center-align">${index + 1}</td>
                                            <td class="left-align">${school.center_name}</td>
                                            <td class="center-align">-</td>
                                            <td class="left-align">${school.schoolname}</td>
                                            <td class="center-align">${school.class_range}</td>
                                            <td class="center-align">-</td>
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
                                    <td colspan="5" class="right-align"><strong>एकूण वजन:</strong></td>
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
            printWindow.document.close();
        }
    };

    // Table columns with print button
    const listColumns: Column<DispatchListRow>[] = [
        {
            key: 'schoolname',
            label: 'Action',
            render: (r) => (
                <div className="flex items-center">
                    <button
                        onClick={() => handlePrint(String(r.dispatch_code))}
                        className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                        title="Print Route Paper"
                    >
                        Print
                    </button>
                </div>
            )
        },
        {
            key: 'dispatch_code',
            label: 'पावती क्रमांक',
            accessor: 'dispatch_code',
            render: (r) => <span>{r.dispatch_code}</span>,
        },
        // { 
        //     key: 'created_at', 
        //     label: 'Dispatch Date', 
        //     accessor: 'created_at', 
        //     render: (r) => <span>{formatDate(r.created_at)}</span> 
        // },
        { 
            key: 'order_no', 
            label: 'Order No', 
            accessor: 'order_no', 
            render: (r) => <span>{r.order_no || ''}</span> 
        },
        {
            key: 'taluka',
            label: 'Taluka',
            render: (r) => {
                const sd = r.school_id ? schoolDataById.get(Number(r.school_id)) : undefined;
                const talukaName = sd ? (talukaList.find(t => t.taluka_id === sd.taluka_id)?.name || '') : '';
                return <span>{talukaName}</span>;
            }
        },
        {
            key: 'center_name',
            label: 'Center',
            accessor: 'center_name',
            render: (r) => {
                const c = centerList.find(cn => String(cn.center_id) === String(r.center_id));
                const name = c?.marathi_name || c?.name || r.center_name || r.center_id;
                return <span>{name}</span>;
            }
        },
        {
            key: 'schoolname',
            label: 'School',
            accessor: 'schoolname',
            render: (r) => <span>{r.schoolname || ''}</span>
        },
        {
            key: 'class_range',
            label: 'Class',
            accessor: 'class_range',
            render: (r) => <span>{r.class_range || ''}</span>
        },
        { 
            key: 'truckNo', 
            label: 'Truck', 
            accessor: 'truckNo', 
            render: (r) => <span>{r.truckNo || r.truck_id}</span> 
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
                data={filteredDispatchList}
                columns={listColumns}
                filterOptions={[]}
                filterKey={undefined}
                toolbar={toolbar}
                groupByKey="dispatch_code"
                colspanKeys={[
                    "dispatch_code",
                    "order_no",
                    "taluka",
                    "class_range",
                    "schoolname",
                    "center_name",
                    "truckNo",
                ]}
                highlightGroups={[]}
            />
        </div>
    );
};

export default Routepaperview;