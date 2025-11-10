"use client";

import { useEffect, useState } from 'react';
import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { useToggleContext } from '@/context/ToggleContext';
import { Taluka } from '../Taluka/Taluka';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';
import { utils, writeFile } from 'xlsx';
import { useRef } from 'react';

type Props = {
  district: Taluka[];
  distoption: Taluka[];
  village: Taluka[];
  center: Taluka[];
  school: Taluka[];
};

type FormErrors = {
  dist?: string;
  taluka?: string;
  village?: string;
  center?: string;
  name?: string;
  udais_no?: string;
};

type SchoolRow = Taluka & {
  // class_1_5?: number;
  // class_6_8?: number;
  mobile1?: string;
  mobile2?: string;
  mobile3?: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Schooldata = ({ district: _district, distoption: _distoption, center: _center, school: _school }: Props) => {
  const [data, setData] = useState<SchoolRow[]>([]);
  const [districtOptions, setDistrictOptions] = useState<Taluka[]>([]);
  const [talukaOptions, setTalukaOptions] = useState<Taluka[]>([]);
  const [centerOptions, setCenterOptions] = useState<Taluka[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTaluka, setSelectedTaluka] = useState('');
  // const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [udaisNo, setUdaisNo] = useState('');

  // NEW: extra fields
  // const [class15, setClass15] = useState<string>('');
  // const [class68, setClass68] = useState<string>('');
  const [mobile1, setMobile1] = useState<string>('');
  const [mobile2, setMobile2] = useState<string>('');
  const [mobile3, setMobile3] = useState<string>('');

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
      
      console.log('Fetching school data for logged-in user:', {
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
        ? `/api/scooldata?${params.toString()}` 
        : '/api/scooldata';
      
      console.log('Fetching school data with URL:', url);
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
      console.log('School data received for company_id:', companyId);
      console.log('School data count:', Array.isArray(result) ? result.length : 0, 'records');
      
      // Ensure we set an array
      const dataArray = Array.isArray(result) ? result : [];
      setData(dataArray as SchoolRow[]);
      
      if (dataArray.length === 0 && companyId && companyId.trim() !== '') {
        console.warn('No school data found for logged-in user company_id:', companyId);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('Failed to fetch school data');
      setData([]);
    } finally {
      setLoading(false);
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

  // Fetch taluka options with company_id filtering from logged-in user's sessionStorage
  const fetchTalukaOptions = async () => {
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
        ? `/api/taluka?${params.toString()}` 
        : '/api/taluka';
      
      console.log('Fetching taluka options for logged-in user company_id:', companyId);
      
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
      setTalukaOptions(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching taluka options:', error);
      toast.error('Failed to fetch taluka options');
      setTalukaOptions([]);
    }
  };

  // Fetch center options with company_id filtering from logged-in user's sessionStorage
  const fetchCenterOptions = async () => {
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
        ? `/api/centerapi?${params.toString()}` 
        : '/api/centerapi';
      
      console.log('Fetching center options for logged-in user company_id:', companyId);
      
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
      setCenterOptions(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching center options:', error);
      toast.error('Failed to fetch center options');
      setCenterOptions([]);
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
        fetchTalukaOptions();
        fetchCenterOptions();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for company change events (when company is selected in header)
  useEffect(() => {
    const handleCompanyChange = () => {
      fetchData();
      fetchDistrictOptions();
      fetchTalukaOptions();
      fetchCenterOptions();
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
      setErrors({});
    }
  }, [isvalidation]);

  const reset = () => {
    setSelectedDistrict('');
    setSelectedTaluka('');
    // setSelectedVillage('');
    setSelectedCenter('');
    setSchoolName('');
    setUdaisNo('');
    setEditId(null);
    // setClass15('');
    // setClass68('');
    setMobile1('');
    setMobile2('');
    setMobile3('');
  };

  useEffect(() => {
    if (!isEditMode) {
      reset();
    }
  }, [isEditMode]);

  const validateInputs = () => {
    const newErrors: FormErrors = {};
    setisvalidation(true);

    if (!selectedDistrict) newErrors.dist = "District is required";
    if (!selectedTaluka) newErrors.taluka = "Taluka is required";
    // if (!selectedVillage) newErrors.village = "Village is required";
    if (!selectedCenter) newErrors.center = "Center is required";
    if (!schoolName) newErrors.name = "School name is required";
    if (!udaisNo) newErrors.udais_no = "UDAIS No is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;
    setLoading(true);

    const apiUrl = '/api/scooldata';
    const method = isEditMode ? 'PUT' : 'POST';

    // Get company_id and user_id from sessionStorage
    const companyId = sessionStorage.getItem('company_id');
    const userId = sessionStorage.getItem('userid');

    try {
      const requestBody = {
        // keep field names consistent for both create and update
        ...(isEditMode ? { schoolid: editId } : {}),
        district: selectedDistrict,
        taluka_id: selectedTaluka,
        village_id: 1,
        center: selectedCenter,
        schoolname: schoolName,
        udaisno: udaisNo,
        // class_1_5: class15 ? Number(class15) : null,
        // class_6_8: class68 ? Number(class68) : null,
        mobile1: mobile1 || null,
        mobile2: mobile2 || null,
        mobile3: mobile3 || null,
        status: "Active",
        company_id: companyId ? parseInt(companyId) : null,
        user_id: userId ? parseInt(userId) : null
      };

      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.message || `HTTP error! status: ${response.status}`);
      }

      toast.success(editId ? 'School updated successfully!' : 'School created successfully!');
      reset();
      setEditId(null);
      fetchData();
    } catch (error) {
      console.error('Error saving School:', error);
      toast.error(editId ? 'Failed to update School. Please try again.' : 'Failed to create School. Please try again.');
    } finally {
      setLoading(false);
      setIsmodelopen(false);
    }
  };

  const handleEdit = (item: SchoolRow) => {
    console.log("fasfasf", item)
    setIsActive(!isActive);
    setIsmodelopen(true);
    setIsEditmode(true);
    setEditId(item.schoolid);
    setSelectedDistrict(String(item.district ?? ''));
    setSelectedTaluka(String(item.taluka_id ?? ''));
    // setSelectedVillage(String(item.village_id ?? ''));
    setSelectedCenter(String(item.center ?? ''));
    setSchoolName(item.schoolname ?? '');
    setUdaisNo(item.udaisno ?? '');
    // setClass15(String(item.class_1_5 ?? ''));
    // setClass68(String(item.class_6_8 ?? ''));
    setMobile1(String(item.mobile1 ?? ''));
    setMobile2(String(item.mobile2 ?? ''));
    setMobile3(String(item.mobile3 ?? ''));
  };
  const columns: Column<SchoolRow>[] = [

    {
      key: 'district',
      label: 'District',
      accessor: 'districtname',
      render: (data) => <span>{(data).districtname}</span>
    },
    { key: 'taluka', label: 'Taluka', accessor: 'talukaname', render: (row) => <span>{(row).talukaname || 'N/A'}</span> },

    { key: 'center', label: 'Center', accessor: 'centername', render: (row) => <span>{(row).centername || 'N/A'}</span> },
    { key: 'schoolname', label: 'School Name', accessor: 'schoolname', render: (row) => <span>{(row).schoolname || 'N/A'}</span> },
    // { key: 'schoolname', label: 'School Name', accessor: 'schoolname', render: (row) => <span>{(row).schoolname || 'N/A'}</span> },
    { key: 'udaisno', label: 'UDAIS No', accessor: 'udaisno', render: (row) => <span>{(row).udaisno || 'N/A'}</span> },
    // NEW: show extra fields
    // { key: 'class_1_5', label: 'वर्ग (1-5) पटसंख्या', accessor: 'class_1_5', render: (row) => <span>{row.class_1_5 ?? '-'}</span> },
    // { key: 'class_6_8', label: 'वर्ग (6-8) पटसंख्या', accessor: 'class_6_8', render: (row) => <span>{row.class_6_8 ?? '-'}</span> },
    { key: 'mobile1', label: 'Mobile 1', accessor: 'mobile1', render: (row) => <span>{row.mobile1 || '-'}</span> },
    { key: 'mobile2', label: 'Mobile 2', accessor: 'mobile2', render: (row) => <span>{row.mobile2 || '-'}</span> },
    { key: 'mobile3', label: 'Mobile 3', accessor: 'mobile3', render: (row) => <span>{row.mobile3 || '-'}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-3 whitespace-nowrap w-full">
          <span
            onClick={() => handleEdit(row)}
            className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200"
            title="Edit School"
          >
            <FaEdit className="inline-block align-middle text-lg" />
          </span>
          <span>
            <DefaultModal
              id={row.schoolid}
              fetchData={fetchData}
              endpoint={"scooldata"}
              bodyname='id'
              newstatus={(row).status || 'Active'}
            />
          </span>

        </div>
      )
    }
  ];

  // Excel template download
  const templateHeaders = ['जिल्हा', 'तालुका', 'केंद्र', 'विद्यालय नाव', 'यूडीएआयएस', 'मोबाइल 1', 'मोबाइल 2', 'मोबाइल 3'];
  const handleDownloadTemplate = () => {
    const ws = utils.aoa_to_sheet([templateHeaders]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Schools');
    writeFile(wb, 'school_import_template.xlsx');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      
      // Get company_id and user_id from sessionStorage and add to FormData
      const companyId = sessionStorage.getItem('company_id');
      const userId = sessionStorage.getItem('userid');
      if (companyId) form.append('company_id', companyId);
      if (userId) form.append('user_id', userId);
      
      const res = await fetch('/api/schooldataecelimport', {
        method: 'POST',
        body: form,
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(out?.message || 'Import failed');
      } else {
        const inserted = out?.inserted ?? 0;
        const updated = out?.updated ?? 0;
        const errors = out?.errors ?? [];
        toast.success(`Import done. Inserted: ${inserted}, Updated: ${updated}`);
        if (errors.length) {
          console.warn('Import row errors:', errors);
          toast.warn(`Skipped rows: ${errors.length}. Check console for details.`);
        }
        fetchData();
      }
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Import failed');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mt-5">
      <ReusableTable
        data={data}
        classname={"h-[550px] overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <Label>District</Label>
              <select
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  border-gray-300 bg-white text-gray-800`}
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  // Reset dependent fields when district changes
                  setSelectedTaluka('');
                  setSelectedCenter('');
                }}
              >
                <option value="">सर्व जिल्हा</option>
                {districtOptions.map((d) => (
                  <option key={d.district_id} value={d.district_id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {error.dist && <div className="text-red-500 text-sm mt-1 pl-1">{error.dist}</div>}
            </div>
            <div>
              <Label>Taluka</Label>
              <select
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  border-gray-300 bg-white text-gray-800`}
                value={selectedTaluka}
                onChange={(e) => {
                  setSelectedTaluka(e.target.value);
                  // Reset center when taluka changes
                  setSelectedCenter('');
                }}
                disabled={!selectedDistrict}
              >
                <option value="">सर्व तालुका</option>
                {talukaOptions
                  .filter(t => !selectedDistrict || t.dist_id == Number(selectedDistrict))
                  .map((t) => (
                    <option key={t.taluka_id} value={t.taluka_id}>
                      {t.name}
                    </option>
                  ))}
              </select>
              {error.taluka && <div className="text-red-500 text-sm mt-1 pl-1">{error.taluka}</div>}
            </div>



            <div>

              <Label>Center</Label>
              <select
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  border-gray-300 bg-white text-gray-800`}
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                disabled={!selectedDistrict || !selectedTaluka}
              >
                <option value="">सर्व केंद्र</option>
                {centerOptions
                  .filter(c =>
                    (c.dist_id == Number(selectedDistrict)) &&
                    (c.taluka_id == Number(selectedTaluka))
                  )
                  .map((c) => (
                    <option key={c.center_id} value={c.center_id}>
                      {c.marathi_name}
                    </option>
                  ))}
              </select>
              {error.center && <div className="text-red-500 text-sm mt-1 pl-1">{error.center}</div>}
            </div>

            <div>
              <Label>School Name</Label>
              <input
                type="text"
                placeholder="Enter School Name"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.name ? "border-red-500" : ""}`}
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
              {error.name && <div className="text-red-500 text-sm mt-1 pl-1">{error.name}</div>}
            </div>

            <div>
              <Label>UDAIS No</Label>
              <input
                type="text"
                placeholder="Enter UDAIS No"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.udais_no ? "border-red-500" : ""}`}
                value={udaisNo}
                onChange={(e) => {
                  if (/^\d{0,15}$/.test(e.target.value)) {
                    setUdaisNo(e.target.value);
                    if (e.target.value.length === 15) {
                      setUdaisNo(e.target.value);
                    }
                  }
                }}
              />
              {error.udais_no && <div className="text-red-500 text-sm mt-1 pl-1">{error.udais_no}</div>}
            </div>


            {/* <div className="sm:col-span-2 font-semibold text-gray-700">Mobile Numbers</div> */}
            <div>
              <Label>Mobile 1</Label>
              <input
                type="tel"
                placeholder="10-digit"
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={mobile1}
                onChange={(e) => { if (/^\d{0,10}$/.test(e.target.value)) setMobile1(e.target.value) }}
              />
            </div>
            <div>
              <Label>Mobile 2</Label>
              <input
                type="tel"
                placeholder="10-digit"
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={mobile2}
                onChange={(e) => { if (/^\d{0,10}$/.test(e.target.value)) setMobile2(e.target.value) }}
              />
            </div>
            <div>
              <Label>Mobile 3</Label>
              <input
                type="tel"
                placeholder="10-digit"
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={mobile3}
                onChange={(e) => { if (/^\d{0,10}$/.test(e.target.value)) setMobile3(e.target.value) }}
              />
            </div>
          </div>

        }
        columns={columns}
        title="Schools"
        filterOptions={[]}
        submitbutton={
          <button
            type='button'
            onClick={handleSave}
            className='bg-blue-700 text-white py-2 p-2 rounded hover:bg-blue-800 transition-colors'
            disabled={loading}
          >
            {loading ? 'Submitting...' : (editId ? 'Update' : 'Submit')}
          </button>
        }
        searchKey="name"
        actionsRight={
          <>

            <span>


              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="bg-emerald-600 text-white px-3 py-2 rounded hover:bg-emerald-700 ml-2"
                disabled={loading}
              >
                Excel Template Download
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 ml-2"
                disabled={loading}
              >
                Excel Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </span>
          </>
        }
      />
    </div>
  );
};

export default Schooldata;



