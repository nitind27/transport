"use client";

import { useEffect, useMemo, useState } from "react";

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import { useToggleContext } from "@/context/ToggleContext";
import { toast } from "react-toastify";
import DefaultModal from "../example/ModalExample/DefaultModal";
import { FaEdit } from "react-icons/fa";
import DatePicker from "../form/date-picker";
import StockTransfer from "./StockTransfer";
import DamageStock from "./DamageStock";

type StockEntry = {
  id: number;
  dealer: string;
  ewayBillNo?: string;
  billNo?: string;
  invoiceDate?: string; // ISO string yyyy-mm-dd
  truckNo?: string;
  grain: string;
  units: string;
  weight: number; // numeric qty
  rate?: number; // per unit
  totalAmount?: number; // manual
  remarks?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

// Enhanced stock data type for the new columns
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

type FormErrors = Partial<Record<keyof Omit<StockEntry, "id" | "status" | "created_at" | "updated_at">, string>>;

interface StockInventoryProps {
  dealers: Array<{ id: number; name: string; status: string }>;
  grains: Array<{ id: number; name: string; Unit: string; status: string }>;
  initialStockData: StockEntry[];
}

const StockInventory = ({ dealers }: StockInventoryProps) => {
  const { isActive, setIsActive, setIsmodelopen, isvalidation, setisvalidation, isEditMode, setIsEditmode } = useToggleContext();

  // Get user category from sessionStorage
  const [userCategory, setUserCategory] = useState<string | null>(null);
  
  useEffect(() => {
    const category = sessionStorage.getItem('category_id');
    setUserCategory(category);
  }, []);

  // Tab state - Updated to include new tabs
  const [activeTab, setActiveTab] = useState<'stockTransfer' | 'damageStock' | 'inventory' | 'addStock'>('inventory');

  // Table data - Initialize as empty, will be fetched based on company_id
  const [data, setData] = useState<StockEntry[]>([]);
  const [enhancedData, setEnhancedData] = useState<EnhancedStockData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Grains filtered by company_id
  const [grains, setGrains] = useState<Array<{ id: number; name: string; Unit: string; status: string }>>([]);

  // Dropdown masters from API
  const dealerOptions = useMemo(
    () => [
      { value: "", label: "Select Dealer / Vendor" },
      ...dealers
        .filter(dealer => dealer.status === "Active")
        .map(dealer => ({ value: dealer.name, label: dealer.name }))
    ],
    [dealers]
  );

  const grainOptions = useMemo(
    () => [
      { value: "", label: "Select Grain" },
      ...grains
        .filter(grain => grain.status === "Active")
        .map(grain => ({ value: grain.name, label: grain.name }))
    ],
    [grains]
  );

  // Form state
  const [dealer, setDealer] = useState("");
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [billNo, setBillNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [truckNo, setTruckNo] = useState("");
  const [grain, setGrain] = useState("");
  const [units, setUnits] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [rate, setRate] = useState<number | "">("");
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [remarks, setRemarks] = useState("");

  const [error, setErrors] = useState<FormErrors>({});
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    if (!isvalidation) setErrors({});
  }, [isvalidation]);

  // Fetch grains/items filtered by company_id
  const fetchGrains = async () => {
    try {
      const companyId = sessionStorage.getItem('company_id');
      
      if (!companyId || companyId.trim() === '') {
        console.warn('No company_id found in sessionStorage');
        setGrains([]);
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
        setGrains(grainsArray);
        console.log('Grains fetched successfully for company_id:', companyId, 'Count:', grainsArray.length);
      } else {
        console.error('Failed to fetch grains');
        setGrains([]);
      }
    } catch (error) {
      console.error('Error fetching grains:', error);
      setGrains([]);
    }
  };

  // Load initial data - Always fetch from API with company_id filtering
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const companyId = sessionStorage.getItem('company_id');
    
    if (!companyId || companyId.trim() === '') {
      console.warn('No company_id found in sessionStorage - unable to load stock inventory');
      setData([]);
      setEnhancedData([]);
      setGrains([]);
      return;
    }
    
    console.log('Component mounted - fetching stock inventory data for company_id:', companyId);
    
    const timer = setTimeout(() => {
      fetchGrains();
      fetchStockData();
      fetchEnhancedStockData();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Listen for company change events (when company is selected in header)
  useEffect(() => {
    const handleCompanyChange = () => {
      fetchGrains();
      fetchStockData();
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

  function formatDate(dateString: string | undefined | null): string {
    if (!dateString) return 'उपलब्ध नाही';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'उपलब्ध नाही';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  const resetForm = () => {
    setDealer("");
    setEwayBillNo("");
    setBillNo("");
    setInvoiceDate("");
    setTruckNo("");
    setGrain("");
    setUnits("");
    setWeight("");
    setRate("");
    setTotalAmount("");
    setRemarks("");
    setEditId(null);
  };

  useEffect(() => {
    if (!isEditMode) resetForm();
  }, [isEditMode]);

  const validateInputs = () => {
    const newErrors: FormErrors = {};
    setisvalidation(true);

    if (!dealer) newErrors.dealer = "Dealer / Vendor is required";
    if (!grain) newErrors.grain = "Grain is required";
    if (!units) newErrors.units = "Units is required";
    if (weight === "" || Number.isNaN(Number(weight))) newErrors.weight = "Weight is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch enhanced stock data from API
  const fetchEnhancedStockData = async () => {
    try {
      // Get company_id from sessionStorage - this is set when user logs in
      const companyId = sessionStorage.getItem('company_id');
      
      if (!companyId || companyId.trim() === '') {
        console.warn('StockInventory - No company_id found in sessionStorage');
        setEnhancedData([]);
        return;
      }
      
      console.log('StockInventory - Fetching enhanced stock data for logged-in user company_id:', companyId);
      
      const params = new URLSearchParams();
      params.append('company_id', companyId.trim());
      
      const url = `/api/stockinventory/enhanced?${params.toString()}`;
      console.log('StockInventory - Fetching enhanced stock data with URL:', url);
      
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
        // Also normalize data by trimming whitespace
        const uniqueDataMap = new Map<string, EnhancedStockData>();
        dataArray.forEach((item: EnhancedStockData) => {
          // Normalize grain and units by trimming whitespace
          const normalizedGrain = (item.grain || '').trim();
          const normalizedUnits = (item.units || '').trim();
          
          if (!normalizedGrain || !normalizedUnits) {
            console.warn('Skipping item with missing grain or units:', item);
            return;
          }
          
          const key = `${normalizedGrain.toLowerCase()}_${normalizedUnits.toLowerCase()}`;
          
          if (!uniqueDataMap.has(key)) {
            // Create a normalized item with trimmed values
            uniqueDataMap.set(key, {
              ...item,
              grain: normalizedGrain,
              units: normalizedUnits,
              inwardQty: Number(item.inwardQty || 0),
              dispatchQty: Number(item.dispatchQty || 0),
              transferQty: Number(item.transferQty || 0),
              damageQty: Number(item.damageQty || 0),
              balanceQty: Number(item.balanceQty || 0)
            });
          } else {
            // If duplicate found, merge the quantities
            const existing = uniqueDataMap.get(key)!;
            existing.inwardQty = (existing.inwardQty || 0) + Number(item.inwardQty || 0);
            existing.dispatchQty = (existing.dispatchQty || 0) + Number(item.dispatchQty || 0);
            existing.transferQty = (existing.transferQty || 0) + Number(item.transferQty || 0);
            existing.damageQty = (existing.damageQty || 0) + Number(item.damageQty || 0);
            existing.balanceQty = existing.inwardQty - existing.dispatchQty - existing.transferQty - existing.damageQty;
          }
        });
        
        const uniqueData = Array.from(uniqueDataMap.values());
        
        setEnhancedData(uniqueData);
        
        console.log('StockInventory - Enhanced stock data fetched successfully for company_id:', companyId);
        console.log('StockInventory - Data count:', uniqueData.length, 'records (after deduplication)');
        
        if (uniqueData.length === 0) {
          console.warn('No enhanced stock data found for company_id:', companyId);
        }
      } else {
        const errorText = await response.text();
        console.error('StockInventory - API Error Response:', errorText);
        toast.error('Failed to fetch enhanced stock data');
        setEnhancedData([]);
      }
    } catch (error) {
      console.error('Error fetching enhanced stock data:', error);
      toast.error('Failed to fetch enhanced stock data');
      setEnhancedData([]);
    }
  };

  // Fetch stock data from API - filtered by company_id only
  const fetchStockData = async () => {
    try {
      // Get company_id from sessionStorage - this is set when user logs in
      const companyId = sessionStorage.getItem('company_id');
      
      if (!companyId || companyId.trim() === '') {
        console.warn('StockInventory - No company_id found in sessionStorage');
        setData([]);
        return;
      }
      
      console.log('StockInventory - Fetching stock data for logged-in user company_id:', companyId);
      
      const params = new URLSearchParams();
      params.append('company_id', companyId.trim());
      
      const url = `/api/stockinventory?${params.toString()}`;
      console.log('StockInventory - Fetching stock data with URL:', url);
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const stockData = await response.json();
        const dataArray = Array.isArray(stockData) ? stockData : [];
        
        setData(dataArray);
        
        console.log('StockInventory - Stock data fetched successfully for company_id:', companyId);
        console.log('StockInventory - Data count:', dataArray.length, 'records');
        
        if (dataArray.length === 0) {
          console.warn('No stock data found for company_id:', companyId);
        }
        
        // Refresh enhanced data after list load
        await fetchEnhancedStockData();
      } else {
        const errorText = await response.text();
        console.error('StockInventory - API Error Response:', errorText);
        toast.error('Failed to fetch stock data');
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to fetch stock data');
      setData([]);
    }
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      // Get company_id from sessionStorage
      const companyId = sessionStorage.getItem('company_id');
      
      const stockData = {
        dealer,
        ewayBillNo: ewayBillNo || undefined,
        billNo: billNo || undefined,
        invoiceDate: invoiceDate || undefined,
        truckNo: truckNo || undefined,
        grain,
        units,
        weight: Number(weight),
        rate: rate === "" ? undefined : Number(rate),
        totalAmount: totalAmount === "" ? undefined : Number(totalAmount),
        remarks: remarks || undefined,
        company_id: companyId && companyId.trim() !== '' ? companyId.trim() : undefined,
      };

      const url = editId ? '/api/stockinventory' : '/api/stockinventory';
      const method = editId ? 'PUT' : 'POST';
      const body = editId ? { ...stockData, id: editId } : stockData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        if (editId) {
          toast.success("Stock updated successfully!");
        } else {
          toast.success("Stock added successfully!");
        }

        // Refresh data from API
        await fetchGrains();
        await fetchStockData();
        resetForm();
        setIsEditmode(false);
        setIsmodelopen(false);

        // Switch to inventory tab after successful addition
        setActiveTab('inventory');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving stock:', error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit - populate form fields with row data
  const handleEdit = (row: StockEntry) => {
    setEditId(row.id);
    setDealer(row.dealer);
    setEwayBillNo(row.ewayBillNo || "");
    setBillNo(row.billNo || "");
    setInvoiceDate(row.invoiceDate || "");
    setTruckNo(row.truckNo || "");
    setGrain(row.grain);
    setUnits(row.units);
    setWeight(row.weight);
    setRate(row.rate || "");
    // Fix: Properly handle totalAmount - use the actual value from database
    setTotalAmount(row.totalAmount !== undefined && row.totalAmount !== null ? row.totalAmount : "");
    setRemarks(row.remarks || "");
    setIsActive(!isActive);
    setIsmodelopen(true);
    setIsEditmode(true);
  };

  // Add Stock columns (with edit/delete actions)
  const addStockColumns: Column<StockEntry>[] = [
    {
      key: "grain",
      label: "Item (Grain)",
      accessor: "grain",
      render: (row) => <span>{row.grain}</span>,
    },
    {
      key: "qty",
      label: "Quantity",
      render: (row) => (
        <span>
          {row.weight} {row.units}
        </span>
      ),
    },
    {
      key: "dealer",
      label: "Dealer / Vendor",
      accessor: "dealer",
      render: (row) => <span>{row.dealer}</span>,
    },
    {
      key: "invoiceDate",
      label: "Invoice Date",
      accessor: "invoiceDate",
      render: (row) => <span>{formatDate(row.invoiceDate) || "-"}</span>,
    },
    {
      key: "actions",
      label: "Actions",
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
              fetchData={fetchStockData}
              endpoint={"stockinventory"}
              bodyname='id'
              newstatus={row.status || "Active"}
            />
          </span>
        </div>
      ),
    },
  ];

  // Function to get visible tabs based on user role
  const getVisibleTabs = () => {
    const allTabs = [
      { key: 'inventory', label: 'Stock Inventory' },
      { key: 'addStock', label: 'Add Stock' },
      { key: 'stockTransfer', label: 'Stock Transfer' },
      { key: 'damageStock', label: 'Damage Stock' }
    ];

    // Staff (category_id = 4) can only see Stock Inventory tab
    if (userCategory === '4') {
      return [{ key: 'inventory', label: 'Stock Inventory' }];
    }

    // Admin, Owner, Supervisor can see all tabs
    return allTabs;
  };

  const visibleTabs = getVisibleTabs();

  return (
    <div className="">
      {/* Tab Navigation - Role-based visibility */}
      <div className="flex border-b border-gray-200 mb-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as "inventory" | "addStock" | "stockTransfer" | "damageStock")}
            className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === tab.key
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content - Updated with new tab content */}
      {activeTab === 'stockTransfer' ? (
        <StockTransfer onDataChanged={fetchEnhancedStockData}/>
      ) : activeTab === 'damageStock' ? (
        <DamageStock onDataChanged={fetchEnhancedStockData} />
      ) : activeTab === 'inventory' ? (
        // Stock Inventory Tab - Enhanced with new columns
        <div>
          {/* Enhanced Table for Current Stock Summary with new columns - Compact design */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs border border-gray-300 dark:border-gray-600">
  <thead className="bg-gray-50 dark:bg-gray-700">
    <tr>
      <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-300 dark:border-gray-600">
        Sr
      </th>
      <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-300 dark:border-gray-600">
        Item (Grain)
      </th>
      <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-300 dark:border-gray-600">
        Inward
      </th>
      <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-300 dark:border-gray-600">
        Dispatch
      </th>
      <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-300 dark:border-gray-600">
        Transfer
      </th>
      <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-300 dark:border-gray-600">
        Damage
      </th>
      <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-300 dark:border-gray-600">
        Balance
      </th>
    </tr>
  </thead>
  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    {enhancedData.length === 0 ? (
      <tr>
        <td colSpan={7} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
          {loading ? 'Loading data...' : 'No stock data available for your company'}
        </td>
      </tr>
    ) : (
      enhancedData
        .filter(item => {
          // Additional client-side filter: ensure grain is active
          // Normalize grain name for comparison (trim and case-insensitive)
          const normalizedItemGrain = (item.grain || '').trim().toLowerCase();
          const grain = grains.find(g => 
            (g.name || '').trim().toLowerCase() === normalizedItemGrain
          );
          return grain?.status === 'Active';
        })
        .map((item, index) => (
        <tr key={`${item.grain}-${item.units}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
          <td className="px-3 py-2 whitespace-nowrap font-mono text-gray-900 dark:text-white text-center border border-gray-300 dark:border-gray-600">
            {index + 1}
          </td>
          <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900 dark:text-white text-center border border-gray-300 dark:border-gray-600">
            {item.grain || ''} - {item.units || ''}
          </td>
          <td className="px-3 py-2 whitespace-nowrap font-bold text-green-600 dark:text-green-400 text-center border border-gray-300 dark:border-gray-600">
            {Number(item.inwardQty || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </td>
          <td className="px-3 py-2 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400 text-center border border-gray-300 dark:border-gray-600">
            {Number(item.dispatchQty || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </td>
          <td className="px-3 py-2 whitespace-nowrap font-bold text-orange-600 dark:text-orange-400 text-center border border-gray-300 dark:border-gray-600">
            {Number(item.transferQty || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </td>
          <td className="px-3 py-2 whitespace-nowrap font-bold text-red-600 dark:text-red-400 text-center border border-gray-300 dark:border-gray-600">
            {Number(item.damageQty || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </td>
          <td className={`px-3 py-2 whitespace-nowrap font-bold text-center border border-gray-300 dark:border-gray-600 ${Number(item.balanceQty || 0) >= 0
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
          }`}>
            {Number(item.balanceQty || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>


            </div>
          </div>

      
        </div>
      ) : activeTab === 'addStock' ? (
        // Add Stock Tab - With Form and Actions
        <div>
          <ReusableTable
            data={data}
            classname={"h-[650px] overflow-y-auto scrollbar-hide"}
            inputfiled={
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <div>
                  <Label>Dealer / Vendor</Label>
                  <select
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${error.dealer ? "border-red-500" : ""}`}
                    value={dealer}
                    onChange={(e) => setDealer(e.target.value)}
                  >
                    {dealerOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  {error.dealer && <div className="text-red-500 text-sm mt-1 pl-1">{error.dealer}</div>}
                </div>

                <div>
                  <Label>E-Way bill no</Label>
                  <input
                    type="text"
                    placeholder="Enter E-Way bill no"
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90`}
                    value={ewayBillNo}
                    onChange={(e) => setEwayBillNo(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Bill no</Label>
                  <input
                    type="text"
                    placeholder="Enter Bill no"
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90`}
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                  />
                </div>

                <div className="">
                  <Label>Date of Invoice</Label>
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

                <div>
                  <Label>Truck No</Label>
                  <input
                    type="text"
                    placeholder="Enter Truck No"
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90`}
                    value={truckNo}
                    onChange={(e) => {
                      if (/^[a-zA-Z0-9]{0,10}$/.test(e.target.value)) {
                        const upperCaseValue = e.target.value.toUpperCase();
                        setTruckNo(upperCaseValue);
                      }
                    }}
                  />
                </div>

                <div>
                  <Label>Grain</Label>
                  <select
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${error.grain ? "border-red-500" : ""}`}
                    value={grain}
                    onChange={(e) => {
                      const selectedGrain = e.target.value;
                      setGrain(selectedGrain);

                      // Find the selected grain and set its unit
                      const selectedGrainData = grains.find(g => g.name === selectedGrain);
                      if (selectedGrainData) {
                        setUnits(selectedGrainData.Unit);
                      } else {
                        setUnits("");
                      }
                    }}
                  >
                    {grainOptions.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  {error.grain && <div className="text-red-500 text-sm mt-1 pl-1">{error.grain}</div>}
                </div>

                <div>
                  <Label>Units</Label>
                  <select
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs bg-gray-100 text-gray-600 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed ${error.units ? "border-red-500" : ""}`}
                    value={units}
                    disabled={true}
                  >
                    <option value="">{units || "Select Grain first"}</option>
                  </select>
                  {error.units && <div className="text-red-500 text-sm mt-1 pl-1">{error.units}</div>}
                </div>

                <div>
                  <Label>Weight</Label>
                  <input
                    type="number"
                    placeholder="Enter Weight"
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${error.weight ? "border-red-500" : ""}`}
                    value={weight}
                    onChange={(e) => {
                      const newWeight = e.target.value === "" ? "" : Number(e.target.value);
                      setWeight(newWeight);

                      // Calculate total amount: Weight × Rate
                      if (newWeight !== "" && rate !== "") {
                        const calculatedAmount = Number(newWeight) * Number(rate);
                        setTotalAmount(calculatedAmount);
                      } else if (newWeight === "" || rate === "") {
                        setTotalAmount("");
                      }
                    }}
                  />
                  {error.weight && <div className="text-red-500 text-sm mt-1 pl-1">{error.weight}</div>}
                </div>

                <div>
                  <Label>Rate</Label>
                  <input
                    type="number"
                    placeholder="Enter Rate"
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90`}
                    value={rate}
                    onChange={(e) => {
                      const newRate = e.target.value === "" ? "" : Number(e.target.value);
                      setRate(newRate);

                      // Calculate total amount: Weight × Rate
                      if (weight !== "" && newRate !== "") {
                        const calculatedAmount = Number(weight) * Number(newRate);
                        setTotalAmount(calculatedAmount);
                      } else if (weight === "" || newRate === "") {
                        setTotalAmount("");
                      }
                    }}
                  />
                </div>

                <div>
                  <Label>Total Amount</Label>
                  <input
                    type="number"
                    placeholder="Auto-calculated (Weight × Rate)"
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-gray-100 text-gray-600 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed`}
                    value={totalAmount}
                    disabled={true}
                    readOnly
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label>Remarks</Label>
                  <textarea
                    placeholder="Enter Remarks"
                    rows={3}
                    className={`w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90`}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>
            }
            columns={addStockColumns}
            title="Add Stock"
            filterOptions={[]}
            submitbutton={
              <button
                type="button"
                onClick={handleSave}
                className="bg-blue-700 text-white py-2 p-2 rounded"
                disabled={loading}
              >
                {loading ? "Submitting..." : editId ? "Update" : "Submit"}
              </button>
            }
            searchKey="grain"
          />
        </div>
      ) : null}
    </div>
  );
};

export default StockInventory;