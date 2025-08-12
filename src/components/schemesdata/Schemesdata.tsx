"use client";

import { useEffect, useState } from 'react';
import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";

// import Select from 'react-select';
import { toast } from 'react-toastify';
import React from 'react';
import { Schemesdatas } from './schemes';
// import { MultiValue } from 'react-select';
import { useToggleContext } from '@/context/ToggleContext';
import Loader from '@/common/Loader';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';

// Define a more specific type for document options


// Define a type for the data fetched from the API
interface schemescategory {
    scheme_category_id: number;
    name: string;
}
interface schemesSubcategory {
    scheme_sub_category_id: number;
    scheme_category_id: number;
    name: string;
}
interface schemesYear {
    scheme_year_id: number;
    year: string;
}

interface Props {
    initialdata: Schemesdatas[];
    filtercategory: schemescategory[];
    filterdocument: {
        id: number;
        document_name: string;
    }[];
    filtersubcategory: schemesSubcategory[];
    filteryear: schemesYear[];
}
type FormErrors = {
    category?: string;
    subcategory?: string;
    year?: string;
    schemename?: string;
    beneficieryname?: string;
    applyedat?: string;
    link?: string;
    documents?: string;
    srno?: string;
    schememarathiname?: string;
};
const Schemesdata: React.FC<Props> = ({
    initialdata,
    // filtercategory,
    // filterdocument,
    // filtersubcategory,
    filteryear
}) => {
    const { isActive, setIsActive, isEditMode, setIsEditmode, isvalidation, setIsmodelopen, setisvalidation } = useToggleContext();
    const [data, setData] = useState<Schemesdatas[]>(initialdata || []);

    const [schemeyearid, setschemeyearid] = useState(0);
    const [schemename, setschemename] = useState('');
    const [schememarathiname, setschememarathiname] = useState('');

    const [error, setErrors] = useState<FormErrors>({});

    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    // Use the DocOption type here
    // const docoptions: DocOption[] = filterdocument.map(doc => ({
    //     label: doc.document_name,
    //     value: doc.id.toString()
    // }));

    useEffect(() => {

        if (!isvalidation) {

            setErrors({})
        }
    }, [isvalidation])

    const validateInputs = () => {
        const newErrors: FormErrors = {};
        setisvalidation(true)
        // Category validation

        // Year validation
        if (!schemeyearid) {
            newErrors.year = "Year is required";
        }

        // Scheme name validation
        if (!schemename.trim()) {
            newErrors.schemename = "Scheme name (english) is required";
        }


        if (!schememarathiname.trim()) {
            newErrors.schememarathiname = "Scheme name (marathi) is required";
        }



        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/schemescrud');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false); // End loading
        }
    };




    const handleSave = async () => {

        if (!validateInputs()) return;
        setLoading(true)
        const apiUrl = isEditMode ? `/api/schemescrud` : '/api/schemescrud';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scheme_id: editId,

                    scheme_year_id: schemeyearid,
                    scheme_name: schemename,

                    scheme_name_marathi: schememarathiname,

                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success(editId
                ? 'Schemes updated successfully!'
                : 'Schemes created successfully!');

            // setInputValue(''); // Remove or use inputValue
            setEditId(null);
            resetdata();
            fetchData();

        } catch (error) {
            console.error('Error saving Schemes:', error);
            toast.error(editId
                ? 'Failed to update Schemes. Please try again.'
                : 'Failed to create Schemes. Please try again.');
        }
        finally {
            setLoading(false);
            setIsmodelopen(false);
        }
    };
    const resetdata = () => {



        setschemeyearid(0)
        setschemename("")
        setschememarathiname("")

        setEditId(0);


    }
    useEffect(() => {
        if (!isEditMode) {

            resetdata()
        }
    }, [isEditMode]);
    const handleEdit = (item: Schemesdatas) => {

        setIsmodelopen(true);
        setIsEditmode(true);
        setIsActive(!isActive)
        setEditId(item.scheme_id)

        setschemeyearid(item.scheme_year_id)
        setschemename(item.scheme_name)
        setschememarathiname(item.scheme_name_marathi)

    };

    // Document ID से नाम मैपिंग
    // const documentMap = new Map(filterdocument.map(doc => [doc.id, doc.document_name]));

    const columns: Column<Schemesdatas>[] = [

        {
            key: 'scheme_year_id',
            label: 'Year',
            accessor: 'scheme_year_id',
            render: (data) => <span>{data.scheme_year}</span>
        },
        {
            key: 'scheme_name',
            label: 'Name (English)',
            accessor: 'scheme_name',
            render: (data) => <span>{data.scheme_name}</span>
        },
        {
            key: 'scheme_name_marathi',
            label: 'Name (Marathi)',
            accessor: 'scheme_name',
            render: (data) => <span>{data.scheme_name_marathi}</span>
        },


        {
            key: 'status',
            label: 'Status',
            accessor: 'status',
            render: (data) => <span>{data.status}</span>
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
                        <DefaultModal id={data.scheme_id} fetchData={fetchData} endpoint={"schemescrud"} bodyname={"scheme_id"} newstatus={data.status} />
                    </span>
                </div>
            )
        }
    ];

    return (
        <div className="">
            {loading && <Loader />}
            <ReusableTable
                data={data}
                title='Schemes'
                classname={"h-[450px] overflow-y-auto scrollbar-hide"}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">




                        <div>
                            <Label>Scheme Year</Label>
                            <select
                                name=""
                                id=""
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.year ? "border-red-500" : ""
                                    }`}
                                value={schemeyearid}
                                onChange={(e) => setschemeyearid(Number(e.target.value))}
                            >
                                <option value="">Year</option>
                                {filteryear.map((category) => (
                                    <option key={category.scheme_year_id} value={category.scheme_year_id}>
                                        {category.year}
                                    </option>
                                ))}
                            </select>
                            {error && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.year}
                                </div>
                            )}
                        </div>

                        <div className="col-span-1">
                            <Label>Name (English)</Label>
                            <input
                                type="text"
                                placeholder="Enter name"
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.schemename ? "border-red-500" : ""
                                    }`}
                                value={schemename}
                                onChange={(e) => setschemename(e.target.value)}
                            />
                            {error && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.schemename}
                                </div>
                            )}
                        </div>
                        <div className="col-span-1">
                            <Label>Name (Marathi)</Label>
                            <input
                                type="text"
                                placeholder="Enter name"
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.schememarathiname ? "border-red-500" : ""
                                    }`}
                                value={schememarathiname}
                                onChange={(e) => setschememarathiname(e.target.value)}
                            />
                            {error && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.schememarathiname}
                                </div>
                            )}
                        </div>


                    </div>
                }
                submitbutton={
                    <button
                        type='button'
                        onClick={handleSave}
                        className='bg-blue-700 text-white py-2 p-2 rounded'
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : (isEditMode ? 'Update' : 'Save Changes')}
                    </button>
                }
                searchKey="beneficiery_name"
                columns={columns}
            />
        </div>
    );
};

export default Schemesdata;
