"use client";

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

import Label from "../form/Label";
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { useToggleContext } from '@/context/ToggleContext';
import { Modal } from '../ui/modal';
import { Schoolwisetable } from '../tables/Schoolwisetable';
import Loader from '../../common/Loader';
import { FaTrash } from 'react-icons/fa';

// Types
interface ZPOrderDetail {
  id: number;
  order_no: string;
  no_of_days: number;
  period: string;
  financial_year: string;
  status: string;
}

interface School {
  id: number;
  schoolid: number;
  name: string;
  schoolname: string;
  udaisno: string;
  status: string;
  center?: number;
  centername?: string;
  talukaname?: string;
}

interface SchoolWiseOrder {
  id: number;
  order_id: number;
  school_id: number;
  class_range: string;
  items_data: string;
  total_weight: number;
  order_no: string;
  no_of_days: number;
  period: string;
  financial_year: string;
  schoolname: string;
  udaisno: string;
  patsankhya?: number;
  status: string;
  created_at: string;
  uniq_id?: string;
}

type FormErrors = {
  orderNo?: string;
  selectedClass?: string;
  file?: string;
};

type ExtendedSWO = SchoolWiseOrder & {
  _isFirstInGroup?: boolean;
  _groupCount?: number;
  _groupKey?: string;
};

interface ParsedExcelRow {
  _schoolName: string;
  _udise: string;
  _centerName: string;
  _classRange: string;
  _patSankhya: number;
  _totalWeight: number;
  _items: Record<string, number>;
}

interface ItemsData {
  [key: string]: number;
}

