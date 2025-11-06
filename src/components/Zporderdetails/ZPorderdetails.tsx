"use client";

import { useEffect, useState } from 'react';
import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { useToggleContext } from '@/context/ToggleContext';
// import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';
import { ZPOrderDetail, FormErrors } from './ZPOrderDetailsType';
import DeleteZapmodel from '../example/ModalExample/DeleteZapmodel';

type Props = {
  zpOrderDetails: ZPOrderDetail[];
};

interface ZPOrderRequestBody {
  id?: number | null;
  order_no: string;
  no_of_days: number;
  period: string;
  financial_year: string;
  user_id?: string;
  company_id?: string;
}

const ZPorderdetails = ({ zpOrderDetails }: Props) => {
  // Initialize with prop data from server-side rendering, will be updated by fetchData with filtered data
  const [data, setData] = useState<ZPOrderDetail[]>(zpOrderDetails || []);
  const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true); // Loading state for initial data fetch
  const [error, setErrors] = useState<FormErrors>({});
  const [editId, setEditId] = useState<number | null>(null);

  // Form fields
  const [orderNo, setOrderNo] = useState('');
  const [days, setDays] = useState<number | ''>('');
  const [period, setPeriod] = useState('');
  const [financialYear, setFinancialYear] = useState('');

  // Generate financial year options (current year and next 5 years)
  const generateFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 6; i++) {
      const year = currentYear + i;
      const nextYear = year + 1;
      years.push(`${year}-${nextYear.toString().slice(-2)}`);
    }
    return years;
  };

  const financialYearOptions = generateFinancialYears();

  useEffect(() => {
    if (!isvalidation) setErrors({});
  }, [isvalidation]);

  const reset = () => {
    setOrderNo('');
    setDays('');
    setPeriod('');
    setFinancialYear('');
    setEditId(null);
  };

  useEffect(() => {
    if (!isEditMode) reset();
  }, [isEditMode]);

  // Fetch filtered data on component mount
  useEffect(() => {
    // Wait a bit to ensure sessionStorage is populated
    const timer = setTimeout(() => {
      fetchData();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const validateInputs = () => {
    const newErrors: FormErrors = {};
    setisvalidation(true);

    if (!orderNo.trim()) newErrors.order_no = "Order No is required";
    if (days === '' || Number(days) <= 0) newErrors.no_of_days = "No of Days is required and must be greater than 0";
    if (!period.trim()) newErrors.period = "Period is required";
    if (!financialYear.trim()) newErrors.financial_year = "Financial Year is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchData = async () => {
    try {
      setDataLoading(true);
      
      // Get user_id and company_id from sessionStorage
      const userId = sessionStorage.getItem('userid');
      const companyId = sessionStorage.getItem('company_id');
      
      console.log('ZP Order Details - SessionStorage values:', { 
        userId: userId || 'NOT FOUND', 
        companyId: companyId || 'NOT FOUND' 
      });
      
      // Build query parameters - only add if exists and not empty string
      const params = new URLSearchParams();
      if (userId && userId.trim() !== '') {
        params.append('user_id', userId.trim());
      }
      if (companyId && companyId.trim() !== '') {
        params.append('company_id', companyId.trim());
      }
      
      const queryString = params.toString();
      const apiUrl = `/api/zporderdetails${queryString ? '?' + queryString : ''}`;
      
      console.log('ZP Order Details - Fetching from:', apiUrl);
      console.log('ZP Order Details - Query params:', { user_id: userId, company_id: companyId });
      
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('ZP Order Details - Fetched successfully:', result?.length || 0, 'records');
        console.log('ZP Order Details - Sample data:', result?.slice(0, 2));
        
        if (Array.isArray(result)) {
          setData(result);
        } else {
          console.error('ZP Order Details - Invalid response format:', result);
          setData([]);
          toast.error('Invalid data format received');
        }
      } else {
        const errorText = await response.text();
        console.error('ZP Order Details - API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        toast.error(`Failed to fetch order details: ${response.statusText}`);
        setData([]);
      }
    } catch (error: unknown) {
      console.error('ZP Order Details - Fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to fetch order details: ${errorMessage}`);
      setData([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateInputs()) return;
    setLoading(true);

    // Get user_id and company_id from sessionStorage
    const userId = sessionStorage.getItem('userid');
    const companyId = sessionStorage.getItem('company_id');

    const apiUrl = '/api/zporderdetails';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      // Build request body
      const requestBody: ZPOrderRequestBody = {
        ...(editId && { id: editId }),
        order_no: orderNo,
        no_of_days: Number(days),
        period: period,
        financial_year: financialYear,
        // Only add user_id and company_id for new records (POST), not for updates
        ...(!isEditMode && userId && userId.trim() !== '' && { user_id: userId.trim() }),
        ...(!isEditMode && companyId && companyId.trim() !== '' && { company_id: companyId.trim() })
      };

      const response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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
    setFinancialYear(item.financial_year);
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
      key: 'financial_year', 
      label: 'Financial Year', 
      accessor: 'financial_year', 
      render: (row) => <span>{row.financial_year}</span> 
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
            <DeleteZapmodel 
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

  // Show loading state
  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <ReusableTable
        data={data}
        classname={"h-auto overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
            <div className='grid grid-cols-1 gap-x-2 gap-y-2 sm:grid-cols-2'>
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

              <div>
                <Label>Financial Year</Label>
                <select
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.financial_year ? "border-red-500" : ""}`}
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                >
                  <option value="">Select Financial Year</option>
                  {financialYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {error.financial_year && <div className="text-red-500 text-sm mt-1 pl-1">{error.financial_year}</div>}
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
