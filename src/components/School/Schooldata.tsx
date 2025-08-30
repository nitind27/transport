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

const Schooldata = ({ district, distoption, center, school }: Props) => {
  const [data, setData] = useState<Taluka[]>(school || []);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTaluka, setSelectedTaluka] = useState('');
  // const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [udaisNo, setUdaisNo] = useState('');

  const [editId, setEditId] = useState<number | null>(null);
  const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState<FormErrors>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scooldata');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

    try {
      const requestBody = {
        // keep field names consistent for both create and update
        ...(isEditMode ? {schoolid: editId } : {}),
        district: selectedDistrict,
        taluka_id: selectedTaluka,
        village_id: 1,
        center: selectedCenter,
        schoolname: schoolName,
        udaisno: udaisNo,
        status: "Active",
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

  const handleEdit = (item:Taluka) => {
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
  };
  const columns: Column<Taluka>[] = [

    {
      key: 'district',
      label: 'District',
      accessor: 'districtname',
      render: (data) => <span>{(data).districtname}</span>
    },
    { key: 'taluka', label: 'Taluka', accessor: 'talukaname', render: (row) => <span>{(row).talukaname || 'N/A'}</span> },
    { key: 'village', label: 'Village', accessor: 'villagename', render: (row) => <span>{(row).villagename || 'N/A'}</span> },
    { key: 'center', label: 'Center', accessor: 'centername', render: (row) => <span>{(row).centername || 'N/A'}</span> },
    { key: 'schoolname', label: 'School Name', accessor: 'schoolname', render: (row) => <span>{(row).schoolname || 'N/A'}</span> },
    { key: 'udaisno', label: 'UDAIS No', accessor: 'udaisno', render: (row) => <span>{(row).udaisno || 'N/A'}</span> },
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

  return (
    <div className="mt-5">
      <ReusableTable
        data={data}
        classname={"h-[550px] overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
            <div>
              <Label>District</Label>
              <select
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  border-gray-300 bg-white text-gray-800`}
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedTaluka('');
                  // setSelectedVillage('');
                  setSelectedCenter('');
                }}
              >
                <option value="">सर्व जिल्हा</option>
                {distoption.map((d) => (
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
                  // setSelectedVillage('');
                  setSelectedCenter('');
                }}
              >   
                <option value="">सर्व तालुका</option>
                {district
                  .filter(t => !selectedDistrict || t.dist_id == Number(selectedDistrict))
                  .map((t) => (
                    <option key={t.taluka_id} value={t.taluka_id}>
                      {t.name}
                    </option>
                  ))}
              </select>
              {error.taluka && <div className="text-red-500 text-sm mt-1 pl-1">{error.taluka}</div>}
            </div>

            {/* <div>
              <Label>Village</Label>
              <select
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  border-gray-300 bg-white text-gray-800`}
                value={selectedVillage}
                onChange={(e) => {
                  setSelectedVillage(e.target.value);
                  setSelectedCenter('');
                }}
              >
                <option value="">सर्व गावे</option>
                {village
                  .filter(v => (!selectedDistrict || v.dist_id == Number(selectedDistrict)) && (!selectedTaluka || v.taluka_id == Number(selectedTaluka)))
                  .map((v) => (
                    <option key={v.village_id} value={v.village_id}>
                      {v.name}
                    </option>
                  ))}
              </select>
              {error.village && <div className="text-red-500 text-sm mt-1 pl-1">{error.village}</div>}
            </div> */}

            <div>
              <Label>Center</Label>
              <select
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  border-gray-300 bg-white text-gray-800`}
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
              >
                <option value="">सर्व केंद्र</option>
                {center
                  .filter(c =>
                    (!selectedDistrict || c.dist_id == Number(selectedDistrict)) &&
                    (!selectedTaluka || c.taluka_id == Number(selectedTaluka))
                  )
                  .map((c) => (
                    <option key={c.center_id} value={c.center_id}>
                      {c.name}
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
                // onChange={(e) => setUdaisNo(e.target.value)}
                   onChange={(e) => {
                  if (/^\d{0,10}$/.test(e.target.value)) {
                    setUdaisNo(e.target.value);
                    if (e.target.value.length === 11) {
                       setUdaisNo(e.target.value);
                    }
                  }
                }}
              />
              {error.udais_no && <div className="text-red-500 text-sm mt-1 pl-1">{error.udais_no}</div>}
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
      />
    </div>
  );
};

export default Schooldata;
