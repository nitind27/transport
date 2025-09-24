"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';

import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Modal } from '../ui/modal';
import { Filterroutepaper } from '../tables/Filterroutepaper';
import { formatDate } from '@/lib/utils';

interface ZPOrderDetail {
    id: number;
    order_no: string;
    no_of_days: number;
    period: string;
    status: string;
}
interface SchoolWiseOrder {
    id: number;
    order_id: number;
    school_id: number;
    items_data: string | Record<string, number>;
    total_weight: number;
    order_no: string;
    no_of_days: number;
    period: string;
    financial_year: string;
    schoolname: string;  // from JOIN
    udaisno: string;     // from JOIN
    status: string;
    created_at: string;
    class_range?: string; // ensure present
    patsankhya?: number;  // <-- add this
}
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

interface TruckRow {
    id: number;
    truckNo: string;
    status?: string;
}
interface CenterRow {
    center_id: number;
    name: string;
    marathi_name?: string;
    status?: string;
    taluka_id?: number; // ensure we can filter centers by taluka
}
interface ItemGrain {
    id: number;
    name: string;
    Unit: string;
}

// Existing inserted dispatch list row (from API GET)
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
    group_id?: number | null; // <- add this
};

type DispatchRow = {
    schoolname: string;
    grain: string;
    totalQty: number; // Original planned quantity
    remainingQty: number; // Remaining quantity after dispatch
    unit: string;
};

// Print Modal Component

interface TalukaRow {
    taluka_id: number;
    name: string;
    name_en?: string;
    dist_id?: number;
    status?: string;
}



