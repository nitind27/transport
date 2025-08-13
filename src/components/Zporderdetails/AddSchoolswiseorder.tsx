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
  school?: string;
  item?: string;
  quantity?: string;
};

const AddSchoolswiseorder = ({ users }: Props) => {
  const [data] = useState<UserData[]>(users || []);
  const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState<FormErrors>({});
  const [editId, setEditId] = useState<number | null>(null);

  // Form fields
  const [orderNo, setOrderNo] = useState('');
  const [school, setSchool] = useState('');
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');

  // Dropdown options (placeholder static options; replace with API data later)
  const orderNoOptions = useMemo(
    () => [
      { value: '', label: 'Select Order Number' },
      { value: 'ORD-2025-001', label: 'ORD-2025-001' },
      { value: 'ORD-2025-002', label: 'ORD-2025-002' },
      { value: 'ORD-2025-003', label: 'ORD-2025-003' },
    ],
    []
  );

  const schoolOptions = useMemo(
    () => [
      { value: '', label: 'Select School' },
      { value: 'School-01', label: 'School 01' },
      { value: 'School-02', label: 'School 02' },
      { value: 'School-03', label: 'School 03' },
    ],
    []
  );

  const itemOptions = useMemo(
    () => [
      { value: '', label: 'Select Item' },
      { value: 'Rice', label: 'Rice' },
      { value: 'Wheat', label: 'Wheat' },
      { value: 'Dal', label: 'Dal' },
    ],
    []
  );

  useEffect(() => {
    if (!isvalidation) setErrors({});
  }, [isvalidation]);

  const reset = () => {
    setOrderNo('');
    setSchool('');
    setItem('');
    setQuantity('');
    setEditId(0);
  };

  useEffect(() => {
    if (!isEditMode) reset();
  }, [isEditMode]);

  const validateInputs = () => {
    const newErrors: FormErrors = {};
    setisvalidation(true);

    if (!orderNo) newErrors.orderNo = "Order number is required";
    if (!school) newErrors.school = "School is required";
    if (!item) newErrors.item = "Item is required";
    if (quantity === '' || Number(quantity) <= 0) newErrors.quantity = "Quantity is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    try {
      // TODO: Hook up to backend API when ready
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
            <DefaultModal id={row.user_id} fetchData={() => {}} endpoint={"users/insert"} bodyname='user_id' newstatus={row.status} />
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
        classname={"h-[550px] overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
            <div>
              <Label>Select Order Number</Label>
              <select
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.orderNo ? "border-red-500" : ""}`}
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
              >
                {orderNoOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {error.orderNo && <div className="text-red-500 text-sm mt-1 pl-1">{error.orderNo}</div>}
            </div>

            <div>
              <Label>Select School</Label>
              <select
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.school ? "border-red-500" : ""}`}
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              >
                {schoolOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {error.school && <div className="text-red-500 text-sm mt-1 pl-1">{error.school}</div>}
            </div>

            <div>
              <Label>Add Item Details</Label>
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
              <Label>Qty</Label>
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
        searchKey="username"
      />
    </div>
  );
};

export default AddSchoolswiseorder;