"use client";

import { useEffect, useState } from 'react';
import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { useToggleContext } from '@/context/ToggleContext';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';
import DatePicker from "../form/date-picker";

type DamageStockEntry = {
    id: number;
    invoiceDate: string;
    itemGrain: string;
    quantity: number;
    remarks: string;
    status?: string;
    tpNo?: string;
    created_at?: string;
    updated_at?: string;
};

type ItemGrain = {
    id: number;
    name: string;
    Unit: string;
    status?: string;
};

type FormErrors = {
    itemGrain?: string;
    quantity?: string;
};
type DamageStockProps = {
    onDataChanged?: () => void;
}
type StockInfo = {
    availableWeight: number;
    message: string;
};
const DamageStock = ({ onDataChanged }: DamageStockProps) => {
    const [data, setData] = useState<DamageStockEntry[]>([]);
    const [itemGrains, setItemGrains] = useState<ItemGrain[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setErrors] = useState<FormErrors>({});
    const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
    const [checkingStock, setCheckingStock] = useState(false);

    // Form state
    const [invoiceDate, setInvoiceDate] = useState("");
    const [itemGrain, setItemGrain] = useState("");
    const [quantity, setQuantity] = useState<number | "">("");
    const [remarks, setRemarks] = useState("");

    const [editId, setEditId] = useState<number | null>(null);
    const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        setInvoiceDate(formattedDate);
    }, []);
    
    // Fetch item grains from API
    const fetchItemGrains = async () => {
        try {
            const response = await fetch('/api/itemgrains');
            if (response.ok) {
                const grainsData = await response.json();
                setItemGrains(grainsData);
            }
        } catch (error) {
            console.error('Error fetching item grains:', error);
            toast.error('Failed to fetch item grains');
        }
    };
    const checkStockAvailability = async (selectedItemGrain: string) => {
        if (!selectedItemGrain) {
            setStockInfo(null);
            return;
        }

        setCheckingStock(true);
        try {
            const response = await fetch(`/api/stocktransfer?itemGrain=${encodeURIComponent(selectedItemGrain)}`);
            if (response.ok) {
                const stockData = await response.json();
                setStockInfo({
                    availableWeight: stockData.availableWeight,
                    message: stockData.message
                });
            } else {
                setStockInfo(null);
            }
        } catch (error) {
            console.error('Error checking stock:', error);
            setStockInfo(null);
        } finally {
            setCheckingStock(false);
        }
    };
    useEffect(() => {
        if (itemGrain) {
            checkStockAvailability(itemGrain);
        } else {
            setStockInfo(null);
        }
    }, [itemGrain]);
    // Fetch damage stock data from API
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/stockmanage');
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error('Error fetching damage stock data:', error);
            toast.error('Failed to fetch damage stock data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchItemGrains();
    }, []);

    useEffect(() => {
        if (!isvalidation) {
            setErrors({});
        }
    }, [isvalidation]);

    const reset = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        setInvoiceDate("");
        setItemGrain("");
        setQuantity("");
        setRemarks("");
        setInvoiceDate(formattedDate);
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

        if (!itemGrain) {
            newErrors.itemGrain = "Item/Grain is required";
        }
        if (quantity === "" || Number.isNaN(Number(quantity))) {
            newErrors.quantity = "Quantity is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateInputs()) return;
        setLoading(true);

        try {
            const damageStockData = {
                invoiceDate: invoiceDate || undefined,
                itemGrain,
                quantity: Number(quantity),
                remarks: remarks || undefined,
            };

            const url = '/api/stockmanage';
            const method = editId ? 'PUT' : 'POST';
            const body = editId ? { ...damageStockData, id: editId } : damageStockData;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                fetchData();
                if (onDataChanged) onDataChanged();
                toast.success(editId ? 'Damage stock updated successfully!' : 'Damage stock added successfully!');
                reset();
                setEditId(null);
                fetchData();
                setIsEditmode(false);
                setIsmodelopen(false);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to save');
            }
        } catch (error) {
            console.error('Error saving damage stock:', error);
            toast.error('Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: DamageStockEntry) => {
        setIsActive(!isActive);
        setIsmodelopen(true);
        setIsEditmode(true);
        setEditId(item.id);
        setInvoiceDate(item.invoiceDate || "");
        setItemGrain(item.itemGrain);
        setQuantity(item.quantity);
        setRemarks(item.remarks || "");
    };

    function formatDate(dateString: string | undefined | null): string {
        if (!dateString) return 'उपलब्ध नाही';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'उपलब्ध नाही';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    const columns: Column<DamageStockEntry>[] = [

        {
            key: 'invoiceDate',
            label: 'Invoice Date',
            accessor: 'invoiceDate',
            render: (row) => <span>{formatDate(row.invoiceDate)}</span>
        },
        {
            key: 'itemGrain',
            label: 'Item/Grain',
            accessor: 'itemGrain',
            render: (row) => <span>{row.itemGrain}</span>
        },
        {
            key: 'quantity',
            label: 'Quantity',
            accessor: 'quantity',
            render: (row) => <span>{row.quantity}</span>
        },
        {
            key: 'remarks',
            label: 'Remarks',
            accessor: 'remarks',
            render: (row) => <span>{row.remarks || '-'}</span>
        },
        {
            key: 'tpNo',
            label: 'TP No',
            accessor: 'tpNo',
            render: (row) => <span>{row.tpNo || '-'}</span>
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
                        <DefaultModal
                            id={row.id}
                            fetchData={async () => {
                                await fetchData();          // Refresh this table's data
                                if (onDataChanged) onDataChanged(); // Refresh parent summary or enhanced data
                              }}
                            endpoint={"stockmanage"}
                            bodyname='id'
                            newstatus={row.status || "Active"}
                        />
                    </span>
                </div>
            )
        }
    ];

    // Grain options for dropdown
    const grainOptions = itemGrains
        .filter(grain => grain.status === "Active")
        .map(grain => ({ value: grain.name, label: grain.name }));

    return (
        <div className="mt-5">
            <ReusableTable
                data={data}
                classname={"h-auto overflow-y-auto scrollbar-hide"}
                inputfiled={
                    <div className="">
                        <div>
                            <Label>Invoice Date</Label>
                            <DatePicker
                                id="invoiceDate"
                                label=""
                                placeholder="Select Invoice Date"
                                defaultDate={invoiceDate ? new Date(invoiceDate) : undefined}
                                onChange={(selectedDates) => {
                                    if (selectedDates && selectedDates.length > 0) {
                                        const date = selectedDates[0];
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, "0");
                                        const day = String(date.getDate()).padStart(2, "0");
                                        const formattedDate = `${year}-${month}-${day}`;
                                        setInvoiceDate(formattedDate);
                                    }
                                }}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 mt-5">
                            <div>
                                <Label>Item/Grain</Label>
                                <select
                                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${error.itemGrain ? "border-red-500" : ""}`}
                                    value={itemGrain}
                                    onChange={(e) => setItemGrain(e.target.value)}
                                >
                                    <option value="">Select Item/Grain</option>
                                    {grainOptions.map((grain) => (
                                        <option key={grain.value} value={grain.value}>
                                            {grain.label}
                                        </option>
                                    ))}
                                </select>
                                {error.itemGrain && (
                                    <div className="text-red-500 text-sm mt-1 pl-1">
                                        {error.itemGrain}
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>Quantity</Label>
                                <input
                                    type="number"
                                    placeholder="Enter Quantity"
                                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${error.quantity ? "border-red-500" : ""}`}
                                    value={quantity}
                                    onChange={(e) => {
                                        const newQuantity = e.target.value === "" ? "" : Number(e.target.value);
                                        setQuantity(newQuantity);
                                    }}
                                />
                                {error.quantity && (
                                    <div className="text-red-500 text-sm mt-1 pl-1">
                                        {error.quantity}
                                    </div>
                                )}
                                {/* Stock Information Display */}
                            {stockInfo && (
                                <div className={`text-sm mt-1 pl-1 ${stockInfo.availableWeight > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {checkingStock ? (
                                        <span className="text-blue-600">Checking stock...</span>
                                    ) : (
                                        <span>
                                            Available Stock: <strong>{stockInfo.availableWeight}</strong>
                                        </span>
                                    )}
                                </div>
                            )}
                            </div>

                            <div className="sm:col-span-2">
                                <Label>Remarks</Label>
                                <textarea
                                    placeholder="Enter Remarks"
                                    rows={3}
                                    className="w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                }
                columns={columns}
                title="Stock Damage"
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
                searchKey="itemGrain"
            />
        </div>
    );
};

export default DamageStock;