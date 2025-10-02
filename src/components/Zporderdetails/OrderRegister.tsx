"use client";

import { useEffect, useMemo, useState } from 'react';


import Label from "../form/Label";
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
// import { useToggleContext } from '@/context/ToggleContext';
import { Modal } from '../ui/modal';
import { ColumnSearchTable } from '../tables/ColumnSearchTable';
import Loader from '../../common/Loader';

import { FaTrash } from 'react-icons/fa';

// Types
interface ZPOrderDetail {
  id: number;
  order_no: string;
  no_of_days: number;
  period: string;
  financial_year: string;
  status: string;
}

interface School {
  id: number;
  schoolid: number;
  name: string;
  schoolname: string;
  udaisno: string;
  status: string;
  center?: number;
  centername?: string;
  talukaname?: string;
}

interface SchoolWiseOrder {
  id: number;
  order_id: number;
  school_id: number;
  class_range: string;
  items_data: string;
  total_weight: number;
  order_no: string;
  no_of_days: number;
  period: string;
  financial_year: string;
  schoolname: string;
  udaisno: string;
  patsankhya?: number;
  status: string;
  created_at: string;
  uniq_id?: string;
}

type FormErrors = {
  orderNo?: string;
  selectedClass?: string;
  file?: string;
};

type ExtendedSWO = SchoolWiseOrder & {
  _isFirstInGroup?: boolean;
  _groupCount?: number;
  _groupKey?: string;
};

// interface ParsedExcelRow {
//   _schoolName: string;
//   _udise: string;
//   _centerName: string;
//   _classRange: string;
//   _patSankhya: number;
//   _totalWeight: number;
//   _items: Record<string, number>;
// }



