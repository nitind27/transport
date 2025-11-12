"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';

import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
// import { Modal } from '../ui/modal';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDateToDDMMYYYY } from '@/lib/utils';
import { ColumnSearchTable } from '../tables/ColumnSearchTable';

// Loader Component
const Loader = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading dispatch data...</span>
    </div>
  );
};

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
  schoolname: string;
  udaisno: string;
  status: string;
  created_at: string;
  class_range?: string;
  patsankhya?: number;
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

interface CenterRow {
  center_id: number;
  name: string;
  marathi_name?: string;
  status?: string;
  taluka_id?: number;
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
  total_weight?: string;
  truckNo?: string;
  class_range?: string;
  taluka_id?: string;
  taluka_name?: string;
  period?: string;
  no_of_days?: number;
  financial_year?: string;
  udaisno?: string;

  patsankhya?: string;
  action?: string;
  entered_by_name?: string;
  // Add all grain properties as optional string types
  "grain_तांदुळ"?: string;
  "grain_मुंगदाळ"?: string;
  "grain_मसूरदाळ"?: string;
  "grain_तूरदाळ"?: string;
  "grain_हरभरा"?: string;
  "grain_चवळी"?: string;
  "grain_मटकी"?: string;
  "grain_मुग"?: string;
  "grain_वाटाणा"?: string;
  "grain_सोया वडी"?: string;
  "grain_मसाला"?: string;
  "grain_सोया तेल"?: string;
  "grain_हळद"?: string;
  "grain_मीठ"?: string;
  "grain_मोहरी"?: string;
  "grain_चना"?: string;
  "grain_जीरा"?: string;
};

type DispatchRow = {
  schoolname: string;
  grain: string;
  totalQty: number;
  remainingQty: number;
  unit: string;
};

// Excel Export Modal Component
interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatchData: {
    dispatch_code: string;
    schoolname: string;
    udaisno: string;
    taluka: string;
    center_name: string;
    truckNo: string;
    date: string;
    class_range?: string;
    period?: string;
    no_of_days?: number;
    financial_year?: string;
    patsankhya?: string;
    items: Array<{
      name: string;
      qty: number;
      unit: string;
    }>;
  };
}

interface TalukaRow {
  taluka_id: number;
  name: string;
  name_en?: string;
  dist_id?: number;
  status?: string;
}

// Add these type definitions after line 160 (after ExcelExportModalProps interface)
type DispatchData = {
  dispatch_code: string;
  schoolname: string;
  udaisno: string;
  taluka: string;
  center_name: string;
  truckNo: string;
  date: string;
  class_range?: string;
  period?: string;
  no_of_days?: number;
  financial_year?: string;
  patsankhya?: string;
  items: Array<{
    name: string;
    qty: number;
    unit: string;
  }>;
};

type DispatchItem = {
  name: string;
  qty: number;
  unit: string;
};

