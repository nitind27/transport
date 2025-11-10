"use client"
import { useEffect, useState } from 'react';
import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { useToggleContext } from '@/context/ToggleContext';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';

// TruckRow structure
type TruckRow = {
    id: number;
    name: string;
    contactnumber: number;
    address: string;
    gstno: string;
    status: string;
};



type FormErrors = {
    name?: string;
    contactnumber?: string;
    address?: string;
    gstno?: string;
};

const Dealerdata = () => {
    const [data, setData] = useState<TruckRow[]>([]);
    const [name, setName] = useState('');
    const [contactnumber, setContactnumber] = useState('');
    const [address, setAddress] = useState('');
    const [gstno, setGstno] = useState('');
    const [editId, setEditId] = useState<number | null>(null);

    const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
    const [loading, setLoading] = useState(false);
    const [error, setErrors] = useState<FormErrors>({});

    // Fetch dealer data - filtered by company_id only
    const fetchData = async () => {
        setLoading(true);
        try {
            // Get company_id from sessionStorage - this is set when user logs in
            const companyId = sessionStorage.getItem('company_id');
            const userId = sessionStorage.getItem('userid');
            const isSuperAdmin = sessionStorage.getItem('isSuperAdmin') === 'true';
            
            console.log('Fetching dealer data for logged-in user:', {
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
                ? `/api/dealerdata?${params.toString()}` 
                : '/api/dealerdata';
            
            console.log('Fetching dealer data with URL:', url);
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
            
            const dealers: TruckRow[] = await response.json();
            const dataArray = Array.isArray(dealers) ? dealers : [];
            setData(dataArray);
            
            console.log('Dealer data received for company_id:', companyId);
            console.log('Dealer data count:', dataArray.length, 'records');
            
            if (dataArray.length === 0 && companyId && companyId.trim() !== '') {
                console.warn('No dealer data found for logged-in user company_id:', companyId);
            }
        } catch (error) {
            console.error('Error fetching dealer data:', error);
            toast.error('Failed to load dealer data');
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
        if (!isvalidation) setErrors({});
    }, [isvalidation]);

    const reset = () => {
        setName('');
        setContactnumber('');
        setAddress('');
        setGstno('');
        setEditId(null);
    };

    useEffect(() => {
        if (!isEditMode) reset();
    }, [isEditMode]);

    const validateInputs = () => {
        const newErrors: FormErrors = {};
        setisvalidation(true);

        if (!name) newErrors.name = "Name is required";
        if (!contactnumber) newErrors.contactnumber = "Contact Number is required";
        if (!address) newErrors.address = "Address is required";
        if (!gstno) newErrors.gstno = "GST No is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateInputs()) return;
        setLoading(true);

        const apiUrl = '/api/dealerdata';
        const method = editId ? 'PUT' : 'POST';

        // Get company_id and user_id from sessionStorage - ensure they are valid numbers, not 0
        const companyIdStr = sessionStorage.getItem('company_id');
        const userIdStr = sessionStorage.getItem('userid');
        
        // Parse and validate - only include if they are valid numbers greater than 0
        const companyId = companyIdStr && !isNaN(Number(companyIdStr)) && Number(companyIdStr) > 0 
            ? parseInt(companyIdStr) 
            : null;
        const userId = userIdStr && !isNaN(Number(userIdStr)) && Number(userIdStr) > 0 
            ? parseInt(userIdStr) 
            : null;

        try {
            const response = await fetch(apiUrl, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editId,
                    name,
                    contactnumber,
                    address,
                    gstno,
                    status: "Active",
                    company_id: companyId,
                    user_id: userId
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            toast.success(editId
                ? 'Updated successfully!'
                : 'Inserted successfully!');

            reset();
            setEditId(null);
            fetchData();
        } catch  {
            toast.error(editId
                ? 'Failed to update. Please try again.'
                : 'Failed to create. Please try again.');
        } finally {
            setLoading(false);
            setIsmodelopen(false);
            fetchData();
        }
    };

    const handleEdit = (row: TruckRow) => {
        setIsActive(!isActive);
        setIsmodelopen(true);
        setIsEditmode(true);

        setEditId(row.id);
        setName(row.name);
        setContactnumber(row.contactnumber ? row.contactnumber.toString() : '');
        setAddress(row.address);
        setGstno(row.gstno);
    };

    const columns: Column<TruckRow>[] = [
        { key: 'name', label: 'Name', accessor: 'name', render: (row) => <span>{row.name}</span> },
        { key: 'contactnumber', label: 'Contact Number', accessor: 'contactnumber', render: (row) => <span>{row.contactnumber}</span> },
        { key: 'address', label: 'Address', accessor: 'address', render: (row) => <span>{row.address}</span> },
        { key: 'gstno', label: 'GST No', accessor: 'gstno', render: (row) => <span>{row.gstno}</span> },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <div className="flex gap-2 whitespace-nowrap w-full">
                    <span onClick={() => handleEdit(row)} className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200">
                        <FaEdit className="inline-block align-middle text-lg" />
                    </span>
                    <span>
                        <DefaultModal id={row.id} fetchData={fetchData} endpoint={"dealerdata"} bodyname='id' newstatus={row.status} />
                    </span>
                </div>
            ),
        }
    ];

    return (
        <div className="mt-5">
            <ReusableTable
                data={data}
                classname={"h-auto overflow-y-auto scrollbar-hide"}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                        <div>
                            <Label>Name</Label>
                            <input
                                type="text"
                                placeholder="Enter Name"
                                className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm ${error.name ? "border-red-500" : "border-gray-300"}`}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            {error.name && <div className="text-red-500 text-sm mt-1 pl-1">{error.name}</div>}
                        </div>
                        <div>
                            <Label>Contact Number</Label>
                            <input
                                type="tel"
                                placeholder="Enter Contact Number"
                                className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm ${error.contactnumber ? "border-red-500" : "border-gray-300"}`}
                                value={contactnumber}
                                // onChange={(e) => setContactnumber(e.target.value)}
                                onChange={(e) => {
									if (/^\d{0,10}$/.test(e.target.value)) {
										setContactnumber(e.target.value);
										if (e.target.value.length === 10) {
											setContactnumber(e.target.value);
										}
									}
								}}

                            />
                            {error.contactnumber && <div className="text-red-500 text-sm mt-1 pl-1">{error.contactnumber}</div>}
                        </div>
                        <div>
                            <Label>Address</Label>
                            <input
                                type="text"
                                placeholder="Enter Address"
                                className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm ${error.address ? "border-red-500" : "border-gray-300"}`}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                            {error.address && <div className="text-red-500 text-sm mt-1 pl-1">{error.address}</div>}
                        </div>
                        <div>
                            <Label>GST No</Label>
                            <input
                                type="text"
                                placeholder="Enter GST No"
                                className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm ${error.gstno ? "border-red-500" : "border-gray-300"}`}
                                value={gstno}
                                // onChange={(e) => setGstno(e.target.value)}
                                onChange={(e) => {
									// Allow only alphabets and digits, max length 10
									if (/^[a-zA-Z0-9]{0,15}$/.test(e.target.value)) {
										// Convert to uppercase for display and storage
										const upperCaseValue = e.target.value.toUpperCase();
										setGstno(upperCaseValue);
									}
								}}
                            />
                            {error.gstno && <div className="text-red-500 text-sm mt-1 pl-1">{error.gstno}</div>}
                        </div>
                    </div>
                }
                columns={columns}
                title="Dealers"
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

export default Dealerdata;

