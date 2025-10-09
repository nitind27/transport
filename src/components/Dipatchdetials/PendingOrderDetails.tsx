"use client";

import { useEffect, useMemo, useState } from 'react';
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { ColumnSearchTable } from '../tables/ColumnSearchTable';
import Loader from '@/common/Loader';

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

interface TalukaRow {
  taluka_id: number;
  name: string;
  name_en?: string;
  dist_id?: number;
  status?: string;
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

type PendingOrderRow = {
  id: number;
  order_id: number;
  school_id: number;
  order_no: string;
  schoolname: string;
  udaisno: string;
  taluka_name: string;
  center_name: string;
  class_range: string;
  patsankhya: number;
  period: string;
  financial_year: string;
  no_of_days: number;
  total_weight: number;
  items_count: number;
  items_data: Record<string, number>;
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
    total_weight?: string;
    truckNo?: string;
    class_range?: string;
    taluka?: string;
    taluka_name?: string;
    period?: string;
    no_of_days?: number;
    financial_year?: string;
    udaisno?: string;
  
    patsankhya?: string;
    action?: string;
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
const PendingOrderDetails = () => {
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedOrderNo, setSelectedOrderNo] = useState<string>('');
  const [selectedTalukaId, setSelectedTalukaId] = useState<string>('');
  const [selectedCenterId, setSelectedCenterId] = useState<string>('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedClassRange, setSelectedClassRange] = useState<string>('');

  // Masters
  const [talukaList, setTalukaList] = useState<TalukaRow[]>([]);
  const [centerList, setCenterList] = useState<CenterRow[]>([]);
  const [itemGrains,setItemGrains] = useState<ItemGrain[]>([]);
  console.log(itemGrains);
  const [schoolWiseOrders, setSchoolWiseOrders] = useState<SchoolWiseOrder[]>([]);
  const [schoolDataById, setSchoolDataById] = useState<Map<number, SchoolDataRow>>(new Map());
  const [dispatchList, setDispatchList] = useState<DispatchListRow[]>([]);

  // Get unique order numbers
  const orderOptions = useMemo(() => {
    const uniqueOrders = new Set<string>();
    schoolWiseOrders.forEach(order => {
      if (order.order_no) {
        uniqueOrders.add(order.order_no);
      }
    });
    return Array.from(uniqueOrders).sort();
  }, [schoolWiseOrders]);

  // Get taluka options
  const talukaOptions = useMemo(() => [
    { value: '', label: 'Select Taluka' },
    ...talukaList.map(t => ({ value: String(t.taluka_id), label: t.name }))
  ], [talukaList]);

  // Get center options filtered by taluka
  const centerOptions = useMemo(() => [
    { value: '', label: 'Select Center' },
    ...centerList
      .filter(c => !selectedTalukaId || String(c.taluka_id || '') === String(selectedTalukaId))
      .map(c => ({ value: String(c.center_id), label: c.marathi_name || c.name || String(c.center_id) }))
  ], [centerList, selectedTalukaId]);

  // Get school options filtered by center/taluka
  const schoolOptions = useMemo(() => {
    if (!selectedOrderNo) return [{ value: '', label: 'Select School' }];

    let filteredSchools = schoolWiseOrders.filter(s => s.order_no === selectedOrderNo);

    // Filter by center if selected
    if (selectedCenterId) {
      filteredSchools = filteredSchools.filter(s => {
        const sd = schoolDataById.get(Number(s.school_id));
        return sd && String(sd.center) === String(selectedCenterId);
      });
    } else if (selectedTalukaId) {
      filteredSchools = filteredSchools.filter(s => {
        const sd = schoolDataById.get(Number(s.school_id));
        return sd && String(sd.taluka_id) === String(selectedTalukaId);
      });
    }

    // Filter by class range if selected
    if (selectedClassRange) {
      filteredSchools = filteredSchools.filter(s => s.class_range === selectedClassRange);
    }

    // Remove schools that have been dispatched
    const dispatchedSchoolIds = new Set(
      dispatchList
        .filter(d => d.order_no === selectedOrderNo)
        .map(d => d.school_id)
    );

    filteredSchools = filteredSchools.filter(s => !dispatchedSchoolIds.has(s.school_id));

    // Get unique schools
    const uniqueSchools = new Map<number, SchoolWiseOrder>();
    filteredSchools.forEach(s => {
      if (!uniqueSchools.has(s.school_id)) {
        uniqueSchools.set(s.school_id, s);
      }
    });

    return [
      { value: '', label: 'Select School' },
      ...Array.from(uniqueSchools.values()).map((s, idx) => {
        const fallback = schoolDataById.get(Number(s.school_id));
        const name = s.schoolname || fallback?.schoolname || `School ${s.school_id}`;
        const ud = s.udaisno || fallback?.udaisno || 'NA';
        const classRanges = schoolWiseOrders
          .filter(sw => sw.order_no === selectedOrderNo && sw.school_id === s.school_id)
          .map(sw => sw.class_range)
          .filter(Boolean)
          .join(', ');

        return {
          value: String(s.school_id),
          label: `${idx + 1}) ${name} (${ud}) ${classRanges ? `[${classRanges}]` : ''}`,
        };
      })
    ];
  }, [selectedOrderNo, selectedTalukaId, selectedCenterId, selectedClassRange, schoolWiseOrders, schoolDataById, dispatchList]);

  // Get class range options
  const classRangeOptions = useMemo(() => {
    if (!selectedOrderNo || !selectedSchoolId) return [{ value: '', label: 'Class Range (Select)' }];
    
    const uniq = new Set<string>();
    schoolWiseOrders
      .filter(s => s.order_no === selectedOrderNo && String(s.school_id) === String(selectedSchoolId))
      .forEach(s => { if (s.class_range) uniq.add(String(s.class_range)); });
    
    const arr = Array.from(uniq.values()).sort();
    return [{ value: '', label: 'Class Range (All)' }, ...arr.map(v => ({ value: v, label: v }))];
  }, [selectedOrderNo, selectedSchoolId, schoolWiseOrders]);

  // Process pending orders data
  const pendingOrdersData = useMemo(() => {
    if (!selectedOrderNo) return [];

    let filteredOrders = schoolWiseOrders.filter(s => s.order_no === selectedOrderNo);

    // Apply filters
    if (selectedTalukaId) {
      filteredOrders = filteredOrders.filter(s => {
        const sd = schoolDataById.get(Number(s.school_id));
        return sd && String(sd.taluka_id) === String(selectedTalukaId);
      });
    }

    if (selectedCenterId) {
      filteredOrders = filteredOrders.filter(s => {
        const sd = schoolDataById.get(Number(s.school_id));
        return sd && String(sd.center) === String(selectedCenterId);
      });
    }

    if (selectedSchoolId) {
      filteredOrders = filteredOrders.filter(s => String(s.school_id) === String(selectedSchoolId));
    }

    if (selectedClassRange) {
      filteredOrders = filteredOrders.filter(s => s.class_range === selectedClassRange);
    }

    // Remove dispatched schools
    const dispatchedSchoolIds = new Set(
      dispatchList
        .filter(d => d.order_no === selectedOrderNo)
        .map(d => d.school_id)
    );

    filteredOrders = filteredOrders.filter(s => !dispatchedSchoolIds.has(s.school_id));

    // Group by school and process data
    const schoolGroups = new Map<number, SchoolWiseOrder[]>();
    filteredOrders.forEach(order => {
      if (!schoolGroups.has(order.school_id)) {
        schoolGroups.set(order.school_id, []);
      }
      schoolGroups.get(order.school_id)!.push(order);
    });

    const processedData: PendingOrderRow[] = [];
    
    schoolGroups.forEach((orders, schoolId) => {
      const firstOrder = orders[0];
      const sd = schoolDataById.get(schoolId);
      const talukaName = sd ? (talukaList.find(t => t.taluka_id === sd.taluka_id)?.name || '') : '';
      const centerName = sd ? (centerList.find(c => String(c.center_id) === String(sd.center))?.marathi_name || '') : '';

      // Combine items from all class ranges for this school
      const combinedItems: Record<string, number> = {};
      let totalWeight = 0;
      let totalPatsankhya = 0;

      orders.forEach(order => {
        const items = typeof order.items_data === 'string' 
          ? JSON.parse(order.items_data) 
          : (order.items_data || {});
        
        Object.entries(items).forEach(([itemName, qty]) => {
          combinedItems[itemName] = (combinedItems[itemName] || 0) + Number(qty);
        });
        
        totalWeight += Number(order.total_weight || 0);
        totalPatsankhya += Number(order.patsankhya || 0);
      });

      const classRanges = orders.map(o => o.class_range).filter(Boolean).join(', ');

      processedData.push({
        id: firstOrder.id,
        order_id: firstOrder.order_id,
        school_id: schoolId,
        order_no: firstOrder.order_no,
        schoolname: firstOrder.schoolname,
        udaisno: firstOrder.udaisno,
        taluka_name: talukaName,
        center_name: centerName,
        class_range: classRanges,
        patsankhya: totalPatsankhya,
        period: firstOrder.period,
        financial_year: firstOrder.financial_year,
        no_of_days: firstOrder.no_of_days,
        total_weight: totalWeight,
        items_count: Object.keys(combinedItems).length,
        items_data: combinedItems
      });
    });

    return processedData.sort((a, b) => a.schoolname.localeCompare(b.schoolname));
  }, [selectedOrderNo, selectedTalukaId, selectedCenterId, selectedSchoolId, selectedClassRange, schoolWiseOrders, schoolDataById, dispatchList, talukaList, centerList]);

  // Table columns
  const columns: Column<PendingOrderRow>[] = [
    { key: 'order_no', label: 'Order No', accessor: 'order_no' },
    { key: 'schoolname', label: 'School Name', accessor: 'schoolname' },
    { key: 'udaisno', label: 'UDISE No', accessor: 'udaisno' },
    { key: 'taluka_name', label: 'Taluka', accessor: 'taluka_name' },
    { key: 'center_name', label: 'Center', accessor: 'center_name' },
    { key: 'class_range', label: 'Class Range', accessor: 'class_range' },
    { key: 'patsankhya', label: 'पट संख्या', render: (r) => <span>{r.patsankhya}</span> },
    { key: 'items_count', label: 'Items Count', render: (r) => <span className="font-semibold text-blue-600">{r.items_count}</span> },
    { key: 'total_weight', label: 'Total Weight', render: (r) => <span className="font-semibold text-green-600">{r.total_weight.toFixed(2)} kg</span> },
    {
      key: 'items_detail',
      label: 'Items Detail',
      render: (r) => (
        <div className="max-w-xs">
          <div className="text-xs space-y-1">
            {Object.entries(r.items_data).slice(0, 3).map(([item, qty]) => (
              <div key={item} className="flex justify-between">
                <span className="truncate">{item}</span>
                <span className="font-medium">{qty}</span>
              </div>
            ))}
            {Object.keys(r.items_data).length > 3 && (
              <div className="text-gray-500">+{Object.keys(r.items_data).length - 3} more...</div>
            )}
          </div>
        </div>
      )
    }
  ];

  // Toolbar
  const toolbar = (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2 items-center">
        <div className="flex flex-col">
          <span className="text-xs text-gray-600 mb-1 text-left">Order Number</span>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={selectedOrderNo}
            onChange={(e) => {
              setSelectedOrderNo(e.target.value);
              setSelectedTalukaId('');
              setSelectedCenterId('');
              setSelectedSchoolId('');
              setSelectedClassRange('');
            }}
          >
            <option value="">Select Order Number</option>
            {orderOptions.map(orderNo => (
              <option key={orderNo} value={orderNo}>{orderNo}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-600 mb-1 text-left">Taluka</span>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={selectedTalukaId}
            onChange={(e) => {
              setSelectedTalukaId(e.target.value);
              setSelectedCenterId('');
              setSelectedSchoolId('');
              setSelectedClassRange('');
            }}
            disabled={!selectedOrderNo}
          >
            {talukaOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
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
              setSelectedClassRange('');
            }}
            disabled={!selectedOrderNo || !selectedTalukaId}
          >
            {centerOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
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
            disabled={!selectedOrderNo}
          >
            {schoolOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-600 mb-1 text-left">Class Range</span>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={selectedClassRange}
            onChange={(e) => setSelectedClassRange(e.target.value)}
            disabled={!selectedOrderNo || !selectedSchoolId}
          >
            {classRangeOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  // Fetch functions
  const fetchTalukas = async () => {
    try {
      const res = await fetch('/api/taluka');
      if (res.ok) setTalukaList(await res.json());
    } catch {
      toast.error('Failed to load taluka');
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

  const fetchDispatchList = async () => {
    try {
      const res = await fetch('/api/dispatchdetails');
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
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTalukas(),
          fetchCenters(),
          fetchItemMaster(),
          fetchSchoolWiseOrders(),
          fetchDispatchList(),
          fetchSchoolDataMap()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="">
      <div className="bg-white rounded-2xl shadow-md border p-4 mb-4">
        {toolbar}
      </div>

      <div className="bg-white rounded-2xl shadow-md border p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Pending Order Details
            {pendingOrdersData.length > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                ({pendingOrdersData.length} schools pending)
              </span>
            )}
          </h3>
        </div>

        <ColumnSearchTable
          data={pendingOrdersData}
          classname={"h-auto overflow-y-auto scrollbar-hide"}
          columns={columns}
          title="Pending Orders"
          filterOptions={[]}
          searchKey="schoolname"
          searchableKeys={['order_no', 'schoolname', 'udaisno', 'taluka_name', 'center_name', 'class_range']}
          groupByKeys={['order_no', 'taluka_name']}
          colspanKeys={["order_no", "taluka_name", "center_name", "schoolname", "udaisno", "class_range", "patsankhya", "items_count", "total_weight", "items_detail"]}
        />
      </div>
    </div>
  );
};

export default PendingOrderDetails;
