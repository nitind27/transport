"use client";

import { useEffect, useState } from 'react';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";


import { toast } from 'react-toastify';

import { useToggleContext } from '@/context/ToggleContext';

import { Taluka } from '../Taluka/Taluka';

import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';
// import { Grampanchayattype } from '../grampanchayat/gptype';

type Props = {
    district: Taluka[];

};
type FormErrors = {

    usercategory?: string;
    name?: string;
    Contact?: string;
    Username?: string;
    Password?: string;
    address?: string;
    Taluka?: string;
    entaluka?: string;
    Village?: string;
    gp?: string;

};
const Distdata = ({ district }: Props) => {

    const [data, setData] = useState<Taluka[]>(district || []);

    const [Taluka, setTaluka] = useState('');
    const [entaluka, setEntaluka] = useState('');
    

    const [editId, setEditId] = useState<number | null>(null);
    const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
    const [loading, setLoading] = useState(false);
    const [error, setErrors] = useState<FormErrors>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            // Get company_id and userid from sessionStorage
            const companyId = sessionStorage.getItem('company_id');
            const userId = sessionStorage.getItem('userid');
            const categoryId = sessionStorage.getItem('category_id');
            const isSuperAdmin = sessionStorage.getItem('isSuperAdmin') === 'true';
            
            // Build query parameters
            const params = new URLSearchParams();
            // Only add user_id if not super admin (category_id = 5) and userid exists
            if (userId && userId.trim() !== '' && !isSuperAdmin && categoryId !== '5') {
                params.append('user_id', userId.trim());
            }
            // Add company_id if it exists and is not empty
            if (companyId && companyId.trim() !== '') {
                params.append('company_id', companyId.trim());
            }
            
            const url = `/api/district${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url);
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false); // End loading
        }
    };

    // Fetch data on component mount and when company_id changes
    useEffect(() => {
        fetchData();
    }, []);

    // Listen for company change events (when company is selected in header)
    useEffect(() => {
        const handleCompanyChange = () => {
            fetchData();
        };

        // Listen for custom companyChanged event
        window.addEventListener('companyChanged', handleCompanyChange);
        
        // Also listen for storage events (for cross-tab updates)
        window.addEventListener('storage', handleCompanyChange);

        return () => {
            window.removeEventListener('companyChanged', handleCompanyChange);
            window.removeEventListener('storage', handleCompanyChange);
        };
    }, []);

    useEffect(() => {

        if (!isvalidation) {

            setErrors({})
        }
    }, [isvalidation])

    const reset = () => {

        setTaluka("")
        setEntaluka("")
      
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
   if (!entaluka) {
    newErrors.Taluka = "District Marathi name is required";
}
   if (!Taluka) {
    newErrors.entaluka = "District English name is required";
}

     

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSave = async () => {
        if (!validateInputs()) return;
        setLoading(true);
        const apiUrl = isEditMode ? `/api/district` : '/api/district';
        const method = isEditMode ? 'PUT' : 'POST';

        // Get company_id and user_id from sessionStorage
        const companyId = sessionStorage.getItem('company_id');
        const userId = sessionStorage.getItem('userid');

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    district_id: editId,
                    name: Taluka,
                    name_en: entaluka,
                    status: "Active",
                    company_id: companyId ? parseInt(companyId) : null,
                    user_id: userId ? parseInt(userId) : null // Add user_id from sessionStorage
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success(editId
                ? 'Updated successfully!'
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




    const handleEdit = (item: Taluka) => {
        setIsActive(!isActive)
        setIsmodelopen(true);
        setIsEditmode(true);
        setEditId(item.district_id)
        setTaluka(item.name)
        setEntaluka(item.name_en)

    };

    // const handleDownloadExcel = () => {
    //     // Prepare data for Excel (remove unwanted fields if needed)
    //     const exportData = data.map(({ ...rest }) => rest); // Example: exclude password

    //     // Convert JSON to worksheet
    //     const worksheet = XLSX.utils.json_to_sheet(exportData);

    //     // Create a new workbook and append the worksheet
    //     const workbook = XLSX.utils.book_new();
    //     XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    //     // Generate buffer
    //     const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    //     // Save file
    //     const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    //     saveAs(file, "users.xlsx");
    // };

    const columns: Column<Taluka>[] = [

        {
            key: 'name',
            label: 'Dist (Mr)',
            accessor: 'name',
            render: (data) => <span>{data.name}</span>
        },
        {
            key: 'name',
            label: 'Dist (En)',
            accessor: 'name',
            render: (data) => <span>{data.name_en}</span>
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
                        <DefaultModal id={data.district_id} fetchData={fetchData} endpoint={"district"} bodyname='district_id' newstatus={data.status} />
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
                classname={"h-[350px] overflow-y-auto scrollbar-hide"}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">



                        <div>
                            <Label>District (En)</Label>
                            <input
                                type="text"
                                placeholder="Enter District"
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Username ? "border-red-500" : ""
                                    }`}

                                value={entaluka}
                                onChange={(e) => setEntaluka((e.target.value))}
                            />
                            {error && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.entaluka}
                                </div>
                            )}
                        </div>

                        <div>
                            <Label>District (Mr)</Label>
                            <input
                                type="text"
                                placeholder="Enter District"
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Username ? "border-red-500" : ""
                                    }`}

                                value={Taluka}
                                onChange={(e) => setTaluka((e.target.value))}
                            />
                            {error && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.Taluka}
                                </div>
                            )}
                        </div>



                    </div>
                }

                columns={columns}
                title="District"
                filterOptions={[]}
                // filterKey="role"
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
                searchKey="username"
            // 
            />
        </div>
    );
};

export default Distdata;
