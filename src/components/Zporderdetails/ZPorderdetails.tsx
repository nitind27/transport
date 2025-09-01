"use client";

import { useEffect, useState } from 'react';
import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { useToggleContext } from '@/context/ToggleContext';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';
import { ZPOrderDetail, FormErrors } from './ZPOrderDetailsType';

type Props = {
  zpOrderDetails: ZPOrderDetail[];
};

const ZPorderdetails = ({ zpOrderDetails }: Props) => {
  const [data, setData] = useState<ZPOrderDetail[]>(zpOrderDetails || []);
  const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState<FormErrors>({});
  const [editId, setEditId] = useState<number | null>(null);

  // Form fields
  const [orderNo, setOrderNo] = useState('');
  const [days, setDays] = useState<number | ''>('');
  const [period, setPeriod] = useState('');

  useEffect(() => {
    if (!isvalidation) setErrors({});
  }, [isvalidation]);

  const reset = () => {
    setOrderNo('');
    setDays('');
    setPeriod('');
    setEditId(null);
  };

  useEffect(() => {
    if (!isEditMode) reset();
  }, [isEditMode]);

  const validateInputs = () => {
    const newErrors: FormErrors = {};
    setisvalidation(true);

    if (!orderNo.trim()) newErrors.order_no = "Order No is required";
    if (days === '' || Number(days) <= 0) newErrors.no_of_days = "No of Days is required and must be greater than 0";
    if (!period.trim()) newErrors.period = "Period is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchData = async () => {
    try {
      const response = await fetch('/api/zporderdetails');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSave = async () => {
    if (!validateInputs()) return;
    setLoading(true);

    const apiUrl = '/api/zporderdetails';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId,
          order_no: orderNo,
          no_of_days: Number(days),
          period: period
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success(editId ? 'Order updated successfully!' : 'Order created successfully!');
      reset();
      setEditId(null);
      fetchData();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error(editId ? 'Failed to update order. Please try again.' : 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
      setIsmodelopen(false);
    }
  };

  const handleEdit = (item: ZPOrderDetail) => {
    setIsActive(!isActive);
    setIsmodelopen(true);
    setIsEditmode(true);
    setEditId(item.id);
    setOrderNo(item.order_no);
    setDays(item.no_of_days);
    setPeriod(item.period);
  };

  const columns: Column<ZPOrderDetail>[] = [
    { 
      key: 'order_no', 
      label: 'Order No', 
      accessor: 'order_no', 
      render: (row) => <span>{row.order_no}</span> 
    },
    { 
      key: 'no_of_days', 
      label: 'No of Days', 
      accessor: 'no_of_days', 
      render: (row) => <span>{row.no_of_days}</span> 
    },
    { 
      key: 'period', 
      label: 'Period', 
      accessor: 'period', 
      render: (row) => <span>{row.period}</span> 
    },
    { 
      key: 'status', 
      label: 'Status', 
      accessor: 'status', 
      render: (row) => <span>{row.status}</span> 
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2 whitespace-nowrap w-full">
          <span 
            onClick={() => handleEdit(row)} 
            className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <FaEdit className="inline-block align-middle text-lg" />
          </span>
          <span>
            <DefaultModal 
              id={row.id} 
              fetchData={fetchData} 
              endpoint="zporderdetails" 
              bodyname='id' 
              newstatus={row.status} 
            />
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="">
      <ReusableTable
        data={data}
        classname={"h-auto overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
            <div className='grid grid-cols-1 gap-x-2 gap-y-2 sm:grid-cols-3'>
              <div>
                <Label>Order No</Label>
                <input
                  type="text"
                  placeholder="Enter Order No"
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.order_no ? "border-red-500" : ""}`}
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                />
                {error.order_no && <div className="text-red-500 text-sm mt-1 pl-1">{error.order_no}</div>}
              </div>

              <div>
                <Label>No of Days</Label>
                <input
                  type="number"
                  placeholder="Enter No of Days"
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.no_of_days ? "border-red-500" : ""}`}
                  value={days}
                  onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))}
                />
                {error.no_of_days && <div className="text-red-500 text-sm mt-1 pl-1">{error.no_of_days}</div>}
              </div>

              <div>
                <Label>Period</Label>
                <input
                  type="text"
                  placeholder="Enter Period"
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.period ? "border-red-500" : ""}`}
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                />
                {error.period && <div className="text-red-500 text-sm mt-1 pl-1">{error.period}</div>}
              </div>
            </div>
          </div>
        }
        columns={columns}
        title="ZP Order Details"
        filterOptions={[]}
        submitbutton={
          <button
            type='button'
            onClick={handleSave}
            className='bg-blue-700 text-white py-2 p-2 rounded'
            disabled={loading}
          >
            {loading ? 'Submitting...' : (editId ? 'Update' : 'Submit')}
          </button>
        }
        searchKey="order_no"
      />
    </div>
  );
};

export default ZPorderdetails;
