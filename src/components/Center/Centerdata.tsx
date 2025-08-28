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
  center: Taluka[];
};

type FormErrors = {
  taluka_id?: string;
  name?: string;
  marathi_name?: string;
  selectedDist?: string;
};

const Centerdata = ({ district, distoption, center }: Props) => {
  // Use center data instead of district data
  const [data, setData] = useState<Taluka[]>(center || []);
  
  const [selectedTaluka, setSelectedTaluka] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [centerName, setCenterName] = useState('');
  const [marathiName, setMarathiName] = useState('');
  
  const [editId, setEditId] = useState<number | null>(null);
  const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState<FormErrors>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/centerapi');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isvalidation) {
      setErrors({});
    }
  }, [isvalidation]);

  const reset = () => {
    setSelectedTaluka("");
    setSelectedDistrict("");
    setCenterName("");
    setMarathiName("");
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

    if (!selectedDistrict) {
      newErrors.selectedDist = "District is required";
    }
    if (!selectedTaluka) {
      newErrors.taluka_id = "Taluka is required";
    }
    if (!centerName) {
      newErrors.name = "Center name is required";
    }
    if (!marathiName) {
      newErrors.marathi_name = "Marathi name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    
    const apiUrl = '/api/centerapi';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const requestBody = isEditMode ? {
        center_id: editId,
        dist_id: selectedDistrict,
        taluka_id: selectedTaluka,
        name: centerName,
        marathi_name: marathiName,
        status: "Active"
      } : {
        dist_id: selectedDistrict,
        taluka_id: selectedTaluka,
        name: centerName,
        marathi_name: marathiName,
        status: "Active"
      };

      const response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast.success(editId
        ? 'Center updated successfully!'
        : 'Center created successfully!');

      reset();
      setEditId(null);
      fetchData();
    } catch (error) {
      console.error('Error saving Center:', error);
      toast.error(editId
        ? 'Failed to update Center. Please try again.'
        : 'Failed to create Center. Please try again.');
    } finally {
      setLoading(false);
      setIsmodelopen(false);
    }
  };

  const handleEdit = (item: Taluka) => {
    setIsActive(!isActive);
    setIsmodelopen(true);
    setIsEditmode(true);
    setEditId(item.center_id);
    setSelectedTaluka(item.taluka_id?.toString() || '');
    setSelectedDistrict(item.dist_id?.toString() || '');
    // API returns name (Mr) and name_en (En) after JOIN
    setCenterName(item.name || '');
    setMarathiName(item.marathi_name || '');
  };

  const columns: Column<Taluka>[] = [
    {
      key: 'district',
      label: 'District',
      accessor: 'districtname',
      render: (data) => <span>{data.districtname || 'N/A'}</span>
    },
    {
      key: 'taluka',
      label: 'Taluka (Mr)',
      accessor: 'talukaname',
      render: (data) => <span>{data.talukaname || data.name || 'N/A'}</span>
    },
    {
      key: 'center_name',
      label: 'Center Name (En)',
      accessor: 'name_en',
      render: (data) => <span>{data.name || 'N/A'}</span>
    },
    {
      key: 'center_name_mr',
      label: 'Center Name (Mr)',
      accessor: 'name',
      render: (data) => <span>{data.marathi_name || 'N/A'}</span>
    },
    
    {
      key: 'actions',
      label: 'Actions',
      render: (data) => (
        <div className="flex gap-2 whitespace-nowrap w-full">
          <span
            onClick={() => handleEdit(data)}
            className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200"
            title="Edit Center"
          >
            <FaEdit className="inline-block align-middle text-lg" />
          </span>
          <span>
            <DefaultModal 
              id={data.center_id} 
              fetchData={fetchData} 
              endpoint={"centerapi"} 
              bodyname='center_id' 
              newstatus={data.status || 'Active'} 
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
        classname={"h-auto overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
            <div>
              <Label>District</Label>
              <select
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  border-gray-300 bg-white text-gray-800`}
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <option value="">सर्व जिल्हा</option>
                {distoption.map((category) => (
                  <option key={category.district_id} value={category.district_id}>
                    {category.name}
                  </option>
                ))}
              </select>
               {error.selectedDist && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.selectedDist}
                </div>
              )}
            </div>
            
            <div>
              <Label>Taluka</Label>
              <select
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  border-gray-300 bg-white text-gray-800`}
                value={selectedTaluka}
                onChange={(e) => setSelectedTaluka(e.target.value)}
              >
                <option value="">सर्व तालुका</option>
                {district
                  .filter(data => !selectedDistrict || data.dist_id == Number(selectedDistrict))
                  .map((category) => (
                    <option key={category.taluka_id} value={category.taluka_id}>
                      {category.name}
                    </option>
                  ))}
              </select>
              {error.taluka_id && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.taluka_id}
                </div>
              )}
            </div>

            <div>
              <Label>Center Name (En)</Label>
              <input
                type="text"
                placeholder="Enter Center Name in English"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${
                  error.name ? "border-red-500" : ""
                }`}
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
              />
              {error.name && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.name}
                </div>
              )}
            </div>
            
            <div>
              <Label>Center Name (Mr)</Label>
              <input
                type="text"
                placeholder="Enter Center Name in Marathi"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${
                  error.marathi_name ? "border-red-500" : ""
                }`}
                value={marathiName}
                onChange={(e) => setMarathiName(e.target.value)}
              />
              {error.marathi_name && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.marathi_name}
                </div>
              )}
            </div>
          </div>
        }
        columns={columns}
        title="Center"
        filterOptions={[]}
        submitbutton={
          <button
            type='button'
            onClick={handleSave}
            className='bg-blue-700 text-white py-2 p-2 rounded hover:bg-blue-800 transition-colors'
            disabled={loading}
          >
            {loading ? 'Submitting...' : (editId ? 'Update' : 'Save Changes')}
          </button>
        }
        searchKey="name"
      />
    </div>
  );
};

export default Centerdata;