const OrderRegisterWithColumnSearch = () => {
  // const { isEditMode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading] = useState(false);
  const [error] = useState<FormErrors>({});
  // const [editId, setEditId] = useState<number | null>(null);

  // Global UI busy (overlay loader)
  const [uiBusy] = useState(false);
  
  // Form fields
  const [orderNo, setOrderNo] = useState('');
  // const [noOfDays, setNoOfDays] = useState<number | null>(null);
  // const [period, setPeriod] = useState('');
  // const [financialYear, setFinancialYear] = useState('');
  // const [selectedClass, setSelectedClass] = useState('');
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [excelData, setExcelData] = useState<ParsedExcelRow[]>([]);

  // Data states
  const [zpOrders, setZpOrders] = useState<ZPOrderDetail[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolWiseOrders, setSchoolWiseOrders] = useState<SchoolWiseOrder[]>([]);

  // View modal state
  // const [viewOpen, setViewOpen] = useState(false);
  // const [viewItem, setViewItem] = useState<SchoolWiseOrder | null>(null);
  // const [uniqId, setUniqId] = useState<string | null>(null);
  
  // Group modal state
  // const [setGroupOpen] = useState(false);
  // const [setGroupRows] = useState<SchoolWiseOrder[]>([]);
  // const [setGroupMeta] = useState<{
  //   order_no: string;
  //   class_range: string;
  //   no_of_days: number;
  //   period: string;
  //   financial_year: string;
  // } | null>(null);

  // const [reopenGroupOnItemsClose, setReopenGroupOnItemsClose] = useState<boolean>(false);

  // Group delete confirm
  const [confirmGroupOpen, setConfirmGroupOpen] = useState(false);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);

  // Fetch data functions (same as original)
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

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/scooldata');
      const data = await response.json();
      setSchools(data);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('Failed to fetch school data');
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

  useEffect(() => {
    fetchZpOrders();
    fetchSchools();
    fetchSchoolWiseOrders();
  }, []);

  type SWOWithTaluka = SchoolWiseOrder & { taluka: string; _groupKey?: string };

  const dataWithTaluka: SWOWithTaluka[] = useMemo(() => {
    if (!schoolWiseOrders.length) return [];
    return schoolWiseOrders.map(r => {
      const s = schools.find(sc => sc.schoolid === r.school_id);
      return { ...r, taluka: s?.talukaname || '-' };
    });
  }, [schoolWiseOrders, schools]);

  const columns: Column<SWOWithTaluka>[] = [
    {
      key: 'delete',
      label: 'Action',
      render: (row) => {
        const r = row as ExtendedSWO;
        if (!r._isFirstInGroup) return null;
        const gkey = r._groupKey || (row).uniq_id || '';
        const first = dataWithTaluka.find(d => ((d._groupKey || d.uniq_id || '') === gkey)) as SchoolWiseOrder | undefined;
        const uid = (first && (first).uniq_id) || (row).uniq_id || null;
        return (
          <button
            type="button"
            className="text-red-600 hover:text-red-800 underline"
            onClick={() => {
              if (uid) {
                setPendingGroupId(uid as string);
                setConfirmGroupOpen(true);
              }
            }}
          >
            <FaTrash />
          </button>
        );
      }
    },
    { key: 'order_no', label: 'Order No', accessor: 'order_no', render: (row) => <span>{row.order_no}</span> },
    { key: 'no_of_days', label: 'No of Days', accessor: 'no_of_days', render: (row) => <span>{row.no_of_days}</span> },
    { key: 'period', label: 'Period', accessor: 'period', render: (row) => <span>{row.period}</span> },
    { key: 'financial_year', label: 'Year', accessor: 'financial_year', render: (row) => <span>{row.financial_year}</span> },
    { key: 'taluka', label: 'Taluka', accessor: 'taluka', render: (row) => <span>{(row as SWOWithTaluka).taluka}</span> },
    { key: 'class_range', label: 'Class', accessor: 'class_range', render: (row) => <span>{row.class_range}</span> },
    {
      key: 'total_schools',
      label: 'Total Number of Schools',
      render: (row) => {
        const r = row as ExtendedSWO;
        if (!r._isFirstInGroup) return null;
        return <span className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
          onClick={() => openGroup(r)}>{r._groupCount || 0}</span>;
      }
    },
  ];

  const openGroup = (row: (SchoolWiseOrder & { _groupKey?: string; _groupCount?: number })) => {
    const key = row._groupKey;
    if (key && key.length > 0) {
      // const rows = schoolWiseOrders.filter(r => (r).uniq_id === key);
      // setGroupRows(rows);
    
      return;
    }
  };

  const confirmGroupDelete = async () => {
    if (!pendingGroupId) return;
    try {
      const res = await fetch('/api/schoolwiseorders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniq_id: pendingGroupId, status: 'Inactive' }),
      });
      if (!res.ok) throw new Error('Failed to delete group');
      toast.success('Group deleted (soft) successfully');
      await fetchSchoolWiseOrders();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete group');
    } finally {
      setConfirmGroupOpen(false);
      setPendingGroupId(null);
    }
  };

  return (
    <div className="">
      {uiBusy && <Loader />}

      <ColumnSearchTable
        data={dataWithTaluka}
        classname={"h-auto overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
              <div>
                <Label>Select Order Number</Label>
                <select
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.orderNo ? "border-red-500" : ""}`}
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                >
                  <option value="">Select Order Number</option>
                  {zpOrders.map(order => (
                    <option key={order.id} value={order.id.toString()}>
                      {order.order_no} ({order.financial_year})
                    </option>
                  ))}
                </select>
                {error.orderNo && <div className="text-red-500 text-sm mt-1 pl-1">{error.orderNo}</div>}
              </div>
            </div>
          </div>
        }
        columns={columns}
        title="Order Details with Column Search"
        filterOptions={[]}
        submitbutton={
          <div className="flex gap-3 items-center">
            <button
              type='button'
              className='bg-blue-700 text-white py-2 px-4 rounded'
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Save'}
            </button>
          </div>
        }
        searchKey="schoolname"
        searchableKeys={['order_no', 'financial_year', 'class_range', 'taluka']}
        groupByKeys={['uniq_id']}
        colspanKeys={['delete', 'uniq_id', 'order_no', 'no_of_days', 'period', 'financial_year', 'taluka', 'class_range', 'total_schools']}
      />

      {/* Modals remain the same as original */}
      <Modal
        isOpen={confirmGroupOpen}
        onClose={() => { setConfirmGroupOpen(false); setPendingGroupId(null); }}
        className="max-w-[480px] p-6"
      >
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Confirmation</h4>
          <p className="text-sm text-gray-600 dark:text-white/70">
            Delete all rows for this group?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setConfirmGroupOpen(false); setPendingGroupId(null); }}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={confirmGroupDelete}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderRegisterWithColumnSearch;