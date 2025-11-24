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

// Enhanced stock data type for balance display
type EnhancedStockData = {
    id: number;
    grain: string;
    units: string;
    inwardQty: number;
    dispatchQty: number;
    transferQty: number;
    damageQty: number;
    balanceQty: number;
};

const DamageStock = ({ onDataChanged }: DamageStockProps) => {
    const [data, setData] = useState<DamageStockEntry[]>([]);
    const [itemGrains, setItemGrains] = useState<ItemGrain[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setErrors] = useState<FormErrors>({});
    const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
    const [checkingStock, setCheckingStock] = useState(false);
    const [enhancedData, setEnhancedData] = useState<EnhancedStockData[]>([]);

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
    
    // Fetch item grains from API - filtered by company_id
    const fetchItemGrains = async () => {
        try {
            const companyId = sessionStorage.getItem('company_id');
            
            if (!companyId || companyId.trim() === '') {
                console.warn('No company_id found in sessionStorage');
                setItemGrains([]);
                return;
            }
            
            const params = new URLSearchParams();
            params.append('company_id', companyId.trim());
            
            const url = `/api/itemgrains?${params.toString()}`;
            console.log('Fetching grains with company_id filter:', url);
            
            const response = await fetch(url, {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const grainsData = await response.json();
                const grainsArray = Array.isArray(grainsData) ? grainsData : [];
                setItemGrains(grainsArray);
                console.log('Grains fetched successfully for company_id:', companyId, 'Count:', grainsArray.length);
            } else {
                console.error('Failed to fetch grains');
                setItemGrains([]);
            }
        } catch (error) {
            console.error('Error fetching item grains:', error);
            toast.error('Failed to fetch item grains');
            setItemGrains([]);
        }
    };
    // Fetch enhanced stock data from API - filtered by company_id
    const fetchEnhancedStockData = async () => {
        try {
            // Get company_id from sessionStorage
            const companyId = sessionStorage.getItem('company_id');
            
            if (!companyId || companyId.trim() === '') {
                console.warn('DamageStock - No company_id found in sessionStorage');
                setEnhancedData([]);
                return;
            }
            
            console.log('DamageStock - Fetching enhanced stock data for company_id:', companyId);
            
            const params = new URLSearchParams();
            params.append('company_id', companyId.trim());
            
            const url = `/api/stockinventory/enhanced?${params.toString()}`;
            console.log('DamageStock - Fetching enhanced stock data with URL:', url);
            
            const response = await fetch(url, {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                } 
            });
            
            if (response.ok) {
                const enhancedStockData = await response.json();
                const dataArray = Array.isArray(enhancedStockData) ? enhancedStockData : [];
                
                // Deduplicate by grain name and units - keep only unique combinations
                const uniqueDataMap = new Map<string, EnhancedStockData>();
                dataArray.forEach((item: EnhancedStockData) => {
                    const key = `${item.grain.toLowerCase().trim()}_${item.units.toLowerCase().trim()}`;
                    if (!uniqueDataMap.has(key)) {
                        uniqueDataMap.set(key, item);
                    } else {
                        // If duplicate found, merge the quantities
                        const existing = uniqueDataMap.get(key)!;
                        existing.inwardQty = (existing.inwardQty || 0) + (item.inwardQty || 0);
                        existing.dispatchQty = (existing.dispatchQty || 0) + (item.dispatchQty || 0);
                        existing.transferQty = (existing.transferQty || 0) + (item.transferQty || 0);
                        existing.damageQty = (existing.damageQty || 0) + (item.damageQty || 0);
                        existing.balanceQty = existing.inwardQty - existing.dispatchQty - existing.transferQty - existing.damageQty;
                    }
                });
                
                const uniqueData = Array.from(uniqueDataMap.values());
                
                setEnhancedData(uniqueData);
                
                console.log('DamageStock - Enhanced stock data fetched successfully for company_id:', companyId);
                console.log('DamageStock - Data count:', uniqueData.length, 'records (after deduplication)');
                
                if (uniqueData.length === 0) {
                    console.warn('No enhanced stock data found for company_id:', companyId);
                }
            } else {
                const errorText = await response.text();
                console.error('DamageStock - API Error Response:', errorText);
                toast.error('Failed to fetch enhanced stock data');
                setEnhancedData([]);
            }
        } catch (error) {
            console.error('Error fetching enhanced stock data:', error);
            toast.error('Failed to fetch enhanced stock data');
            setEnhancedData([]);
        }
    };

    // Check stock availability for selected item - using enhanced data
    const checkStockAvailability = async (selectedItemGrain: string) => {
        if (!selectedItemGrain) {
            setStockInfo(null);
            return;
        }

        setCheckingStock(true);
        try {
            // Find the balance from enhanced data for the selected grain
            const grainData = enhancedData.find(item => 
                item.grain.toLowerCase().trim() === selectedItemGrain.toLowerCase().trim()
            );
            
            if (grainData) {
                const availableWeight = Math.max(0, grainData.balanceQty || 0);
                setStockInfo({
                    availableWeight: availableWeight,
                    message: `Available balance: ${availableWeight}`
                });
            } else {
                // If not found in enhanced data, try API as fallback
                const companyId = sessionStorage.getItem('company_id');
                const params = new URLSearchParams();
                params.append('itemGrain', selectedItemGrain);
                if (companyId && companyId.trim() !== '') {
                    params.append('company_id', companyId.trim());
                }
                
                const response = await fetch(`/api/stocktransfer?${params.toString()}`);
                if (response.ok) {
                    const stockData = await response.json();
                    setStockInfo({
                        availableWeight: stockData.availableWeight || 0,
                        message: stockData.message || 'Stock information not available'
                    });
                } else {
                    setStockInfo({
                        availableWeight: 0,
                        message: 'Stock information not available'
                    });
                }
            }
        } catch (error) {
            console.error('Error checking stock:', error);
            setStockInfo(null);
        } finally {
            setCheckingStock(false);
        }
    };
    // Check stock when item grain changes or enhanced data updates
    useEffect(() => {
        if (itemGrain) {
            checkStockAvailability(itemGrain);
        } else {
            setStockInfo(null);
        }
    }, [itemGrain, enhancedData]);

    // Fetch damage stock data from API
    const fetchData = async () => {
        setLoading(true);
        try {
            const companyId = sessionStorage.getItem('company_id');
            const params = new URLSearchParams();
            if (companyId && companyId.trim() !== '') {
                params.append('company_id', companyId.trim());
            }
            
            const url = `/api/stockmanage${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url, {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
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
        if (typeof window === 'undefined') return;
        
        const companyId = sessionStorage.getItem('company_id');
        
        if (!companyId || companyId.trim() === '') {
            console.warn('DamageStock - No company_id found in sessionStorage');
            setData([]);
            setEnhancedData([]);
            setItemGrains([]);
            return;
        }
        
        console.log('DamageStock component mounted - fetching data for company_id:', companyId);
        
        const timer = setTimeout(() => {
            fetchItemGrains();
            fetchData();
            fetchEnhancedStockData();
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);

    // Listen for company change events (when company is selected in header)
    useEffect(() => {
        const handleCompanyChange = () => {
            fetchItemGrains();
            fetchData();
            fetchEnhancedStockData();
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
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        setInvoiceDate(formattedDate);
        setItemGrain("");
        setQuantity("");
        setRemarks("");
        setEditId(null);
        setStockInfo(null);
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
                fetchEnhancedStockData(); // Refresh available stock after damage entry
                if (onDataChanged) onDataChanged();
                toast.success(editId ? 'Damage stock updated successfully!' : 'Damage stock added successfully!');
                reset();
                setEditId(null);
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
                                await fetchEnhancedStockData(); // Refresh available stock data
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
                                {/* Balance Display */}
                            {stockInfo && (
                                <div className={`text-sm mt-1 pl-1 ${stockInfo.availableWeight > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {checkingStock ? (
                                        <span className="text-blue-600">Checking balance...</span>
                                    ) : (
                                        <span>
                                            Balance: <strong>{stockInfo.availableWeight}</strong>
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