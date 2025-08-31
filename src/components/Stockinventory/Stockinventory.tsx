"use client";

import { useEffect, useMemo, useState } from "react";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import { useToggleContext } from "@/context/ToggleContext";
import { toast } from "react-toastify";
import DefaultModal from "../example/ModalExample/DefaultModal";
import { FaEdit } from "react-icons/fa";
import DatePicker from "../form/date-picker";
import { Withoutbutton } from "../tables/Withoutbutton";

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

type AggregatedStock = {
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

  // Tab state
  const [activeTab, setActiveTab] = useState<'inventory' | 'addStock'>('inventory');

  // Table data
  const [data, setData] = useState<StockEntry[]>(initialStockData || []);
  const [loading, setLoading] = useState(false);

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

  const unitOptions = useMemo(
    () => [
      { value: "", label: "Select Units" },
      { value: "kg", label: "KG" },
      { value: "ltr", label: "Ltr" },
    ],
    []
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

  // Aggregate stock data by grain and units
  const aggregatedStockData = useMemo(() => {
    const aggregated: { [key: string]: AggregatedStock } = {};
    
    data.forEach(item => {
      const key = `${item.grain}-${item.units}`;
      if (!aggregated[key]) {
        aggregated[key] = {
          grain: item.grain,
          units: item.units,
          totalQuantity: 0
        };
      }
      // Sum all quantities for the same grain and units
      aggregated[key].totalQuantity += Number(item.weight);
    });

    return Object.values(aggregated);
  }, [data]);

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
    setTotalAmount(row.totalAmount || "");
    setRemarks(row.remarks || "");
    setIsActive(!isActive);
    setIsmodelopen(true);
    setIsEditmode(true);
  };

  // const handleDownloadExcel = () => {
  //   const exportData = data.map(({...rest }) => rest);
  //   const worksheet = XLSX.utils.json_to_sheet(exportData);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");
  //   const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  //   const file = new Blob([excelBuffer], { type: "application/octet-stream" });
  //   saveAs(file, "stock_inventory.xlsx");
  // };

  // Stock Inventory columns (read-only, aggregated)
  const inventoryColumns: Column<AggregatedStock>[] = [
    {
      key: "grain",
      label: "Item (Grain)",
      accessor: "grain",
      render: (row) => <span>{row.grain}</span>,
    },
    {
      key: "units",
      label: "Units",
      accessor: "units",
      render: (row) => <span>{row.units}</span>,
    },
    {
      key: "totalQuantity",
      label: "Total Quantity",
      accessor: "totalQuantity",
      render: (row) => <span>{row.totalQuantity}</span>,
    },
  ];

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
      render: (row) => <span>{row.invoiceDate || "-"}</span>,
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

  return (
    <div className="">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'inventory'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Stock Inventory
        </button>
        <button
          onClick={() => setActiveTab('addStock')}
          className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'addStock'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Add Stock
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'inventory' ? (
        // Stock Inventory Tab - Read Only
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Current Stock Summary
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total quantities by item (read-only view)
            </p>
          </div>
          
          <Withoutbutton
            data={aggregatedStockData}
            classname={"h-[650px] overflow-y-auto scrollbar-hide"}
            columns={inventoryColumns}
            title="Stock Inventory"
            filterOptions={[]}
            searchKey="grain"
          />
        </div>
      ) : (
        // Add Stock Tab - With Form and Actions
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Add New Stock Entry
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add new stock entries and manage existing ones
            </p>
          </div>

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
                    onChange={(e) => setGrain(e.target.value)}
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
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${error.units ? "border-red-500" : ""}`}
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                  >
                    {unitOptions.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
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
                    onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
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
                    onChange={(e) => setRate(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Total Amount</Label>
                  <input
                    type="number"
                    placeholder="Enter Total Amount"
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90`}
                    value={totalAmount}
                    onChange={(e) =>
                      setTotalAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
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