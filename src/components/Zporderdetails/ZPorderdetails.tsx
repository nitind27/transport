"use client";

import { useEffect, useMemo, useState } from 'react';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";

import { toast } from 'react-toastify';
import { useToggleContext } from '@/context/ToggleContext';
import { UserCategory } from '../usercategory/userCategory';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';
import { UserData } from '../usersdata/Userdata';

type Props = {
  users: UserData[];
  datavillage: Village[];
  datataluka: Taluka[];
  datausercategorycrud: UserCategory[];
};

type FormErrors = {
  orderNo?: string;
  days?: string;
  item?: string;
  quantity?: string;
  period?: string;
};

const ZPorderdetails = ({ users }: Props) => {
  const [data] = useState<UserData[]>(users || []);
  const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState<FormErrors>({});
  const [editId, setEditId] = useState<number | null>(null);

  // New form fields
  const [orderNo, setOrderNo] = useState('');
  const [days, setDays] = useState<number | ''>('');
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [period, setPeriod] = useState('');

  // Dropdown options for Items (static for now)
  const itemOptions = useMemo(
    () => [
      { value: '', label: 'Select Item' },
      { value: 'Item 1', label: 'Item 1' },
      { value: 'Item 2', label: 'Item 2' },
      { value: 'Item 3', label: 'Item 3' },
    ],
    []
  );

  useEffect(() => {
    if (!isvalidation) setErrors({});
  }, [isvalidation]);

  const reset = () => {
    setOrderNo('');
    setDays('');
    setItem('');
    setQuantity('');
    setPeriod('');
    setEditId(0);
  };

  useEffect(() => {
    if (!isEditMode) reset();
  }, [isEditMode]);

  const validateInputs = () => {
    const newErrors: FormErrors = {};
    setisvalidation(true);

    if (!orderNo) newErrors.orderNo = "Order No is required";
    if (days === '' || Number(days) <= 0) newErrors.days = "No of Days is required";
    if (!item) newErrors.item = "Item is required";
    if (quantity === '' || Number(quantity) <= 0) newErrors.quantity = "Quantity is required";
    if (!period) newErrors.period = "Period is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    try {
      // No backend specified yet for these fields; just simulate success:
      toast.success(editId ? 'Order updated successfully!' : 'Order created successfully!');
      reset();
      setEditId(null);
    } catch {
      toast.error(editId ? 'Failed to update. Please try again.' : 'Failed to create. Please try again.');
    } finally {
      setLoading(false);
      setIsmodelopen(false);
    }
  };

  const handleEdit = (itemRow: UserData) => {
    // Keeping table edit open behavior for now; not pre-filling new fields
    setIsActive(!isActive);
    setIsmodelopen(true);
    setIsEditmode(true);
    setEditId(itemRow.user_id);
  };

  // const handleDownloadExcel = () => {
  //   const exportData = data.map(({ ...rest }) => rest);
  //   const worksheet = XLSX.utils.json_to_sheet(exportData);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
  //   const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  //   const file = new Blob([excelBuffer], { type: "application/octet-stream" });
  //   saveAs(file, "users.xlsx");
  // };

  const columns: Column<UserData>[] = [
    { key: 'name', label: 'Name', accessor: 'name', render: (row) => <span>{row.name}</span> },
    { key: 'user_category_id', label: 'User Category', accessor: 'user_category_id', render: (row) => <span>{row.user_category_name}</span> },
    { key: 'username', label: 'User Name', accessor: 'username', render: (row) => <span>{row.username}</span> },
    { key: 'password', label: 'Password', accessor: 'password', render: (row) => <span>{row.password}</span> },
    { key: 'contact_no', label: 'Contact No', accessor: 'contact_no', render: (row) => <span>{row.contact_no}</span> },
    { key: 'address', label: 'Address', accessor: 'address', render: (row) => <span>{row.address}</span> },
    { key: 'taluka_id', label: 'Taluka', accessor: 'taluka_id', render: (row) => <span>{row.taluka_name}</span> },
    { key: 'village_id', label: 'Village', accessor: 'village_id', render: (row) => <span>{row.village_name}</span> },
    { key: 'status', label: 'Status', accessor: 'status', render: (row) => <span>{row.status}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2 whitespace-nowrap w-full">
          <span onClick={() => handleEdit(row)} className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200">
            <FaEdit className="inline-block align-middle text-lg" />
          </span>
          <span>
            <DefaultModal id={row.user_id} fetchData={() => { }} endpoint={"users/insert"} bodyname='user_id' newstatus={row.status} />
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="">
      <div className="flex justify-end">
        {/* <button
          onClick={handleDownloadExcel}
          className="bg-green-600 text-white py-2 px-4 rounded mb-4 hover:bg-green-700 transition-colors"
        >
          Download Excel
        </button> */}
      </div>

      <ReusableTable
        data={data}
        classname={"h-auto overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
            <div className='grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2'>


              <div>
                <Label>Order No</Label>
                <input
                  type="text"
                  placeholder="Enter Order No"
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.orderNo ? "border-red-500" : ""}`}
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                />
                {error.orderNo && <div className="text-red-500 text-sm mt-1 pl-1">{error.orderNo}</div>}
              </div>

              <div>
                <Label>No of Days</Label>
                <input
                  type="number"
                  placeholder="Enter No of Days"
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.days ? "border-red-500" : ""}`}
                  value={days}
                  onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))}
                />
                {error.days && <div className="text-red-500 text-sm mt-1 pl-1">{error.days}</div>}
              </div>
            </div>
             <div className='grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2'>

            <div>
              <Label>Items</Label>
              <select
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.item ? "border-red-500" : ""}`}
                value={item}
                onChange={(e) => setItem(e.target.value)}
              >
                {itemOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {error.item && <div className="text-red-500 text-sm mt-1 pl-1">{error.item}</div>}
            </div>

            <div>
              <Label>Quantity</Label>
              <input
                type="number"
                placeholder="Enter Quantity"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.quantity ? "border-red-500" : ""}`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
              />
              {error.quantity && <div className="text-red-500 text-sm mt-1 pl-1">{error.quantity}</div>}
            </div>
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
        }
        columns={columns}
        title="Order Details"
        filterOptions={[]}
        submitbutton={
          <button
            type='button'
            onClick={handleSave}
            className='bg-blue-700 text-white py-2 p-2 rounded'
            disabled={loading}
          >
            {loading ? 'Submitting...' : (editId ? 'Update' : 'Save Changes')}
          </button>
        }
        searchKey="username"
      />
    </div>
  );
};

export default ZPorderdetails;