const AddSchoolswiseorder = () => {
  const { isEditMode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState<FormErrors>({});
  const [editId, setEditId] = useState<number | null>(null);

  // Global UI busy (overlay loader)
  const [uiBusy, setUiBusy] = useState(false);
  
  // Form fields
  const [orderNo, setOrderNo] = useState('');
  const [noOfDays, setNoOfDays] = useState<number | null>(null);
  const [period, setPeriod] = useState('');
  const [financialYear, setFinancialYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ParsedExcelRow[]>([]);

  // Data states
  const [zpOrders, setZpOrders] = useState<ZPOrderDetail[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolWiseOrders, setSchoolWiseOrders] = useState<SchoolWiseOrder[]>([]);

  // Group modal state
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupRows, setGroupRows] = useState<SchoolWiseOrder[]>([]);
  const [groupMeta, setGroupMeta] = useState<{
    order_no: string;
    class_range: string;
    no_of_days: number;
    period: string;
    financial_year: string;
  } | null>(null);

  // All grain items for table headers
  const [allGrainItems, setAllGrainItems] = useState<string[]>([]);

  // Group delete confirm
  const [confirmGroupOpen, setConfirmGroupOpen] = useState(false);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);

  const openGroup = (row: (SchoolWiseOrder & { _groupKey?: string; _groupCount?: number })) => {
    const key = row._groupKey;

    // If grouped by uniq_id, _groupKey is the uniq_id
    if (key && key.length > 0) {
      const rows = schoolWiseOrders.filter(r => (r).uniq_id === key);
      setGroupRows(rows);

      const metaSource = rows[0] || row;
      setGroupMeta({
        order_no: metaSource.order_no,
        class_range: metaSource.class_range,
        no_of_days: metaSource.no_of_days,
        period: metaSource.period,
        financial_year: metaSource.financial_year,
      });
      setGroupOpen(true);
      return;
    }

    // Fallback: old key format order_no|class_range|taluka
    const fallbackKey = `${row.order_no}|${row.class_range}`;
    const [order_no, class_range, taluka] = (row._groupKey || fallbackKey).split("|");
    const rows = schoolWiseOrders.filter(r => {
      const basicMatch = r.order_no === (order_no || row.order_no) && r.class_range === (class_range || row.class_range);
      if (!taluka) return basicMatch;
      const s = schools.find(sc => sc.schoolid === r.school_id);
      return basicMatch && (s?.talukaname || '-') === taluka;
    });
    setGroupRows(rows);
    setGroupMeta({
      order_no: order_no || row.order_no,
      class_range: class_range || row.class_range,
      no_of_days: row.no_of_days,
      period: row.period,
      financial_year: row.financial_year,
    });
    setGroupOpen(true);
  };

  // Fetch ZP Orders
  const fetchZpOrders = async () => {
    try {
      const response = await fetch('/api/zporderdetails');
      const data = await response.json();
      setZpOrders(data);
    } catch (error) {
      console.error('Error fetching ZP orders:', error);
      toast.error('Failed to fetch order details');
    }
  };

  type SWOWithTaluka = SchoolWiseOrder & { taluka: string; _groupKey?: string };

  const dataWithTaluka: SWOWithTaluka[] = useMemo(() => {
    if (!schoolWiseOrders.length) return [];
    return schoolWiseOrders.map(r => {
      const s = schools.find(sc => sc.schoolid === r.school_id);
      return { ...r, taluka: s?.talukaname || '-' };
    });
  }, [schoolWiseOrders, schools]);

  // Fetch Schools
  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/scooldata');
      const data = await response.json();
      setSchools(data);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('Failed to fetch school data');
    }
  };

  // Fetch School Wise Orders
  const fetchSchoolWiseOrders = async () => {
    try {
      const response = await fetch('/api/schoolwiseorders');
      const data = await response.json();
      setSchoolWiseOrders(data);
      
      // Extract all grain items from items_data
      const grainItemsSet = new Set<string>();
      data.forEach((order: SchoolWiseOrder) => {
        if (order.items_data) {
          try {
            const itemsData: ItemsData = JSON.parse(order.items_data);
            Object.keys(itemsData).forEach(key => {
              if (key !== 'एकूण वजन') {
                grainItemsSet.add(key);
              }
            });
          } catch (e) {
            console.error('Error parsing items_data:', e);
          }
        }
      });
      
      // Convert set to array and set state
      setAllGrainItems(Array.from(grainItemsSet));
    } catch (error) {
      console.error('Error fetching school-wise orders:', error);
      toast.error('Failed to fetch school-wise orders');
    }
  };

  useEffect(() => {
    fetchZpOrders();
    fetchSchools();
    fetchSchoolWiseOrders();
  }, []);

  // Order number options
  const orderNoOptions = useMemo(() => {
    const options = [{ value: '', label: 'Select Order Number' }];
    zpOrders.forEach(order => {
      options.push({
        value: order.id.toString(),
        label: `${order.order_no} (${order.financial_year})`
      });
    });
    return options;
  }, [zpOrders]);

  // Handle order number selection
  const handleOrderChange = (orderId: string) => {
    setOrderNo(orderId);
    if (orderId) {
      const selectedOrder = zpOrders.find(order => order.id.toString() === orderId);
      if (selectedOrder) {
        setNoOfDays(selectedOrder.no_of_days);
        setPeriod(selectedOrder.period);
        setFinancialYear(selectedOrder.financial_year);
      }
    } else {
      setNoOfDays(null);
      setPeriod('');
      setFinancialYear('');
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is Excel
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!['xlsx', 'xls'].includes(fileExtension || '')) {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        return;
      }

      setSelectedFile(file);
      parseExcelFile(file);
    }
  };

  // Parse Excel file
  const parseExcelFile = (file: File) => {
    setUiBusy(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

        // Normalize header keys: remove only trailing spaces from each key
        const rowsNormalized = raw.map((r) => {
          const out: Record<string, unknown> = {};
          Object.entries(r).forEach(([k, v]) => {
            const trimmedKey = String(k).replace(/\s+$/, "");
            out[trimmedKey] = v;
          });
          return out;
        });

        const norm = (s: unknown) => String(s ?? "").trim();
        const num = (v: unknown) => {
          const n = Number(String(v ?? "").toString().replace(/[, ]+/g, ''));
          return isNaN(n) ? 0 : n;
        };
        const pick = (row: Record<string, unknown>, keys: string[]) => {
          for (const k of keys) {
            const v = row[k];
            if (v !== undefined && v !== null && String(v).trim() !== "") return v;
          }
          return undefined;
        };

        const normalized: ParsedExcelRow[] = rowsNormalized.map((r): ParsedExcelRow => {
          const schoolName = pick(r, ['School Name', 'शाळा', 'विद्यालय नाव']);
          const udise = pick(r, ['UDISE Code', 'यूडीएआयएस', 'UDISE', 'UDISE No', 'UDAIS']);
          const centerName = pick(r, ['केंद्र', 'Center']);
          const classRange = pick(r, ['वर्ग', 'Class']);
          const patSankhya = pick(r, ['पट संख्या', 'पटसंख्या', 'पट. संख्या']);

          const items: Record<string, number> = {
            'तांदुळ': num(pick(r, ['तांदुळ'])),
            'मुंगदाळ': num(pick(r, ['मुंगदाळ'])),
            'मसूरदाळ': num(pick(r, ['मसूरदाळ'])),
            'तूरदाळ': num(pick(r, ['तूरदाळ', 'तूरदाल'])),
            'हरभरा': num(pick(r, ['हरभरा'])),
            'चवळी': num(pick(r, ['चवळी'])),
            'मटकी': num(pick(r, ['मटकी'])),
            'मुग': num(pick(r, ['मुग'])),
            'वाटाणा': num(pick(r, ['वाटाणा', 'वाटाणा'])),
            'सोया वडी': num(pick(r, ['सोया वडी'])),
            'मसाला': num(pick(r, ['मसाला'])),
            'सोया तेल': num(pick(r, ['सोया तेल'])),
            'हळद': num(pick(r, ['हळद'])),
            'मीठ': num(pick(r, ['मीठ'])),
            'मोहरी': num(pick(r, ['मोहरी'])),
            'चना': num(pick(r, ['चना'])),
            'जीरा': num(pick(r, ['जीरा'])),
          };

          const providedTotal = num(pick(r, ['एकूण वजन', 'एकुण वजन']));
          const computedTotal = Object.values(items).reduce((sum, v) => sum + (Number(v) || 0), 0);
          const total_weight = providedTotal > 0 ? providedTotal : computedTotal;

          return {
            _schoolName: norm(schoolName),
            _udise: norm(udise),
            _centerName: norm(centerName),
            _classRange: norm(classRange),
            _patSankhya: num(patSankhya),
            _totalWeight: total_weight,
            _items: items,
          };
        });

        setExcelData(normalized);

        // Generate and store a group uniq ID for this Excel import
        const newGroupId = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
        fetch('/api/uniqid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_id: newGroupId,
            meta: { sheetName, rows: normalized.length }
          }),
        }).catch(() => { });

        toast.success(`Excel file loaded successfully. Found ${normalized.length} rows.`);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        toast.error('Error parsing Excel file. Please check the format.');
      } finally {
        setUiBusy(false);
      }
    };
    reader.onerror = () => setUiBusy(false);
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (!isvalidation) setErrors({});
  }, [isvalidation]);

  const reset = () => {
    setOrderNo('');
    setNoOfDays(null);
    setPeriod('');
    setFinancialYear('');
    setSelectedClass('');
    setSelectedFile(null);
    setExcelData([]);
    setEditId(null);
  };

  useEffect(() => {
    if (!isEditMode) reset();
  }, [isEditMode]);

  const validateInputs = () => {
    const newErrors: FormErrors = {};
    setisvalidation(true);

    if (!orderNo) newErrors.orderNo = "Order number is required";
    const hasClassInExcel = excelData.some((r) => r._classRange);
    if (!selectedClass && !hasClassInExcel) newErrors.selectedClass = "Class selection is required (in dropdown or Excel)";
    if (!selectedFile && excelData.length === 0) newErrors.file = "Excel file is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Download failed rows as Excel with reason
  const downloadFailedRows = (failed: Array<{
    _schoolName: string;
    _udise: string;
    _centerName: string;
    _classRange: string;
    _patSankhya: number;
    _totalWeight: number;
    _items: Record<string, number>;
    reason: string;
  }>) => {
    if (!failed.length) return;
    const rows = failed.map(r => ({
      'School Name': r._schoolName || '',
      'UDISE': r._udise || '',
      'Center': r._centerName || '',
      'Class': r._classRange || '',
      'Patsankhya': r._patSankhya || 0,
      'Total Weight': r._totalWeight || 0,
      'Reason': r.reason || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Rows');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed_schoolwise_rows_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    setUiBusy(true);

    try {
      const orderId = parseInt(orderNo);

      const failedRows: Array<ParsedExcelRow & { reason: string }> = [];
      let successCount = 0;

      for (const row of excelData) {
        const udise = row._udise.trim();
        const rowSchoolName = row._schoolName.trim();
        const rowCenterName = row._centerName.trim();
        const rowClass = (row._classRange || selectedClass || '').trim();

        // Validate class present
        if (!rowClass) {
          failedRows.push({ ...row, reason: 'Class missing (neither in Excel nor selected)' });
          continue;
        }

        // Try to locate school by UDISE or Name(+Center)
        let school = udise
          ? schools.find(s => String(s.udaisno || '').trim() === udise)
          : undefined;

        if (!school && rowSchoolName) {
          school = schools.find(s => {
            const byName = String(s.schoolname || '').trim().toLowerCase() === rowSchoolName.toLowerCase();
            if (!byName) return false;
            if (rowCenterName && s.centername) {
              return String(s.centername).trim() === rowCenterName;
            }
            return true;
          });
        }

        if (!school) {
          failedRows.push({ ...row, reason: udise ? `School not found for UDISE ${udise}` : 'School not found by name/center' });
          continue;
        }

        const itemsData: ItemsData = { ...row._items };
        const totalWeight = row._totalWeight || 0;

        const payload = {
          order_id: orderId,
          school_id: school.schoolid,
          class_range: rowClass,
          items_data: itemsData,
          total_weight: totalWeight,
          patsankhya: row._patSankhya || 0,
          ...(editId && { id: editId })
        };
        const url = '/api/schoolwiseorders';
        const method = editId ? 'PUT' : 'POST';

        try {
          const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            let reason = `API ${method} failed (${response.status})`;
            try {
              const j = await response.json();
              if (j?.error) reason = j.error;
              if (j?.message) reason = j.message;
            } catch { }
            failedRows.push({ ...row, reason });
            continue;
          }

          successCount += 1;
        } catch (e) {
          console.log(e);
          continue;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} row(s) saved successfully.`);
      }
      if (failedRows.length > 0) {
        toast.warn(`${failedRows.length} row(s) failed. Downloading failure report...`);
        downloadFailedRows(failedRows);
      }

      if (successCount > 0) {
        reset();
        setEditId(null);
        fetchSchoolWiseOrders();
      }
    } catch (error) {
      console.error('Error saving orders:', error);
      toast.error(editId ? 'Failed to update. Please try again.' : 'Failed to create. Please try again.');
    } finally {
      setLoading(false);
      setUiBusy(false);
      setIsmodelopen(false);
    }
  };

  const confirmGroupDelete = async () => {
    if (!pendingGroupId) return;
    try {
      const res = await fetch('/api/schoolwiseorders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniq_id: pendingGroupId, status: 'Inactive' }),
      });
      if (!res.ok) throw new Error('Failed to delete group');
      toast.success('Group deleted (soft) successfully');
      await fetchSchoolWiseOrders();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete group');
    } finally {
      setConfirmGroupOpen(false);
      setPendingGroupId(null);
    }
  };

  // Parse items data function
  const parseItemsData = (itemsData: string): ItemsData => {
    try {
      return JSON.parse(itemsData);
    } catch (e) {
      console.error('Error parsing items_data:', e);
      return {};
    }
  };

  const columns: Column<SWOWithTaluka>[] = [
    {
      key: 'delete',
      label: 'Action',
      render: (row) => {
        const r = row as ExtendedSWO;
        if (!r._isFirstInGroup) return null;
        const gkey = r._groupKey || (row).uniq_id || '';
        const first = dataWithTaluka.find(d => ((d._groupKey || d.uniq_id || '') === gkey)) as SchoolWiseOrder | undefined;
        const uid = (first && (first).uniq_id) || (row).uniq_id || null;
        return (
          <button
            type="button"
            className="text-red-600 hover:text-red-800 underline"
            onClick={() => {
              if (uid) {
                setPendingGroupId(uid as string);
                setConfirmGroupOpen(true);
              }
            }}
          >
            <FaTrash />
          </button>
        );
      }
    },

    { key: 'order_no', label: 'Order No', accessor: 'order_no', render: (row) => <span>{row.order_no}</span> },
    { key: 'no_of_days', label: 'No of Days', accessor: 'no_of_days', render: (row) => <span>{row.no_of_days}</span> },
    { key: 'period', label: 'Period', accessor: 'period', render: (row) => <span>{row.period}</span> },
    { key: 'financial_year', label: 'Year', accessor: 'financial_year', render: (row) => <span>{row.financial_year}</span> },
    { key: 'taluka', label: 'Taluka', accessor: 'taluka', render: (row) => <span>{(row as SWOWithTaluka).taluka}</span> },
    { key: 'class_range', label: 'Class', accessor: 'class_range', render: (row) => <span>{row.class_range}</span> },
    {
      key: 'total_schools',
      label: 'Total Number of Schools',
      render: (row) => {
        const r = row as ExtendedSWO;
        if (!r._isFirstInGroup) return null;
        return <span className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
          onClick={() => openGroup(r)}>{r._groupCount || 0}</span>;
      }
    },
  ];

  return (
    <div className="">
      {uiBusy && <Loader />}

      <Schoolwisetable
        data={dataWithTaluka}
        classname={"h-auto overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className="space-y-6">
            {/* First row - 3 fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
              <div>
                <Label>Select Order Number</Label>
                <select
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.orderNo ? "border-red-500" : ""}`}
                  value={orderNo}
                  onChange={(e) => handleOrderChange(e.target.value)}
                >
                  {orderNoOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {error.orderNo && <div className="text-red-500 text-sm mt-1 pl-1">{error.orderNo}</div>}
              </div>

              {orderNo && (
                <>
                  <div>
                    <Label>No of Days</Label>
                    <input
                      type="number"
                      value={noOfDays || ''}
                      disabled
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-gray-100 text-gray-600 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white/70"
                    />
                  </div>
                  <div>
                    <Label>Period</Label>
                    <input
                      type="text"
                      value={period}
                      disabled
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-gray-100 text-gray-600 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white/70"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Second row - 3 fields in flex */}
            <div className="flex flex-col sm:flex-row gap-x-6 gap-y-5">
              <div className="flex-1">
                <Label>Financial Year</Label>
                <input
                  type="text"
                  value={financialYear}
                  disabled
                  className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-gray-100 text-gray-600 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white/70"
                />
              </div>
              <div className="flex-1">
                <Label>वर्ग (Class)</Label>
                <select
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.selectedClass ? "border-red-500" : ""}`}
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">Select Class</option>
                  <option value="1-5">1-5</option>
                  <option value="6-8">6-8</option>
                </select>
                {error.selectedClass && <div className="text-red-500 text-sm mt-1 pl-1">{error.selectedClass}</div>}
              </div>
              <div className="flex-1">
                <Label>Excel File</Label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.file ? "border-red-500" : ""}`}
                />
                {error.file && <div className="text-red-500 text-sm mt-1 pl-1">{error.file}</div>}
                {selectedFile && (
                  <div className="text-green-600 text-sm mt-1 pl-1">
                    Selected: {selectedFile.name} ({excelData.length} rows)
                  </div>
                )}
              </div>
            </div>
          </div>
        }
        columns={columns}
        title="Add Schools Wise Order Details"
        filterOptions={[]}
        submitbutton={
          <div className="flex gap-3 items-center">
            <button
              type='button'
              onClick={handleSave}
              className='bg-blue-700 text-white py-2 px-4 rounded'
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Save'}
            </button>
            <a
              href="/excel/sample_school_wise_order.xlsx"
              download="sample_school_wise_order.xlsx"
              className="inline-flex items-center gap-2 px-2 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Sample
            </a>
          </div>
        }
        searchKey="schoolname"
        groupByKeys={['uniq_id']}
        colspanKeys={['delete', 'uniq_id', 'order_no', 'no_of_days', 'period', 'financial_year', 'taluka', 'class_range', 'total_schools']}
      />

      {/* Group Details Modal with All Grain Items */}
      <Modal
        isOpen={groupOpen}
        onClose={() => setGroupOpen(false)}
        className="max-w-[95vw] p-6"
      >
        {groupMeta && (
          <div className="space-y-4 h-[550px] overflow-y-auto scrollbar-hide">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Order {groupMeta.order_no} • Class {groupMeta.class_range}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
              <div><span className="font-medium text-gray-600 dark:text-white/70">No. of Days: </span>{groupMeta.no_of_days}</div>
              <div><span className="font-medium text-gray-600 dark:text-white/70">Period: </span>{groupMeta.period}</div>
              <div><span className="font-medium text-gray-600 dark:text-white/70">Year: </span>{groupMeta.financial_year}</div>
              <div><span className="font-medium text-gray-600 dark:text-white/70">Total Schools: </span>{groupRows.length}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left border border-gray-200 dark:border-gray-700 w-10">Sr</th>
                    <th className="px-3 py-2 text-left border border-gray-200 dark:border-gray-700">School Name</th>
                    <th className="px-3 py-2 text-left border border-gray-200 dark:border-gray-700">UDAIS No</th>
                    <th className="px-3 py-2 text-right border border-gray-200 dark:border-gray-700">Patsankhya</th>
                    
                    {/* Dynamic grain items headers */}
                    {allGrainItems.map((grain) => (
                      <th 
                        key={grain} 
                        className="px-3 py-2 text-right border border-gray-200 dark:border-gray-700"
                      >
                        {grain}
                      </th>
                    ))}
                    
                    <th className="px-3 py-2 text-right border border-gray-200 dark:border-gray-700">Total Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {groupRows.map((r, idx) => {
                    const itemsData = parseItemsData(r.items_data);
                    return (
                      <tr key={r.id}>
                        <td className="px-3 py-2 border border-gray-200 dark:border-gray-700">{idx + 1}</td>
                        <td className="px-3 py-2 border border-gray-200 dark:border-gray-700">{r.schoolname}</td>
                        <td className="px-3 py-2 border border-gray-200 dark:border-gray-700">{r.udaisno}</td>
                        <td className="px-3 py-2 text-right border border-gray-200 dark:border-gray-700">{r.patsankhya ?? '-'}</td>
                        
                        {/* Dynamic grain items data */}
                        {allGrainItems.map((grain) => (
                          <td 
                            key={grain} 
                            className="px-3 py-2 text-right border border-gray-200 dark:border-gray-700"
                          >
                            {itemsData[grain] || 0}
                          </td>
                        ))}
                        
                        <td className="px-3 py-2 text-right border border-gray-200 dark:border-gray-700">{r.total_weight} kg</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmGroupOpen}
        onClose={() => { setConfirmGroupOpen(false); setPendingGroupId(null); }}
        className="max-w-[480px] p-6"
      >
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Confirmation</h4>
          <p className="text-sm text-gray-600 dark:text-white/70">
            Delete all rows for this group?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setConfirmGroupOpen(false); setPendingGroupId(null); }}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={confirmGroupDelete}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddSchoolswiseorder;