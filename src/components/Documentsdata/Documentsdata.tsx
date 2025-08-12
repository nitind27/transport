"use client";

import { useEffect, useState } from 'react';

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";

import { Documents } from './documents';
import { toast } from 'react-toastify';
import React from 'react';
import { useToggleContext } from '@/context/ToggleContext';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';


interface Props {
    serverData: Documents[];
}
type FormErrors = {

    documents?: string;
    srno?: string;
};
const Documentsdata: React.FC<Props> = ({ serverData }) => {
    const [data, setData] = useState<Documents[]>(serverData || []);
    const [inputValue, setInputValue] = useState('');
    const [editId, setEditId] = useState<number | null>(null);
    const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
    const [loading, setLoading] = useState(false);
    const [error, setErrors] = useState<FormErrors>({});
    const [srno, setSrno] = useState('');


    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/documents');
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

    useEffect(() => {
        if (!isEditMode) {
            setInputValue("");
            setSrno("");
            setEditId(0);
        }
    }, [isEditMode]);

    const validateInputs = () => {
        const newErrors: FormErrors = {};
        setisvalidation(true)
        // Category validation

        // Documents validation
        if (!inputValue || inputValue.length === 0) {
            newErrors.documents = "Document is required";
        }
        if (!srno) {
            newErrors.srno = "Sr No is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSave = async () => {
        if (!validateInputs()) return;
        setLoading(true);
        const apiUrl = editId ? `/api/documents` : '/api/documents';
        const method = editId ? 'PUT' : 'POST';

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editId,
                    document_name: inputValue,
                    sr_no: srno
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }


            toast.success(editId
                ? 'Documents updated successfully!'
                : 'Documents created successfully!');

            setInputValue('');
            setEditId(null);
            fetchData();

        } catch (error) {
            console.error('Error saving Documents:', error);
            toast.error(editId
                ? 'Failed to update Documents. Please try again.'
                : 'Failed to create Documents. Please try again.');
        } finally {
            setLoading(false);
            setIsmodelopen(false);
        }
    };



    const handleEdit = (item: Documents) => {
        setIsmodelopen(true);
        setIsEditmode(true);
        setIsActive(!isActive)
        setInputValue(item.document_name);
        setSrno(item.sr_no);
        setEditId(item.id);
    };

    const columns: Column<Documents>[] = [
        {
            key: 'document_name',
            label: 'Documents Name',
            accessor: 'document_name',
            render: (data) => <span>{data.document_name}</span>
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
                        <DefaultModal id={data.id} fetchData={fetchData} endpoint={"documents"} bodyname='id' newstatus={data.status} />
                    </span>
                </div>
            )
        }
    ];

    return (
        <div className="">

            <ReusableTable
                data={data}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                        <div className="col-span-1">
                            <Label>Sr No</Label>
                            <input
                                type="number"
                                placeholder="Sr No"
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.srno ? "border-red-500" : ""
                                    }`}
                                value={srno}
                                onChange={(e) => setSrno(e.target.value)}
                            />
                            {error && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.srno}
                                </div>
                            )}
                        </div>
                        <div className="col-span-1">
                            <Label>Documents</Label>
                            <input
                                type="text"
                                placeholder="Enter Document"
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.documents ? "border-red-500" : ""
                                    }`}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            {error && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.documents}
                                </div>
                            )}
                        </div>
                    </div>
                }

                columns={columns}
                title="Document"
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

                searchKey="document_name"

            />
        </div>
    );
};

export default Documentsdata;
