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
    distoption: Taluka[];

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
    entaluka?: string;
    distrcit?: string;
    gp?: string;

};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Talukadata = ({ district: _district, distoption: _distoption }: Props) => {

    const [data, setData] = useState<Taluka[]>([]);
    const [districtOptions, setDistrictOptions] = useState<Taluka[]>([]);
    // console.log("distoption",distoption)
    const [Taluka, setTaluka] = useState('');
    const [entaluka, setEntaluka] = useState('');
    const [distrcit, setDistrict] = useState('');


    const [editId, setEditId] = useState<number | null>(null);
    const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
    const [loading, setLoading] = useState(false);
    const [error, setErrors] = useState<FormErrors>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            // Get company_id from sessionStorage - this is set when user logs in
            const companyId = sessionStorage.getItem('company_id');
            const userId = sessionStorage.getItem('userid');
            const isSuperAdmin = sessionStorage.getItem('isSuperAdmin') === 'true';
            
            console.log('Fetching taluka data for logged-in user:', {
                userId,
                companyId,
                isSuperAdmin
            });
            
            // Build query parameters - filter by company_id from logged-in user's sessionStorage
            const params = new URLSearchParams();
            
            // Only filter by company_id if it exists and is not empty
            // Super admin might have empty company_id, so we don't filter in that case
            if (companyId && companyId.trim() !== '' && !isSuperAdmin) {
                params.append('company_id', companyId.trim());
            }
            
            const url = params.toString() 
                ? `/api/taluka?${params.toString()}` 
                : '/api/taluka';
            
            console.log('Fetching taluka data with URL:', url);
            console.log('Logged-in user company_id from sessionStorage:', companyId);
            
            const response = await fetch(url, {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Taluka data received for company_id:', companyId);
            console.log('Taluka data count:', Array.isArray(result) ? result.length : 0, 'records');
            
            // Ensure we set an array
            const dataArray = Array.isArray(result) ? result : [];
            setData(dataArray);
            
            if (dataArray.length === 0 && companyId && companyId.trim() !== '') {
                console.warn('No taluka data found for logged-in user company_id:', companyId);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch taluka data');
            setData([]);
        } finally {
            setLoading(false); // End loading
        }
    };

    // Fetch district options with company_id filtering from logged-in user's sessionStorage
    const fetchDistrictOptions = async () => {
        try {
            // Get company_id from sessionStorage - this is set when user logs in
            const companyId = sessionStorage.getItem('company_id');
            const isSuperAdmin = sessionStorage.getItem('isSuperAdmin') === 'true';
            
            // Build query parameters - filter by company_id from logged-in user's sessionStorage
            const params = new URLSearchParams();
            
            // Only filter by company_id if it exists and is not empty
            // Super admin might have empty company_id, so we don't filter in that case
            if (companyId && companyId.trim() !== '' && !isSuperAdmin) {
                params.append('company_id', companyId.trim());
            }
            
            const url = params.toString() 
                ? `/api/district?${params.toString()}` 
                : '/api/district';
            
            console.log('Fetching district options for logged-in user company_id:', companyId);
            
            const response = await fetch(url, {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setDistrictOptions(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error('Error fetching district options:', error);
            toast.error('Failed to fetch district options');
            setDistrictOptions([]);
        }
    };

    // Fetch data on component mount - using logged-in user's company_id from sessionStorage
    useEffect(() => {
        // Ensure sessionStorage is available before fetching
        if (typeof window !== 'undefined') {
            // Check if user is logged in (has company_id or is super admin)
            const companyId = sessionStorage.getItem('company_id');
            const userId = sessionStorage.getItem('userid');
            
            if (!userId) {
                console.warn('User not logged in - userid not found in sessionStorage');
                return;
            }
            
            console.log('Component mounted - fetching data for logged-in user:', {
                userId,
                companyId
            });
            
            // Small delay to ensure sessionStorage is ready
            const timer = setTimeout(() => {
                fetchData();
                fetchDistrictOptions();
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, []);

    // Listen for company change events (when company is selected in header)
    useEffect(() => {
        const handleCompanyChange = () => {
            fetchData();
            fetchDistrictOptions();
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

        if (!distrcit) {
            newErrors.distrcit = "Distrcit is required";
        }
        if (!entaluka) {
            newErrors.entaluka = "Taluka English name is required";
        }
        if (!Taluka) {
            newErrors.Taluka = "Taluka Marathi name is required";
        }


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSave = async () => {
        if (!validateInputs()) return;
        setLoading(true);
        const apiUrl = isEditMode ? `/api/taluka` : '/api/taluka';
        const method = isEditMode ? 'PUT' : 'POST';

        // Get company_id and user_id from sessionStorage
        const companyId = sessionStorage.getItem('company_id');
        const userId = sessionStorage.getItem('userid');

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taluka_id: editId,
                    dist_id: distrcit,
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
        // console.log("fafdfa",item)
        setIsActive(!isActive)
        setIsmodelopen(true);
        setDistrict(String(item.dist_id))
        setIsEditmode(true);
        setEditId(item.taluka_id)
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
            label: 'District',
            accessor: 'districtname',
            render: (data) => <span>{data.districtname}</span>
        },
        {
            key: 'name',
            label: 'Taluka (Mr)',
            accessor: 'name',
            render: (data) => <span>{data.name}</span>
        },
        {
            key: 'name',
            label: 'Taluka (En)',
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
                        <DefaultModal id={data.taluka_id} fetchData={fetchData} endpoint={"taluka"} bodyname='taluka_id' newstatus={data.status} />
                    </span>
                </div>
            )
        }
    ];

    return (
        <div className="mt-5">
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
                        <div>
                            <Label>District</Label>
                            <select
                                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                    border-gray-300 bg-white text-gray-800
                                    }`}
                                value={distrcit}
                                onChange={(e) => setDistrict(e.target.value)}
                            // disabled={!selectedTaluka || !selectedGrampanchayat}
                            >
                                <option value="">सर्व जिल्हा</option>
                                {districtOptions.map((category) => (
                                    <option key={category.district_id} value={category.district_id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {error && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.distrcit}
                                </div>
                            )}
                        </div>



                        <div>
                            <Label>Taluka (En)</Label>
                            <input
                                type="text"
                                placeholder="Enter Taluka"
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
                            <Label>Taluka (Mr)</Label>
                            <input
                                type="text"
                                placeholder="Enter Taluka"
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
                title="Taluka"
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
                searchKey="name"
            // 
            />
        </div>
    );
};

export default Talukadata;
