"use client";

import { useEffect, useMemo, useState } from 'react';
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { Filterdispached } from "../tables/Filterdispached";

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
  schoolname: string;
  udaisno: string;
  status: string;
  created_at: string;
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
};

type DispatchRow = {
  schoolname: string;
  grain: string;
  totalQty: number; // remaining qty (planned - already dispatched)
  unit: string;
};

const Dipatchdetials = () => {
  const [loading, setLoading] = useState(false);

  // Filters
  const [orderNo, setOrderNo] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState<string>('');
  const [selectedCenterId, setSelectedCenterId] = useState<string>('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');

  // Masters
  const [zpOrders, setZpOrders] = useState<ZPOrderDetail[]>([]);
  const [schoolWiseOrders, setSchoolWiseOrders] = useState<SchoolWiseOrder[]>([]);
  const [truckList, setTruckList] = useState<TruckRow[]>([]);
  const [centerList, setCenterList] = useState<CenterRow[]>([]);
  const [itemGrains, setItemGrains] = useState<ItemGrain[]>([]);

  // Existing dispatch list
  const [dispatchList, setDispatchList] = useState<DispatchListRow[]>([]);

  // State to gate input mode and reset when filters change
  const [didSearch, setDidSearch] = useState(false);

  // reset search gate when any filter changes
  useEffect(() => { setDidSearch(false); }, [orderNo, selectedTruckId, selectedCenterId, selectedSchoolId]);

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
    } catch {}
  };

  const fetchDispatchList = async () => {
    try {
      const res = await fetch('/api/dispatchdetails');
      if (res.ok) setDispatchList(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchZpOrders();
    fetchSchoolWiseOrders();
    fetchTrucks();
    fetchCenters();
    fetchItemMaster();
    fetchDispatchList();
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

  const centerOptions = useMemo(() => [
    { value: '', label: 'Select Center' },
    ...centerList.map(c => ({ value: String(c.center_id), label: c.name || c.marathi_name || String(c.center_id) }))
  ], [centerList]);

  const schoolOptions = useMemo(() => {
    if (!orderNo) return [{ value: '', label: 'Select School' }];
    const uniq = new Map<number, { value: string; label: string }>();
    schoolWiseOrders
      .filter(s => String(s.order_id) === orderNo)
      .forEach(s => {
        uniq.set(s.school_id, { value: String(s.school_id), label: s.schoolname });
      });
    return [{ value: '', label: 'Select School' }, ...Array.from(uniq.values())];
  }, [orderNo, schoolWiseOrders]);

  const handleOrderChange = (orderId: string) => {
    setOrderNo(orderId);
    setSelectedSchoolId('');
  };

  // Selected target (order + school)
  const selectedOrderSchool = useMemo(() => {
    if (!orderNo || !selectedSchoolId) return null;
    return schoolWiseOrders.find(
      s => String(s.order_id) === orderNo && String(s.school_id) === selectedSchoolId
    ) || null;
  }, [orderNo, selectedSchoolId, schoolWiseOrders]);

  // Sum already dispatched per item for selected order + school
  const dispatchedByItem = useMemo<Record<string, number>>(() => {
    if (!orderNo || !selectedSchoolId) return {};
    const map: Record<string, number> = {};
    dispatchList
      .filter(d => String(d.order_id) === orderNo && String(d.school_id) === selectedSchoolId)
      .forEach(d => {
        const key = d.item_name.trim();
        map[key] = (map[key] || 0) + Number(d.qty_dispatch || 0);
      });
    return map;
  }, [dispatchList, orderNo, selectedSchoolId]);

  // Build input-mode rows with remaining qty (planned - already dispatched)
  const dispatchRows = useMemo<DispatchRow[]>(() => {
    if (!selectedOrderSchool) return [];
    const items = typeof selectedOrderSchool.items_data === 'string'
      ? JSON.parse(selectedOrderSchool.items_data as unknown as string)
      : (selectedOrderSchool.items_data || {});
    const rows: DispatchRow[] = [];

    Object.entries(items)
      .filter(([, v]) => Number(v) > 0)
      .forEach(([k, v]) => {
        const master = itemGrains.find(g => g.name.trim() === k.trim());
        const planned = Number(v) || 0;
        const already = Number(dispatchedByItem[k] || 0);
        const remaining = Math.max(0, planned - already);
        rows.push({
          schoolname: selectedOrderSchool.schoolname,
          grain: k,
          totalQty: remaining,
          unit: master?.Unit || 'kg',
        });
      });

    return rows;
  }, [selectedOrderSchool, itemGrains, dispatchedByItem]);

  // Inputs map for qty dispatch
  const [dispatchInputs, setDispatchInputs] = useState<Record<string, number>>({});
  useEffect(() => { setDispatchInputs({}); }, [selectedOrderSchool?.id]);

  // Input-mode columns
  const inputColumns: Column<DispatchRow>[] = [
    {
      key: 'order',
      label: 'Order No (ID)',
      render: () => {
        const ord = zpOrders.find(o => String(o.id) === orderNo);
        return <span>{ord ? `${ord.order_no} (${ord.id})` : '-'}</span>;
      }
    },
    {
      key: 'school',
      label: 'School (ID)',
      render: () => (
        <span>
          {selectedOrderSchool ? `${selectedOrderSchool.schoolname} (${selectedOrderSchool.school_id})` : '-'}
        </span>
      )
    },
    { key: 'grain', label: 'Item', accessor: 'grain', render: (row) => <span>{row.grain}</span> },
    { key: 'unit', label: 'Unit', accessor: 'unit', render: (row) => <span>{row.unit}</span> },
    { key: 'totalQty', label: 'Remaining Qty', accessor: 'totalQty', render: (row) => <span>{row.totalQty}</span> },
    {
      key: 'qtyDispatch',
      label: 'Qty Dispatch',
      render: (row) => (
        <input
          type="number"
          min={0}
          max={row.totalQty}
          className="h-9 w-28 rounded border px-2 text-sm"
          value={dispatchInputs[row.grain] ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : Number(e.target.value);
            // cap to remaining qty
            const capped = Math.min(Math.max(0, val), Number(row.totalQty));
            setDispatchInputs(prev => ({ ...prev, [row.grain]: capped }));
          }}
        />
      )
    },
    {
      key: 'balQty',
      label: 'Bal Qty',
      render: (row) => {
        const qd = dispatchInputs[row.grain] ?? 0;
        const bal = Math.max(0, Number(row.totalQty) - Number(qd));
        return <span>{bal}</span>;
      }
    },
  ];

  // Read-only list columns (default view)
  const listColumns: Column<DispatchListRow>[] = [
    { key: 'dispatch_code', label: 'Code', accessor: 'dispatch_code', render: (r) => <span>{r.dispatch_code}</span> },
    { key: 'order_no', label: 'Order No', accessor: 'order_no', render: (r) => <span>{r.order_no || r.order_id}</span> },
    { key: 'school', label: 'School', render: (r) => <span>{r.schoolname || r.school_id}</span> },
    { key: 'center', label: 'Center', render: (r) => <span>{r.center_name || r.center_id}</span> },
    { key: 'truck', label: 'Truck', render: (r) => <span>{r.truckNo || r.truck_id}</span> },
    { key: 'item', label: 'Item', render: (r) => <span>{r.item_name}</span> },
    { key: 'unit', label: 'Unit', accessor: 'unit', render: (r) => <span>{r.unit}</span> },
    { key: 'qty', label: 'Qty Dispatch', render: (r) => <span>{r.qty_dispatch}</span> },
    { key: 'bal', label: 'Bal Qty', render: (r) => <span>{r.bal_qty}</span> },
    { key: 'created', label: 'Created', render: (r) => <span>{new Date(r.created_at).toLocaleString()}</span> },
  ];

  const allFiltersSelected = Boolean(orderNo && selectedTruckId && selectedCenterId && selectedSchoolId);
  const showInputMode = allFiltersSelected && didSearch;

  // Inline toolbar with filters + submit
  const toolbar = (
    <div className="grid grid-cols-6 gap-2 items-center">
      <select
        className="h-10  rounded-md border px-3 text-sm"
        value={orderNo}
        onChange={(e) => { handleOrderChange(e.target.value); }}
      >
        {orderNoOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select Order Number'}</option>)}
      </select>
  
      <select
        className="h-10 rounded-md border px-3 text-sm"
        value={selectedTruckId}
        onChange={(e) => setSelectedTruckId(e.target.value)}
      >
        {truckOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select Truck'}</option>)}
      </select>
  
      <select
        className="h-10  rounded-md border px-3 text-sm"
        value={selectedCenterId}
        onChange={(e) => setSelectedCenterId(e.target.value)}
      >
        {centerOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select Center'}</option>)}
      </select>
  
      <select
        className="h-10 rounded-md border px-3 text-sm"
        value={selectedSchoolId}
        onChange={(e) => setSelectedSchoolId(e.target.value)}
        disabled={!orderNo}
      >
        {schoolOptions.map(o => <option key={o.value} value={o.value}>{o.label || 'Select School'}</option>)}
      </select>
  
      <button
        type="button"
        className="h-10 px-4 rounded-md bg-gray-600 text-white text-sm font-medium"
        onClick={() => {
          if (!allFiltersSelected) {
            toast.error('Select Order, Truck, Center, and School');
            return;
          }
          setDidSearch(true);
        }}
      >
        Search
      </button>
  
      <button
        type="button"
        className="h-10 px-4 rounded-md bg-blue-600 text-white text-sm font-medium"
        onClick={async () => {
            try {
              if (!orderNo || !selectedTruckId || !selectedCenterId || !selectedSchoolId) {
                toast.error('Select Order, Truck, Center, and School');
                return;
              }
              if (dispatchRows.length === 0) {
                toast.error('No items to dispatch');
                return;
              }
              const lines = dispatchRows
                .map(r => ({
                  grain: r.grain,
                  unit: r.unit,
                  totalQty: r.totalQty,
                  qtyDispatch: Number(dispatchInputs[r.grain] ?? 0),
                }))
                .filter(l => l.qtyDispatch > 0);
              if (lines.length === 0) {
                toast.error('Enter at least one dispatch quantity');
                return;
              }
              setLoading(true);
              const resp = await fetch('/api/dispatchdetails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  order_id: Number(orderNo),
                  school_id: Number(selectedSchoolId),
                  center_id: Number(selectedCenterId),
                  truck_id: Number(selectedTruckId),
                  lines
                }),
              });
              if (!resp.ok) {
                const er = await resp.json().catch(() => ({}));
                throw new Error(er.message || 'Failed to save dispatch');
              }
              const ok = await resp.json();
              toast.success(`Dispatch saved (Code: ${ok.dispatch_code})`);
              setDispatchInputs({});
              await fetchDispatchList(); // refresh list
            } catch{
            //   console.error(e);
              toast.error('Failed to save');
            } finally {
              setLoading(false);
            }
          }}
        disabled={loading || !showInputMode}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
  
  return (
    <div className="">
      {showInputMode ? (
        <Filterdispached
          data={dispatchRows}
          columns={inputColumns}
          filterOptions={[]}
          filterKey={undefined}
          toolbar={toolbar}
        />
      ) : (
        <Filterdispached
          data={dispatchList}
          columns={listColumns}
          filterOptions={[]}
          filterKey={undefined}
          toolbar={toolbar}
        />
      )}
    </div>
  );
};

export default Dipatchdetials;