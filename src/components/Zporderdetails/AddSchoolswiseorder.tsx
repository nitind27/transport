"use client";

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

import Label from "../form/Label";

import { Column } from "../tables/tabletype";

import { toast } from 'react-toastify';
import { useToggleContext } from '@/context/ToggleContext';
import { IoEyeSharp } from 'react-icons/io5';
import { Modal } from '../ui/modal';
import { Schoolwisetable } from '../tables/Schoolwisetable';
import { MdDelete } from 'react-icons/md';

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
  status: string;
  created_at: string;
}

interface ExcelRow {
  'School Name': string;
  'तांदुळ': number;
  'मुंगदाळ': number;
  'मसूरदाळ': number;
  'तूरदाल': number;
  'हरभरा': number;
  'चवळी': number;
  'मटकी': number;
  'मुंग': number;
  'वाटाणा': number;
  'सोया वडी': number;
  'मसाला': number;
  'सोया तेल': number;
  'हळद': number;
  'मीठ': number;
  'मोहरी': number;
  'एकूण वजन': number;
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


const AddSchoolswiseorder = () => {
  const { isEditMode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState<FormErrors>({});
  const [editId, setEditId] = useState<number | null>(null);

  // Form fields
  const [orderNo, setOrderNo] = useState('');
  const [noOfDays, setNoOfDays] = useState<number | null>(null);
  const [period, setPeriod] = useState('');
  const [financialYear, setFinancialYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);

  // Data states
  const [zpOrders, setZpOrders] = useState<ZPOrderDetail[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolWiseOrders, setSchoolWiseOrders] = useState<SchoolWiseOrder[]>([]);

  // View modal state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<SchoolWiseOrder | null>(null);

  const handleView = (row: SchoolWiseOrder) => {
    setViewItem(row);
    setViewOpen(true);
  };
  console.log("fastchecj", schools)
  // Fetch ZP Orders
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

  // Fetch Schools
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

  // Fetch School Wise Orders
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

  // Order number options
  const orderNoOptions = useMemo(() => {
    const options = [{ value: '', label: 'Select Order Number' }];
    zpOrders.forEach(order => {
      options.push({
        value: order.id.toString(),
        label: `${order.order_no} (${order.financial_year})`
      });
    });
    return options;
  }, [zpOrders]);

  // Handle order number selection
  const handleOrderChange = (orderId: string) => {
    setOrderNo(orderId);
    if (orderId) {
      const selectedOrder = zpOrders.find(order => order.id.toString() === orderId);
      if (selectedOrder) {
        setNoOfDays(selectedOrder.no_of_days);
        setPeriod(selectedOrder.period);
        setFinancialYear(selectedOrder.financial_year);
      }
    } else {
      setNoOfDays(null);
      setPeriod('');
      setFinancialYear('');
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is Excel
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!['xlsx', 'xls'].includes(fileExtension || '')) {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        return;
      }

      setSelectedFile(file);
      parseExcelFile(file);
    }
  };

  // Parse Excel file
  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

        setExcelData(jsonData);
        toast.success(`Excel file loaded successfully. Found ${jsonData.length} rows.`);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        toast.error('Error parsing Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (!isvalidation) setErrors({});
  }, [isvalidation]);

  const reset = () => {
    setOrderNo('');
    setNoOfDays(null);
    setPeriod('');
    setFinancialYear('');
    setSelectedClass('');
    setSelectedFile(null);
    setExcelData([]);
    setEditId(null);
  };

  useEffect(() => {
    if (!isEditMode) reset();
  }, [isEditMode]);

