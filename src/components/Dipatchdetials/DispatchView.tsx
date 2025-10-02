"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { Filterdispached } from "../tables/Filterdispached";
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
// import { Modal } from '../ui/modal';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


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
  taluka?: string;
  period?: string;
  no_of_days?: number;
  financial_year?: string;
  udaisno?: string;
  patsankhya?: string;
  action?:string;
  // Add all grain properties as optional string types
  "grain_तांदुळ"?: string;
  "grain_मुंगदाळ"?: string;
  "grain_मसूरदाळ"?: string;
  "grain_तूरदाळ"?: string;
  "grain_हरभरा"?: string;
  "grain_चवळी"?: string;
  "grain_मटकी"?: string;
  "grain_मूग"?: string;
  "grain_वाटणा"?: string;
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





const ExcelExportModal: React.FC<ExcelExportModalProps> = ({ isOpen, onClose, dispatchData }) => {
    const exportToExcel = () => {
      try {
        const workbook = XLSX.utils.book_new();
        
        // Create grain mapping with all required columns
        const grainColumns = [
          'तांदुळ', 'मुंगदाळ', 'मसूरदाळ', 'तूरदाळ', 'हरभरा', 'चवळी', 
          'मटकी', 'मूग', 'वाटणा', 'सोया वडी', 'मसाला', 'सोया तेल', 
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
          } else if (itemName.includes('मुंग') || itemName.includes('moong')) {
            if (itemName.includes('दाळ') || itemName.includes('dal')) {
              grainQuantities['मुंगदाळ'] += Number(item.qty) || 0;
            } else {
              grainQuantities['मूग'] += Number(item.qty) || 0;
            }
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
          } else if (itemName.includes('वाटाणा') || itemName.includes('वाटणा') || itemName.includes('vatana') || itemName.includes('peas')) {
            grainQuantities['वाटणा'] += Number(item.qty) || 0;
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
  // const [loading, setLoading] = useState(false);
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

  // Date range filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

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

    setFilteredDispatchList(filtered);
  }, [dispatchList, fromDate, toDate]);

  // Fetchers
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
      const res = await fetch('/api/dispatchdetails');
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

  // Options
  // const orderNoOptions = useMemo(() => [
  //   { value: '', label: 'Select Order Number' },
  //   ...zpOrders.map(order => ({ value: String(order.id), label: order.order_no }))
  // ], [zpOrders]);

  // const truckOptions = useMemo(() => [
  //   { value: '', label: 'Select Truck' },
  //   ...truckList.map(t => ({ value: String(t.id), label: t.truckNo }))
  // ], [truckList]);

  // const talukaOptions = useMemo(() => [
  //   { value: '', label: 'Select Taluka' },
  //   ...talukaList.map(t => ({ value: String(t.taluka_id), label: t.name }))
  // ], [talukaList]);

  // const centerOptions = useMemo(() => [
  //   { value: '', label: 'Select Center' },
  //   ...centerList
  //     .filter(c => !selectedTalukaId || String(c.taluka_id || '') === String(selectedTalukaId))
  //     .map(c => ({ value: String(c.center_id), label: c.marathi_name || c.name || String(c.center_id) }))
  // ], [centerList, selectedTalukaId]);

  // const classRangeOptions = useMemo(() => {
  //   if (!orderNo || !selectedSchoolId) return [{ value: '', label: 'Class Varg (Select)' }];
  //   const uniq = new Set<string>();
  //   schoolWiseOrders
  //     .filter(s => String(s.order_id) === orderNo && String(s.school_id) === String(selectedSchoolId))
  //     .forEach(s => { if (s.class_range) uniq.add(String(s.class_range)); });
  //   const arr = Array.from(uniq.values()).sort();
  //   return [{ value: '', label: 'Class Varg (All)' }, ...arr.map(v => ({ value: v, label: v }))];
  // }, [orderNo, selectedSchoolId, schoolWiseOrders]);

  // Updated school options - exclude schools that have already been dispatched
  // const schoolOptions = useMemo(() => {
  //   if (!orderNo) return [{ value: '', label: 'Select School' }];

  //   let filtered = schoolWiseOrders.filter(s => String(s.order_id) === orderNo);

  //   if (selectedCenterId) {
  //     filtered = filtered.filter(s => {
  //       const sd = schoolDataById.get(Number(s.school_id));
  //       return sd && String(sd.center) === String(selectedCenterId);
  //     });
  //   } else if (selectedTalukaId) {
  //     filtered = filtered.filter(s => {
  //       const sd = schoolDataById.get(Number(s.school_id));
  //       return sd && String(sd.taluka_id) === String(selectedTalukaId);
  //     });
  //   }

  //   // NEW: Filter out schools that have already been dispatched
  //   const dispatchedSchools = new Set<number>();
  //   dispatchList.forEach(dispatch => {
  //     if (String(dispatch.order_id) === orderNo) {
  //       dispatchedSchools.add(dispatch.school_id);
  //     }
  //   });

  //   // Remove dispatched schools from the list
  //   filtered = filtered.filter(s => !dispatchedSchools.has(s.school_id));

  //   // De-dup by school_id
  //   const seen = new Set<number>();
  //   const dedup = filtered.filter(s => {
  //     if (seen.has(s.school_id)) return false;
  //     seen.add(s.school_id);
  //     return true;
  //   });

  //   // Stable sort
  //   dedup.sort((a, b) => {
  //     const an = a.schoolname || schoolDataById.get(a.school_id)?.schoolname || '';
  //     const bn = b.schoolname || schoolDataById.get(b.school_id)?.schoolname || '';
  //     return an.localeCompare(bn);
  //   });

  //   // Label: SR) Name (UDISE) with fallback from schooldata if missing in API
  //   return [
  //     { value: '', label: 'Select School' },
  //     ...dedup.map((s, idx) => {
  //       const fallback = schoolDataById.get(Number(s.school_id));
  //       const name = s.schoolname || fallback?.schoolname || `School ${s.school_id}`;
  //       const ud = s.udaisno || fallback?.udaisno || 'NA';
  //       return {
  //         value: String(s.school_id),
  //         label: `${idx + 1}) ${name} (${ud})`,
  //       };
  //     })
  //   ];
  // }, [orderNo, selectedTalukaId, selectedCenterId, schoolWiseOrders, schoolDataById, dispatchList]);

  // const handleOrderChange = (orderId: string) => {
  //   setOrderNo(orderId);
  //   setSelectedClassRange('');
  //   setSelectedSchoolId('');
  // };

  // const handleTalukaChange = (talukaId: string) => {
  //   setSelectedTalukaId(talukaId);
  //   setSelectedCenterId('');
  //   setSelectedSchoolId('');
  //   setSelectedClassRange('');
  // };

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
        'मटकी', 'मूग', 'वाटणा', 'सोया वडी', 'मसाला', 'सोया तेल', 
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
          'मटकी', 'मूग', 'वाटणा', 'सोया वडी', 'मसाला', 'सोया तेल', 
          'हळद', 'मीठ', 'मोहरी', 'चना', 'जीरा', 'एकूण वजन'
        ]
      ];

      // Add data rows
      Object.values(groupedData).forEach((group) => {
        // Initialize grain quantities
        const grainQuantities = {
          'तांदुळ': 0, 'मुंगदाळ': 0, 'मसूरदाळ': 0, 'तूरदाळ': 0, 'हरभरा': 0, 'चवळी': 0,
          'मटकी': 0, 'मूग': 0, 'वाटणा': 0, 'सोया वडी': 0, 'मसाला': 0, 'सोया तेल': 0,
          'हळद': 0, 'मीठ': 0, 'मोहरी': 0, 'चना': 0, 'जीरा': 0
        };

        // Map dispatch items to grain quantities
        Object.entries(group.items).forEach(([itemName, qty]) => {
          const name = (itemName || '').toLowerCase().trim();
          const quantity = Number(qty) || 0;
          
          // Simple mapping based on common names
          if (name.includes('तांदुळ') || name.includes('rice') || name.includes('चावल')) {
            grainQuantities['तांदुळ'] += quantity;
          } else if (name.includes('मुंग') || name.includes('moong')) {
            if (name.includes('दाळ') || name.includes('dal')) {
              grainQuantities['मुंगदाळ'] += quantity;
            } else {
              grainQuantities['मूग'] += quantity;
            }
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
          } else if (name.includes('वाटाणा') || name.includes('वाटणा') || name.includes('vatana') || name.includes('peas')) {
            grainQuantities['वाटणा'] += quantity;
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
          // index + 1,
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
          grainQuantities['मूग'].toFixed(3),
          grainQuantities['वाटणा'].toFixed(3),
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
        'मटकी': 0, 'मूग': 0, 'वाटणा': 0, 'सोया वडी': 0, 'मसाला': 0, 'सोया तेल': 0,
        'हळद': 0, 'मीठ': 0, 'मोहरी': 0, 'चना': 0, 'जीरा': 0
      };

      // Get all items for this dispatch code
      const dispatchItems = dispatchList.filter(d => d.dispatch_code === dispatchCode);
      
      dispatchItems.forEach(item => {
        const itemName = (item.item_name || '').toLowerCase().trim();
        const quantity = Number(item.qty_dispatch || 0);
        
        // Map items to grain quantities
        if (itemName.includes('तांदुळ') || itemName.includes('rice') || itemName.includes('चावल')) {
          grainQuantities['तांदुळ'] += quantity;
        } else if (itemName.includes('मुंग') || itemName.includes('moong')) {
          if (itemName.includes('दाळ') || itemName.includes('dal')) {
            grainQuantities['मुंगदाळ'] += quantity;
          } else {
            grainQuantities['मूग'] += quantity;
          }
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
        } else if (itemName.includes('वाटाणा') || itemName.includes('वाटणा') || itemName.includes('vatana') || itemName.includes('peas')) {
          grainQuantities['वाटणा'] += quantity;
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

  // Add delete functionality
  const handleDeleteDispatch = async (dispatchCode: string) => {
    if (!confirm('Are you sure you want to delete this dispatch? This action cannot be undone.')) {
      return;
    }

    try {
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
    }
  };

  // Updated table columns with correct keys and action column
  const listColumns: Column<DispatchListRow>[] = [
    { key: 'dispatch_code', label: 'PAVTI NO', accessor: 'dispatch_code', render: (r) => <span>{r.dispatch_code}</span> },
    { key: 'order_no', label: 'ORDER NO', accessor: 'order_no', render: (r) => <span>{r.order_no || r.order_no}</span> },
    // Taluka (Marathi) resolved via schoolDataById + talukaList
    {
      key: 'taluka',
      label: 'TALUKA',
      render: (r) => {
        const sd = r.school_id ? schoolDataById.get(Number(r.school_id)) : undefined;
        const talukaName = sd ? (talukaList.find(t => t.taluka_id === sd.taluka_id)?.name || '') : '';
        return <span>{talukaName}</span>;
      }
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
      render: (r) => {
        const sd = r.school_id ? schoolDataById.get(Number(r.school_id)) : undefined;
        const udaisno = sd?.udaisno || '';
        return <span>{udaisno}</span>;
      }
    },
    {
      key: 'class_range',
      label: 'CLASS',
      accessor: 'class_range',
      render: (r) => <span>{r.class_range || ''}</span>
    },
    { key: 'truckNo', label: 'TRUCK NO', accessor: 'truckNo', render: (r) => <span>{r.truckNo || r.truck_id}</span> },
    
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
        return <span>{quantities['तांदुळ'].toFixed(3)}</span>;
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
      key: 'grain_मूग',
      label: 'मूग',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'मूग': 0 };
        return <span>{quantities['मूग'].toFixed(3)}</span>;
      }
    },
    {
      key: 'grain_वाटणा',
      label: 'वाटणा',
      render: (r) => {
        const quantities = grainQuantitiesByDispatch.get(r.dispatch_code) || { 'वाटणा': 0 };
        return <span>{quantities['वाटणा'].toFixed(3)}</span>;
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
    // Action column with delete functionality
    {
      key: 'action',
      label: 'ACTION',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDeleteDispatch(r.dispatch_code)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            title="Delete Dispatch"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }
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
        <Filterdispached
          data={filteredDispatchList}
          columns={listColumns}
          filterOptions={[]}
          filterKey={undefined}
          toolbar={null}
          groupByKey="dispatch_code"
          colspanKeys={["dispatch_code", "order_no", "taluka", "center_name", "schoolname", "udaisno", "class_range", "truckNo", "grain_तांदुळ", "grain_मुंगदाळ", "grain_मसूरदाळ", "grain_तूरदाळ", "grain_हरभरा", "grain_चवळी", "grain_मटकी", "grain_मूग", "grain_वाटणा", "grain_सोया वडी", "grain_मसाला", "grain_सोया तेल", "grain_हळद", "grain_मीठ", "grain_मोहरी", "grain_चना", "grain_जीरा", "patsankhya","total_weight","action"]}
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

