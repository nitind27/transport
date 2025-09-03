"use client";

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";

import { toast } from 'react-toastify';
import { useToggleContext } from '@/context/ToggleContext';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';
import { IoEyeSharp } from 'react-icons/io5';
import { Modal } from '../ui/modal';

// Types
interface ZPOrderDetail {
  id: number;
  order_no: string;
  no_of_days: number;
  period: string;
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
  items_data: string;
  total_weight: number;
  order_no: string;
  no_of_days: number;
  period: string;
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
  file?: string;
};



const AddSchoolswiseorder = () => {
  const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState<FormErrors>({});
  const [editId, setEditId] = useState<number | null>(null);

  // Form fields
  const [orderNo, setOrderNo] = useState('');
  const [noOfDays, setNoOfDays] = useState<number | null>(null);
  const [period, setPeriod] = useState('');
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
        label: order.order_no
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
      }
    } else {
      setNoOfDays(null);
      setPeriod('');
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

  const handleEdit = (itemRow: SchoolWiseOrder) => {
    setIsActive(!isActive);
    setIsmodelopen(true);
    setIsEditmode(true);
    setEditId(itemRow.id);
    setOrderNo(itemRow.order_id.toString());
    setNoOfDays(itemRow.no_of_days);
    setPeriod(itemRow.period);
  };

  const columns: Column<SchoolWiseOrder>[] = [
    { key: 'order_no', label: 'Order No', accessor: 'order_no', render: (row) => <span>{row.order_no}</span> },
    { key: 'schoolname', label: 'School Name', accessor: 'schoolname', render: (row) => <span>{row.schoolname}</span> },
    { key: 'udaisno', label: 'UDAIS No', accessor: 'udaisno', render: (row) => <span>{row.udaisno}</span> },
    { key: 'no_of_days', label: 'No of Days', accessor: 'no_of_days', render: (row) => <span>{row.no_of_days}</span> },
    { key: 'period', label: 'Period', accessor: 'period', render: (row) => <span>{row.period}</span> },
    { key: 'total_weight', label: 'Total Weight', accessor: 'total_weight', render: (row) => <span>{row.total_weight} kg</span> },
    // { key: 'status', label: 'Status', accessor: 'status', render: (row) => <span>{row.status}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2 whitespace-nowrap w-full">
          {false &&
            <span onClick={() => handleEdit(row)} className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200">
              <FaEdit className="inline-block align-middle text-lg" />
            </span>
          }
          <span>
            <DefaultModal
              id={row.id}
              fetchData={fetchSchoolWiseOrders}
              endpoint={"schoolwiseorders"}
              bodyname='id'
              newstatus={row.status}
            />
          </span>
          <span className='cursor-pointer' onClick={() => handleView(row)}>
            <IoEyeSharp size={20} color='blue' />
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="">
      <ReusableTable
        data={schoolWiseOrders}
        classname={"h-auto overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className={`grid grid-cols-1 gap-x-6 gap-y-5 ${orderNo ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
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

            <div className={orderNo ? "sm:col-span-3" : ""}>
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
        }
        columns={columns}
        title="Add Schools Wise Order Details"
        filterOptions={[]}
        submitbutton={
          <button
            type='button'
            onClick={handleSave}
            className='bg-blue-700 text-white py-2 p-2 rounded'
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Save'}
          </button>
        }
        searchKey="schoolname"
      />

      {/* View Details Modal */}
      <Modal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        className="max-w-[900px] p-6"
      >
        {viewItem && (
          <div className="space-y-6 h-[550px] overflow-scroll">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {viewItem.schoolname}
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-white/60">
                (UDISE: {viewItem.udaisno})
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div><span className="font-medium text-gray-600 dark:text-white/70">Order No: </span>{viewItem.order_no}</div>
              <div><span className="font-medium text-gray-600 dark:text-white/70">School: </span>{viewItem.schoolname}</div>
              <div><span className="font-medium text-gray-600 dark:text-white/70">UDAIS No: </span>{viewItem.udaisno}</div>
              <div><span className="font-medium text-gray-600 dark:text-white/70">No. of Days: </span>{viewItem.no_of_days}</div>
              <div><span className="font-medium text-gray-600 dark:text-white/70">Period: </span>{viewItem.period}</div>
              <div><span className="font-medium text-gray-600 dark:text-white/70">Total Weight: </span>{viewItem.total_weight} kg</div>
            </div>

            <div>
              <h5 className="font-medium mb-3 text-gray-800 dark:text-white/90">Items</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left">Item</th>
                      <th className="px-3 py-2 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      typeof viewItem.items_data === 'string'
                        ? JSON.parse(viewItem.items_data as unknown as string)
                        : (viewItem.items_data || {})
                    )
                      .filter(([, val]) => Number(val) > 0)
                      .map(([key, val]) => (
                        <tr key={key} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-3 py-2">{key}</td>
                          <td className="px-3 py-2 text-right">{val as number}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewOpen(false)}
                className="bg-gray-600 text-white py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AddSchoolswiseorder;