  const validateInputs = () => {
    const newErrors: FormErrors = {};
    setisvalidation(true);

    if (!orderNo) newErrors.orderNo = "Order number is required";
    if (!selectedClass) newErrors.selectedClass = "Class selection is required";
    if (!selectedFile && excelData.length === 0) newErrors.file = "Excel file is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;
    setLoading(true);

    try {
      const orderId = parseInt(orderNo);

      // Process each row from Excel data
      for (const row of excelData) {
        // Find school by name
        const school = schools.find(s =>
          s.schoolname.toLowerCase().trim() === row['School Name'].toLowerCase().trim()
        );

        if (!school) {
          toast.warning(`School "${row['School Name']}" not found in database`);
          continue;
        }

        // Prepare items data in JSON format
        const itemsData = {
          'तांदुळ': row['तांदुळ'] || 0,
          'मुंगदाळ': row['मुंगदाळ'] || 0,
          'मसूरदाळ': row['मसूरदाळ'] || 0,
          'तूरदाल': row['तूरदाल'] || 0,
          'हरभरा': row['हरभरा'] || 0,
          'चवळी': row['चवळी'] || 0,
          'मटकी': row['मटकी'] || 0,
          'मुंग': row['मुंग'] || 0,
          'वाटाणा': row['वाटाणा'] || 0,
          'सोया वडी': row['सोया वडी'] || 0,
          'मसाला': row['मसाला'] || 0,
          'सोया तेल': row['सोया तेल'] || 0,
          'हळद': row['हळद'] || 0,
          'मीठ': row['मीठ'] || 0,
          'मोहरी': row['मोहरी'] || 0,
        };

        const totalWeight = row['एकूण वजन'] || 0;

        // Create or update school-wise order
        const payload = {
          order_id: orderId,
          school_id: school.schoolid,
          class_range: selectedClass,
          items_data: itemsData,
          total_weight: totalWeight
        };

        const url = editId ? '/api/schoolwiseorders' : '/api/schoolwiseorders';
        const method = editId ? 'PUT' : 'POST';

        if (editId) {
          payload.order_id = editId;
        }

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to ${editId ? 'update' : 'create'} order for school ${school.schoolname}`);
        }
      }

      toast.success(editId ? 'Order updated successfully!' : 'Orders created successfully!');
      reset();
      setEditId(null);
      fetchSchoolWiseOrders(); // Refresh the data
    } catch (error) {
      console.error('Error saving orders:', error);
      toast.error(editId ? 'Failed to update. Please try again.' : 'Failed to create. Please try again.');
    } finally {
      setLoading(false);
      setIsmodelopen(false);
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingOrderNo, setPendingOrderNo] = useState<string | null>(null);

  const openBulkDelete = (orderNo: string) => {
    setPendingOrderNo(orderNo);
    setConfirmOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (!pendingOrderNo) return;
    try {
      const targets = schoolWiseOrders.filter(r => r.order_no === pendingOrderNo);
      for (const t of targets) {
        await fetch('/api/schoolwiseorders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: t.id, status: 'Inactive' }),
        });
      }
      toast.success('Deleted all rows for the order');
      await fetchSchoolWiseOrders();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete rows for the order');
    } finally {
      setConfirmOpen(false);
      setPendingOrderNo(null);
    }
  };

  const columns: Column<SchoolWiseOrder>[] = [
    {
      key: 'order_no',
      label: 'Actions',
      render: (row) => {
        const isFirst = (row as ExtendedSWO)._isFirstInGroup === true;
        return (
          <div className="flex gap-2 whitespace-nowrap w-full items-center">
            {isFirst && (
              <span
                onClick={() => openBulkDelete(row.order_no)}
                className="cursor-pointer text-red-600 hover:text-red-800 transition-colors duration-200"
                title="Delete all rows for this order"
              >
                <MdDelete className="inline-block align-middle text-lg" />
              </span>
            )}

          </div>
        );
      }
    },
    { key: 'order_no', label: 'Order No', accessor: 'order_no', render: (row) => <span>{row.order_no}</span> },
    { key: 'no_of_days', label: 'No of Days', accessor: 'no_of_days', render: (row) => <span>{row.no_of_days}</span> },
    { key: 'period', label: 'Period', accessor: 'period', render: (row) => <span>{row.period}</span> },
    { key: 'financial_year', label: 'Financial Year', accessor: 'financial_year', render: (row) => <span>{row.financial_year}</span> },
    { key: 'class_range', label: 'Class', accessor: 'class_range', render: (row) => <span>{row.class_range}</span> },
    { key: 'schoolname', label: 'School Name', accessor: 'schoolname', render: (row) => <span>{row.schoolname}</span> },
    { key: 'udaisno', label: 'UDAIS No', accessor: 'udaisno', render: (row) => <span>{row.udaisno}</span> },
    { key: 'total_weight', label: 'Total Weight', accessor: 'total_weight', render: (row) => <span>{row.total_weight} kg</span> },
    // { key: 'status', label: 'Status', accessor: 'status', render: (row) => <span>{row.status}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {

        return (
          <div className="flex gap-2 whitespace-nowrap w-full items-center">

            <span className='cursor-pointer' onClick={() => handleView(row)} title="View">
              <IoEyeSharp size={20} color='blue' />
            </span>
          </div>
        );
      }
    }
  ];

  return (
    <div className="">
      <Schoolwisetable
        data={schoolWiseOrders}
        classname={"h-auto overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className="space-y-6">
            {/* First row - 3 fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
              <div>
                <Label>Select Order Number</Label>
                <select
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.orderNo ? "border-red-500" : ""}`}
                  value={orderNo}
                  onChange={(e) => handleOrderChange(e.target.value)}
                >
                  {orderNoOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {error.orderNo && <div className="text-red-500 text-sm mt-1 pl-1">{error.orderNo}</div>}
              </div>

              {orderNo && (
                <>
                  <div>
                    <Label>No of Days</Label>
                    <input
                      type="number"
                      value={noOfDays || ''}
                      disabled
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-gray-100 text-gray-600 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white/70"
                    />
                  </div>
                  <div>
                    <Label>Period</Label>
                    <input
                      type="text"
                      value={period}
                      disabled
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-gray-100 text-gray-600 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white/70"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Second row - 3 fields in flex */}
            <div className="flex flex-col sm:flex-row gap-x-6 gap-y-5">
              <div className="flex-1">
                <Label>Financial Year</Label>
                <input
                  type="text"
                  value={financialYear}
                  disabled
                  className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-gray-100 text-gray-600 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white/70"
                />
              </div>
              <div className="flex-1">
                <Label>वर्ग (Class)</Label>
                <select
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.selectedClass ? "border-red-500" : ""}`}
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">Select Class</option>
                  <option value="1-5">1-5</option>
                  <option value="6-8">6-8</option>
                </select>
                {error.selectedClass && <div className="text-red-500 text-sm mt-1 pl-1">{error.selectedClass}</div>}
              </div>
              <div className="flex-1">
                <Label>Excel File</Label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.file ? "border-red-500" : ""}`}
                />
                {error.file && <div className="text-red-500 text-sm mt-1 pl-1">{error.file}</div>}
                {selectedFile && (
                  <div className="text-green-600 text-sm mt-1 pl-1">
                    Selected: {selectedFile.name} ({excelData.length} rows)
                  </div>
                )}
              </div>
            </div>
          </div>
        }
        columns={columns}
        title="Add Schools Wise Order Details"
        filterOptions={[]}
        submitbutton={
          <div className="flex gap-3 items-center">

            <button
              type='button'
              onClick={handleSave}
              className='bg-blue-700 text-white py-2 px-4 rounded'
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Save'}
            </button>
            <a
              href="/excel/sample_school_wise_order.xlsx"
              download="sample_school_wise_order.xlsx"
              className="inline-flex items-center gap-2 px-2 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Sample
            </a>
          </div>
        }

        // ... existing code ...
        searchKey="schoolname"
        groupByKey="order_no"
        colspanKeys={['order_no', 'no_of_days', 'period', 'financial_year', 'class_range']}
      />

      {/* View Details Modal */}
      <Modal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        className="max-w-[550px] p-6"
      >
        {viewItem && (
          <div className="space-y-3 h-[550px] overflow-scroll">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {viewItem.schoolname}
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-white/60">
                (UDISE: {viewItem.udaisno})
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-gray-600 dark:text-white/70">Order No: </span>{viewItem.order_no}</div>

              <div><span className="font-medium text-gray-600 dark:text-white/70">No. of Days: </span>{viewItem.no_of_days}</div>
              <div><span className="font-medium text-gray-600 dark:text-white/70">Period: </span>{viewItem.period}</div>
              <div><span className="font-medium text-gray-600 dark:text-white/70">Financial Year: </span>{viewItem.financial_year}</div>
              <div><span className="font-medium text-gray-600 dark:text-white/70">Class: </span>{viewItem.class_range}</div>
              <div><span className="font-medium text-gray-600 dark:text-white/70">Total Weight: </span>{viewItem.total_weight} kg</div>
            </div>

            <div>
              <h5 className="font-medium mb-3 text-gray-800 dark:text-white/90">Items</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 border-collapse">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left border border-gray-200 dark:border-gray-700 w-5">Sr</th>
                      <th className="px-3 py-2 text-left border border-gray-200 dark:border-gray-700">Item</th>
                      <th className="px-3 py-2 text-right border border-gray-200 dark:border-gray-700">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      typeof viewItem.items_data === 'string'
                        ? JSON.parse(viewItem.items_data as unknown as string)
                        : (viewItem.items_data || {})
                    )
                      .filter(([, val]) => Number(val) > 0)
                      .map(([key, val], index) => (
                        <tr key={key} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-3 py-2 border border-gray-200 dark:border-gray-700">{index + 1}</td>
                          <td className="px-3 py-2 border border-gray-200 dark:border-gray-700">{key}</td>
                          <td className="px-3 py-2 text-right border border-gray-200 dark:border-gray-700">{val as number}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 
            <div className="flex justify-end">
              <button
                onClick={() => setViewOpen(false)}
                className="bg-gray-600 text-white py-2 px-4 rounded"
              >
                Close
              </button>
            </div> */}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingOrderNo(null); }}
        className="max-w-[480px] p-6"
      >
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Confirmation</h4>
          <p className="text-sm text-gray-600 dark:text-white/70">
            Delete all rows for order no: <span className="font-semibold">{pendingOrderNo}</span>?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setConfirmOpen(false); setPendingOrderNo(null); }}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={confirmBulkDelete}
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

export default AddSchoolswiseorder;