const Routepaper = ({ onSubmitted }: { onSubmitted?: () => void }) => {
    const [loading, setLoading] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmCode, setConfirmCode] = useState<string | null>(null);
    const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);


    // NEW: simple selection cart for route paper
    type CartItem = {
        dispatch_code: string;
        order_id: number;
        school_id: number;
        center_id: number;
        truck_id: number;
        class_range?: string;
        order_no?: string;
        schoolname?: string;
        center_name?: string;
        truckNo?: string;
        period?: string;
        no_of_days?: number;
        financial_year?: string;
        patsankhya?: string;
        items: Array<{ name: string; qty: number; unit: string }>;
    };
    const [routeCart, setRouteCart] = useState<CartItem[]>([]);
    console.log('routeCart', routeCart)
    const [showCartModal, setShowCartModal] = useState(false);
    const [addCode, setAddCode] = useState('');          // manual पावती क्रमांक entry

    const addGroupToCart = (groupCode: string) => {
        const groupRows = dispatchList.filter(d => String(d.dispatch_code) === String(groupCode));
        if (groupRows.length === 0) return;

        // Avoid duplicates
        if (routeCart.some(c => String(c.dispatch_code) === String(groupCode))) {
            toast.info('Already added to route');
            return;
        }

        // Aggregate items
        const items = groupRows.map(gr => ({
            name: gr.item_name,
            qty: Number(gr.qty_dispatch || 0),
            unit: gr.unit || '',
        }));

        const first = groupRows[0];
        // const sd = first.school_id ? schoolDataById.get(Number(first.school_id)) : undefined;
        const center = centerList.find(c => String(c.center_id) === String(first.center_id));
        const school = schoolWiseOrders.find(s => String(s.school_id) === String(first.school_id));

        const cartItem: CartItem = {
            dispatch_code: String(first.dispatch_code),
            order_id: Number(first.order_id),
            school_id: Number(first.school_id),
            center_id: Number(first.center_id),
            truck_id: Number(first.truck_id),
            class_range: first.class_range || '',
            order_no: first.order_no,
            schoolname: first.schoolname || school?.schoolname || '',
            center_name: center?.marathi_name || center?.name || first.center_name || '',
            truckNo: first.truckNo || '',
            period: first.period,
            no_of_days: first.no_of_days,
            financial_year: first.financial_year,
            patsankhya: first.patsankhya,
            items,
        };

        setRouteCart(prev => [...prev, cartItem]);
        toast.success('Added to route');
    };
    const removeFromCart = (dispatch_code: string) => { setRouteCart(prev => prev.filter(c => String(c.dispatch_code) !== String(dispatch_code))); };

    const addByDispatchCode = () => {
        const code = addCode.trim();
        if (!code) return toast.error('पावती क्रमांक टाका');
        const exists = dispatchList.some(d => String(d.dispatch_code) === code);
        if (!exists) return toast.error('पावती क्रमांक सापडला नाही');
        if (routeCart.some(c => String(c.dispatch_code) === code)) {
            return toast.info('आधीच कार्टमध्ये आहे');
        }
        addGroupToCart(code);
        setAddCode('');
    };
    const submitRouteCart = async () => {
        if (routeCart.length === 0) {
            toast.error('No items in route cart');
            return;
        }
        try {
            setLoading(true);
            const payload = {
                routes: routeCart.map(c => ({
                    dispatch_ids: getDispatchIdsForGroup(c.dispatch_code),
                })),
            };
            const resp = await fetch('/api/routepaper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!resp.ok) {
                const er = await resp.json().catch(() => ({}));
                throw new Error(er.message || 'Failed to save route paper');
            }
            toast.success('Route paper saved');
            setRouteCart([]);
            // Refresh list so newly grouped/inserted data disappears from table
            await fetchDispatchList();
            setShowCartModal(false);
            if (onSubmitted) onSubmitted();
           
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to save route paper');
        } finally {
            setLoading(false);
            setSubmitConfirmOpen(false);
        }
    };
    // Filters
    const [orderNo, setOrderNo] = useState('');
    const [selectedTruckId, setSelectedTruckId] = useState<string>('');
    const [selectedTalukaId, setSelectedTalukaId] = useState<string>('');
    const [selectedCenterId, setSelectedCenterId] = useState<string>('');
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [selectedClassRange, setSelectedClassRange] = useState<string>('');

    // Masters
    const [talukaList, setTalukaList] = useState<TalukaRow[]>([]);
    const [centerList, setCenterList] = useState<CenterRow[]>([]);
    const [itemGrains, setItemGrains] = useState<ItemGrain[]>([]);

    // Map school_id → center, taluka, schoolname, udaisno (from /api/scooldata)
    interface SchoolDataRow {
        schoolid: number;
        center: number;
        taluka_id: number;
        schoolname: string;
        udaisno: string;
    }
    // Shape of rows returned from `/api/scooldata`
    type SchoolDataApiRow = {
        schoolid: number | string;
        center: number | string | null;
        taluka_id: number | string | null;
        schoolname?: string | null;
        udaisno?: string | null;
    };
    const [schoolDataById, setSchoolDataById] = useState<Map<number, SchoolDataRow>>(new Map());
    // Date filter state - Initialize with current date
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    });

    // Date picker ref
    const datePickerRef = useRef<HTMLInputElement>(null);
    const flatpickrInstanceRef = useRef<flatpickr.Instance | null>(null);

    // Masters
    const [zpOrders, setZpOrders] = useState<ZPOrderDetail[]>([]);
    const [schoolWiseOrders, setSchoolWiseOrders] = useState<SchoolWiseOrder[]>([]);
    const [truckList, setTruckList] = useState<TruckRow[]>([]);
    // const [itemGrains, setItemGrains] = useState<ItemGrain[]>([]);

    // Existing dispatch list
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

            // Store the instance in ref
            flatpickrInstanceRef.current = flatPickr;

            return () => {
                flatPickr.destroy();
                flatpickrInstanceRef.current = null;
            };
        }
    }, []);


    // Filter dispatch list based on date and hide items added to route cart
    useEffect(() => {
        let filtered = [...dispatchList];
        // Filter by date only if a date is selected
        if (selectedDate && selectedDate.trim() !== '') {
            const selectedDateObj = new Date(selectedDate);
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.created_at);
                return itemDate.toDateString() === selectedDateObj.toDateString();
            });
        }

        // Hide rows already inserted/grouped on server
        filtered = filtered.filter(item => !item.group_id);

        // Also hide groups that user has added to the route cart locally
        const cartCodes = new Set(routeCart.map(c => String(c.dispatch_code)));
        if (cartCodes.size > 0) {
            filtered = filtered.filter(item => !cartCodes.has(String(item.dispatch_code)));
        }

        setFilteredDispatchList(filtered);
    }, [dispatchList, selectedDate, routeCart]);


    // Fetchers
    const fetchZpOrders = async () => {
        try {
            const response = await fetch('/api/zporderdetails');
            const data = await response.json();
            setZpOrders(data);
        } catch (error) {
            console.error('Error fetching ZP orders:', error);
            toast.error('Failed to fetch order details');
        }
    };

    const fetchSchoolWiseOrders = async () => {
        try {
            const response = await fetch('/api/schoolwiseorders');
            const data = await response.json();
            setSchoolWiseOrders(data);
        } catch (error) {
            console.error('Error fetching school-wise orders:', error);
            toast.error('Failed to fetch school-wise orders');
        }
    };

    const fetchTrucks = async () => {
        try {
            const res = await fetch('/api/truckdata');
            setTruckList(await res.json());
        } catch {
            toast.error('Failed to load trucks');
        }
    };

    const fetchCenters = async () => {
        try {
            const res = await fetch('/api/centerapi');
            setCenterList(await res.json());
        } catch {
            toast.error('Failed to load centers');
        }
    };

    const fetchItemMaster = async () => {
        try {
            const res = await fetch('/api/itemgrains');
            if (res.ok) setItemGrains(await res.json());
        } catch { }
    };

    const fetchDispatchList = async () => {
        try {
            const res = await fetch('/api/routedispatch');
            if (res.ok) setDispatchList(await res.json());
        } catch (e) {
            console.error(e);
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

    const fetchSchoolDataMap = async () => {
        try {
            const res = await fetch('/api/scooldata');
            if (!res.ok) return;
            const rows: SchoolDataApiRow[] = await res.json();
            const map = new Map<number, SchoolDataRow>();
            rows.forEach(r => {
                // API fields: schoolid, center (id), taluka_id, schoolname, udaisno
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
        fetchZpOrders();
        fetchSchoolWiseOrders();
        fetchTrucks();
        fetchTalukas();         // NEW
        fetchCenters();
        fetchItemMaster();
        fetchDispatchList();
        fetchSchoolDataMap();   // NEW
    }, []);

    // Options
    const orderNoOptions = useMemo(() => [
        { value: '', label: 'Select Order Number' },
        ...zpOrders.map(order => ({ value: String(order.id), label: order.order_no }))
    ], [zpOrders]);

    const truckOptions = useMemo(() => [
        { value: '', label: 'Select Truck' },
        ...truckList.map(t => ({ value: String(t.id), label: t.truckNo }))
    ], [truckList]);

    const talukaOptions = useMemo(() => [
        { value: '', label: 'Select Taluka' },
        ...talukaList.map(t => ({ value: String(t.taluka_id), label: t.name }))
    ], [talukaList]);

    const centerOptions = useMemo(() => [
        { value: '', label: 'Select Center' },
        ...centerList
            .filter(c => !selectedTalukaId || String(c.taluka_id || '') === String(selectedTalukaId))
            .map(c => ({ value: String(c.center_id), label: c.marathi_name || c.name || String(c.center_id) }))
    ], [centerList, selectedTalukaId]);

    const classRangeOptions = useMemo(() => {
        if (!orderNo || !selectedSchoolId) return [{ value: '', label: 'Class Varg (Select)' }];
        const uniq = new Set<string>();
        schoolWiseOrders
            .filter(s => String(s.order_id) === orderNo && String(s.school_id) === String(selectedSchoolId))
            .forEach(s => { if (s.class_range) uniq.add(String(s.class_range)); });
        const arr = Array.from(uniq.values()).sort();
        return [{ value: '', label: 'Class Varg (All)' }, ...arr.map(v => ({ value: v, label: v }))];
    }, [orderNo, selectedSchoolId, schoolWiseOrders]);

    const schoolOptions = useMemo(() => {
        if (!orderNo) return [{ value: '', label: 'Select School' }];

        let filtered = schoolWiseOrders.filter(s => String(s.order_id) === orderNo);

        if (selectedCenterId) {
            filtered = filtered.filter(s => {
                const sd = schoolDataById.get(Number(s.school_id));
                return sd && String(sd.center) === String(selectedCenterId);
            });
        } else if (selectedTalukaId) {
            filtered = filtered.filter(s => {
                const sd = schoolDataById.get(Number(s.school_id));
                return sd && String(sd.taluka_id) === String(selectedTalukaId);
            });
        }

        // De-dup by school_id
        const seen = new Set<number>();
        const dedup = filtered.filter(s => {
            if (seen.has(s.school_id)) return false;
            seen.add(s.school_id);
            return true;
        });

        // Stable sort
        dedup.sort((a, b) => {
            const an = a.schoolname || schoolDataById.get(a.school_id)?.schoolname || '';
            const bn = b.schoolname || schoolDataById.get(b.school_id)?.schoolname || '';
            return an.localeCompare(bn);
        });

        // Label: SR) Name (UDISE) with fallback from schooldata if missing in API
        return [
            { value: '', label: 'Select School' },
            ...dedup.map((s, idx) => {
                const fallback = schoolDataById.get(Number(s.school_id));
                const name = s.schoolname || fallback?.schoolname || `School ${s.school_id}`;
                const ud = s.udaisno || fallback?.udaisno || 'NA';
                return {
                    value: String(s.school_id),
                    label: `${idx + 1}) ${name} (${ud})`,
                };
            })
        ];
    }, [orderNo, selectedTalukaId, selectedCenterId, schoolWiseOrders, schoolDataById]);
    const handleOrderChange = (orderId: string) => {
        setOrderNo(orderId);
        setSelectedClassRange('');
        setSelectedSchoolId('');
    };

    const handleTalukaChange = (talukaId: string) => {
        setSelectedTalukaId(talukaId);
        setSelectedCenterId('');
        setSelectedSchoolId('');
        setSelectedClassRange('');
    };

    // Selected target (order + school)
    const selectedOrderSchool = useMemo(() => {
        if (!orderNo || !selectedSchoolId) return null;
        const all = schoolWiseOrders.filter(
            s => String(s.order_id) === orderNo && String(s.school_id) === selectedSchoolId
        );
        if (all.length === 0) return null;
        if (selectedClassRange) {
            return all.find(s => String(s.class_range || '') === String(selectedClassRange)) || all[0];
        }
        return all[0];
    }, [orderNo, selectedSchoolId, selectedClassRange, schoolWiseOrders]);

    // Sum already dispatched per item for selected order + school (+ class)
    // Sum already dispatched per item for selected order + school (+ class)
    const dispatchedByItem = useMemo<Record<string, number>>(() => {
        if (!orderNo || !selectedSchoolId) return {};
        const selectedClass = selectedClassRange || selectedOrderSchool?.class_range || '';
        const map: Record<string, number> = {};
        dispatchList
            .filter(d =>
                String(d.order_id) === orderNo &&
                String(d.school_id) === selectedSchoolId &&
                (!selectedClass || String(d.class_range || '') === String(selectedClass))
            )
            .forEach(d => {
                const key = d.item_name.trim();
                map[key] = (map[key] || 0) + Number(d.qty_dispatch || 0);
            });
        return map;
    }, [dispatchList, orderNo, selectedSchoolId, selectedClassRange, selectedOrderSchool?.class_range]);

    // Latest inserted row per item for this order+school(+class)
    const latestDispatchByItem = useMemo<Record<string, { id: number; qty: number; total: number }>>(() => {
        if (!orderNo || !selectedSchoolId) return {};
        const selectedClass = selectedClassRange || selectedOrderSchool?.class_range || '';
        const map: Record<string, { id: number; qty: number; total: number; created: string | number }> = {};
        dispatchList
            .filter(d =>
                String(d.order_id) === orderNo &&
                String(d.school_id) === selectedSchoolId &&
                (!selectedClass || String(d.class_range || '') === String(selectedClass))
            )
            .forEach(d => {
                const key = d.item_name.trim();
                const prev = map[key];
                const created = d.created_at || d.id;
                if (!prev || String(created) > String(prev.created)) {
                    map[key] = { id: d.id, qty: Number(d.qty_dispatch || 0), total: Number(d.total_qty || 0), created };
                }
            });
        const out: Record<string, { id: number; qty: number; total: number }> = {};
        Object.entries(map).forEach(([k, v]) => { out[k] = { id: v.id, qty: v.qty, total: v.total }; });
        return out;
    }, [dispatchList, orderNo, selectedSchoolId, selectedClassRange, selectedOrderSchool?.class_range]);
    // Build input-mode rows with remaining qty (planned - already dispatched)
    const dispatchRows = useMemo<DispatchRow[]>(() => {
        if (!selectedOrderSchool) return [];
        const items = typeof selectedOrderSchool.items_data === 'string'
            ? JSON.parse(selectedOrderSchool.items_data as unknown as string)
            : (selectedOrderSchool.items_data || {});
        const rows: DispatchRow[] = [];

        Object.entries(items)
            .forEach(([k, v]) => {
                const master = itemGrains.find(g => g.name.trim() === k.trim());
                const planned = Number(v) || 0;
                const already = Number(dispatchedByItem[k] || 0);
                const remaining = Math.max(0, planned - already);
                rows.push({
                    schoolname: selectedOrderSchool.schoolname,
                    grain: k,
                    totalQty: planned, // Show original planned quantity, not remaining
                    remainingQty: remaining, // Keep remaining for balance calculation
                    unit: master?.Unit || 'kg',
                });
            });

        return rows;
    }, [selectedOrderSchool, itemGrains, dispatchedByItem]);

    // Inputs map for qty dispatch (persist per order+school+class)
    const storageKey = useMemo(
        () => {
            if (!orderNo || !selectedSchoolId) return '';
            const cls = selectedClassRange || selectedOrderSchool?.class_range || '';
            return `dispatchInputs:${orderNo}:${selectedSchoolId}:${cls}`;
        },
        [orderNo, selectedSchoolId, selectedClassRange, selectedOrderSchool?.class_range]
    );
    const [dispatchInputs, setDispatchInputs] = useState<Record<string, number | undefined>>({});
    useEffect(() => {
        if (!storageKey) { setDispatchInputs({}); return; }
        try {
            const raw = localStorage.getItem(storageKey);
            setDispatchInputs(raw ? (JSON.parse(raw) || {}) : {});
        } catch { setDispatchInputs({}); }
    }, [storageKey]);

    // Prefill inputs: if no DB row -> Quantity; if DB qty == Quantity -> 0; else -> DB qty
    // Re-seed inputs whenever DB latest changes (after insert/update refresh)
    useEffect(() => {
        if (!storageKey) return;
        setDispatchInputs(() => {
            const next: Record<string, number> = {};
            dispatchRows.forEach(row => {
                const total = Number(row.totalQty);
                const dbQty = Number(latestDispatchByItem[row.grain]?.qty ?? NaN);
                if (Number.isNaN(dbQty)) {
                    next[row.grain] = total;              // no DB row → show Quantity
                } else {
                    next[row.grain] = dbQty >= total ? 0 : dbQty; // fully dispatched → 0 else DB qty
                }
            });
            return next;
        });
    }, [storageKey]);
    // Persist on change
    useEffect(() => {
        if (!storageKey) return;
        try { localStorage.setItem(storageKey, JSON.stringify(dispatchInputs)); } catch { }
    }, [dispatchInputs, storageKey]);

    useEffect(() => {
        if (!storageKey) return;
        try { localStorage.setItem(storageKey, JSON.stringify(dispatchInputs)); } catch { }
    }, [dispatchInputs, storageKey]);
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

    // Map items → per-group grain totals using aliases
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

    const getUdiseBySchool = (school_id?: number) =>
        school_id ? (schoolDataById.get(Number(school_id))?.udaisno || '') : '';

    // helper to get all dispatch_detail ids under a dispatch_code group
    const getDispatchIdsForGroup = (dispatchCode: string): number[] => {
        return dispatchList
            .filter(d => String(d.dispatch_code) === String(dispatchCode))
            .map(d => Number(d.id))
            .filter(id => Number.isFinite(id));
    };
    const listColumns: Column<DispatchListRow>[] = [
        {
            key: 'schoolname',
            label: 'Action',
            render: (r) => {
                // Hide action if already grouped
                if (r?.group_id) return null;
                // Only show action on the first row of the dispatch_code group
                // @ts-expect-error: _isFirstInGroup is added dynamically for grouping logic
                if (r?._isFirstInGroup === false) return null;
                return (
                    <div className="flex items-center">
                        <button
                            onClick={() => addGroupToCart(String(r.dispatch_code))}
                            className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Add this group to route cart"
                        >
                            Add to Route
                        </button>
                    </div>
                );
            }
        },
        {
            key: 'dispatch_code',
            label: 'पावती क्रमांक',
            accessor: 'dispatch_code',
            render: (r) => {
                const inCart = routeCart.some(c => String(c.dispatch_code) === String(r.dispatch_code));
                return (
                    <span className={inCart ? 'bg-green-100 text-green-800 px-2 py-1 rounded' : ''}>
                        {r.dispatch_code}
                    </span>
                );
            },
        },

        { key: 'order_no', label: 'Dispatch Date', accessor: 'created_at', render: (r) => <span>{formatDate(r.created_at) || formatDate(r.created_at)}</span> },
        { key: 'order_no', label: 'Order No', accessor: 'order_no', render: (r) => <span>{r.order_no || r.order_no}</span> },

        // Taluka (Marathi) resolved via schoolDataById + talukaList
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
            render: (r) => (
                <div className="flex items-center justify-between">
                    <span>{r.schoolname || r.schoolname}</span>
                </div>
            )
        },
        // Class Range
        {
            key: 'class_range',
            label: 'Class',
            accessor: 'class_range',
            render: (r) => <span>{r.class_range || ''}</span>
        },
        // Center (prefer Marathi name)

        { key: 'truckNo', label: 'Truck', accessor: 'truckNo', render: (r) => <span>{r.truckNo || r.truck_id}</span> },

    ];

    const allFiltersSelected = Boolean(orderNo && selectedTruckId && selectedCenterId && selectedSchoolId);
    const showInputMode = false;
    // Initialize Flatpickr for date picker ...
    const askRemove = (code: string) => {
        setConfirmCode(code);
        setConfirmOpen(true);
    };

    const confirmRemoveNow = () => {
        if (confirmCode) removeFromCart(confirmCode);
        setConfirmOpen(false);
        setConfirmCode(null);
    };
    // Initialize Flatpickr for date picker (re-init when mode changes so toolbar remounts)
    useEffect(() => {
        if (!datePickerRef.current) return;

        // Destroy any existing instance before re-initializing
        if (flatpickrInstanceRef.current) {
            try { flatpickrInstanceRef.current.destroy(); } catch { }
            flatpickrInstanceRef.current = null;
        }

        const instance = flatpickr(datePickerRef.current, {
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
            locale: { firstDayOfWeek: 1 }
        });

        flatpickrInstanceRef.current = instance;

        return () => {
            try { instance.destroy(); } catch { }
            if (flatpickrInstanceRef.current === instance) {
                flatpickrInstanceRef.current = null;
            }
        };
    }, [showInputMode, selectedDate]);
    // Update the toolbar section with the clear button
    const toolbar = (
        <div className="space-y-4">
            {/* First Row: 5 fields inline */}
            <div className="grid grid-cols-5 gap-2 items-center">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1 text-left">Order Number</span>
                    <select
                        className="h-10 rounded-md border px-3 text-sm"
                        value={orderNo}
                        onChange={(e) => handleOrderChange(e.target.value)}
                    >
                        {orderNoOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select Order Number'}</option>)}
                    </select>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1 text-left">Truck</span>
                    <select
                        className="h-10 rounded-md border px-3 text-sm"
                        value={selectedTruckId}
                        onChange={(e) => setSelectedTruckId(e.target.value)}
                    >
                        {truckOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select Truck'}</option>)}
                    </select>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1 text-left">Taluka</span>
                    <select
                        className="h-10 rounded-md border px-3 text-sm"
                        value={selectedTalukaId}
                        onChange={(e) => handleTalukaChange(e.target.value)}
                    >
                        {talukaOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select Taluka'}</option>)}
                    </select>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1 text-left">Center</span>
                    <select
                        className="h-10 rounded-md border px-3 text-sm"
                        value={selectedCenterId}
                        onChange={(e) => {
                            setSelectedCenterId(e.target.value);
                            setSelectedSchoolId('');
                        }}
                        disabled={!selectedTalukaId}
                    >
                        {centerOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select Center'}</option>)}
                    </select>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1 text-left">School</span>
                    <select
                        className="h-10 rounded-md border px-3 text-sm"
                        value={selectedSchoolId}
                        onChange={(e) => {
                            setSelectedSchoolId(e.target.value);
                            setSelectedClassRange('');
                        }}
                        disabled={!orderNo || !selectedCenterId}
                    >
                        {schoolOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Second Row: 4 fields inline */}
            <div className="grid grid-cols-4 gap-2 items-center">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1 text-left">Class Varg</span>
                    <select
                        className="h-10 rounded-md border px-3 text-sm"
                        value={selectedClassRange}
                        onChange={(e) => setSelectedClassRange(e.target.value)}
                        disabled={!orderNo || !selectedSchoolId}
                    >
                        {classRangeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-gray-600 mb-1 text-left">Date Filter</span>
                    <div className="relative">
                        <input
                            ref={datePickerRef}
                            type="text"
                            placeholder="Select Date"
                            className="h-10 rounded-md border px-3 pr-8 text-sm w-full"
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

                <button
                    type="button"
                    className="h-10 px-4 rounded-md bg-gray-600 text-white text-sm font-medium mt-5"
                    onClick={() => {
                        if (!allFiltersSelected) {
                            toast.error('Select Order, Truck, Center, and School');
                            return;
                        }

                    }}
                >
                    Search
                </button>


                <div className="flex items-end justify-end mt-5">
                    <button
                        type="button"
                        onClick={() => setShowCartModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium"
                    >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-600 font-semibold">
                            {routeCart.length}
                        </span>
                        Route (Cart)
                    </button>
                </div>
            </div>
        </div>
    );


    return (
        <div className="">
            {showInputMode ? (
                <div className="bg-white rounded-2xl shadow-md border p-4">
                    <div className="mb-4">{toolbar}</div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200 dark:border-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Sr No</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Item</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Unit</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Quantity</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Qty Dispatch</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border">Bal Qtsy</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {dispatchRows.map((row, index) => {
                                    const total = Number(row.totalQty);
                                    const dbQty = Number(latestDispatchByItem[row.grain]?.qty ?? NaN);
                                    const defaultValue = Number.isNaN(dbQty) ? total : (dbQty >= total ? 0 : dbQty);
                                    const currentValue = dispatchInputs[row.grain] !== undefined
                                        ? Number(dispatchInputs[row.grain])
                                        : defaultValue;

                                    const bal = (() => {
                                        const dbQtyRaw = (latestDispatchByItem[row.grain]?.qty);
                                        const dbNum = typeof dbQtyRaw === 'number' ? dbQtyRaw : NaN;
                                        const inputQty = dispatchInputs[row.grain] !== undefined ? Number(dispatchInputs[row.grain]) : total;
                                        const dispatched = Number.isNaN(dbNum) ? inputQty : dbNum;
                                        return (total === dispatched) ? 0 : Math.max(0, total - dispatched);
                                    })();

                                    return (
                                        <tr key={row.grain}>
                                            <td className="px-4 py-3 border">{index + 1}</td>
                                            <td className="px-4 py-3 border">{row.grain}</td>
                                            <td className="px-4 py-3 border">{row.unit}</td>
                                            <td className="px-4 py-3 border">{row.totalQty}</td>
                                            <td className="px-4 py-3 border">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={total}
                                                    className="h-9 w-28 rounded border px-2 text-sm"
                                                    value={currentValue}
                                                    onChange={(e) => {
                                                        if (e.target.value === '') {
                                                            setDispatchInputs(prev => ({ ...prev, [row.grain]: defaultValue }));
                                                            return;
                                                        }
                                                        const raw = Number(e.target.value);
                                                        const val = Number.isFinite(raw) ? raw : 0;
                                                        if (val > total) {
                                                            toast.error(`Entered quantity exceeds total. Max allowed: ${total}`);
                                                            return;
                                                        }
                                                        const capped = Math.min(Math.max(0, val), total);
                                                        setDispatchInputs(prev => ({ ...prev, [row.grain]: capped }));
                                                    }}
                                                    onBlur={(e) => {
                                                        if (e.target.value === '') {
                                                            setDispatchInputs(prev => ({ ...prev, [row.grain]: defaultValue }));
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className={`px-4 py-3 border ${bal === 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}`}>{bal}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
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
                    highlightGroups={routeCart.map(c => String(c.dispatch_code))}
                />
            )}


            {/* Route Cart Modal */}
            <Modal isOpen={showCartModal} onClose={() => setShowCartModal(false)} className="max-w-[95vw] w-[1200px] p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Route Cart</h3>
                    <button onClick={() => setShowCartModal(false)} className="text-2xl leading-none">×</button>
                </div>

                {/* Controls row: पावती क्रमांक + Add, दिनांक + Clear */}
                <div className="flex flex-wrap items-end gap-3 mb-4">
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">पावती क्रमांक</label>
                        <input
                            value={addCode}
                            onChange={(e) => setAddCode(e.target.value)}
                            placeholder="उदा. 1234"
                            className="h-10 rounded-md border px-3 text-sm w-48"
                        />
                    </div>
                    <button
                        onClick={addByDispatchCode}
                        className="h-10 px-4 rounded-md bg-emerald-600 text-white text-sm font-medium"
                    >
                        Add to cart
                    </button>


                </div>

                {/* पावती क्रमांक chips row (before table) */}
                {routeCart.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-sm font-medium mr-2">पावती क्रमांक:</span>
                        {routeCart.map(c => (
                            <span key={c.dispatch_code} className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 border border-blue-200 rounded-full px-3 py-1 text-xs">
                                {c.dispatch_code}
                                <button
                                    onClick={() => askRemove(c.dispatch_code)}
                                    className="text-red-600 hover:text-red-700"
                                    title="Remove"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Table: one row per पावती क्रमांक (don’t merge) */}
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border px-2 py-1 whitespace-nowrap">अ. क्र.</th>
                                <th className="border px-2 py-1 whitespace-nowrap">Action</th>
                                <th className="border px-2 py-1 whitespace-nowrap">पावती क्रमांक</th>
                                <th className="border px-2 py-1 whitespace-nowrap">केंद्र</th>
                                <th className="border px-2 py-1 whitespace-nowrap">UDISE Code</th>
                                <th className="border px-2 py-1 whitespace-nowrap">शाळा</th>
                                <th className="border px-2 py-1 whitespace-nowrap">वर्ग</th>
                                <th className="border px-2 py-1 whitespace-nowrap">पट संख्या</th>
                                {mrGrainColumns.map(c => (
                                    <th key={c.key} className="border px-2 py-1 whitespace-nowrap">{c.key}</th>
                                ))}
                                <th className="border px-2 py-1 whitespace-nowrap">एकुण वजन</th>
                                <th className="border px-2 py-1 whitespace-nowrap">हेड मास्टर मोबाइल No.</th>

                            </tr>
                        </thead>
                        <tbody>
                            {routeCart.map((grp, idx) => {
                                const sums = sumGrainsForGroup(grp.items);
                                const total = Object.values(sums).reduce((a, b) => a + (Number(b) || 0), 0);
                                const udise = getUdiseBySchool(grp.school_id);
                                return (
                                    <tr key={grp.dispatch_code}>
                                        <td className="border px-2 py-1 text-center">{idx + 1}</td>
                                        <td className="border px-2 py-1">
                                            <button
                                                onClick={() => askRemove(grp.dispatch_code)}
                                                className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                        <td className="border px-2 py-1">{grp.dispatch_code}</td>
                                        <td className="border px-2 py-1">{grp.center_name || ''}</td>
                                        <td className="border px-2 py-1">{udise}</td>
                                        <td className="border px-2 py-1">{grp.schoolname || ''}</td>
                                        <td className="border px-2 py-1">{grp.class_range || ''}</td>
                                        <td className="border px-2 py-1 text-right">{grp.patsankhya}</td>
                                        {mrGrainColumns.map(c => (
                                            <td key={c.key} className="border px-2 py-1 text-right">
                                                {sums[c.key] ? Number(sums[c.key]).toFixed(2) : '0'}
                                            </td>
                                        ))}
                                        <td className="border px-2 py-1 text-right">{total.toFixed(2)}</td>
                                        <td className="border px-2 py-1">-</td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button onClick={() => setShowCartModal(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">
                        Close
                    </button>
                    <button
                        onClick={() => setSubmitConfirmOpen(true)}
                        disabled={loading || routeCart.length === 0}
                        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60 inline-flex items-center"
                    >
                        {loading && (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                        )}
                        {loading ? 'Submitting...' : 'Final Submit'}
                    </button>
                </div>
            </Modal>
            <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} className="max-w-md p-0">
                <div className="p-5">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 h-9 w-9 shrink-0 rounded-full bg-red-100 text-red-600 flex items-center justify-center">!</div>
                        <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900">Remove from route cart?</h3>
                            <p className="mt-1 text-sm text-gray-600 mt-8">
                                Are you sure you want to remove <span className='font-bold'>पावती क्रमांक {confirmCode}</span> from the cart?
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            onClick={() => setConfirmOpen(false)}
                            className="px-4 py-2 rounded border border-gray-300 text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmRemoveNow}
                            className="px-4 py-2 rounded bg-red-600 text-white"
                        >
                            Yes, remove
                        </button>
                    </div>
                </div>
            </Modal >

            <Modal isOpen={submitConfirmOpen} onClose={() => setSubmitConfirmOpen(false)} className="max-w-md p-0">
                <div className="p-5">
                    <h3 className="text-base font-semibold text-gray-900">Confirm Final Submit</h3>
                    <p className="mt-2 text-sm text-gray-600">Are you sure you want to submit the route cart?</p>
                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            onClick={() => setSubmitConfirmOpen(false)}
                            disabled={loading}
                            className="px-4 py-2 rounded border border-gray-300 text-gray-800 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submitRouteCart}
                            disabled={loading}
                            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
                        >
                            {loading ? 'Submitting...' : 'Yes, submit'}
                        </button>
                    </div>
                </div>
            </Modal >

        </div >
    );
};

export default Routepaper;