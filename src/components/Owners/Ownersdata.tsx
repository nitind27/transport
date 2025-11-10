"use client";

import { useEffect, useState } from 'react';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";

import { toast } from 'react-toastify';

import { useToggleContext } from '@/context/ToggleContext';

import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';

type Owner = {
    id: number;
    name: string;
    status: string;
};

type Props = {
    district: Owner[];
};

type FormErrors = {
    name?: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Ownersdata = ({ district: _district }: Props) => {

    const [data, setData] = useState<Owner[]>([]);

    const [name, setName] = useState('');

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
            
            console.log('Fetching owner data for logged-in user:', {
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
                ? `/api/ownerdata?${params.toString()}` 
                : '/api/ownerdata';
            
            console.log('Fetching owner data with URL:', url);
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
            console.log('Owner data received for company_id:', companyId);
            console.log('Owner data count:', Array.isArray(result) ? result.length : 0, 'records');
            
            // Ensure we set an array
            const dataArray = Array.isArray(result) ? result : [];
            setData(dataArray);
            
            if (dataArray.length === 0 && companyId && companyId.trim() !== '') {
                console.warn('No owner data found for logged-in user company_id:', companyId);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch owner data');
            setData([]);
        } finally {
            setLoading(false);
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
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        if (!isvalidation) {
            setErrors({})
        }
    }, [isvalidation])

    const reset = () => {
        setName("");
        setEditId(0);
    }

    useEffect(() => {
        if (!isEditMode) {
            reset()
        }
    }, [isEditMode]);

    const validateInputs = () => {
        const newErrors: FormErrors = {};
        setisvalidation(true);

        if (!name) {
            newErrors.name = "Name is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateInputs()) return;
        setLoading(true);
        const apiUrl = '/api/ownerdata';
        const method = editId ? 'PUT' : 'POST';

        // Get company_id and user_id from sessionStorage
        const companyId = sessionStorage.getItem('company_id');
        const userId = sessionStorage.getItem('userid');

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editId,
                    name: name,
                    status: "Active",
                    company_id: companyId ? parseInt(companyId) : null,
                    user_id: userId ? parseInt(userId) : null
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success(editId ? 'Updated successfully!' : 'Inserted successfully!');

            reset();
            setEditId(null);
            fetchData();
        } catch (error) {
            console.error('Error saving owner:', error);
            toast.error(editId ? 'Failed to update. Please try again.' : 'Failed to create. Please try again.');
        } finally {
            setLoading(false);
            setIsmodelopen(false);
        }
    };

    const handleEdit = (item: Owner) => {
        setIsActive(!isActive);
        setIsmodelopen(true);
        setIsEditmode(true);
        setEditId(item.id);
        setName(item.name);
    };

    const columns: Column<Owner>[] = [
        {
            key: 'name',
            label: 'Name',
            accessor: 'name',
            render: (row) => <span>{row.name}</span>
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
                        <DefaultModal id={row.id} fetchData={fetchData} endpoint={"ownerdata"} bodyname='id' newstatus={row.status} />
                    </span>
                </div>
            )
        }
    ];

    return (
        <div className="mt-5">
            <div className="flex justify-end">
                {/* Optional download button area */}
            </div>
            <ReusableTable
                data={data}
                classname={"h-auto overflow-y-auto scrollbar-hide"}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                        <div>
                            <Label>Name</Label>
                            <input
                                type="text"
                                placeholder="Enter Owner Name"
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.name ? "border-red-500" : ""}`}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            {error.name && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.name}
                                </div>
                            )}
                        </div>
                    </div>
                }
                columns={columns}
                title="Owners"
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
                searchKey="name"
            />
        </div>
    );
};

export default Ownersdata;