const ExcelExportModal: React.FC<ExcelExportModalProps> = ({ isOpen, onClose, dispatchData }) => {
  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Create grain mapping with all required columns
      const grainColumns = [
        'तांदुळ', 'मुंगदाळ', 'मसूरदाळ', 'तूरदाळ', 'हरभरा', 'चवळी',
        'मटकी', 'मुग', 'वाटाणा', 'सोया वडी', 'मसाला', 'सोया तेल',
        'हळद', 'मीठ', 'मोहरी', 'चना', 'जीरा'
      ];

      // Initialize grain quantities
      const grainQuantities = grainColumns.reduce((acc, grain) => {
        acc[grain] = 0;
        return acc;
      }, {} as Record<string, number>);

      // Map dispatch items to grain quantities
      dispatchData.items.forEach(item => {
        const itemName = (item.name || '').toLowerCase().trim();

        // Simple mapping based on common names
        if (itemName.includes('तांदुळ') || itemName.includes('rice') || itemName.includes('चावल')) {
          grainQuantities['तांदुळ'] += Number(item.qty) || 0;
        } else if (itemName.includes('मुंगदाळ') || itemName.includes('moong dal') || itemName.includes('moongdal')) {
          grainQuantities['मुंगदाळ'] += Number(item.qty) || 0;
        } else if (itemName.includes('मुग') || itemName.includes('moong') || itemName.includes('green gram')) {
          grainQuantities['मुग'] += Number(item.qty) || 0;
        } else if (itemName.includes('मसूर') || itemName.includes('masoor')) {
          grainQuantities['मसूरदाळ'] += Number(item.qty) || 0;
        } else if (itemName.includes('तूर') || itemName.includes('toor') || itemName.includes('अरहर')) {
          grainQuantities['तूरदाळ'] += Number(item.qty) || 0;
        } else if (itemName.includes('हरभरा') || itemName.includes('chana') || itemName.includes('gram')) {
          grainQuantities['हरभरा'] += Number(item.qty) || 0;
        } else if (itemName.includes('चवळी') || itemName.includes('chawli') || itemName.includes('लोबिया')) {
          grainQuantities['चवळी'] += Number(item.qty) || 0;
        } else if (itemName.includes('मटकी') || itemName.includes('matki')) {
          grainQuantities['मटकी'] += Number(item.qty) || 0;
        } else if (itemName.includes('वाटाणा') || itemName.includes('वाटाणा') || itemName.includes('vatana') || itemName.includes('peas')) {
          grainQuantities['वाटाणा'] += Number(item.qty) || 0;
        } else if (itemName.includes('सोया') || itemName.includes('soya')) {
          if (itemName.includes('वडी') || itemName.includes('chunks')) {
            grainQuantities['सोया वडी'] += Number(item.qty) || 0;
          } else if (itemName.includes('तेल') || itemName.includes('oil')) {
            grainQuantities['सोया तेल'] += Number(item.qty) || 0;
          }
        } else if (itemName.includes('मसाला') || itemName.includes('spices')) {
          grainQuantities['मसाला'] += Number(item.qty) || 0;
        } else if (itemName.includes('हळद') || itemName.includes('turmeric') || itemName.includes('haldi')) {
          grainQuantities['हळद'] += Number(item.qty) || 0;
        } else if (itemName.includes('मीठ') || itemName.includes('salt')) {
          grainQuantities['मीठ'] += Number(item.qty) || 0;
        } else if (itemName.includes('मोहरी') || itemName.includes('mustard')) {
          grainQuantities['मोहरी'] += Number(item.qty) || 0;
        } else if (itemName.includes('चना') || itemName.includes('gram')) {
          grainQuantities['चना'] += Number(item.qty) || 0;
        } else if (itemName.includes('जीरा') || itemName.includes('cumin')) {
          grainQuantities['जीरा'] += Number(item.qty) || 0;
        }
      });

      // Calculate total weight
      const totalWeight = Object.values(grainQuantities).reduce((sum, qty) => sum + qty, 0);

      // Create worksheet data
      const worksheetData = [
        // Headers
        [
          'अ. क्र.', 'केंद्र', 'UDISE Code', 'शाळा', 'वर्ग', 'पट संख्या',
          ...grainColumns,
          'एकूण वजन'
        ],

        // Data row
        [
          1,
          dispatchData.center_name || '',
          dispatchData.udaisno || '',
          dispatchData.schoolname || '',
          dispatchData.class_range || '1-5',
          dispatchData.patsankhya || 0,
          ...grainColumns.map(grain => grainQuantities[grain].toFixed(3)),
          totalWeight.toFixed(2)
        ]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = [
        { wch: 8 },   // अ. क्र.
        { wch: 25 },  // केंद्र
        { wch: 15 },  // UDISE Code
        { wch: 30 },  // शाळा
        { wch: 10 },  // वर्ग
        { wch: 12 },  // पट संख्या
        ...grainColumns.map(() => ({ wch: 10 })), // grain columns
        { wch: 12 }   // एकूण वजन
      ];

      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispatch Details');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const fileName = `Dispatch_${dispatchData.dispatch_code}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(data, fileName);

      toast.success('Excel file exported successfully!');
      onClose();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error(`Failed to export Excel file: `);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-9999">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Export Dispatch Data to Excel</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Dispatch Details Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Receipt No:</strong> {dispatchData.dispatch_code}</div>
              <div><strong>Date:</strong> {dispatchData.date}</div>
              <div><strong>School:</strong> {dispatchData.schoolname}</div>
              <div><strong>Udise No:</strong> {dispatchData.udaisno}</div>
              <div><strong>Taluka:</strong> {dispatchData.taluka}</div>
              <div><strong>Center:</strong> {dispatchData.center_name}</div>
              <div><strong>Class:</strong> {dispatchData.class_range || '-'}</div>
              <div><strong>Truck:</strong> {dispatchData.truckNo}</div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={exportToExcel}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Export to Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DispatchView = () => {
  const [loading, setLoading] = useState(true); // Add loading state
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [lastDispatchData] = useState<{
    dispatch_code: string;
    schoolname: string;
    udaisno: string;
    taluka: string;
    center_name: string;
    truckNo: string;
    date: string;
    class_range?: string;
    period?: string;
    no_of_days?: number;
    financial_year?: string;
    patsankhya?: string;
    items: Array<{
      name: string;
      qty: number;
      unit: string;
    }>;
  } | null>(null);

  // Filters
  const [orderNo] = useState('');
  const [selectedTruckId] = useState<string>('');
  const [selectedTalukaId] = useState<string>('');
  const [selectedCenterId] = useState<string>('');
  const [selectedSchoolId] = useState<string>('');
  const [selectedClassRange] = useState<string>('');

  // Date range filters - Set current date as default
  const [fromDate, setFromDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  });
  const [toDate, setToDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  });
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

  // Date picker refs
  const fromDatePickerRef = useRef<HTMLInputElement>(null);
  const toDatePickerRef = useRef<HTMLInputElement>(null);
  const flatpickrFromInstanceRef = useRef<flatpickr.Instance | null>(null);
  const flatpickrToInstanceRef = useRef<flatpickr.Instance | null>(null);

  // Masters
  // const [zpOrders, setZpOrders] = useState<ZPOrderDetail[]>([]);
  const [schoolWiseOrders] = useState<SchoolWiseOrder[]>([]);
  // const [truckList, setTruckList] = useState<TruckRow[]>([]);

  // Existing dispatch list
  const [dispatchList, setDispatchList] = useState<DispatchListRow[]>([]);
  const [filteredDispatchList, setFilteredDispatchList] = useState<DispatchListRow[]>([]);
  console.log(filteredDispatchList, "filteredDispatchList");
  // State to gate input mode and reset when filters change
  const [didSearch, setDidSearch] = useState(false);

  // reset search gate when any filter changes
  useEffect(() => { setDidSearch(false); }, [
    orderNo, selectedTruckId, selectedTalukaId, selectedCenterId, selectedSchoolId, selectedClassRange
  ]);

  // Initialize Flatpickr for from date picker
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

  // Initialize Flatpickr for to date picker
  useEffect(() => {
    if (toDatePickerRef.current) {
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

      return () => {
        flatPickr.destroy();
        flatpickrToInstanceRef.current = null;
      };
    }
  }, []);

  // Filter dispatch list based on date range
  // Filter dispatch list based on date range and sort by dispatch_code descending
  // Filter dispatch list based on date range
  useEffect(() => {
    let filtered = [...dispatchList];

    // Filter by date range if dates are selected
    if (fromDate && fromDate.trim() !== '') {
      const fromDateObj = new Date(fromDate);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= fromDateObj;
      });
    }

    if (toDate && toDate.trim() !== '') {
      const toDateObj = new Date(toDate);
      toDateObj.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate <= toDateObj;
      });
    }

    // Sort by dispatch_code in descending order
    filtered = filtered.sort((a, b) => {
      // Extract numeric part from dispatch_code for proper sorting
      const getDispatchNumber = (code: string) => {
        if (!code || typeof code !== 'string') return 0;
        const match = code.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const aNum = getDispatchNumber(a.dispatch_code);
      const bNum = getDispatchNumber(b.dispatch_code);

      return bNum - aNum; // Descending order (highest first)
    });

    setFilteredDispatchList(filtered);
  }, [dispatchList, fromDate, toDate]);
  // Fetchers
  const fetchCenters = async () => {
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
      
      const res = await fetch(`/api/centerapi${params.toString() ? '?' + params.toString() : ''}`);
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
      setLoading(true); // Start loading
      
      // Get user_id, company_id, and category_id from sessionStorage
      const userId = sessionStorage.getItem('userid');
      const companyId = sessionStorage.getItem('company_id');
      const categoryId = sessionStorage.getItem('category_id');
      
      // Build query parameters - only add if exists and not empty string
      const params = new URLSearchParams();
      if (userId && userId.trim() !== '') params.append('user_id', userId.trim());
      if (companyId && companyId.trim() !== '') params.append('company_id', companyId.trim());
      if (categoryId && categoryId.trim() !== '') params.append('category_id', categoryId.trim());
      
      const apiUrl = `/api/dispatchdetails${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Fetching dispatch list from:', apiUrl);
      
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        console.log('Dispatch data received:', data.length, 'records');
        console.log('User ID:', userId, 'Company ID:', companyId, 'Category ID:', categoryId);
        setDispatchList(data);
      }
    } catch (e) {
      console.error('Error fetching dispatch list:', e);
      toast.error('Failed to fetch dispatch list');
    } finally {
      setLoading(false); // Stop loading regardless of success/error
    }
  };

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
    // Remove unused fetches
    // fetchZpOrders();
    // fetchSchoolWiseOrders();
    // fetchTrucks();
    fetchTalukas();
    fetchCenters();
    fetchItemMaster();
    fetchDispatchList();
    fetchSchoolDataMap();
  }, []);

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

  // Add function to export filtered data to Excel
  const exportFilteredDataToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Create grain mapping with all required columns
      const grainColumns = [
        'पट संख्या', 'तांदुळ', 'मुंगदाळ', 'मसूरदाळ', 'तूरदाळ', 'हरभरा', 'चवळी',
        'मटकी', 'मुग', 'वाटाणा', 'सोया वडी', 'मसाला', 'सोया तेल',
        'हळद', 'मीठ', 'मोहरी', 'चना', 'जीरा', 'एकूण वजन'
      ];

      // Group data by dispatch_code
      const groupedData = filteredDispatchList.reduce((acc, item) => {
        const key = item.dispatch_code;
        if (!acc[key]) {
          acc[key] = {
            dispatch_code: item.dispatch_code,
            order_no: item.order_no,
            schoolname: item.schoolname,
            udaisno: schoolDataById.get(Number(item.school_id))?.udaisno || '',
            taluka: schoolDataById.get(Number(item.school_id)) ?
              (talukaList.find(t => t.taluka_id === schoolDataById.get(Number(item.school_id))?.taluka_id)?.name || '') : '',
            center_name: centerList.find(cn => String(cn.center_id) === String(item.center_id))?.marathi_name || item.center_name || '',
            truckNo: item.truckNo || '',
            class_range: item.class_range || '',
            patsankhya: item.patsankhya || '',
            items: {} as Record<string, number>
          };
        }

        // Add item to the group
        const itemName = item.item_name.trim();
        if (!acc[key].items[itemName]) {
          acc[key].items[itemName] = 0;
        }
        acc[key].items[itemName] += Number(item.qty_dispatch || 0);

        return acc;
      }, {} as Record<string, {
        dispatch_code: string;
        order_no?: string;
        schoolname?: string;
        udaisno: string;
        taluka: string;
        center_name: string;
        truckNo: string;
        class_range?: string;
        patsankhya?: string;
        items: Record<string, number>;
      }>);

      // Convert grouped data to worksheet format
      const worksheetData = [
        // Headers
        [
          'अ. क्र.', 'केंद्र', 'UDISE Code', 'शाळा', 'वर्ग', 'पट संख्या',
          'तांदुळ', 'मुंगदाळ', 'मसूरदाळ', 'तूरदाळ', 'हरभरा', 'चवळी',
          'मटकी', 'मुग', 'वाटाणा', 'सोया वडी', 'मसाला', 'सोया तेल',
          'हळद', 'मीठ', 'मोहरी', 'चना', 'जीरा', 'एकूण वजन'
        ]
      ];

      // Add data rows
      Object.values(groupedData).forEach((group, index) => {
        // Initialize grain quantities
        const grainQuantities = {
          'तांदुळ': 0, 'मुंगदाळ': 0, 'मसूरदाळ': 0, 'तूरदाळ': 0, 'हरभरा': 0, 'चवळी': 0,
          'मटकी': 0, 'मुग': 0, 'वाटाणा': 0, 'सोया वडी': 0, 'मसाला': 0, 'सोया तेल': 0,
          'हळद': 0, 'मीठ': 0, 'मोहरी': 0, 'चना': 0, 'जीरा': 0
        };

        // Map dispatch items to grain quantities
        Object.entries(group.items).forEach(([itemName, qty]) => {
          const name = (itemName || '').toLowerCase().trim();
          const quantity = Number(qty) || 0;

          // Simple mapping based on common names
          if (name.includes('तांदुळ') || name.includes('rice') || name.includes('चावल')) {
            grainQuantities['तांदुळ'] += quantity;
          } else if (name.includes('मुंगदाळ') || name.includes('moong dal') || name.includes('moongdal')) {
            grainQuantities['मुंगदाळ'] += quantity;
          } else if (name.includes('मुग') || name.includes('moong') || name.includes('green gram')) {
            grainQuantities['मुग'] += quantity;
          } else if (name.includes('मसूर') || name.includes('masoor')) {
            grainQuantities['मसूरदाळ'] += quantity;
          } else if (name.includes('तूर') || name.includes('toor') || name.includes('अरहर')) {
            grainQuantities['तूरदाळ'] += quantity;
          } else if (name.includes('हरभरा') || name.includes('chana') || name.includes('gram')) {
            grainQuantities['हरभरा'] += quantity;
          } else if (name.includes('चवळी') || name.includes('chawli') || name.includes('लोबिया')) {
            grainQuantities['चवळी'] += quantity;
          } else if (name.includes('मटकी') || name.includes('matki')) {
            grainQuantities['मटकी'] += quantity;
          } else if (name.includes('वाटाणा') || name.includes('वाटाणा') || name.includes('vatana') || name.includes('peas')) {
            grainQuantities['वाटाणा'] += quantity;
          } else if (name.includes('सोया') || name.includes('soya')) {
            if (name.includes('वडी') || name.includes('chunks')) {
              grainQuantities['सोया वडी'] += quantity;
            } else if (name.includes('तेल') || name.includes('oil')) {
              grainQuantities['सोया तेल'] += quantity;
            }
          } else if (name.includes('मसाला') || name.includes('spices')) {
            grainQuantities['मसाला'] += quantity;
          } else if (name.includes('हळद') || name.includes('turmeric') || name.includes('haldi')) {
            grainQuantities['हळद'] += quantity;
          } else if (name.includes('मीठ') || name.includes('salt')) {
            grainQuantities['मीठ'] += quantity;
          } else if (name.includes('मोहरी') || name.includes('mustard')) {
            grainQuantities['मोहरी'] += quantity;
          } else if (name.includes('चना') || name.includes('gram')) {
            grainQuantities['चना'] += quantity;
          } else if (name.includes('जीरा') || name.includes('cumin')) {
            grainQuantities['जीरा'] += quantity;
          }
        });

        // Calculate total weight
        const totalWeight = Object.values(grainQuantities).reduce((sum, qty) => sum + qty, 0);

        // Add row data
        worksheetData.push([
          (index + 1).toString(), // Serial number (अ. क्र.) as string
          group.center_name || '',
          group.udaisno || '',
          group.schoolname || '',
          group.class_range || '1-5',
          group.patsankhya || '',
          grainQuantities['तांदुळ'].toFixed(3),
          grainQuantities['मुंगदाळ'].toFixed(3),
          grainQuantities['मसूरदाळ'].toFixed(3),
          grainQuantities['तूरदाळ'].toFixed(3),
          grainQuantities['हरभरा'].toFixed(3),
          grainQuantities['चवळी'].toFixed(3),
          grainQuantities['मटकी'].toFixed(3),
          grainQuantities['मुग'].toFixed(3),
          grainQuantities['वाटाणा'].toFixed(3),
          grainQuantities['सोया वडी'].toFixed(3),
          grainQuantities['मसाला'].toFixed(3),
          grainQuantities['सोया तेल'].toFixed(3),
          grainQuantities['हळद'].toFixed(3),
          grainQuantities['मीठ'].toFixed(3),
          grainQuantities['मोहरी'].toFixed(3),
          grainQuantities['चना'].toFixed(3),
          grainQuantities['जीरा'].toFixed(3),
          totalWeight.toFixed(2)
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = [
        { wch: 8 },   // अ. क्र.
        { wch: 25 },  // केंद्र
        { wch: 15 },  // UDISE Code
        { wch: 30 },  // शाळा
        { wch: 10 },  // वर्ग
        { wch: 12 },  // पट संख्या
        ...grainColumns.slice(1).map(() => ({ wch: 10 })), // grain columns
      ];

      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Dispatch Data');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const fileName = `Filtered_Dispatch_Data_${fromDate || 'all'}_to_${toDate || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(data, fileName);

      toast.success('Filtered data exported to Excel successfully!');
    } catch (error) {
      console.error('Error exporting filtered data to Excel:', error);
      toast.error('Failed to export filtered data to Excel');
    }
  };

  // Memoize grain quantities calculation to prevent performance issues
  const grainQuantitiesByDispatch = useMemo(() => {
    const quantitiesMap = new Map<string, Record<string, number>>();

    // Get unique dispatch codes from filtered list
    const uniqueDispatchCodes = [...new Set(filteredDispatchList.map(item => item.dispatch_code))];

    uniqueDispatchCodes.forEach(dispatchCode => {
      const grainQuantities = {
        'तांदुळ': 0, 'मुंगदाळ': 0, 'मसूरदाळ': 0, 'तूरदाळ': 0, 'हरभरा': 0, 'चवळी': 0,
        'मटकी': 0, 'मुग': 0, 'वाटाणा': 0, 'सोया वडी': 0, 'मसाला': 0, 'सोया तेल': 0,
        'हळद': 0, 'मीठ': 0, 'मोहरी': 0, 'चना': 0, 'जीरा': 0
      };

      // Get all items for this dispatch code
      const dispatchItems = dispatchList.filter(d => d.dispatch_code === dispatchCode);

      // Create a map to track unique items and prevent duplicates
      const uniqueItems = new Map<string, number>();

      dispatchItems.forEach(item => {
        const itemName = (item.item_name || '').toLowerCase().trim();
        const quantity = Number(item.qty_dispatch || 0);

        // Use item name as key to prevent duplicates
        const key = `${itemName}_${item.id}`;

        if (uniqueItems.has(key)) {
          // If item already exists, add to existing quantity
          uniqueItems.set(key, uniqueItems.get(key)! + quantity);
        } else {
          uniqueItems.set(key, quantity);
        }
      });

      // Now process the unique items instead of dispatchItems
      uniqueItems.forEach((quantity, key) => {
        const itemName = key.split('_')[0]; // Extract item name from key

        // Map items to grain quantities
        if (itemName.includes('तांदुळ') || itemName.includes('rice') || itemName.includes('चावल')) {
          grainQuantities['तांदुळ'] += quantity;
        } else if (itemName.includes('मुंगदाळ') || itemName.includes('moong dal') || itemName.includes('moongdal')) {
          grainQuantities['मुंगदाळ'] += quantity;
        } else if (itemName.includes('मुग') || itemName.includes('moong') || itemName.includes('green gram')) {
          grainQuantities['मुग'] += quantity;
        } else if (itemName.includes('मसूर') || itemName.includes('masoor')) {
          grainQuantities['मसूरदाळ'] += quantity;
        } else if (itemName.includes('तूर') || itemName.includes('toor') || itemName.includes('अरहर')) {
          grainQuantities['तूरदाळ'] += quantity;
        } else if (itemName.includes('हरभरा') || itemName.includes('chana') || itemName.includes('gram')) {
          grainQuantities['हरभरा'] += quantity;
        } else if (itemName.includes('चवळी') || itemName.includes('chawli') || itemName.includes('लोबिया')) {
          grainQuantities['चवळी'] += quantity;
        } else if (itemName.includes('मटकी') || itemName.includes('matki')) {
          grainQuantities['मटकी'] += quantity;
        } else if (itemName.includes('वाटाणा') || itemName.includes('वाटाणा') || itemName.includes('vatana') || itemName.includes('peas')) {
          grainQuantities['वाटाणा'] += quantity;
        } else if (itemName.includes('सोया') || itemName.includes('soya')) {
          if (itemName.includes('वडी') || itemName.includes('chunks')) {
            grainQuantities['सोया वडी'] += quantity;
          } else if (itemName.includes('तेल') || itemName.includes('oil')) {
            grainQuantities['सोया तेल'] += quantity;
          }
        } else if (itemName.includes('मसाला') || itemName.includes('spices')) {
          grainQuantities['मसाला'] += quantity;
        } else if (itemName.includes('हळद') || itemName.includes('turmeric') || itemName.includes('haldi')) {
          grainQuantities['हळद'] += quantity;
        } else if (itemName.includes('मीठ') || itemName.includes('salt')) {
          grainQuantities['मीठ'] += quantity;
        } else if (itemName.includes('मोहरी') || itemName.includes('mustard')) {
          grainQuantities['मोहरी'] += quantity;
        } else if (itemName.includes('चना') || itemName.includes('gram')) {
          grainQuantities['चना'] += quantity;
        } else if (itemName.includes('जीरा') || itemName.includes('cumin')) {
          grainQuantities['जीरा'] += quantity;
        }
      });

      // Calculate total weight
      const totalWeight = Object.values(grainQuantities).reduce((sum, qty) => sum + qty, 0);
      quantitiesMap.set(dispatchCode, { ...grainQuantities, 'एकूण वजन': totalWeight });
    });

    return quantitiesMap;
  }, [filteredDispatchList, dispatchList]);

  // Enhanced grain mapping for Marathi names - Added more comprehensive aliases
  // const mrGrainColumns = [
  //   { key: 'तांदुळ', aliases: ['तांदुळ', 'rice', 'चावल', 'tandul', 'rice grains'] },
  //   { key: 'मुगदाळ', aliases: ['मुगदाळ', 'मुग डाळ', 'moong dal', 'मूगडाळ', 'green dal'] },
  //   { key: 'मसूरदाळ', aliases: ['मसूरदाळ', 'मसूर डाळ', 'masoor dal', 'red dal', 'red lentil'] },
  //   { key: 'तूरदाळ', aliases: ['तूरदाळ', 'तूर डाळ', 'toor dal', 'अरहर', 'tur dal'] },
  //   { key: 'हरभरा', aliases: ['हरभरा', 'चना', 'chana', 'gram', 'bengal gram', 'besan'] },
  //   { key: 'चवळी', aliases: ['चवळी', 'chawli', 'लोबिया', 'cowpea', 'black eyed peas'] },
  //   { key: 'मटकी', aliases: ['मटकी', 'matki', 'moth beans'] },
  //   { key: 'मुग', aliases: ['मुग', 'moong', 'green gram', 'whole moong'] },
  //   { key: 'वाटाणा', aliases: ['वाटाणा', 'वाटाणा', 'vatana', 'peas', 'green peas'] },
  //   { key: 'सोया वडी', aliases: ['सोया वडी', 'soya chunks', 'soy wadi', 'सोया चंक्स'] },
  //   { key: 'मसाला', aliases: ['मसाला', 'spices', 'गरम मसाला'] },
  //   { key: 'सोया तेल', aliases: ['सोया तेल', 'refined oil', 'soy oil', 'तेल', 'vegetable oil'] },
  //   { key: 'हळद', aliases: ['हळद', 'turmeric', 'haldi', 'turmeric powder'] },
  //   { key: 'मीठ', aliases: ['मीठ', 'salt', 'common salt'] },
  //   { key: 'मोहरी', aliases: ['मोहरी', 'mustard', 'mustard seeds'] },
  // ];




  // // Get taluka name by school ID
  // const getTalukaNameBySchoolId = (schoolId: number): string => {
  //   const schoolData = schoolDataById.get(schoolId);
  //   if (schoolData) {
  //     const taluka = talukaList.find(t => t.taluka_id === schoolData.taluka_id);
  //     return taluka?.name || '';
  //   }
  //   return '';
  // };




  // Helper function to check if a date is today
  const isToday = (dateString: string): boolean => {
    if (!dateString) return false;
    const dispatchDate = new Date(dateString);
    const today = new Date();
    
    // Compare year, month, and day only (ignore time)
    return (
      dispatchDate.getFullYear() === today.getFullYear() &&
      dispatchDate.getMonth() === today.getMonth() &&
      dispatchDate.getDate() === today.getDate()
    );
  };

  // Add delete functionality
  const handleDeleteDispatch = async (dispatchCode: string) => {
    if (!confirm('Are you sure you want to delete this dispatch? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true); // Start loading when deleting
      const response = await fetch(`/api/dispatchdetails?dispatch_code=${dispatchCode}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove deleted items from local state
        setDispatchList(prev => prev.filter(item => item.dispatch_code !== dispatchCode));
        setFilteredDispatchList(prev => prev.filter(item => item.dispatch_code !== dispatchCode));
        toast.success('Dispatch deleted successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete dispatch');
      }
    } catch (error) {
      console.error('Error deleting dispatch:', error);
      toast.error('Failed to delete dispatch');
    } finally {
      setLoading(false); // Stop loading after delete operation
    }
  };

  // Handler to check date before deletion
  const handleDeleteClick = (dispatchCode: string, createdDate: string) => {
    if (isToday(createdDate)) {
      handleDeleteDispatch(dispatchCode);
    } else {
      toast.warning('Please contact administrative');
    }
  };

  // FIXED: Print Rice Pavti function using the same approach as Dipatchdetials.tsx
  const printRicePavti = (dispatchData: DispatchData) => {
    try {
      console.log('Print Rice Pavti clicked:', dispatchData);

      // Create print content for Rice Pavti
      const riceItems = dispatchData.items.filter((item: DispatchItem) => {
        const itemName = item.name.toLowerCase();
        return itemName.includes('rice') || itemName.includes('चावल') || itemName.includes('तांदुळ');
      });

      if (riceItems.length === 0) {
        toast.error('No rice items found to print');
        return;
      }

      // Calculate total weight (वजन किलो ग्रॅम)
      const totalQty = riceItems.reduce((sum, item) => {
        const qty = typeof item.qty === 'string' ? parseFloat(item.qty) || 0 : Number(item.qty) || 0;
        return sum + qty;
      }, 0);

      // Calculate totals for split tables
      const firstTableTotal = riceItems.slice(0, 10).reduce((sum, item) => {
        const qty = typeof item.qty === 'string' ? parseFloat(item.qty) || 0 : Number(item.qty) || 0;
        return sum + qty;
      }, 0);
      const secondTableTotal = riceItems.slice(10).reduce((sum, item) => {
        const qty = typeof item.qty === 'string' ? parseFloat(item.qty) || 0 : Number(item.qty) || 0;
        return sum + qty;
      }, 0);

      const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rice Pavti - ${dispatchData.dispatch_code}</title>
  <style>
    @page {
      margin: 15mm 10mm;
      size: A4 landscape;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 15px 10px;
      font-size: 12px;
      line-height: 1.3;
      color: #000;
      background: white;
    }
    .page-wrapper {
      width: 100%;
      height: 100vh;
      page-break-after: always;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      gap: 0;
      overflow: hidden;
      padding: 10px 0;
    }
    .page-wrapper:last-child {
      page-break-after: avoid;
    }
    .page-row {
      display: flex;
      flex-direction: row;
      gap: 0;
      width: 100%;
      height: 100%;
      flex: 1;
    }
    .copy-container {
      width: 50%;
      height: 100%;
      margin-bottom: 0;
      page-break-after: avoid;
      page-break-inside: avoid;
      flex: 1;
      padding: 30px 20px;
      border-right: 2px dashed #000;
      box-sizing: border-box;
      overflow: hidden;
    }
    .copy-container:last-child {
      border-right: none;
    }
    .container {
      max-width: 100%;
      margin: 0 auto;
      height: 100%;
      padding: 5px;
    }
    .header {
      text-align: center;
      margin-bottom: 5px;
      padding: 5px 0;
    }
    .title {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      font-size: 16px;
      font-weight: bold;
  margin-bottom: 5px;
      margin-top: 5px;
      width: 100%;
      gap: 10px;
      padding: 0 5px;
    }
    .center-item {
      grid-column: 2;
      text-align: center;
      white-space: nowrap;
    }
    .end-item {
      grid-column: 3;
      text-align: right;
      white-space: nowrap;
    }
    .subtitle {
      font-size: 13px;
      font-weight: 500;
     
      padding: 2px 0;
    }
    .subtitle-center {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 5px;
      padding: 2px 0;
      text-align: center;
      width: 100%;
    }
    .subtitle-small {
      font-size: 12px;
      margin-bottom: 5px;
    }
    .info-section {

      padding: 5px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
   margin-bottom: 5px;
      font-size: 12px;
    }
    .info-left, .info-right {
      flex-basis: 50%;
    }
    .info-left {
      text-align: left;
    }
    .info-right {
      text-align: right;
    }
    .recipient-label {
     margin-bottom: 5px;
      margin-top: 5px;
    }
    .recipient-info {
      margin: 12px 0;
    }
    .recipient-info div {
     margin-bottom: 5px;
    }
    .description-text {
      margin: 8px 0;
      font-size: 12px;
      line-height: 1.4;
      text-align: justify;
      padding: 5px 0;
    }
    .description-text.before-table {
      margin-top: 10px;
  margin-bottom: 5px;
    }
    .description-text.after-total {
      margin-top: 5px;
      margin-bottom: 5px;
    }
      .total-section {
       text-align: right !important;
       margin-top: 12px;
       margin-bottom: 5px;
       font-weight: bold;
       font-size: 11px;
       padding-right: 0;
       width: 100%;
       display: block;
       float: none;
       clear: both;
       margin-left: auto;
       margin-right: 0;
     }
    .total-section span {
      font-weight: bold;
      display: inline-block;
      text-align: right;
      float: right;
      clear: both;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 10px;
    }
    .table th, .table td {
      border: 1px solid #000;
      padding: 5px 4px;
      text-align: center;
      font-size: 10px;
    }
    .table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .table td:first-child {
      width: 40px;
    }
    .table td:nth-child(2) {
      text-align: left;
      width: 60%;
    }
    .table td:last-child {
      width: 80px;
    }
    .table .total-row {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .footer {
      margin-top: 12px;
      padding-top: 8px;
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 12px;
      font-size: 11px;
      padding: 5px 0;
    }
    .signature-left {
      text-align: left;
      width: 50%;
    }
    .signature-right {
      text-align: right;
      width: 50%;
    }
    
    /* Hide elements when printing */
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      @page {
        margin: 15mm 10mm;
        size: A4 landscape;
        marks: none;
        -webkit-print-color-adjust: exact;
      }
      .page-wrapper {
        height: 100vh;
        page-break-after: always;
        page-break-inside: avoid;
        padding: 10px 0;
      }
      .page-wrapper:last-child {
        page-break-after: avoid;
      }
      .copy-container {
        page-break-inside: avoid;
        padding: 15px 12px;
      }
      .container {
        padding: 5px;
      }
      .total-section {
        text-align: right !important;
        margin-top: 12px;
     margin-bottom: 5px;
        font-weight: bold;
        font-size: 11px;
        width: 100%;
        display: block;
        float: none;
        clear: both;
        margin-left: auto;
        margin-right: 0;
      }
      .total-section span {
        text-align: right;
        display: inline-block;
        float: right;
        clear: both;
      }
      .title {
        display: grid !important;
        grid-template-columns: 1fr auto 1fr !important;
        align-items: center !important;
        width: 100% !important;
        gap: 10px !important;
      }
    .center-item {
        grid-column: 2 !important;
        text-align: center !important;
            font-size: 16px !important;
        font-weight: bold !important;
        margin: 0 auto !important;
        justify-self: center !important;
      }
      .end-item {
        grid-column: 3 !important;
        font-size: 16px !important;
        font-weight: bold !important;
        text-align: right !important;
        justify-self: end !important;
      }
      ::after, ::before {
        content: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- Page 1: हेड मास्टर and बी.आर. सी ऑफीस -->
  <div class="page-wrapper">
    <div class="page-row">
      ${[0, 1].map((copyIndex) => {
   const copyTitles = [
     'हेड मास्टर',
     'बी.आर. सी ऑफीस (तालुका ऑफीस)'
   ];
   return `
    <div class="copy-container">
      <div class="container">
        <div class="header">
          <div class="titl">
          <div class="end-item">${copyTitles[copyIndex]}</div>
            <div class="center-item">डिलीव्हरी चलन</div>
          </div>

          <div class="subtitle">मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर</div>
          <div class="subtitle">ता. भोकरदन जि. जालना</div>
       
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-left">पावती क्र- <b>${dispatchData.dispatch_code}</b></span>
            <span class="info-right">दिनांक : <b>${dispatchData.date}</b></span>
          </div>
          <div class="subtitle-center">शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाची पोहोच पावती</div>
          <div class="info-row">
            <span class="info-left">Udise No.- <b>${dispatchData.udaisno}</b></span>
            <span class="info-right">तालुका: <b>${dispatchData.taluka}</b></span>
          </div>
          <div class="info-row">
            <span class="info-left">पट संख्या: <b>${dispatchData.patsankhya || '0'}</b></span>
            <span class="info-right"></span>
          </div>
        </div>

        
      <div class="info-left">प्रति, शाळा प्रमुख / मुख्याध्यापक,</div>
        <div class="info-row">
         
          <div class="info-left">शाळेचे नाव: <b>${dispatchData.schoolname}</b></div>
            <div class="info-right">केंद्र / शाळेचा पुर्ण पत्ता: <b>${dispatchData.center_name}</b></div>
         
        </div>
       

        <div class="description-text before-table">
          आपल्या मागणी प्रमाणे आपणास माहे ${dispatchData.period || 'जुन-जुलै 2025'} (${dispatchData.no_of_days || '38'}) दिवस कालावधी साठी सन ${dispatchData.financial_year || '2025-2026'} करीता ${dispatchData.class_range || '1-5'} साठी खालील तपशिलाप्रमाणे शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाचा पुरवठा वाहन क्रमांक <b>${dispatchData.truckNo}</b> मधुन करण्यात आला आहे.
        </div>

        
        <div style="width: 100%; overflow-x: auto;">
          ${riceItems.length > 10 ? `
          <div style="display: flex; gap: 15px; align-items: flex-start; width: 100%;">
            <table class="table" style="width: 48%; margin: 0;">
              <thead>
                <tr>
                  <th>अ.क्रं.</th>
                  <th>धान्याचे नाव</th>
                  <th>वजन किलो ग्रॅम</th>
                </tr>
              </thead>
              <tbody>
                ${riceItems.slice(0, 10).map((item: DispatchItem, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <table class="table" style="width: 48%; margin: 0;">
              <thead>
                <tr>
                  <th>अ.क्रं.</th>
                  <th>धान्याचे नाव</th>
                  <th>वजन किलो ग्रॅम</th>
                </tr>
              </thead>
              <tbody>
                ${riceItems.slice(10).map((item: DispatchItem, index: number) => `
                  <tr>
                    <td>${index + 11}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <table class="table" style="width: 100%; margin: 0;">
            <tfoot>
              <tr class="total-row">
                <td colspan="2" style="text-align: right; font-weight: bold;">एकूण:</td>
                <td style="text-align: center; font-weight: bold;">${totalQty.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          ` : `
          <table class="table" style="width: 100%; margin: 0;">
            <thead>
              <tr>
                <th>अ.क्रं.</th>
                <th>धान्याचे नाव</th>
                <th>वजन किलो ग्रॅम</th>
              </tr>
            </thead>
            <tbody>
              ${riceItems.map((item: DispatchItem, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}</td>
                  <td>${item.qty}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2" style="text-align: right; font-weight: bold;">एकूण:</td>
                <td style="text-align: center; font-weight: bold;">${totalQty.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          `}
        </div>

        <div class="description-text after-total">
          वरील तपशिलाप्रमाणे पुरवठा करण्यात आलेल्या मालाचा दर्जा व वजन योग्य असून प्रत्यक्ष मोजून माल ताब्यात मिळाला, काही तक्रार नाही. करिता पोहोच पावती देण्यात येत आहे.
        </div>

        <div class="footer">
          <div class="signature-section">
            <div class="signature-left">
              मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर ता. भोकरधन जि. जालना
            </div>
            <div class="signature-right">
              माल ताब्यात घेणाऱ्याची सही व शिक्का
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
      }).join('')}
    </div>
  </div>

  <!-- Page 2: O.C and जिल्हा परिषद ऑफीस -->
  <div class="page-wrapper">
    <div class="page-row">
      ${[2, 3].map((copyIndex) => {
        const copyTitles = [
          'हेड मास्टर',
          'बी.आर. सी ऑफीस (तालुका ऑफीस)',
          'O.C',
          'जिल्हा परिषद ऑफीस'
        ];
        return `
          <div class="copy-container">
            <div class="container">
              <div class="header">
                <div class="title">
                <div class="end-item">${copyTitles[copyIndex]}</div>
                  <div class="center-item">डिलीव्हरी चलन</div>
                </div>

                <div class="subtitle">मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर</div>
                <div class="subtitle">ता. भोकरदन जि. जालना</div>
             
              </div>

              <div class="info-section">
                <div class="info-row">
                  <span class="info-left">पावती क्र- <b>${dispatchData.dispatch_code}</b></span>
                  <span class="info-right">दिनांक : <b>${dispatchData.date}</b></span>
                </div>
                   <div class="title">
                  <span class="subtitle">शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाची पोहोच पावती</span>
                 
                </div>
                <div class="info-row">
                  <span class="info-left">Udise No.- <b>${dispatchData.udaisno}</b></span>
                  <span class="info-right">तालुका: <b>${dispatchData.taluka}</b></span>
                </div>
                <div class="info-row">
                  <span class="info-left">पट संख्या: <b>${dispatchData.patsankhya || '0'}</b></span>
                  <span class="info-right"></span>
                </div>
              </div>

              
            <div class="info-left">प्रति, शाळा प्रमुख / मुख्याध्यापक,</div>
              <div class="info-row">
               
                <div class="info-left">शाळेचे नाव: <b>${dispatchData.schoolname}</b></div>
                  <div class="info-right">केंद्र / शाळेचा पुर्ण पत्ता: <b>${dispatchData.center_name}</b></div>
               
              </div>
             

              <div class="description-text">
                आपल्या मागणी प्रमाणे आपणास माहे ${dispatchData.period || 'जुन-जुलै 2025'} (${dispatchData.no_of_days || '38'}) दिवस कालावधी साठी सन ${dispatchData.financial_year || '2025-2026'} करीता ${dispatchData.class_range || '1-5'} साठी खालील तपशिलाप्रमाणे शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाचा पुरवठा वाहन क्रमांक <b>${dispatchData.truckNo}</b> मधुन करण्यात आला आहे.
              </div>

              <div style="width: 100%; overflow-x: auto;">
                ${riceItems.length > 10 ? `
                <div style="display: flex; gap: 15px; align-items: flex-start; width: 100%;">
                  <table class="table" style="width: 48%; margin: 0;">
                    <thead>
                      <tr>
                        <th>अ.क्रं.</th>
                        <th>धान्याचे नाव</th>
                        <th>वजन किलो ग्रॅम</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${riceItems.slice(0, 10).map((item: DispatchItem, index: number) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${item.name}</td>
                          <td>${item.qty}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  <table class="table" style="width: 48%; margin: 0;">
                    <thead>
                      <tr>
                        <th>अ.क्रं.</th>
                        <th>धान्याचे नाव</th>
                        <th>वजन किलो ग्रॅम</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${riceItems.slice(10).map((item: DispatchItem, index: number) => `
                        <tr>
                          <td>${index + 11}</td>
                          <td>${item.name}</td>
                          <td>${item.qty}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                <table class="table" style="width: 100%; margin: 0;">
                  <tfoot>
                    <tr class="total-row">
                      <td colspan="2" style="text-align: right; font-weight: bold;">एकूण:</td>
                      <td style="text-align: center; font-weight: bold;">${totalQty.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
                ` : `
                <table class="table" style="width: 100%; margin: 0;">
                  <thead>
                    <tr>
                      <th>अ.क्रं.</th>
                      <th>धान्याचे नाव</th>
                      <th>वजन किलो ग्रॅम</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${riceItems.map((item: DispatchItem, index: number) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${item.name}</td>
                        <td>${item.qty}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td colspan="2" style="text-align: right; font-weight: bold;">एकूण:</td>
                      <td style="text-align: center; font-weight: bold;">${totalQty.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
                `}
              </div>

              <div class="description-text">
                वरील तपशिलाप्रमाणे पुरवठा करण्यात आलेल्या मालाचा दर्जा व वजन योग्य असून प्रत्यक्ष मोजून माल ताब्यात मिळाला, काही तक्रार नाही. करिता पोहोच पावती देण्यात येत आहे.
              </div>

              <div class="footer">
                <div class="signature-section">
                  <div class="signature-left">
                    मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर ता. भोकरधन जि. जालना
                  </div>
                  <div class="signature-right">
                    माल ताब्यात घेणाऱ्याची सही व शिक्का
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </div>
</body>
</html>
    `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Unable to open print window. Please check popup blocker.');
        return;
      }

      printWindow.document.write(printContent);
      // printWindow.document.close();

      // Wait for content to load before printing - SAME AS DIPATCHDETIALS.TSX
      printWindow.onload = () => {
        printWindow.focus();

        // Add a small delay to ensure all content is rendered
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

      toast.success('Rice Pavti print window opened');
    } catch (error) {
      console.error('Error printing rice pavti:', error);
      toast.error('Failed to print rice pavti');
    }
  };

  // FIXED: Print Kirana function using the same approach as Dipatchdetials.tsx
  const printKirana = (dispatchData: DispatchData) => {
    try {
      console.log('Print Kirana clicked:', dispatchData);

      // Create print content for Kirana
      const kiranaItems = dispatchData.items.filter((item: DispatchItem) => {
        const itemName = item.name.toLowerCase();
        return !itemName.includes('rice') && !itemName.includes('चावल') && !itemName.includes('तांदुळ');
      });

      if (kiranaItems.length === 0) {
        toast.error('No kirana items found to print');
        return;
      }

      // Calculate total weight (वजन किलो ग्रॅम)
      const totalQty = kiranaItems.reduce((sum, item) => {
        const qty = typeof item.qty === 'string' ? parseFloat(item.qty) || 0 : Number(item.qty) || 0;
        return sum + qty;
      }, 0);

      const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Kirana - ${dispatchData.dispatch_code}</title>
  <style>
    @page {
      margin: 15mm 10mm;
      size: A4 landscape;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 15px 10px;
      font-size: 12px;
      line-height: 1.3;
      color: #000;
      background: white;
    }
    .page-wrapper {
      width: 100%;
      height: 100vh;
      page-break-after: always;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      gap: 0;
      overflow: hidden;
      padding: 10px 0;
    }
    .page-wrapper:last-child {
      page-break-after: avoid;
    }
    .page-row {
      display: flex;
      flex-direction: row;
      gap: 0;
      width: 100%;
      height: 100%;
      flex: 1;
    }
    .copy-container {
      width: 50%;
      height: 100%;
      margin-bottom: 0;
      page-break-after: avoid;
      page-break-inside: avoid;
      flex: 1;
      padding: 30px 20px;
      border-right: 2px dashed #000;
      box-sizing: border-box;
      overflow: hidden;
    }
    .copy-container:last-child {
      border-right: none;
    }
    .container {
      max-width: 100%;
      margin: 0 auto;
      height: 100%;
      padding: 5px;
    }
    .header {
      text-align: center;
     margin-bottom: 5px;
      padding: 5px 0;
    }
    .title {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      font-size: 16px;
      font-weight: bold;
     margin-bottom: 5px;
      margin-top: 5px;
      width: 100%;
      gap: 10px;
      padding: 0 5px;
    }
    .center-item {
      grid-column: 2;
      text-align: center;
      white-space: nowrap;
    }
    .end-item {
      grid-column: 3;
      text-align: right;
      white-space: nowrap;
    }
    .subtitle {
      font-size: 13px;
      font-weight: 500;
      
      padding: 2px 0;
    }
    .subtitle-center {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 5px;
      padding: 2px 0;
      text-align: center;
      width: 100%;
    }
    .subtitle-small {
      font-size: 12px;
      margin-bottom: 5px;
    }
    .info-section {

      padding: 5px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
     margin-bottom: 5px;
      font-size: 12px;
    }
    .info-left, .info-right {
      flex-basis: 50%;
    }
    .info-left {
      text-align: left;
    }
    .info-right {
      text-align: right;
    }
    .recipient-label {
   margin-bottom: 5px;
      margin-top: 5px;
    }
    .recipient-info {
      margin: 12px 0;
    }
    .recipient-info div {
      margin-bottom: 4px;
    }
  .description-text {
      margin: 8px 0;
      font-size: 12px;
      line-height: 1.4;
      text-align: justify;
      padding: 5px 0;
    }
    .description-text.before-table {
      margin-top: 10px;
      margin-bottom: 5px;
    }
    .description-text.after-total {
      margin-top: 5px;
      margin-bottom: 5px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
      font-size: 10px;
    }
    .table th, .table td {
      border: 1px solid #000;
      padding: 3px;
      text-align: center;
      font-size: 10px;
    }
    .table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .table td:first-child {
      width: 40px;
    }
    .table td:nth-child(2) {
      text-align: left;
      width: 60%;
    }
    .table td:last-child {
      width: 80px;
    }
    .table .total-row {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .footer {
      margin-top: 2px;
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
      font-size: 12px;
    }
    .signature-left {
      text-align: left;
      width: 50%;
    }
    .signature-right {
      text-align: right;
      width: 50%;
    }
    
    /* Hide elements when printing */
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      @page {
        margin: 15mm 10mm;
        size: A4 landscape;
        marks: none;
        -webkit-print-color-adjust: exact;
      }
      .page-wrapper {
        height: 100vh;
        page-break-after: always;
        page-break-inside: avoid;
        padding: 10px 0;
      }
      .page-wrapper:last-child {
        page-break-after: avoid;
      }
      .copy-container {
        page-break-inside: avoid;
        padding: 15px 12px;
      }
      .container {
        padding: 5px;
      }
      .total-section {
        text-align: right !important;
        margin-top: 12px;
        margin-bottom: 5px;
        font-weight: bold;
        font-size: 11px;
        width: 100%;
        // display: block;
        float: none;
        clear: both;
        margin-left: auto;
        margin-right: 0;
        padding-right: 10px;
      }
      .total-section span {
        text-align: right;
        display: inline-block;
        float: right;
        clear: both;
      }
      .title {
        display: grid !important;
        grid-template-columns: 1fr auto 1fr !important;
        align-items: center !important;
        width: 100% !important;
        gap: 10px !important;
      }
      .center-item {
        grid-column: 2 !important;
        text-align: center !important;
            font-size: 16px !important;
        font-weight: bold !important;
        margin: 0 auto !important;
        justify-self: center !important;
      }
      .end-item {
        grid-column: 3 !important;
        font-size: 16px !important;
        font-weight: bold !important;
        text-align: right !important;
        justify-self: end !important;
      }
      ::after, ::before {
        content: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- Page 1: हेड मास्टर and बी.आर. सी ऑफीस -->
  <div class="page-wrapper">
    <div class="page-row">
      ${[0, 1].map((copyIndex) => {
   const copyTitles = [
     'हेड मास्टर',
     'बी.आर. सी ऑफीस (तालुका ऑफीस)'
   ];
   return `
    <div class="copy-container">
      <div class="container">
        <div class="header">
          <div class="titl">
           <div class="end-item">${copyTitles[copyIndex]}</div>
            <div class="center-item">डिलीव्हरी चलन</div>
           
          </div>

          <div class="subtitle">मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर</div>
          <div class="subtitle">ता. भोकरधन जि. जालना</div>
         
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-left">पावती क्र- <b>${dispatchData.dispatch_code}</b></span>
            <span class="info-right">दिनांक : <b>${dispatchData.date}</b></span>
          </div>
          <div class="subtitle-center">शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाची पोहोच पावती</div>
          <div class="info-row">
            <span class="info-left">Udise No.- <b>${dispatchData.udaisno}</b></span>
            <span class="info-right">तालुका: <b>${dispatchData.taluka}</b></span>
          </div>
          <div class="info-row">
            <span class="info-left">पट संख्या: <b>${dispatchData.patsankhya || '0'}</b></span>
            <span class="info-right"></span>
          </div>
        </div>

        
 <div class="info-left recipient-label">प्रति, शाळा प्रमुख / मुख्याध्यापक,</div>
        <div class="info-row">
         
          <div class="info-left">शाळेचे नाव: <b>${dispatchData.schoolname}</b></div>
            <div class="info-right">केंद्र / शाळेचा पुर्ण पत्ता: <b>${dispatchData.center_name}</b></div>
         
        </div>
       

        <div class="description-text before-table">
          आपल्या मागणी प्रमाणे आपणास माहे ${dispatchData.period || 'जुन-जुलै 2025'} (${dispatchData.no_of_days || '38'}) दिवस कालावधी साठी सन ${dispatchData.financial_year || '2025-2026'} करीता ${dispatchData.class_range || '1-5'} साठी खालील तपशिलाप्रमाणे शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाचा पुरवठा वाहन क्रमांक <b>${dispatchData.truckNo}</b> मधुन करण्यात आला आहे.
        </div>

        <div style="width: 100%; overflow-x: auto;">
          ${kiranaItems.length > 8 ? `
          <div style="display: flex; gap: 15px; align-items: flex-start; width: 100%;">
            <table class="table" style="width: 48%; margin: 0;">
              <thead>
                <tr>
                  <th>अ.क्रं.</th>
                  <th>धान्याचे नाव</th>
                  <th>वजन किलो ग्रॅम</th>
                </tr>
              </thead>
              <tbody>
                ${kiranaItems.slice(0, 8).map((item: DispatchItem, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <table class="table" style="width: 48%; margin: 0;">
              <thead>
                <tr>
                  <th>अ.क्रं.</th>
                  <th>धान्याचे नाव</th>
                  <th>वजन किलो ग्रॅम</th>
                </tr>
              </thead>
              <tbody>
                ${kiranaItems.slice(8, 16).map((item: DispatchItem, index: number) => `
                  <tr>
                    <td>${index + 9}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="total-section">
            <span><b>एकूण:</b> ${totalQty.toFixed(2)}</span>
          </div>
          ` : `
          <table class="table" style="width: 100%; margin: 0;">
            <thead>
              <tr>
                <th>अ.क्रं.</th>
                <th>धान्याचे नाव</th>
                <th>वजन किलो ग्रॅम</th>
              </tr>
            </thead>
            <tbody>
              ${kiranaItems.map((item: DispatchItem, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}</td>
                  <td>${item.qty}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-section">
            <span><b>एकूण:</b> ${totalQty.toFixed(2)}</span>
          </div>
          `}
        </div>

        <div class="description-text after-total">
          वरील तपशिलाप्रमाणे पुरवठा करण्यात आलेल्या मालाचा दर्जा व वजन योग्य असून प्रत्यक्ष मोजून माल ताब्यात मिळाला, काही तक्रार नाही. करिता पोहोच पावती देण्यात येत आहे.
        </div>

        <div class="footer">
          <div class="signature-section">
            <div class="signature-left">
              मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर ता. भोकरधन जि. जालना
            </div>
            <div class="signature-right">
              माल ताब्यात घेणाऱ्याची सही व शिक्का
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
      }).join('')}
    </div>
  </div>

  <!-- Page 2: O.C and जिल्हा परिषद ऑफीस -->
  <div class="page-wrapper">
    <div class="page-row">
      ${[2, 3].map((copyIndex) => {
        const copyTitles = [
          'हेड मास्टर',
          'बी.आर. सी ऑफीस (तालुका ऑफीस)',
          'O.C',
          'जिल्हा परिषद ऑफीस'
        ];
        return `
          <div class="copy-container">
            <div class="container">
              <div class="header">
                <div class="title">
                <div class="end-item">${copyTitles[copyIndex]}</div>
                  <div class="center-item">डिलीव्हरी चलन</div>
                </div>

                <div class="subtitle">मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर</div>
                <div class="subtitle">ता. भोकरदन जि. जालना</div>
             
              </div>

              <div class="info-section">
                <div class="info-row">
                  <span class="info-left">पावती क्र- <b>${dispatchData.dispatch_code}</b></span>
                  <span class="info-right">दिनांक : <b>${dispatchData.date}</b></span>
                </div>
                   <div class="title">
                  <span class="subtitle">शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाची पोहोच पावती</span>
                 
                </div>
                <div class="info-row">
                  <span class="info-left">Udise No.- <b>${dispatchData.udaisno}</b></span>
                  <span class="info-right">तालुका: <b>${dispatchData.taluka}</b></span>
                </div>
                <div class="info-row">
                  <span class="info-left">पट संख्या: <b>${dispatchData.patsankhya || '0'}</b></span>
                  <span class="info-right"></span>
                </div>
              </div>

              
            <div class="info-left">प्रति, शाळा प्रमुख / मुख्याध्यापक,</div>
              <div class="info-row">
               
                <div class="info-left">शाळेचे नाव: <b>${dispatchData.schoolname}</b></div>
                  <div class="info-right">केंद्र / शाळेचा पुर्ण पत्ता: <b>${dispatchData.center_name}</b></div>
               
              </div>
             

              <div class="description-text">
                आपल्या मागणी प्रमाणे आपणास माहे ${dispatchData.period || 'जुन-जुलै 2025'} (${dispatchData.no_of_days || '38'}) दिवस कालावधी साठी सन ${dispatchData.financial_year || '2025-2026'} करीता ${dispatchData.class_range || '1-5'} साठी खालील तपशिलाप्रमाणे शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाचा पुरवठा वाहन क्रमांक <b>${dispatchData.truckNo}</b> मधुन करण्यात आला आहे.
              </div>

              <div style="width: 100%; overflow-x: auto;">
                ${kiranaItems.length > 8 ? `
                <div style="display: flex; gap: 15px; align-items: flex-start; width: 100%;">
                  <table class="table" style="width: 48%; margin: 0;">
                    <thead>
                      <tr>
                        <th>अ.क्रं.</th>
                        <th>धान्याचे नाव</th>
                        <th>वजन किलो ग्रॅम</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${kiranaItems.slice(0, 8).map((item: DispatchItem, index: number) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${item.name}</td>
                          <td>${item.qty}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  <table class="table" style="width: 48%; margin: 0;">
                    <thead>
                      <tr>
                        <th>अ.क्रं.</th>
                        <th>धान्याचे नाव</th>
                        <th>वजन किलो ग्रॅम</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${kiranaItems.slice(8, 16).map((item: DispatchItem, index: number) => `
                        <tr>
                          <td>${index + 9}</td>
                          <td>${item.name}</td>
                          <td>${item.qty}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
               <div class="total-section">
                  <span><b>एकूण:</b> ${totalQty.toFixed(2)}</span>
                </div>
                ` : `
                <table class="table" style="width: 100%; margin: 0;">
                  <thead>
                    <tr>
                      <th>अ.क्रं.</th>
                      <th>धान्याचे नाव</th>
                      <th>वजन किलो ग्रॅम</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${kiranaItems.map((item: DispatchItem, index: number) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${item.name}</td>
                        <td>${item.qty}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div class="total-section">
                  <span><b>एकूण:</b> ${totalQty.toFixed(2)}</span>
                </div>
                `}
              </div>

              <div class="description-text">
                वरील तपशिलाप्रमाणे पुरवठा करण्यात आलेल्या मालाचा दर्जा व वजन योग्य असून प्रत्यक्ष मोजून माल ताब्यात मिळाला, काही तक्रार नाही. करिता पोहोच पावती देण्यात येत आहे.
              </div>

              <div class="footer">
                <div class="signature-section">
                  <div class="signature-left">
                    मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर ता. भोकरधन जि. जालना
                  </div>
                  <div class="signature-right">
                    माल ताब्यात घेणाऱ्याची सही व शिक्का
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </div>
</body>
</html>
    `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Unable to open print window. Please check popup blocker.');
        return;
      }

      printWindow.document.write(printContent);
      // printWindow.document.close();

      // Wait for content to load before printing - SAME AS DIPATCHDETIALS.TSX
      printWindow.onload = () => {
        printWindow.focus();

        // Add a small delay to ensure all content is rendered
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

      toast.success('Kirana print window opened');
    } catch (error) {
      console.error('Error printing kirana:', error);
      toast.error('Failed to print kirana');
    }
  };

  //   // FIXED: Print Route Paper function using the same approach as Dipatchdetials.tsx
  //   const printRoutePaper = (dispatchCode: string) => {
  //     const dispatchData = dispatchList.filter(item => item.dispatch_code === dispatchCode);

  //     if (dispatchData.length === 0) {
  //         toast.error('Dispatch data not found for printing');
  //         return;
  //     }

  //     // Get all unique items in the dispatch
  //     const allItemNames = getAllItemNames(dispatchData);

  //     // Group by school and calculate totals
  //     const schoolsMap = new Map();
  //     dispatchData.forEach(row => {
  //         const schoolKey = `${row.school_id}-${row.class_range || ''}`;
  //         if (!schoolsMap.has(schoolKey)) {
  //             const talukaName = getTalukaNameBySchoolId(row.school_id);
  //             const udiseNumber = getUdiseNumberBySchoolId(row.school_id);
  //             schoolsMap.set(schoolKey, {
  //                 schoolname: row.schoolname || '',
  //                 class_range: row.class_range || '',
  //                 center_name: row.center_name || '',
  //                 taluka_name: talukaName,
  //                 udise_number: udiseNumber,
  //                 patsankhya: row.patsankhya || '',
  //                 items: [],
  //                 receipts: new Set<string>(),
  //             });
  //         }

  //         schoolsMap.get(schoolKey).items.push({
  //             name: row.item_name,
  //             qty: row.qty_dispatch,
  //             unit: row.unit
  //         });

  //         if (row.dispatch_code) {
  //             schoolsMap.get(schoolKey).receipts.add(String(row.dispatch_code));
  //         }
  //     });

  //     const schools = Array.from(schoolsMap.values());

  //     // Calculate grand totals for all items
  //     const grandTotals: Record<string, number> = {};

  //     schools.forEach(school => {
  //         const schoolSums = sumGrainsForGroup(school.items);
  //         Object.entries(schoolSums).forEach(([itemName, qty]) => {
  //             grandTotals[itemName] = (grandTotals[itemName] || 0) + qty;
  //         });
  //     });

  //     // Calculate overall total
  //     const overallTotal = Object.values(grandTotals).reduce((sum, qty) => sum + qty, 0);

  //     // Get dynamic data from first dispatch item
  //     const firstDispatchItem = dispatchData[0];
  //     const dispatchDate = firstDispatchItem?.created_at ? formatDate(firstDispatchItem.created_at) : '';
  //     const orderNo = firstDispatchItem?.order_no || '';
  //     const dispatchCodeValue = firstDispatchItem?.dispatch_code || '';
  //     const vehicleNo = firstDispatchItem?.truckNo || '';
  //     const periodText = firstDispatchItem?.period || 'Aug-Sept-2025';
  //     const daysText = firstDispatchItem?.no_of_days ? `${firstDispatchItem.no_of_days} Days` : '42 Days';

  //     // Open print window with Excel-style formatting
  //     const printWindow = window.open('', '_blank');
  //     if (printWindow) {
  //         printWindow.document.write(`
  //             <html>
  //                 <head>
  //                     <title>Route Paper - ${dispatchCode}</title>
  //                     <style>
  //                         body { 
  //                             font-family: Arial, sans-serif; 
  //                             margin: 10px; 
  //                             font-size: 12px;
  //                         }
  //                         .header-table {
  //                             width: 100%;
  //                             border-collapse: collapse;
  //                             margin-bottom: 14px;
  //                         }
  //                         .header-table td {
  //                             vertical-align: top;
  //                             padding: 0 5px;
  //                         }
  //                         .header-org {
  //                             font-size: 13px; 
  //                             font-weight: bold; 
  //                             line-height: 1.25; 
  //                             text-align: center;
  //                             margin-bottom: 10px;
  //                         }
  //                         .header-logo {
  //                             width: 78px;
  //                             height: auto;
  //                             display: block;
  //                             margin: 6px auto 3px auto;
  //                         }
  //                         .dispatch-detail {
  //                             text-align: left;
  //                             font-size: 12px;
  //                             line-height: 1.55;
  //                         }
  //                         .driver-detail {
  //                             text-align: right;
  //                             font-size: 12px;
  //                             line-height: 1.55;
  //                         }
  //                         .header-center { 
  //                             font-size: 12px;
  //                             font-weight: bold;
  //                             text-align: right;
  //                             margin-top: 6px; 
  //                         }
  //                         .dataflex {
  //                             display: flex;
  //                             justify-content: space-around;
  //                             align-items: flex-start;
  //                             margin-top: 10px;
  //                             width: 100%;
  //                         }
  //                         .dataflex > div {
  //                             flex: 1;
  //                             text-align: center;
  //                             padding: 0 10px;
  //                         }
  //                         .dataflex > div:first-child {
  //                             text-align: left;
  //                         }
  //                         .dataflex > div:last-child {
  //                             text-align: right;
  //                         }
  //                         .center-title {
  //                             font-size: 12px;
  //                             font-weight: bold;
  //                             text-align: center;
  //                             margin-top: 10px;
  //                         }
  //                         .table { 
  //                             width: 100%; 
  //                             border-collapse: collapse; 
  //                             border: 1px solid #000;
  //                         }
  //                         .table th, .table td { 
  //                             border: 1px solid #000; 
  //                             padding: 4px 6px; 
  //                             text-align: center;
  //                             font-size: 11px;
  //                         }
  //                         .table th { 
  //                             background-color: #f0f0f0; 
  //                             font-weight: bold;
  //                         }
  //                         .total-row { 
  //                             background-color: #e6e6e6; 
  //                             font-weight: bold;
  //                         }
  //                         .grain-column {
  //                             min-width: 60px;
  //                         }
  //                         .serial-column {
  //                             min-width: 30px;
  //                         }
  //                         .center-align {
  //                             text-align: center;
  //                         }
  //                         .left-align {
  //                             text-align: left;
  //                         }
  //                         .right-align {
  //                             text-align: right;
  //                         }
  //                         .footer { 
  //                             margin-top: 15px; 
  //                             text-align: center;
  //                             font-size: 11px;
  //                             border-top: 1px solid #000;
  //                             padding-top: 5px;
  //                         }
  //                         @media print {
  //                             body { margin: 5mm; }
  //                             .table { font-size: 10px; }
  //                         }
  //                     </style>
  //                 </head>
  //                 <body>
  //                     <table class="header-table">
  //                         <tr>
  //                             <td style="width:44%; text-align:center;">
  //                                 <div class="header-org">
  //                                     मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजुर , ता . भोकरधन, जि. जालना <br>
  //                                     शालेय पोषण आहार योजना, शिक्षण विभाग ( प्राथमिक, जिल्हा परिषद नंदुरबार
  //                                 </div>
  //                                 <div class="dataflex">
  //                                     <div>
  //                                         Dispatch No. - ${dispatchCodeValue}<br>
  //                                         Dispatch date - ${dispatchDate}<br>
  //                                         पुरवठा माहे - ${periodText} (${daysText})<br>
  //                                         Order No. - ${orderNo}<br>
  //                                         Total Weight - <b>${overallTotal.toFixed(2)}</b>
  //                                     </div>
  //                                     <div>
  //                                         <img src="/images/login/logo.png" alt="Logo" class="header-logo" />
  //                                     </div>
  //                                     <div>
  //                                         Driver MOTIRAM PADAVI<br>
  //                                         Mob 9022899429<br>
  //                                         Vehicle No ${vehicleNo}<br>
  //                                         <div class="header-center"> तळोदे जि. नंदुरबार</div>
  //                                     </div>
  //                                 </div>
  //                                 <div class="center-title">
  //                                     मध्यदाय भोजन योजना <br> Mid Day Meal Scheme 
  //                                 </div>
  //                             </td>
  //                         </tr>
  //                     </table>

  //                     <table class="table">
  //                         <thead>
  //                             <tr>
  //                                 <th class="serial-column">अ. क्र.</th>
  //                                 <th class="left-align">तालुका</th>
  //                                 <th class="left-align">पावती क्रमांक</th>
  //                                 <th class="left-align">केंद्र</th>
  //                                 <th class="left-align">UDISE Code</th>
  //                                 <th class="left-align">शाळा</th>
  //                                 <th class="center-align">वर्ग</th>
  //                                 <th class="center-align">पट संख्या</th>
  //                                 ${allItemNames.map(item =>
  //                                     `<th class="grain-column">${item}</th>`
  //                                 ).join('')}
  //                                 <th class="center-align">एकूण</th>
  //                                 <th class="center-align">हेड मास्टर मोबाइल No.</th>
  //                             </tr>
  //                         </thead>
  //                         <tbody>
  //                             ${schools.map((school, index) => {
  //                                 const grainSums = sumGrainsForGroup(school.items);
  //                                 const schoolTotal = Object.values(grainSums).reduce((sum, qty) => sum + qty, 0);
  //                                 const receipts = school.receipts ? Array.from(school.receipts).join(', ') : '-';
  //                                 return `
  //                                     <tr>
  //                                         <td class="center-align">${index + 1}</td>
  //                                         <td class="left-align">${school.taluka_name || '-'}</td>
  //                                         <td class="left-align">${receipts}</td>
  //                                         <td class="left-align">${school.center_name}</td>
  //                                         <td class="center-align">${school.udise_number || '-'}</td>
  //                                         <td class="left-align">${school.schoolname}</td>
  //                                         <td class="center-align">${school.class_range}</td>
  //                                         <td class="center-align">${school.patsankhya || '-'}</td>
  //                                         ${allItemNames.map(item =>
  //                                             `<td class="right-align">${grainSums[item] ? grainSums[item].toFixed(2) : '0.00'}</td>`
  //                                         ).join('')}
  //                                         <td class="right-align">${schoolTotal.toFixed(2)}</td>
  //                                         <td class="center-align">-</td>
  //                                     </tr>
  //                                 `;
  //                             }).join('')}
  //                             <tr class="total-row">
  //                                 <td colspan="8" class="right-align"><strong>एकूण:</strong></td>
  //                                 ${allItemNames.map(item =>
  //                                     `<td class="right-align"><strong>${grandTotals[item] ? grandTotals[item].toFixed(2) : '0.00'}</strong></td>`
  //                                 ).join('')}
  //                                 <td class="right-align"><strong>${overallTotal.toFixed(2)}</strong></td>
  //                                 <td class="center-align"></td>
  //                             </tr>
  //                         </tbody>
  //                     </table>

  //                     <div class="footer">
  //                         <table style="width: 100%; margin-top: 20px;">
  //                             <tr>
  //                                 <td style="width: 33%; text-align: center;">
  //                                     <p>तपासणी अधिकारी</p>
  //                                     <p>___________________________________</p>
  //                                 </td>
  //                                 <td style="width: 33%; text-align: center;">
  //                                     <p>वाहन चालक</p>
  //                                     <p>___________________________________</p>
  //                                 </td>
  //                                 <td style="width: 33%; text-align: center;">
  //                                     <p>सह्या</p>
  //                                     <p>___________________________________</p>
  //                                 </td>
  //                             </tr>
  //                         </table>
  //                         <p style="margin-top: 10px;">Generated by System - जिल्हा परिषद प्राथमिक शाळा</p>
  //                         <p style="margin-top: 5px;">Dispatch: ${dispatchCode} | Total Items: ${allItemNames.length} | Total Weight: ${overallTotal.toFixed(2)} Kg</p>
  //                     </div>

  //                     <script>
  //                         window.onload = function() {
  //                             window.print();
  //                             setTimeout(function() {
  //                                 window.close();
  //                             }, 1000);
  //                         }
  //                     </script>
  //                 </body>
  //             </html>
  //         `);
  //     }
  // };

  // FIXED: Print DC function using the same approach as Dipatchdetials.tsx
  //   const printDC = (dispatchData: DispatchData) => {
  //     try {
  //       console.log('Print DC clicked:', dispatchData);

  //       const printContent = `
  // <!DOCTYPE html>
  // <html>
  // <head>
  //   <meta charset="UTF-8">
  //   <title>Delivery Challan - ${dispatchData.dispatch_code}</title>
  //   <style>
  //     @page {
  //       margin: 0;
  //       size: A4;
  //     }
  //     * {
  //       margin: 0;
  //       padding: 0;
  //       box-sizing: border-box;
  //     }
  //     body {
  //       font-family: 'Arial', sans-serif;
  //       margin: 0;
  //       padding: 10px;
  //       font-size: 12px;
  //       line-height: 1.3;
  //       color: #000;
  //       background: white;
  //     }
  //     .copy-container {
  //       width: 100%;
  //       margin-bottom: 20px;
  //       page-break-after: always;
  //     }
  //     .copy-container:last-child {
  //       page-break-after: avoid;
  //     }
  //     .container {
  //       max-width: 100%;
  //       margin: 0 auto;
  //     }
  //     .header {
  //       text-align: center;
  //       margin-bottom: 15px;
  //     }
  //     .title {
  //       display: flex;
  //       align-items: center;
  //       justify-content: center;
  //       font-size: 16px;
  //       font-weight: bold;
  //       margin-bottom: 6px;
  //       position: relative;
  //       margin-top: 10px;
  //     }
  //     .center-item {
  //       position: absolute;
  //       left: 50%;
  //       transform: translateX(-50%);
  //       white-space: nowrap;
  //     }
  //     .end-item {
  //       margin-left: auto;
  //     }
  //     .subtitle {
  //       font-size: 13px;
  //       font-weight: 500;
  //       margin-bottom: 4px;
  //     }
  //     .subtitle-small {
  //       font-size: 12px;
  //       margin-bottom: 4px;
  //     }
  //     .info-section {
  //       margin-bottom: 12px;
  //     }
  //     .info-row {
  //       display: flex;
  //       justify-content: space-between;
  //       margin-bottom: 6px;
  //       font-size: 12px;
  //     }
  //     .info-left, .info-right {
  //       flex-basis: 50%;
  //     }
  //     .info-left {
  //       text-align: left;
  //     }
  //     .info-right {
  //       text-align: right;
  //     }
  //     .recipient-info {
  //       margin: 12px 0;
  //     }
  //     .recipient-info div {
  //       margin-bottom: 4px;
  //     }
  //     .description-text {
  //       margin: 12px 0;
  //       font-size: 12px;
  //       line-height: 1.4;
  //       text-align: justify;
  //     }
  //     .table {
  //       width: 100%;
  //       border-collapse: collapse;
  //       margin: 15px 0;
  //       font-size: 11px;
  //     }
  //     .table th, .table td {
  //       border: 1px solid #000;
  //       padding: 6px;
  //       text-align: center;
  //       font-size: 11px;
  //     }
  //     .table th {
  //       background-color: #f0f0f0;
  //       font-weight: bold;
  //     }
  //     .table td:first-child {
  //       width: 40px;
  //     }
  //     .table td:nth-child(2) {
  //       text-align: left;
  //       width: 60%;
  //     }
  //     .table td:last-child {
  //       width: 80px;
  //     }
  //     .footer {
  //       margin-top: 25px;
  //     }
  //     .signature-section {
  //       display: flex;
  //       justify-content: space-between;
  //       margin-top: 30px;
  //       font-size: 12px;
  //     }
  //     .signature-left {
  //       text-align: left;
  //       width: 50%;
  //     }
  //     .signature-right {
  //       text-align: right;
  //       width: 50%;
  //     }

  //     /* Hide elements when printing */
  //     @media print {
  //       body {
  //         padding: 10px;
  //       }
  //       @page {
  //         margin: 0;
  //         size: A4;
  //         marks: none;
  //         -webkit-print-color-adjust: exact;
  //       }
  //       ::after, ::before {
  //         content: none !important;
  //       }
  //     }
  //   </style>
  // </head>
  // <body>
  //  ${Array.from({ length: 4 }, (_, copyIndex) => `
  //     <div class="copy-container">
  //       <div class="container">
  //         <div class="header">
  //           <div class="title">
  //             <div class="center-item">डिलीव्हरी चलन</div>
  //             <div class="end-item">Copy ${copyIndex + 1}</div>
  //           </div>

  //           <div class="subtitle">मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर</div>
  //           <div class="subtitle">ता. भोकरधन जि. जालना</div>
  //           <div class="subtitle-small">शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाची पोहोच पावती</div>
  //         </div>

  //         <div class="info-section">
  //           <div class="info-row">
  //             <span class="info-left">पावती क्र- <b>${dispatchData.dispatch_code}</b></span>
  //             <span class="info-right">दिनांक : <b>${dispatchData.date}</b></span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-left">Udise No.- <b>${dispatchData.udaisno}</b></span>
  //             <span class="info-right">तालुका: <b>${dispatchData.taluka}</b></span>
  //           </div>
  //         </div>

  //         <div class="recipient-info">
  //           <div>प्रति, शाळा प्रमुख / मुख्याध्यापक,</div>
  //           <div>शाळेचे नाव: <b>${dispatchData.schoolname}</b></div>
  //           <div>केंद्र / शाळेचा पुर्ण पत्ता: <b>${dispatchData.center_name}</b></div>
  //         </div>

  //         <div class="description-text">
  //           आपल्या मागणी प्रमाणे आपणास माहे ${dispatchData.period || 'जुन-जुलै 2025'} (${dispatchData.no_of_days || '38'}) दिवस कालावधी साठी सन ${dispatchData.financial_year || '2025-2026'} करीता ${dispatchData.class_range || '1-5'} साठी खालील तपशिलाप्रमाणे शालेय पोषण आहार योजने अंतर्गत धान्यादी मालाचा पुरवठा वाहन क्रमांक <b>${dispatchData.truckNo}</b> मधुन करण्यात आला आहे.
  //         </div>

  //         <div style="display: flex; gap: 20px; align-items: flex-start;">
  //           <table class="table" style="flex: 1;">
  //             <thead>
  //               <tr>
  //                 <th>अ.क्रं.</th>
  //                 <th>धान्याचे नाव</th>
  //                 <th>वजन किलो ग्रॅम</th>
  //               </tr>
  //             </thead>
  //             <tbody>
  //               ${dispatchData.items.slice(0, 10).map((item: DispatchItem, index: number) => `
  //                 <tr>
  //                   <td>${index + 1}</td>
  //                   <td>${item.name}</td>
  //                   <td>${item.qty}</td>
  //                 </tr>
  //               `).join('')}
  //             </tbody>
  //           </table>

  //           ${dispatchData.items.length > 10 ? `
  //           <table class="table" style="flex: 1;">
  //             <thead>
  //               <tr>
  //                 <th>अ.क्रं.</th>
  //                 <th>धान्याचे नाव</th>
  //                 <th>वजन किलो ग्रॅम</th>
  //               </tr>
  //             </thead>
  //             <tbody>
  //               ${dispatchData.items.slice(10).map((item: DispatchItem, index: number) => `
  //                 <tr>
  //                   <td>${index + 11}</td>
  //                   <td>${item.name}</td>
  //                   <td>${item.qty}</td>
  //                 </tr>
  //               `).join('')}
  //             </tbody>
  //           </table>
  //           ` : ''}
  //         </div>

  //         <div class="description-text">
  //           वरील तपशिलाप्रमाणे पुरवठा करण्यात आलेल्या मालाचा दर्जा व वजन योग्य असून प्रत्यक्ष मोजून माल ताब्यात मिळाला, काही तक्रार नाही. करिता पोहोच पावती देण्यात येत आहे.
  //         </div>

  //         <div class="footer">
  //           <div class="signature-section">
  //             <div class="signature-left">
  //               मोरेश्वर महिला प्राथमिक ग्राहक सहकारी संस्था म. राजूर ता. भोकरधन जि. जालना
  //             </div>
  //             <div class="signature-right">
  //               माल ताब्यात घेणाऱ्याची सही व शिक्का
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   `).join('')}
  // </body>
  // </html>
  //     `;

  //       // Open print window
  //       const printWindow = window.open('', '_blank');
  //       if (!printWindow) {
  //         toast.error('Unable to open print window. Please check popup blocker.');
  //         return;
  //       }

  //       printWindow.document.write(printContent);
  //       // printWindow.document.close();

  //       // Wait for content to load before printing - SAME AS DIPATCHDETIALS.TSX
  //       printWindow.onload = () => {
  //         printWindow.focus();

  //         // Add a small delay to ensure all content is rendered
  //         setTimeout(() => {
  //           printWindow.print();
  //         }, 500);
  //       };

  //       toast.success('DC print window opened');
  //     } catch (error) {
  //       console.error('Error printing DC:', error);
  //       toast.error('Failed to print DC');
  //     }
  //   };

  // Updated table columns with proper delete button
  const listColumns: Column<DispatchListRow>[] = [
    // Delete button column (Bin) - Fixed implementation
   

    // Action column with 4 print buttons
    {
      key: 'action',
      label: 'ACTION',
      render: (r) => {
        // build items array for this row's school+order+class
        const schoolItems = dispatchList
          .filter(d =>
            d.schoolname === r.schoolname &&
            d.order_no === r.order_no &&
            String(d.class_range || '') === String(r.class_range || '')
          )
          .map(d => ({ name: d.item_name, qty: d.qty_dispatch, unit: d.unit }));

        const sd = r.school_id ? schoolDataById.get(Number(r.school_id)) : undefined;
        const talukaName = sd ? (talukaList.find(t => t.taluka_id === sd.taluka_id)?.name || '') : '';
        const payload = {
          dispatch_code: r.dispatch_code,
          schoolname: r.schoolname || '',
          udaisno: sd?.udaisno || '',
          taluka: talukaName,
          center_name: (centerList.find(cn => String(cn.center_id) === String(r.center_id))?.marathi_name) || r.center_name || '',
          truckNo: r.truckNo || '',
          date: formatDateToDDMMYYYY(r.created_at),
          class_range: r.class_range || '',
          period: r.period || '',
          no_of_days: r.no_of_days || 0,
          financial_year: r.financial_year || '',
          patsankhya: r.patsankhya || '0',
          items: schoolItems
        };

        return (
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => printRicePavti(payload)}
              className="px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 text-xs"
              title="Print Rice Pavti"
              disabled={loading}
            >
              Print Rice Pavti
            </button>

            <button
              onClick={() => printKirana(payload)}
              className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs"
              title="Print Kirana"
              disabled={loading}
            >
              Print Kirana
            </button>

            {/* <button
              onClick={() => printRoutePaper(r.dispatch_code)}
              className="px-2 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs"
              title="Print Route Paper"
              disabled={loading}
            >
              Print Route Paper
            </button>
             */}
            {/* <button
              onClick={() => printDC(payload)}
              className="px-2 py-1 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs"
              title="Print DC"
              disabled={loading}
            >
              Print DC
            </button> */}
          </div>
        );
      }
    },
    { key: 'dispatch_code', label: 'PAVTI NO', accessor: 'dispatch_code', render: (r) => <span>{r.dispatch_code}</span> },
    { key: 'created_at', label: 'Dispatch Date', accessor: 'created_at', render: (r) => <span>{formatDateToDDMMYYYY(r.created_at)}</span> },
    { key: 'entered_by_name', label: 'Entered By', accessor: 'entered_by_name', render: (r) => <span>{r.entered_by_name || '-'}</span> },
    { key: 'order_no', label: 'ORDER NO', accessor: 'order_no', render: (r) => <span>{r.order_no || r.order_no}</span> },
    // Taluka (Marathi) resolved via schoolDataById + talukaList
    {
      key: 'taluka_name',
      label: 'TALUKA',
      accessor: 'taluka_name',
      render: (r) =>
        <span>{r.taluka_name}</span>,
    },
    // Center (prefer Marathi name) 
    {
      key: 'center_name',
      label: 'CENTER',
      accessor: 'center_name',
      render: (r) => {
        const c = centerList.find(cn => String(cn.center_id) === String(r.center_id));
        const name = c?.marathi_name || c?.name || r.center_name || r.center_id;
        return <span>{name}</span>;
      }
    },
    {
      key: 'schoolname',
      label: 'SCHOOL',
      accessor: 'schoolname',
      render: (r) => (
        <div className="flex items-center justify-between">
          <span>{r.schoolname || r.schoolname}</span>
        </div>
      )
    },
    {
      key: 'udaisno',
      label: 'UDIAS',
      accessor: 'udaisno',
      render: (r) =>
        <span>{r.udaisno}</span>,

    },
    {
      key: 'class_range',
      label: 'CLASS',
      accessor: 'class_range',
      render: (r) => <span>{r.class_range || ''}</span>
    },
    { key: 'truckNo', label: 'TRUCK NO', accessor: 'truckNo', render: (r) => <span>{r.truckNo}</span> },

    // New grain columns with correct keys
    {
      key: 'patsankhya',
      label: 'पट संख्या',
      render: (r) => <span>{r.patsankhya || 0}</span>
    },
    {
      key: 'grain_तांदुळ',
      label: 'तांदुळ',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'तांदुळ': 0 };
        return <span>{quantities['तांदुळ'].toFixed(2)}</span>;
      }
    },
    {
      key: 'grain_मुंगदाळ',
      label: 'मुंगदाळ',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'मुंगदाळ': 0 };
        return <span>{quantities['मुंगदाळ'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_मसूरदाळ',
      label: 'मसूरदाळ',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'मसूरदाळ': 0 };
        return <span>{quantities['मसूरदाळ'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_तूरदाळ',
      label: 'तूरदाळ',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'तूरदाळ': 0 };
        return <span>{quantities['तूरदाळ'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_हरभरा',
      label: 'हरभरा',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'हरभरा': 0 };
        return <span>{quantities['हरभरा'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_चवळी',
      label: 'चवळी',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'चवळी': 0 };
        return <span>{quantities['चवळी'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_मटकी',
      label: 'मटकी',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'मटकी': 0 };
        return <span>{quantities['मटकी'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_मुग',
      label: 'मुग',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'मुग': 0 };
        return <span>{quantities['मुग'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_वाटाणा',
      label: 'वाटाणा',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'वाटाणा': 0 };
        return <span>{quantities['वाटाणा'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_सोया वडी',
      label: 'सोया वडी',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'सोया वडी': 0 };
        return <span>{quantities['सोया वडी'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_मसाला',
      label: 'मसाला',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'मसाला': 0 };
        return <span>{quantities['मसाला'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_सोया तेल',
      label: 'सोया तेल',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'सोया तेल': 0 };
        return <span>{quantities['सोया तेल'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_हळद',
      label: 'हळद',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'हळद': 0 };
        return <span>{quantities['हळद'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_मीठ',
      label: 'मीठ',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'मीठ': 0 };
        return <span>{quantities['मीठ'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_मोहरी',
      label: 'मोहरी',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'मोहरी': 0 };
        return <span>{quantities['मोहरी'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_चना',
      label: 'चना',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'चना': 0 };
        return <span>{quantities['चना'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_जीरा',
      label: 'जीरा',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'जीरा': 0 };
        return <span>{quantities['जीरा'].toFixed(3)}</span>;
      }
    },
    {
      key: 'total_weight',
      label: 'एकूण वजन',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'एकूण वजन': 0 };
        return <span className="font-semibold text-green-600">{quantities['एकूण वजन'].toFixed(2)}</span>;
      }
    },
    {
      key: 'delete',
      label: 'Bin',
      render: (r) => {
        const isCurrentDate = isToday(r.created_at);
        
        return (
          <button
            onClick={() => handleDeleteClick(r.dispatch_code, r.created_at)}
            className={`p-1 rounded-md transition-colors text-red-600 hover:text-red-800 hover:bg-red-50`}
            title={isCurrentDate ? 'Delete Dispatch' : 'Only current date dispatches can be deleted. Please contact administrative.'}
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        );
      }
    },

  ];

  // Updated toolbar section with only From Date and To Date filters
  const toolbar = (
    <div className="space-y-4">
      {/* Date filters and buttons */}
      <div className="grid grid-cols-4 gap-2 items-center">
        <div className="flex flex-col">
          <span className="text-xs text-gray-600 mb-1 text-left">From Date</span>
          <div className="relative">
            <input
              ref={fromDatePickerRef}
              type="text"
              placeholder="Select From Date"
              className="h-10 rounded-md border px-3 pr-8 text-sm w-full"
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
          <span className="text-xs text-gray-600 mb-1 text-left">To Date</span>
          <div className="relative">
            <input
              ref={toDatePickerRef}
              type="text"
              placeholder="Select To Date"
              className="h-10 rounded-md border px-3 pr-8 text-sm w-full"
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
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
              title="Clear To Date"
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
            setDidSearch(true);
          }}
        >
          Search
        </button>

        <button
          type="button"
          className="h-10 px-4 rounded-md bg-green-600 text-white text-sm font-medium mt-5"
          onClick={exportFilteredDataToExcel}
        >
          Export to Excel
        </button>
      </div>
    </div>
  );

  const allFiltersSelected = Boolean(orderNo && selectedTruckId && selectedCenterId && selectedSchoolId);
  const showInputMode = allFiltersSelected && didSearch;

  // Initialize Flatpickr for date picker (re-init when mode changes so toolbar remounts)
  useEffect(() => {
    if (!fromDatePickerRef.current || !toDatePickerRef.current) return;

    // Destroy any existing instances before re-initializing
    if (flatpickrFromInstanceRef.current) {
      try { flatpickrFromInstanceRef.current.destroy(); } catch { }
      flatpickrFromInstanceRef.current = null;
    }
    if (flatpickrToInstanceRef.current) {
      try { flatpickrToInstanceRef.current.destroy(); } catch { }
      flatpickrToInstanceRef.current = null;
    }

    const fromInstance = flatpickr(fromDatePickerRef.current, {
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
      locale: { firstDayOfWeek: 1 }
    });

    const toInstance = flatpickr(toDatePickerRef.current, {
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
      locale: { firstDayOfWeek: 1 }
    });

    flatpickrFromInstanceRef.current = fromInstance;
    flatpickrToInstanceRef.current = toInstance;

    return () => {
      try { fromInstance.destroy(); } catch { }
      try { toInstance.destroy(); } catch { }
      if (flatpickrFromInstanceRef.current === fromInstance) {
        flatpickrFromInstanceRef.current = null;
      }
      if (flatpickrToInstanceRef.current === toInstance) {
        flatpickrToInstanceRef.current = null;
      }
    };
  }, [showInputMode, fromDate, toDate]);

  // Show loader while data is loading
  if (loading) {
    return (
      <div className="">
        <div className="bg-white rounded-2xl shadow-md border p-4 mb-4">
          {toolbar}
        </div>
        <Loader />
      </div>
    );
  }

  return (
    <div className="">
      {/* Add toolbar at the top */}
      <div className="bg-white rounded-2xl shadow-md border p-4 mb-4">
        {toolbar}
      </div>

      {showInputMode ? (
        <div className="bg-white rounded-2xl shadow-md border p-4">
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
        <ColumnSearchTable
          data={filteredDispatchList}
          classname={"h-auto overflow-y-auto scrollbar-hide"}
          columns={listColumns}
          title="Order Details with Column Search"
          filterOptions={[]}
          searchKey="schoolname"
          searchableKeys={['order_no', 'schoolname', 'class_range', 'taluka_id', 'dispatch_code', 'center_name', 'udaisno', 'truckNo', 'created_at', 'taluka_name']}
          groupByKeys={['dispatch_code', 'taluka_name', 'truckNo']}
          colspanKeys={["dispatch_code", "order_no", "taluka", "center_name", "schoolname", "udaisno", "class_range", "truckNo", "grain_तांदुळ", "grain_मुंगदाळ", "grain_मसूरदाळ", "grain_तूरदाळ", "grain_हरभरा", "grain_चवळी", "grain_मटकी", "grain_मुग", "grain_वाटाणा", "grain_सोया वडी", "grain_मसाला", "grain_सोया तेल", "grain_हळद", "grain_मीठ", "grain_मोहरी", "grain_चना", "grain_जीरा", "patsankhya", "total_weight", "action", "delete", "created_at", "taluka_name", "entered_by_name"]}
        />

      )}

      {lastDispatchData && (
        <ExcelExportModal
          isOpen={showExcelModal}
          onClose={() => setShowExcelModal(false)}
          dispatchData={lastDispatchData}
        />
      )}
    </div>
  );
};

export default DispatchView;