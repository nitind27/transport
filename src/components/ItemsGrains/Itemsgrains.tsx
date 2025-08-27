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

type ItemGrain = {
    id: number;
    name: string;
    Unit: string;
    status: string;
};

type Props = {
    district: ItemGrain[];
};

type FormErrors = {
    name?: string;
    Unit?: string;
};

const Itemsgrains = ({ district }: Props) => {

    const [data, setData] = useState<ItemGrain[]>(district || []);

    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');

    const [editId, setEditId] = useState<number | null>(null);
    const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
    const [loading, setLoading] = useState(false);
    const [error, setErrors] = useState<FormErrors>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/itemgrains');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!isvalidation) {
            setErrors({})
        }
    }, [isvalidation])

    const reset = () => {
        setName("");
        setUnit("");
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
        if (!unit) {
            newErrors.Unit = "Unit is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateInputs()) return;
        setLoading(true);
        const apiUrl = '/api/itemgrains';
        const method = editId ? 'PUT' : 'POST';

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editId,
                    name: name,
                    Unit: unit,
                    status: "Active"
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
            console.error('Error saving Item/Grain:', error);
            toast.error(editId ? 'Failed to update. Please try again.' : 'Failed to create. Please try again.');
        } finally {
            setLoading(false);
            setIsmodelopen(false);
        }
    };

    const handleEdit = (item: ItemGrain) => {
        setIsActive(!isActive);
        setIsmodelopen(true);
        setIsEditmode(true);
        setEditId(item.id);
        setName(item.name);
        setUnit(item.Unit);
    };

    const columns: Column<ItemGrain>[] = [
        {
            key: 'name',
            label: 'Name',
            accessor: 'name',
            render: (row) => <span>{row.name}</span>
        },
        {
            key: 'Unit',
            label: 'Unit',
            accessor: 'Unit',
            render: (row) => <span>{row.Unit}</span>
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
                        <DefaultModal id={row.id} fetchData={fetchData} endpoint={"itemgrains"} bodyname='id' newstatus={row.status} />
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
                classname={"h-[350px] overflow-y-auto scrollbar-hide"}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                        <div>
                            <Label>Name</Label>
                            <input
                                type="text"
                                placeholder="Enter Item/Grain Name"
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

                        <div>
                            <Label>Unit (Kg / Ltr)</Label>
                            <input
                                type="text"
                                placeholder="Enter Unit"
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Unit ? "border-red-500" : ""}`}
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                            />
                            {error.Unit && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.Unit}
                                </div>
                            )}
                        </div>
                    </div>
                }
                columns={columns}
                title="Items / Grains"
                filterOptions={[]}
                submitbutton={
                    <button
                        type='button'
                        onClick={handleSave}
                        className='bg-blue-700 text-white py-2 p-2 rounded'
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : (editId ? 'Update' : 'Add')}
                    </button>
                }
                searchKey="name"
            />
        </div>
    );
};

export default Itemsgrains;