"use client";

import { useEffect, useMemo, useState } from "react";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import { useToggleContext } from "@/context/ToggleContext";
import { toast } from "react-toastify";

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
};

type FormErrors = Partial<Record<keyof Omit<StockEntry, "id">, string>>;

const StockInventory = () => {
  const { setIsmodelopen, isvalidation, setisvalidation, isEditMode, setIsEditmode } = useToggleContext();

  // Table data
  const [data, setData] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Dropdown masters (static for now; can be fetched later)
  const dealerOptions = useMemo(
    () => [
      { value: "", label: "Select Dealer / Vendor" },
      { value: "Shree Traders", label: "Shree Traders" },
      { value: "Om Agro", label: "Om Agro" },
      { value: "Maheshwari Grain", label: "Maheshwari Grain" },
    ],
    []
  );

  const grainOptions = useMemo(
    () => [
      { value: "", label: "Select Grain" },
      { value: "Wheat", label: "Wheat" },
      { value: "Rice", label: "Rice" },
      { value: "Maize", label: "Maize" },
      { value: "Bajra", label: "Bajra" },
      { value: "Jowar", label: "Jowar" },
      { value: "Pulses", label: "Pulses" },
    ],
    []
  );

  const unitOptions = useMemo(
    () => [
      { value: "", label: "Select Units" },
      { value: "kg", label: "KG" },
      { value: "quintal", label: "Quintal" },
      { value: "ton", label: "Ton" },
      { value: "bags", label: "Bags" },
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
    // Optional fields can be left blank; keep minimal validation
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const newRow: StockEntry = {
        id: editId ?? Date.now(),
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

      if (editId) {
        setData(prev => prev.map(r => (r.id === editId ? newRow : r)));
        toast.success("Stock updated successfully!");
      } else {
        setData(prev => [newRow, ...prev]);
        toast.success("Stock added successfully!");
      }

      resetForm();
      setIsEditmode(false);
      setIsmodelopen(false);
    } catch{
      toast.error("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
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

  const columns: Column<StockEntry>[] = [
    {
      key: "invoiceDate",
      label: "Invoice Date",
      accessor: "invoiceDate",
      render: (row) => <span>{row.invoiceDate || "-"}</span>,
    },
    {
      key: "dealer",
      label: "Dealer / Vendor",
      accessor: "dealer",
      render: (row) => <span>{row.dealer}</span>,
    },
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
      key: "rate",
      label: "Rate",
      accessor: "rate",
      render: (row) => <span>{row.rate ?? "-"}</span>,
    },
    {
      key: "totalAmount",
      label: "Total Amount",
      accessor: "totalAmount",
      render: (row) => <span>{row.totalAmount ?? "-"}</span>,
    },
    {
      key: "ewayBillNo",
      label: "E-Way Bill No",
      accessor: "ewayBillNo",
      render: (row) => <span>{row.ewayBillNo || "-"}</span>,
    },
    {
      key: "billNo",
      label: "Bill No",
      accessor: "billNo",
      render: (row) => <span>{row.billNo || "-"}</span>,
    },
    {
      key: "truckNo",
      label: "Truck No",
      accessor: "truckNo",
      render: (row) => <span>{row.truckNo || "-"}</span>,
    },
    {
      key: "remarks",
      label: "Remarks",
      accessor: "remarks",
      render: (row) => <span className="line-clamp-1">{row.remarks || "-"}</span>,
    },
  ];

  return (
    <div className="">
      <div className="flex justify-end">
        {/* <button
          onClick={handleDownloadExcel}
          className="bg-green-600 text-white py-2 px-4 rounded mb-4 hover:bg-green-700 transition-colors"
        >
          Download Excel
        </button> */}
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
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${error.billNo ? "border-red-500" : ""}`}
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
              />
              {error.billNo && <div className="text-red-500 text-sm mt-1 pl-1">{error.billNo}</div>}
            </div>

            <div>
              <Label>Date of Invoice</Label>
              <input
                type="date"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${error.invoiceDate ? "border-red-500" : ""}`}
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
              {error.invoiceDate && (
                <div className="text-red-500 text-sm mt-1 pl-1">{error.invoiceDate}</div>
              )}
            </div>

            <div>
              <Label>Truck No</Label>
              <input
                type="text"
                placeholder="Enter Truck No"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${error.truckNo ? "border-red-500" : ""}`}
                value={truckNo}
                onChange={(e) => setTruckNo(e.target.value)}
              />
              {error.truckNo && <div className="text-red-500 text-sm mt-1 pl-1">{error.truckNo}</div>}
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
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${error.rate ? "border-red-500" : ""}`}
                value={rate}
                onChange={(e) => setRate(e.target.value === "" ? "" : Number(e.target.value))}
              />
              {error.rate && <div className="text-red-500 text-sm mt-1 pl-1">{error.rate}</div>}
            </div>

            <div>
              <Label>Total Amount</Label>
              <input
                type="number"
                placeholder="Enter Total Amount"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${error.totalAmount ? "border-red-500" : ""}`}
                value={totalAmount}
                onChange={(e) =>
                  setTotalAmount(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              {error.totalAmount && (
                <div className="text-red-500 text-sm mt-1 pl-1">{error.totalAmount}</div>
              )}
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
        columns={columns}
        title="Add Stock"
        filterOptions={[]}
        submitbutton={
          <button
            type="button"
            onClick={handleSave}
            className="bg-blue-700 text-white py-2 p-2 rounded"
            disabled={loading}
          >
            {loading ? "Submitting..." : editId ? "Update" : "Save"}
          </button>
        }
        searchKey="dealer"
      />
    </div>
  );
};

export default StockInventory;