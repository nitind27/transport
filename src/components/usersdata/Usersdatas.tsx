"use client";

import { useEffect, useState } from 'react';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";


import { toast } from 'react-toastify';

import { UserData } from './Userdata';
import { useToggleContext } from '@/context/ToggleContext';
import { UserCategory } from '../usercategory/userCategory';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';
// import { Grampanchayattype } from '../grampanchayat/gptype';

type Props = {
  users: UserData[];
  datavillage: Village[];
  datataluka: Taluka[];
  datausercategorycrud: UserCategory[];
  // grampanchayat: Grampanchayattype[];
};
type FormErrors = {

  usercategory?: string;
  name?: string;
  Contact?: string;
  Username?: string;
  Password?: string;
  address?: string;
  Taluka?: string;
  Village?: string;
  gp?: string;

};
const Usersdatas = ({ users, datausercategorycrud }: Props) => {

  const [data, setData] = useState<UserData[]>(users || []);
  const [usercategory, setUsercategory] = useState(0);

  const [name, setName] = useState('');
  const [Contact, setContact] = useState('');
  const [Username, setUsername] = useState('');
  const [Password, setPassword] = useState('');
  const [address, setaddress] = useState('');
  // const [Taluka, setTaluka] = useState(0);
  // const [Village, setVillage] = useState(0);
  const [gp, setgp] = useState(0);
  const [editId, setEditId] = useState<number | null>(null);
  const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState<FormErrors>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false); // End loading
    }
  };

  useEffect(() => {

    if (!isvalidation) {

      setErrors({})
    }
  }, [isvalidation])

  const reset = () => {
    setUsercategory(Number(""))

    setName("")
    setContact("")
    setUsername("")
    setPassword("")
    setaddress("")
    // setTaluka(Number(""))
    // setVillage(Number(""))
    setgp(Number(""))
    setEditId(0);
  }

  useEffect(() => {
    if (!isEditMode) {
      reset()
    }
  }, [isEditMode]);

  const validateInputs = () => {
    const newErrors: FormErrors = {};
    setisvalidation(true)
    // Category validation

    // Documents validation
    if (!usercategory) {
      newErrors.usercategory = "Usercategory is required";
    }
    if (!name || name.length === 0) {
      newErrors.name = "Name is required";
    }
    if (!Contact || Contact.length === 0) {
      newErrors.Contact = "Contact is required";
    }
    if (!Username || Username.length === 0) {
      newErrors.Username = "Username is required";
    }
    if (!Password || Password.length === 0) {
      newErrors.Password = "Password is required";
    }
    if (!address || address.length === 0) {
      newErrors.address = "Address is required";
    }
  
 


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSave = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    const apiUrl = isEditMode ? `/api/users/insert` : '/api/users/insert';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editId,
          name: name,
          user_category_id: usercategory,
          username: Username,
          password: Password,
          contact_no: Contact,
          address: address,
          gp_id: gp,
          status: "Active"

        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success(editId
        ? 'updated successfully!'
        : 'Inserted successfully!');


      reset()
      setEditId(null);
      fetchData();
    } catch (error) {
      console.error('Error saving Users:', error);
      toast.error(editId
        ? 'Failed to update Users. Please try again.'
        : 'Failed to create Users. Please try again.');
    } finally {
      setLoading(false);
      setIsmodelopen(false);
    }
  };




  const handleEdit = (item: UserData) => {
    setIsActive(!isActive)
    setIsmodelopen(true);
    setIsEditmode(true);
    setUsercategory(Number(item.user_category_id))
    setEditId(item.user_id)
    setName(item.name)
    setContact(item.contact_no)
    setUsername(item.username)
    setPassword(item.password)
    setaddress(item.address)
    // setTaluka(item.taluka_id)
    // setVillage(item.village_id)
    setgp(Number(item.gp_id))
  };

  // const handleDownloadExcel = () => {
  //   // Prepare data for Excel (remove unwanted fields if needed)
  //   const exportData = data.map(({ ...rest }) => rest); // Example: exclude password

  //   // Convert JSON to worksheet
  //   const worksheet = XLSX.utils.json_to_sheet(exportData);

  //   // Create a new workbook and append the worksheet
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

  //   // Generate buffer
  //   const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  //   // Save file
  //   const file = new Blob([excelBuffer], { type: "application/octet-stream" });
  //   saveAs(file, "users.xlsx");
  // };

  const columns: Column<UserData>[] = [

    {
      key: 'name',
      label: 'Name',
      accessor: 'name',
      render: (data) => <span>{data.name}</span>
    },
    {
      key: 'user_category_id',
      label: 'User Category',
      accessor: 'user_category_id',
      render: (data) => <span>{data.user_category_name}</span>
    },
    {
      key: 'username',
      label: 'User Name',
      accessor: 'username',
      render: (data) => <span>{data.username}</span>
    },
    {
      key: 'password',
      label: 'Password',
      accessor: 'password',
      render: (data) => <span>{data.password}</span>
    },
    {
      key: 'contact_no',
      label: 'Contact No',
      accessor: 'contact_no',
      render: (data) => <span>{data.contact_no}</span>
    },
    {
      key: 'address',
      label: 'Address',
      accessor: 'address',
      render: (data) => <span>{data.address}</span>
    },
    
    {
      key: 'status',
      label: 'Status',
      accessor: 'status',
      render: (data) => <span>{data.status}</span>
    },

    {
      key: 'actions',
      label: 'Actions',
      render: (data) => (
        <div className="flex gap-2 whitespace-nowrap w-full">
          <span
            onClick={() => handleEdit(data)}
            className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <FaEdit className="inline-block align-middle text-lg" />
          </span>


          <span>
            <DefaultModal id={data.user_id} fetchData={fetchData} endpoint={"users/insert"} bodyname='user_id' newstatus={data.status} />
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

            <div className="col-span-1">
              <Label>Category</Label>


              <select
                name=""
                id=""
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.usercategory ? "border-red-500" : ""
                  }`}
                value={usercategory}
                onChange={(e) => setUsercategory(Number(e.target.value))}
              >
                <option value="">Category</option>
                {datausercategorycrud.map((category) => (
                  <option key={category.user_category_id} value={category.user_category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.usercategory}
                </div>
              )}
            </div>
            <div>
              <Label>Name</Label>
              <input
                type="text"
                placeholder="Enter Name"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.name ? "border-red-500" : ""
                  }`}

                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.name}
                </div>
              )}
            </div>
            <div>
              <Label>Contact</Label>
              <input
                type="text"
                placeholder="Enter Contact"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Contact ? "border-red-500" : ""
                  }`}

                value={Contact}
                onChange={(e) => setContact(e.target.value)}
              />
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.Contact}
                </div>
              )}
            </div>
            <div>
              <Label>Address</Label>
              <input
                type="text"
                placeholder="Enter Address"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.address ? "border-red-500" : ""
                  }`}

                value={address}
                onChange={(e) => setaddress(e.target.value)}
              />
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.address}
                </div>
              )}
            </div>
            <div>
              <Label>Username</Label>
              <input
                type="text"
                placeholder="Enter Username"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Username ? "border-red-500" : ""
                  }`}

                value={Username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.Username}
                </div>
              )}
            </div>
            <div>
              <Label>Password</Label>
              <input
                type="text"
                placeholder="Enter Password"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Password ? "border-red-500" : ""
                  }`}

                value={Password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.Password}
                </div>
              )}
            </div>
        
          

          </div>
        }

        columns={columns}
        title="Users"
        filterOptions={[]}
        // filterKey="role"
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
      // 
      />
    </div>
  );
};

export default Usersdatas;
