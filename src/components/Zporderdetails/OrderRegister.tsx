"use client";

import { useEffect, useMemo, useState } from 'react';
import Label from "../form/Label";
import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
import { Modal } from '../ui/modal';
import { ColumnSearchTable } from '../tables/ColumnSearchTable';
import Loader from '../../common/Loader';
import { FaTrash, FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import BreadcrumbsBtn from '../common/BreadcrumbsBtn';

// Types
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

interface ItemsData {
  तांदुळ?: number;
  मुंगदाळ?: number;
  मसूरदाळ?: number;
  तूरदाळ?: number;
  हरभरा?: number;
  चवळी?: number;
  मटकी?: number;
  मूग?: number;
  वाटणा?: number;
  सोया_वडी?: number;
  मसाला?: number;
  सोया_तेल?: number;
  हळद?: number;
  मीठ?: number;
  मोहरी?: number;
  चना?: number;
  जीरा?: number;
  'एकूण वजन'?: number;
}

type ExtendedSWO = SchoolWiseOrder & {
  _isFirstInGroup?: boolean;
  _groupCount?: number;
  _groupKey?: string;
};

const OrderRegisterWithColumnSearch = () => {
  const [loading] = useState(false);
  const [uiBusy] = useState(false);

  // Form fields
  const [selectedOrderFilter, setSelectedOrderFilter] = useState('');

  // Data states
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolWiseOrders, setSchoolWiseOrders] = useState<SchoolWiseOrder[]>([]);

  // Group delete confirm
  const [confirmGroupOpen, setConfirmGroupOpen] = useState(false);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);

  // School details modal state
  const [schoolModalOpen, setSchoolModalOpen] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState<SchoolWiseOrder[]>([]);
  const [selectedGroupMeta, setSelectedGroupMeta] = useState<{
    order_no: string;
    class_range: string;
    no_of_days: number;
    period: string;
    financial_year: string;
    total_schools: number;
  } | null>(null);

  // All grain items for table headers
  const [allGrainItems, setAllGrainItems] = useState<string[]>([]);

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
              if (key !== 'एकूण वजन') { // Exclude total weight as it's already a separate column
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
    fetchSchools();
    fetchSchoolWiseOrders();
  }, []);

  type SWOWithTaluka = SchoolWiseOrder & { 
    taluka: string; 
    _groupKey?: string;
    parsedItems?: ItemsData;
  };

  // Filter data based on selected order filter
  const filteredSchoolWiseOrders = useMemo(() => {
    if (!selectedOrderFilter) return schoolWiseOrders;
    return schoolWiseOrders.filter(order => order.order_no === selectedOrderFilter);
  }, [schoolWiseOrders, selectedOrderFilter]);

  const dataWithTaluka: SWOWithTaluka[] = useMemo(() => {
    if (!filteredSchoolWiseOrders.length) return [];
    return filteredSchoolWiseOrders.map(r => {
      const s = schools.find(sc => sc.schoolid === r.school_id);
      let parsedItems: ItemsData = {};
      try {
        if (r.items_data) {
          parsedItems = JSON.parse(r.items_data);
        }
      } catch (e) {
        console.error('Error parsing items_data:', e);
      }
      return { 
        ...r, 
        taluka: s?.talukaname || '-',
        parsedItems 
      };
    });
  }, [filteredSchoolWiseOrders, schools]);

  // Get unique order numbers for filter dropdown
  const uniqueOrderNumbers = useMemo(() => {
    const orders = schoolWiseOrders.map(order => order.order_no);
    return Array.from(new Set(orders)).sort();
  }, [schoolWiseOrders]);

  // Group data by uniq_id for modal display
  const groupedData = useMemo(() => {
    const groups: Record<string, SchoolWiseOrder[]> = {};
    dataWithTaluka.forEach(item => {
      const key = item.uniq_id || 'default';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    return groups;
  }, [dataWithTaluka]);

  const openGroup = (row: ExtendedSWO) => {
    const key = row._groupKey || row.uniq_id;
    if (key && groupedData[key]) {
      const groupRows = groupedData[key];
      setSelectedGroupData(groupRows);

      // Set group metadata
      if (groupRows.length > 0) {
        const firstRow = groupRows[0];
        setSelectedGroupMeta({
          order_no: firstRow.order_no,
          class_range: firstRow.class_range,
          no_of_days: firstRow.no_of_days,
          period: firstRow.period,
          financial_year: firstRow.financial_year,
          total_schools: groupRows.length
        });
      }

      setSchoolModalOpen(true);
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

  // Export to Excel function for direct download
  const exportGroupToExcel = (row: ExtendedSWO) => {
    const key = row._groupKey || row.uniq_id;
    if (!key || !groupedData[key]) {
      toast.error('No data found to export');
      return;
    }

    const groupRows = groupedData[key];
    if (groupRows.length === 0) {
      toast.error('No data found to export');
      return;
    }

    const firstRow = groupRows[0];
    const groupMeta = {
      order_no: firstRow.order_no,
      class_range: firstRow.class_range,
      no_of_days: firstRow.no_of_days,
      period: firstRow.period,
      financial_year: firstRow.financial_year,
      total_schools: groupRows.length
    };

    try {
      const workbook = XLSX.utils.book_new();

      // Create worksheet data
      const worksheetData = [
        // Headers
        ['Order Details'],
        [`Order No: ${groupMeta.order_no}`],
        [`Class Range: ${groupMeta.class_range}`],
        [`Period: ${groupMeta.period}`],
        [`Financial Year: ${groupMeta.financial_year}`],
        [`No of Days: ${groupMeta.no_of_days}`],
        [`Total Schools: ${groupMeta.total_schools}`],
        [], // Empty row
        // School data headers
        [
          'Sr No', 
          'School Name', 
          'UDISE Code', 
          'Taluka', 
          'Class Range', 
          'Patsankhya',
          ...allGrainItems,
          'Total Weight'
        ]
      ];

      // Add school data rows
      groupRows.forEach((school, index) => {
        const schoolDetails = schools.find(s => s.schoolid === school.school_id);
        const itemsData = parseItemsData(school.items_data);
        
        const rowData = [
          (index + 1).toString(),
          school.schoolname || '',
          school.udaisno || '',
          schoolDetails?.talukaname || '-',
          school.class_range || '',
          (school.patsankhya || 0).toString()
        ];

        // Add grain items data
        allGrainItems.forEach(grain => {
          rowData.push((itemsData[grain as keyof ItemsData] || 0).toString());
        });

        // Add total weight
        rowData.push((school.total_weight || 0).toString());

        worksheetData.push(rowData);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Merge header cells for better formatting
      if (!worksheet['!merges']) worksheet['!merges'] = [];
      const mergeRanges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 + allGrainItems.length } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 + allGrainItems.length } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 6 + allGrainItems.length } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 6 + allGrainItems.length } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 6 + allGrainItems.length } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: 6 + allGrainItems.length } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: 6 + allGrainItems.length } }
      ];
      worksheet['!merges'] = mergeRanges;

      // Set column widths
      const colWidths = [
        { wch: 8 },  // Sr No
        { wch: 30 }, // School Name
        { wch: 15 }, // UDISE Code
        { wch: 20 }, // Taluka
        { wch: 12 }, // Class Range
        { wch: 12 }, // Patsankhya
        ...allGrainItems.map(() => ({ wch: 12 })), // Grain items
        { wch: 15 }  // Total Weight
      ];

      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'School Details');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const fileName = `Order_${groupMeta.order_no}_Class_${groupMeta.class_range}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(data, fileName);

      toast.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel file');
    }
  };

  // Export to Excel function for modal
  const exportToExcel = () => {
    if (!selectedGroupData.length || !selectedGroupMeta) return;

    try {
      const workbook = XLSX.utils.book_new();

      // Create worksheet data
      const worksheetData = [
        ['Order Details'],
        [`Order No: ${selectedGroupMeta.order_no}`],
        [`Class Range: ${selectedGroupMeta.class_range}`],
        [`Period: ${selectedGroupMeta.period}`],
        [`Financial Year: ${selectedGroupMeta.financial_year}`],
        [`No of Days: ${selectedGroupMeta.no_of_days}`],
        [`Total Schools: ${selectedGroupMeta.total_schools}`],
        [],
        [
          'Sr No', 
          'School Name', 
          'UDISE Code', 
          'Taluka', 
          'Class Range', 
          'Patsankhya',
          ...allGrainItems,
          'Total Weight'
        ]
      ];

      // Add school data rows
      selectedGroupData.forEach((school, index) => {
        const schoolDetails = schools.find(s => s.schoolid === school.school_id);
        const itemsData = parseItemsData(school.items_data);
        
        const rowData = [
          (index + 1).toString(),
          school.schoolname || '',
          school.udaisno || '',
          schoolDetails?.talukaname || '-',
          school.class_range || '',
          (school.patsankhya || 0).toString()
        ];

        // Add grain items data
        allGrainItems.forEach(grain => {
          rowData.push((itemsData[grain as keyof ItemsData] || 0).toString());
        });

        // Add total weight
        rowData.push((school.total_weight || 0).toString());

        worksheetData.push(rowData);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      if (!worksheet['!merges']) worksheet['!merges'] = [];
      const mergeRanges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 + allGrainItems.length } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 + allGrainItems.length } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 6 + allGrainItems.length } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 6 + allGrainItems.length } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 6 + allGrainItems.length } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: 6 + allGrainItems.length } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: 6 + allGrainItems.length } }
      ];
      worksheet['!merges'] = mergeRanges;

      const colWidths = [
        { wch: 8 },
        { wch: 30 },
        { wch: 15 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        ...allGrainItems.map(() => ({ wch: 12 })),
        { wch: 15 }
      ];

      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'School Details');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const fileName = `Order_${selectedGroupMeta.order_no}_Class_${selectedGroupMeta.class_range}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(data, fileName);

      toast.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel file');
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
      label: 'Total Schools',
      render: (row) => {
        const r = row as ExtendedSWO;
        if (!r._isFirstInGroup) return null;
        return (
          <div className="flex items-center gap-2">
            <span
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
              onClick={() => openGroup(r)}
            >
              {r._groupCount || 0}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                exportGroupToExcel(r);
              }}
              className="text-green-600 hover:text-green-800"
              title="Export to Excel"
            >
              <FaFileExcel className="text-lg" />
            </button>
          </div>
        );
      }
    },
  ];

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

  // Clear filter function
  const clearFilter = () => {
    setSelectedOrderFilter('');
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Order Register', href: '/orderregister' },
  ];

  return (
    <div className="">
      <div className='mb-6'>
        <BreadcrumbsBtn
          title="Order Register"
          datafiled={<div className="">
            <div>
              <div className="flex gap-2">
                <Label>Order No</Label>
                <select
                  className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  value={selectedOrderFilter}
                  onChange={(e) => setSelectedOrderFilter(e.target.value)}
                >
                  <option value="">All Orders</option>
                  {uniqueOrderNumbers.map((orderNo, index) => (
                    <option key={index} value={orderNo}>
                      {orderNo}
                    </option>
                  ))}
                </select>
                {selectedOrderFilter && (
                  <button
                    onClick={clearFilter}
                    className="h-11 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>}
          breadcrumbs={breadcrumbItems}
        />
      </div>
      {uiBusy && <Loader />}

      <ColumnSearchTable
        data={dataWithTaluka}
        classname={"h-auto overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className="space-y-6">
          </div>
        }
        columns={columns}
        title="Order Details with Column Search"
        filterOptions={[]}
        submitbutton={
          <div className="flex gap-3 items-center">
            <button
              type='button'
              className='bg-blue-700 text-white py-2 px-4 rounded'
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Save'}
            </button>
          </div>
        }
        searchKey="schoolname"
        searchableKeys={['order_no', 'financial_year', 'class_range', 'taluka']}
        groupByKeys={['uniq_id']}
        colspanKeys={['delete', 'uniq_id', 'order_no', 'no_of_days', 'period', 'financial_year', 'taluka', 'class_range', 'total_schools']}
      />

      {/* School Details Modal */}
      <Modal
        isOpen={schoolModalOpen}
        onClose={() => setSchoolModalOpen(false)}
        className="max-w-[95vw] p-6"
      >
        <div className="space-y-6 h-[550px] overflow-y-auto scrollbar-hide">
          <div className="flex justify-between items-center">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              School Details
            </h4>
            <div className="flex gap-3">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors mr-16"
              >
                <FaFileExcel className="text-lg" />
                Export to Excel
              </button>
            </div>
          </div>

          {selectedGroupMeta && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><strong>Order No:</strong> {selectedGroupMeta.order_no}</div>
                <div><strong>Class Range:</strong> {selectedGroupMeta.class_range}</div>
                <div><strong>Period:</strong> {selectedGroupMeta.period}</div>
                <div><strong>Financial Year:</strong> {selectedGroupMeta.financial_year}</div>
                <div><strong>No of Days:</strong> {selectedGroupMeta.no_of_days}</div>
                <div><strong>Total Schools:</strong> {selectedGroupMeta.total_schools}</div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 border-collapse dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sr No
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    School Name
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    UDISE Code
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Taluka
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Class Range
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Patsankhya
                  </th>
                  
                  {/* Dynamic grain items headers */}
                  {allGrainItems.map((grain) => (
                    <th 
                      key={grain} 
                      className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {grain}
                    </th>
                  ))}
                  
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">
                    Total Weight
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {selectedGroupData.map((school, index) => {
                  const schoolDetails = schools.find(s => s.schoolid === school.school_id);
                  const itemsData = parseItemsData(school.items_data);
                  
                  return (
                    <tr key={school.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {school.schoolname}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {school.udaisno}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {schoolDetails?.talukaname || '-'}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {school.class_range}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {school.patsankhya || 0}
                      </td>
                      
                      {/* Dynamic grain items data */}
                      {allGrainItems.map((grain) => (
                        <td 
                          key={grain} 
                          className="border border-gray-300 dark:border-gray-600 px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                        >
                          {itemsData[grain as keyof ItemsData] || 0}
                        </td>
                      ))}
                      
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        {school.total_weight}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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

export default OrderRegisterWithColumnSearch;