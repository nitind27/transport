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

type ItemGrain = {
  id: number;
  name: string;
  Unit: string;
  status?: string;
};

type AggregatedStock = {
  itemId: number;
  grain: string;
  units: string;
  totalQuantity: number;
};

type FormErrors = Partial<Record<keyof Omit<StockEntry, "id" | "status" | "created_at" | "updated_at">, string>>;

interface StockInventoryProps {
  dealers: Array<{ id: number; name: string; status: string }>;
  grains: Array<{ id: number; name: string; Unit: string; status: string }>;
  initialStockData: StockEntry[];
}

const StockInventory = ({ dealers, grains, initialStockData }: StockInventoryProps) => {
  const { isActive, setIsActive, setIsmodelopen, isvalidation, setisvalidation, isEditMode, setIsEditmode } = useToggleContext();

  // Tab state - Updated to include new tabs
  const [activeTab, setActiveTab] = useState<'stockTransfer' | 'damageStock' | 'inventory' | 'addStock'>('stockTransfer');

  // Table data
  const [data, setData] = useState<StockEntry[]>(initialStockData || []);
  const [loading, setLoading] = useState(false);
  const [itemGrains, setItemGrains] = useState<ItemGrain[]>([]);
  const [schoolWiseTotals, setSchoolWiseTotals] = useState<Array<{ grain: string; totalQuantity: number; units: string }>>([]);

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

  // Load initial data
  useEffect(() => {
    if (initialStockData) {
      setData(initialStockData);
    }
  }, [initialStockData]);

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

  useEffect(() => {
    fetchItemGrains();
  }, []);

  useEffect(() => {
    const fetchSchoolWiseTotals = async () => {
      try {
        const res = await fetch('/api/schoolwiseorders/aggregate');
        if (res.ok) {
          const json = await res.json();
          setSchoolWiseTotals(json);
        }
      } catch (e) {
        console.error('Failed to load school-wise totals', e);
      }
    };
    fetchSchoolWiseTotals();
  }, []);

  // Map Marathi item name -> Item (Grain).name in master
  const MARATHI_TO_GRAIN: Record<string, string> = {
    'तांदुळ': 'तांदुळ',
    'मुंगदाळ': 'मुंगदाळ',
    'मसूरदाळ': 'मसूरदाळ',
    'तूरदाल': 'तूरदाळ',
    'हरभरा': 'हरभरा',
    'चवळी': 'चवळी',
    'मटकी': 'मटकी',
    'मुंग': 'मुंग',
    'वाटाणा': 'वाटाणा',
    'सोया वडी': 'सोया वडी',
    'मसाला': 'मसाला',
    'सोया तेल': 'सोया तेल',
    'हळद': 'हळद',
    'मीठ': 'मीठ',
    'मोहरी': 'मोहरी',
  };

  function formatDate(dateString: string | undefined | null): string {
    if (!dateString) return 'उपलब्ध नाही';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'उपलब्ध नाही';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Enhanced aggregate stock data by grain and units, including item ID
  const aggregatedStockData = useMemo(() => {
    const stockMap: { [key: string]: AggregatedStock } = {};

    // Initialize from item master
    itemGrains.forEach((item, index) => {
      const key = `${item.name}-${item.Unit}`;
      stockMap[key] = {
        itemId: item.id ?? index + 1,
        grain: item.name,
        units: item.Unit,
        totalQuantity: 0,
      };
    });

    // Sum existing stock rows
    data.forEach(item => {
      const matchingItem = itemGrains.find(g => g.name.toLowerCase().trim() === item.grain.toLowerCase().trim());
      if (matchingItem) {
        const key = `${matchingItem.name}-${matchingItem.Unit}`;
        stockMap[key].totalQuantity += Number(item.weight);
      } else {
        const key = `${item.grain}-${item.units}`;
        if (!stockMap[key]) {
          stockMap[key] = {
            itemId: 0,
            grain: item.grain,
            units: item.units,
            totalQuantity: 0,
          };
        }
        stockMap[key].totalQuantity += Number(item.weight);
      }
    });

    // Merge School-wise Orders aggregate (Marathi JSON keys)
    schoolWiseTotals.forEach(sw => {
      const mappedName = MARATHI_TO_GRAIN[sw.grain] ?? sw.grain; // fall back to the same name
      // Try to find a matching item in master by name
      const matchingItem = itemGrains.find(g => g.name.trim() === mappedName.trim());
      if (matchingItem) {
        const key = `${matchingItem.name}-${matchingItem.Unit}`;
        if (!stockMap[key]) {
          stockMap[key] = {
            itemId: matchingItem.id,
            grain: matchingItem.name,
            units: matchingItem.Unit,
            totalQuantity: 0,
          };
        }
        stockMap[key].totalQuantity += Number(sw.totalQuantity || 0);
      } else {
        // If not in master, still show it
        const key = `${mappedName}-${sw.units || ''}`;
        if (!stockMap[key]) {
          stockMap[key] = {
            itemId: 0,
            grain: mappedName,
            units: sw.units || '',
            totalQuantity: 0,
          };
        }
        stockMap[key].totalQuantity += Number(sw.totalQuantity || 0);
      }
    });

    return Object.values(stockMap);
  }, [data, itemGrains, schoolWiseTotals]);

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

  // Fetch stock data from API
  const fetchStockData = async () => {
    try {
      const response = await fetch('/api/stockinventory');
      if (response.ok) {
        const stockData = await response.json();
        setData(stockData);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to fetch stock data');
    }
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
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

  // Remove the problematic useEffect that interferes with manual calculation
  // useEffect(() => {
  //   // Only auto-calculate if not in edit mode or if totalAmount is empty
  //   if (!isEditMode && weight !== "" && units !== "") {
  //     const calculatedAmount = Number(weight) * 1; // Multiplying by 1 since units is a string (kg/ltr)
  //     setTotalAmount(calculatedAmount);
  //   } else if (isEditMode && weight !== "" && rate !== "" && totalAmount === "") {
  //     // Only calculate if in edit mode and totalAmount is empty
  //     const calculatedAmount = Number(weight) * Number(rate);
  //     setTotalAmount(calculatedAmount);
  //   }
  // }, [weight, units, rate, isEditMode, totalAmount]);

  return (
    <div className="">
      {/* Tab Navigation - Updated with new tabs */}
      <div className="flex border-b border-gray-200 mb-6">
       
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'inventory'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          Stock Inventory
        </button>
        <button
          onClick={() => setActiveTab('addStock')}
          className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'addStock'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          Add Stock
        </button>
        <button
          onClick={() => setActiveTab('stockTransfer')}
          className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'stockTransfer'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          Stock Transfer
        </button>
        <button
          onClick={() => setActiveTab('damageStock')}
          className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'damageStock'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          Damage Stock
        </button>
      </div>

      {/* Tab Content - Updated with new tab content */}
      {activeTab === 'stockTransfer' ? (
        <StockTransfer />
      ) : activeTab === 'damageStock' ? (
        <DamageStock />
      ) : activeTab === 'inventory' ? (
        // Stock Inventory Tab - Read Only
        <div>
          {/* Enhanced Table for Current Stock Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sr
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Item (Grain)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Units
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Quantity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {aggregatedStockData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.grain}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {item.units}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                        {item.totalQuantity.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
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

                <div>
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
      )}
    </div>
  );
};

export default StockInventory;