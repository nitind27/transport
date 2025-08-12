"use client";

import { useEffect, useState } from 'react';
import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import React from 'react';
import { useToggleContext } from '@/context/ToggleContext';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';
import { Documents } from '../Documentsdata/documents';
import { Supporteddatatype } from './Supporteddatatype';

interface Props {
    serverData: Supporteddatatype[];
    documents: Documents[];
}

type FormErrors = {
    supported_id?: number;
    document_id?: string;
    info?: string;
    supported_docs?: string;
    link?: string;
    status?: string;
};

const Supporteddata: React.FC<Props> = ({ serverData, documents }) => {
    const [data, setData] = useState<Supporteddatatype[]>(serverData || []);
    const [documentdata, setDocumentdata] = useState<Documents[]>(documents || []);
    const [documentsinput, setDocumentsinput] = useState('');
    const [informationinput, setInformationinput] = useState('');
    const [supportedDocumentList, setSupportedDocumentList] = useState<string[]>(['']);
    const [linkinput, setLinkinput] = useState('');
    const [editId, setEditId] = useState<number | null>(null);
    const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
    const [loading, setLoading] = useState(false);
    const [error, setErrors] = useState<FormErrors>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/supportedapi');
            const response1 = await fetch('/api/documents');
            const result = await response.json();
            const result1 = await response1.json();
            setData(result);
            setDocumentdata(result1);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setIsmodelopen(false);
        }
    };

    useEffect(() => {
        if (!isvalidation) {
            setErrors({});
        }
    }, [isvalidation]);

    const validateInputs = () => {
        const newErrors: FormErrors = {};
        setisvalidation(true);

        if (!documentsinput || documentsinput.length === 0) {
            newErrors.document_id = "Documents is required";
        }

        if (!informationinput || informationinput.length === 0) {
            newErrors.info = "Information is required";
        }

        if (!supportedDocumentList.some(doc => doc.trim() !== '')) {
            newErrors.supported_docs = "At least one Supported Document is required";
        }

        if (!linkinput || linkinput.length === 0) {
            newErrors.link = "Link is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateInputs()) return;
        setLoading(true);

        const apiUrl = '/api/supportedapi';
        const method = editId ? 'PUT' : 'POST';

        try {
            const response = await fetch(apiUrl, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supported_id: editId,
                    document_id: documentsinput,
                    info: informationinput,
                    supported_docs: supportedDocumentList.join(','),
                    link: linkinput
                })
            });
   

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success(editId
                ? 'Supported updated successfully!'
                : 'Supported created successfully!');

            setDocumentsinput('');
            setInformationinput('');
            setSupportedDocumentList(['']);
            setLinkinput('');
            setEditId(null);
            fetchData();
        } catch (error) {
            console.error('Error saving Supported:', error);
            toast.error(editId
                ? 'Failed to update Supported. Please try again.'
                : 'Failed to create Supported. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isEditMode) {
            setDocumentsinput("");
            setInformationinput("");
            setSupportedDocumentList([""]);
            setLinkinput("");
            setEditId(null);
        }
    }, [isEditMode]);

    const handleEdit = (item: Supporteddatatype) => {
        setIsmodelopen(true);
        setIsEditmode(true);
        setIsActive(!isActive);
        setDocumentsinput(item.document_id);
        setInformationinput(item.info);
        setSupportedDocumentList(item.supported_docs.split(',').map(doc => doc.trim()));
        setLinkinput(item.link);
        setEditId(item.supported_id);
    };

    const handleSupportedDocChange = (index: number, value: string) => {
        const updatedList = [...supportedDocumentList];
        updatedList[index] = value;
        setSupportedDocumentList(updatedList);
    };
    const removeSupportedDocField = (index: number) => {
        const updatedList = supportedDocumentList.filter((_, i) => i !== index);
        setSupportedDocumentList(updatedList.length > 0 ? updatedList : ['']);
    };

    const addSupportedDocField = () => {
        setSupportedDocumentList([...supportedDocumentList, '']);
    };

    const columns: Column<Supporteddatatype>[] = [
        {
            key: 'document_id',
            label: 'Document',
            accessor: 'document_id',
            render: (data) => <span>{data.document_name}</span>
        },
        {
            key: 'info',
            label: 'Information',
            accessor: 'info',
            render: (data) => <span>{data.info}</span>
        },
        {
            key: 'supported_docs',
            label: 'Supported Documents',
            accessor: 'supported_docs',
            render: (data) => <span>{data.supported_docs}</span>
        },
        {
            key: 'link',
            label: 'Link',
            accessor: 'link',
            render: (data) => <span>{data.link}</span>
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
                        <DefaultModal id={data.supported_id} fetchData={fetchData} endpoint={"supportedapi"} bodyname='supported_id' newstatus={data.status} />
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
                            <Label>Documents</Label>
                            <select
                                className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 ${error.document_id ? "border-red-500" : "border-gray-300"}`}
                                value={documentsinput}
                                onChange={(e) => setDocumentsinput(e.target.value)}
                            >
                                <option value="">Select Document</option>
                                {documentdata.map((doc) => (
                                    <option key={doc.id} value={doc.id}>
                                        {doc.document_name}
                                    </option>
                                ))}
                            </select>
                            {error.document_id && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.document_id}
                                </div>
                            )}
                        </div>

                        <div className="col-span-1">
                            <Label>Information</Label>
                            <textarea
                                rows={4}
                                placeholder="Enter Information"
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm ${error.info ? "border-red-500" : "border-gray-300"}`}
                                value={informationinput}
                                onChange={(e) => setInformationinput(e.target.value)}
                            />
                            {error.info && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.info}
                                </div>
                            )}
                        </div>

                        <div className="col-span-1">
                            <Label>Supported Documents</Label>
                            {supportedDocumentList.map((doc, index) => (
                                <div key={index} className="flex items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Enter Supported Document"
                                        className={`w-full rounded-lg border px-4 py-2.5 text-sm ${error.supported_docs ? "border-red-500" : "border-gray-300"
                                            }`}
                                        value={doc}
                                        onChange={(e) => handleSupportedDocChange(index, e.target.value)}
                                    />

                                    {/* Remove button for all except last field */}
                                    {index < supportedDocumentList.length - 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeSupportedDocField(index)}
                                            className="text-red-600 hover:text-red-800 text-lg font-bold px-2"
                                            title="Remove"
                                        >
                                            &times;
                                        </button>
                                    )}

                                    {/* Add button only on last input field */}
                                    {index === supportedDocumentList.length - 1 && (
                                        <button
                                            type="button"
                                            onClick={addSupportedDocField}
                                            className="text-white bg-green-600 hover:bg-green-700 rounded-full px-3 py-1 text-lg"
                                            title="Add more"
                                        >
                                            +
                                        </button>
                                    )}
                                </div>
                            ))}

                            {error.supported_docs && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.supported_docs}
                                </div>
                            )}
                        </div>

                        <div className="col-span-1">
                            <Label>Link</Label>
                            <input
                                type="text"
                                placeholder="Enter Link"
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm ${error.link ? "border-red-500" : "border-gray-300"}`}
                                value={linkinput}
                                onChange={(e) => setLinkinput(e.target.value)}
                            />
                            {error.link && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.link}
                                </div>
                            )}
                        </div>
                    </div>
                }

                columns={columns}
                title="Supported"
                filterOptions={[]}
                searchKey="supported_id"
                submitbutton={
                    <button
                        type='button'
                        onClick={handleSave}
                        className='bg-blue-700 text-white py-2 px-4 rounded'
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : (editId ? 'Update' : 'Save Changes')}
                    </button>
                }
            />
        </div>
    );
};

export default Supporteddata;
