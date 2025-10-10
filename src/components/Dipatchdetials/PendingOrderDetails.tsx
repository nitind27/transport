"use client";

import { useEffect, useMemo, useState } from 'react';
// import { Column } from "../tables/tabletype";
import { toast } from 'react-toastify';
// import { ColumnSearchTable } from '../tables/ColumnSearchTable';
import Loader from '@/common/Loader';
import React from 'react'; // Added missing import for React

interface SchoolWiseOrder {
  id: number;
  order_id: number;
  school_id: number;
  items_data: string | Record<string, number>;
  total_weight: number;
  order_no: string;
  no_of_days: number;
  period: string;
  financial_year: string;
  schoolname: string;
  udaisno: string;
  status: string;
  created_at: string;
  class_range?: string;
  patsankhya?: number;
  is_dispatched?: boolean | 0; // Added is_dispatched field
}

interface TalukaRow {
  taluka_id: number;
  name: string;
  name_en?: string;
  dist_id?: number;
  status?: string;
}

interface CenterRow {
  center_id: number;
  name: string;
  marathi_name?: string;
  status?: string;
  taluka_id?: number;
}

// interface ItemGrain {
//   id: number;
//   name: string;
//   Unit: string;
// }

interface SchoolDataRow {
  schoolid: number;
  center: number;
  taluka_id: number;
  schoolname: string;
  udaisno: string;
}

interface TruckData {
  id: number;
  truckNo: string;
  status: string;
}

type SchoolDataApiRow = {
  schoolid: number | string;
  center: number | string | null;
  taluka_id: number | string | null;
  schoolname?: string | null;
  udaisno?: string | null;
};

type PendingOrderRow = {
  id: number;
  order_id: number;
  school_id: number;
  order_no: string;
  schoolname: string;
  udaisno: string;
  taluka_name: string;
  center_name: string;
  class_range: string;
  patsankhya: number;
  period: string;
  financial_year: string;
  no_of_days: number;
  total_weight: number;
  items_count: number;
  items_data: Record<string, number>;
  center_id: number;
  taluka_id: number;
};

type DispatchCartItem = {
  id: number;
  order_id: number;
  school_id: number;
  order_no: string;
  schoolname: string;
  udaisno: string;
  taluka_name: string;
  center_name: string;
  class_range: string;
  patsankhya: number;
  period: string;
  financial_year: string;
  no_of_days: number;
  total_weight: number;
  items_data: Record<string, number>;
  center_id: number;
  taluka_id: number;
};

const PendingOrderDetails = () => {
  const [loading, setLoading] = useState(true);

  // Masters
  const [talukaList, setTalukaList] = useState<TalukaRow[]>([]);
  const [centerList, setCenterList] = useState<CenterRow[]>([]);
  // const [itemGrains, setItemGrains] = useState<ItemGrain[]>([]);
  const [schoolWiseOrders, setSchoolWiseOrders] = useState<SchoolWiseOrder[]>([]);
  const [schoolDataById, setSchoolDataById] = useState<Map<number, SchoolDataRow>>(new Map());
  const [truckData, setTruckData] = useState<TruckData[]>([]);

  // Dispatch cart state
  const [dispatchCart, setDispatchCart] = useState<DispatchCartItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showTruckModal, setShowTruckModal] = useState(false);
  const [selectedTruckId, setSelectedTruckId] = useState<string>('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Add this state for the correct pending schools count
  const [pendingSchoolsCount, setPendingSchoolsCount] = useState(0);

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // Show 50 schools per page

  // Grain columns definition (same as route paper)
  const mrGrainColumns = [
    { key: 'तांदुळ', aliases: ['तांदुळ', 'rice', 'चावल'] },
    { key: 'मुगदाळ', aliases: ['मुगदाळ', 'मुग डाळ', 'moong dal', 'मूगडाळ'] },
    { key: 'मसूरदाळ', aliases: ['मसूरदाळ', 'मसूर डाळ', 'masoor dal'] },
    { key: 'तूरदाळ', aliases: ['तूरदाळ', 'तूर डाळ', 'toor dal', 'अरहर'] },
    { key: 'हरभरा', aliases: ['हरभरा', 'चना', 'chana', 'gram'] },
    { key: 'चवळी', aliases: ['चवळी', 'chawli', 'लोबिया'] },
    { key: 'मटकी', aliases: ['मटकी', 'matki', 'मोठ'] },
    { key: 'मूग', aliases: ['मूग', 'moong', 'मुग'] },
    { key: 'वाटणा', aliases: ['वाटणा', 'vatana', 'हरभरा'] },
    { key: 'सोया वडी', aliases: ['सोया वडी', 'soya vadi', 'सोया_वडी'] },
    { key: 'मसाला', aliases: ['मसाला', 'masala', 'spice'] },
    { key: 'सोया तेल', aliases: ['सोया तेल', 'soya oil', 'सोया_तेल'] },
    { key: 'हळद', aliases: ['हळद', 'haldi', 'turmeric'] },
    { key: 'मीठ', aliases: ['मीठ', 'meeth', 'salt'] },
    { key: 'मोहरी', aliases: ['मोहरी', 'mohari', 'mustard'] },
    { key: 'चना', aliases: ['चना', 'chana', 'gram'] },
    { key: 'जीरा', aliases: ['जीरा', 'jeera', 'cumin'] },
  ];

  // Map items → per-group grain totals using aliases
  const sumGrainsForGroup = (items: Record<string, number>) => {
    const sums: Record<string, number> = {};
    Object.entries(items).forEach(([name, qty]) => {
      const nm = (name || '').toLowerCase().trim();
      const match = mrGrainColumns.find(c => c.aliases.some(a => nm.includes(a.toLowerCase())));
      const key = match ? match.key : name;
      sums[key] = (sums[key] || 0) + Number(qty || 0);
    });
    return sums;
  };

  // Get UDISE by school ID
  const getUdiseBySchool = (schoolId: number) => {
    const sd = schoolDataById.get(schoolId);
    return sd?.udaisno || '';
  };

  // Fix the pendingOrdersData processing to show ONLY pending schools
  const pendingOrdersData = useMemo(() => {
    // Filter out ONLY dispatched schools - show only pending schools
    const pendingOrders = schoolWiseOrders.filter(order =>
      order.is_dispatched === 0 || order.is_dispatched === false
    );

    // Group by school and process data
    const schoolGroups = new Map<number, SchoolWiseOrder[]>();
    pendingOrders.forEach(order => {
      if (!schoolGroups.has(order.school_id)) {
        schoolGroups.set(order.school_id, []);
      }
      schoolGroups.get(order.school_id)!.push(order);
    });

    const processedData: PendingOrderRow[] = [];

    schoolGroups.forEach((orders, schoolId) => {
      const firstOrder = orders[0];
      const sd = schoolDataById.get(schoolId);
      const talukaName = sd ? (talukaList.find(t => t.taluka_id === sd.taluka_id)?.name || '') : '';
      const centerName = sd ? (centerList.find(c => String(c.center_id) === String(sd.center))?.marathi_name || '') : '';

      // Group orders by class range to create separate rows
      const classRangeGroups = new Map<string, SchoolWiseOrder[]>();
      orders.forEach(order => {
        const classRange = order.class_range || 'Unknown';
        if (!classRangeGroups.has(classRange)) {
          classRangeGroups.set(classRange, []);
        }
        classRangeGroups.get(classRange)!.push(order);
      });

      // Create separate row for each class range
      classRangeGroups.forEach((classOrders, classRange) => {
        // Create unique key for this school + class range combination
        const uniqueKey = `${schoolId}_${classRange}`;

        // Skip if this specific school + class range is already in cart
        if (dispatchCart.some(item => `${item.school_id}_${item.class_range}` === uniqueKey)) {
          return;
        }

        // Combine items from orders in this class range only
        const combinedItems: Record<string, number> = {};
        let totalWeight = 0;
        let totalPatsankhya = 0;

        classOrders.forEach(order => {
          const items = typeof order.items_data === 'string'
            ? JSON.parse(order.items_data)
            : (order.items_data || {});

          Object.entries(items).forEach(([itemName, qty]) => {
            combinedItems[itemName] = (combinedItems[itemName] || 0) + Number(qty);
          });

          totalWeight += Number(order.total_weight || 0);
          totalPatsankhya += Number(order.patsankhya || 0);
        });

        processedData.push({
          id: firstOrder.id,
          order_id: firstOrder.order_id,
          school_id: schoolId,
          order_no: firstOrder.order_no,
          schoolname: firstOrder.schoolname,
          udaisno: firstOrder.udaisno,
          taluka_name: talukaName,
          center_name: centerName,
          class_range: classRange,
          patsankhya: totalPatsankhya,
          period: firstOrder.period,
          financial_year: firstOrder.financial_year,
          no_of_days: firstOrder.no_of_days,
          total_weight: totalWeight,
          items_count: Object.keys(combinedItems).length,
          items_data: combinedItems,
          center_id: sd?.center || 0,
          taluka_id: sd?.taluka_id || 0
        });
      });
    });

    return processedData.sort((a, b) => {
      // Sort by school name first, then by class range
      const schoolCompare = a.schoolname.localeCompare(b.schoolname);
      if (schoolCompare !== 0) return schoolCompare;
      return a.class_range.localeCompare(b.class_range);
    });
  }, [schoolWiseOrders, schoolDataById, talukaList, centerList, dispatchCart]);

  // Calculate pagination
  const totalPages = Math.ceil(pendingOrdersData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = pendingOrdersData.slice(startIndex, endIndex);

  // Update the count calculation to use the filtered data
  // Remove the uniqueSchoolsCount useMemo (lines 268-277) since we're using the API count
  // Keep only the pendingSchoolsCount from the API

  // Add to dispatch cart
  const addToDispatchCart = (row: PendingOrderRow) => {
    const cartItem: DispatchCartItem = {
      id: row.id,
      order_id: row.order_id,
      school_id: row.school_id,
      order_no: row.order_no,
      schoolname: row.schoolname,
      udaisno: row.udaisno,
      taluka_name: row.taluka_name,
      center_name: row.center_name,
      class_range: row.class_range,
      patsankhya: row.patsankhya,
      period: row.period,
      financial_year: row.financial_year,
      no_of_days: row.no_of_days,
      total_weight: row.total_weight,
      items_data: row.items_data,
      center_id: row.center_id,
      taluka_id: row.taluka_id
    };

    setDispatchCart(prev => [...prev, cartItem]);
    toast.success('Added to dispatch cart');
  };

  // Remove from dispatch cart - now removes specific school + class range combination
  const removeFromDispatchCart = (schoolId: number, classRange: string) => {
    setDispatchCart(prev => prev.filter(item =>
      !(item.school_id === schoolId && item.class_range === classRange)
    ));
    toast.success('Removed from dispatch cart');
  };

  // Submit dispatch
  const submitDispatch = async () => {
    if (dispatchCart.length === 0) {
      toast.error('No items in dispatch cart');
      return;
    }

    if (!selectedTruckId) {
      toast.error('Please select a truck');
      return;
    }

    try {
      setLoading(true);

      // Group by order_id for dispatch
      const orderGroups = new Map<number, DispatchCartItem[]>();
      dispatchCart.forEach(item => {
        if (!orderGroups.has(item.order_id)) {
          orderGroups.set(item.order_id, []);
        }
        orderGroups.get(item.order_id)!.push(item);
      });

      // Submit each order group
      for (const [orderId, items] of orderGroups) {
        const firstItem = items[0];

        // Convert items_data to lines format
        const lines = Object.entries(firstItem.items_data).map(([grain, totalQty]) => ({
          grain,
          unit: 'kg', // Default unit
          totalQty: Number(totalQty),
          qtyDispatch: Number(totalQty) // Dispatch full quantity
        }));

        const payload = {
          order_id: orderId,
          school_id: firstItem.school_id,
          center_id: firstItem.center_id,
          truck_id: Number(selectedTruckId),
          class_range: firstItem.class_range,
          lines
        };

        const response = await fetch('/api/dispatchdetails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to submit dispatch');
        }
      }

      toast.success('Dispatch submitted successfully');
      setDispatchCart([]);
      setShowCartModal(false);
      setShowTruckModal(false);
      setShowSubmitConfirm(false);
      setSelectedTruckId('');

      // Refresh data
      await fetchSchoolWiseOrders();

    } catch (error) {
      console.error('Error submitting dispatch:', error);
      toast.error('Failed to submit dispatch');
    } finally {
      setLoading(false);
    }
  };



  // Fetch functions
  const fetchTalukas = async () => {
    try {
      const res = await fetch('/api/taluka');
      if (res.ok) setTalukaList(await res.json());
    } catch {
      toast.error('Failed to load taluka');
    }
  };

  const fetchCenters = async () => {
    try {
      const res = await fetch('/api/centerapi');
      setCenterList(await res.json());
    } catch {
      toast.error('Failed to load centers');
    }
  };

  // const fetchItemMaster = async () => {
  //   try {
  //     const res = await fetch('/api/itemgrains');
  //     if (res.ok) setItemGrains(await res.json());
  //   } catch { }
  // };

  // Change the fetchSchoolWiseOrders function to use the correct endpoint
  const fetchSchoolWiseOrders = async () => {
    try {
      // Use the endpoint that includes dispatch status
      const response = await fetch('/api/schoolwiseorders/schoolwisedashtaluka');
      const data = await response.json();
      setSchoolWiseOrders(data);
    } catch (error) {
      console.error('Error fetching school-wise orders:', error);
      toast.error('Failed to fetch school-wise orders');
    }
  };

  const fetchTruckData = async () => {
    try {
      const res = await fetch('/api/truckdata');
      if (res.ok) setTruckData(await res.json());
    } catch {
      toast.error('Failed to load truck data');
    }
  };

  const fetchSchoolDataMap = async () => {
    try {
      const res = await fetch('/api/scooldata');
      if (!res.ok) return;
      const rows: SchoolDataApiRow[] = await res.json();
      const map = new Map<number, SchoolDataRow>();
      rows.forEach(r => {
        if (r?.schoolid) {
          map.set(Number(r.schoolid), {
            schoolid: Number(r.schoolid),
            center: Number(r.center),
            taluka_id: Number(r.taluka_id),
            schoolname: String(r.schoolname || ''),
            udaisno: String(r.udaisno || ''),
          });
        }
      });
      setSchoolDataById(map);
    } catch {
      // silent
    }
  };

  // Update the fetchPendingSchoolsCount function to be more robust:
  const fetchPendingSchoolsCount = async () => {
    try {
      // Use the SAME API as dashboard to get the exact same count
      const response = await fetch('/api/talukadashboard?order_no=20');
      const data = await response.json();

      // Calculate total remaining schools from all talukas (same as dashboard)
      // Replace line 472:
      const totalRemaining = data.reduce((sum: number, taluka: { remaining_schools?: number }) =>
        sum + (taluka.remaining_schools || 0), 0
      );
      setPendingSchoolsCount(totalRemaining);
    } catch (error) {
      console.error('Error fetching pending schools count:', error);
      setPendingSchoolsCount(0);
    }
  };

  // Update the useEffect to refresh count when schoolWiseOrders changes
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTalukas(),
          fetchCenters(),
          // fetchItemMaster(),
          fetchSchoolWiseOrders(),
          fetchTruckData(),
          fetchSchoolDataMap(),
          fetchPendingSchoolsCount()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="">
      {/* Dispatch Cart Card */}


      {/* Pending Orders Table */}
      <div className="bg-white rounded-2xl shadow-md border p-4">
        <div className="mb-4">
          <div className='flex justify-between items-center'>
            <h3 className="text-lg font-semibold text-gray-800">
              Pending Order Details
              <span className="ml-2 text-sm text-gray-600">
                ({pendingSchoolsCount} schools pending)
              </span>
            </h3>
            <div>
              <button
                onClick={() => setShowCartModal(true)}
                disabled={dispatchCart.length === 0}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                View Cart ({dispatchCart.length})
              </button>

            </div>
          </div>

        </div>

        {/* Custom table with proper pagination */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100 whitespace-nowrap">
                <th className="border px-3 py-2 text-left font-semibold">अ.क्र</th>
                <th className="border px-3 py-2 text-left font-semibold">ACTION</th>
                <th className="border px-3 py-2 text-left font-semibold">ORDER NO</th>
                <th className="border px-3 py-2 text-left font-semibold">TALUKA</th>
                <th className="border px-3 py-2 text-left font-semibold">CENTER</th>
                <th className="border px-3 py-2 text-left font-semibold">SCHOOL</th>
                <th className="border px-3 py-2 text-left font-semibold">UDISE NO</th>
                <th className="border px-3 py-2 text-left font-semibold">CLASS RANGE</th>
                <th className="border px-3 py-2 text-left font-semibold">पट संख्या</th>
                <th className="border px-3 py-2 text-left font-semibold">PERIOD</th>
                <th className="border px-3 py-2 text-left font-semibold">NO OF DAYS</th>
                <th className="border px-3 py-2 text-left font-semibold">FINANCIAL YEAR</th>
                {/* Add grain columns */}
                {mrGrainColumns.map(grain => (
                  <th key={grain.key} className="border px-3 py-2 text-left font-semibold">{grain.key}</th>
                ))}
                <th className="border px-3 py-2 text-left font-semibold">TOTAL WEIGHT</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr key={`${row.school_id}_${row.class_range}`} className="hover:bg-gray-50 whitespace-nowrap">
                  <td className="border px-3 py-2 text-center">{startIndex + index + 1}</td>
                  <td className="border px-3 py-2">
                    <button
                      onClick={() => addToDispatchCart(row)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Add
                    </button>
                  </td>
                  <td className="border px-3 py-2">{row.order_no}</td>
                  <td className="border px-3 py-2">{row.taluka_name}</td>
                  <td className="border px-3 py-2">{row.center_name}</td>
                  <td className="border px-3 py-2">{row.schoolname}</td>
                  <td className="border px-3 py-2">{row.udaisno}</td>
                  <td className="border px-3 py-2">{row.class_range}</td>
                  <td className="border px-3 py-2 text-right">{row.patsankhya}</td>
                  <td className="border px-3 py-2">{row.period}</td>
                  <td className="border px-3 py-2 text-right">{row.no_of_days}</td>
                  <td className="border px-3 py-2">{row.financial_year}</td>
                  {/* Add grain data */}
                  {mrGrainColumns.map(grain => {
                    let quantity = 0;
                    Object.entries(row.items_data).forEach(([itemName, qty]) => {
                      const nm = (itemName || '').toLowerCase().trim();
                      const match = grain.aliases.some(alias => nm.includes(alias.toLowerCase()));
                      if (match) {
                        quantity += Number(qty || 0);
                      }
                    });
                    return (
                      <td key={grain.key} className="border px-3 py-2 text-right">
                        {quantity > 0 ? quantity.toFixed(2) : '0'}
                      </td>
                    );
                  })}
                  <td className="border px-3 py-2 text-right font-semibold text-green-600">
                    {row.total_weight.toFixed(2)} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, pendingOrdersData.length)} of {pendingOrdersData.length} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border rounded"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dispatch Cart Modal - Similar to Route Paper */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-99999">
          <div className="bg-white rounded-lg p-6 w-full max-w-[95vw] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Dispatch Cart ({dispatchCart.length} items)</h2>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Table: one row per school with class ranges 1-5 and 6-8 in different rows */}
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 whitespace-nowrap">अ. क्र.</th>
                    <th className="border px-2 py-1 whitespace-nowrap">Action</th>
                    <th className="border px-2 py-1 whitespace-nowrap">Order No</th>
                    <th className="border px-2 py-1 whitespace-nowrap">केंद्र</th>
                    <th className="border px-2 py-1 whitespace-nowrap">UDISE Code</th>
                    <th className="border px-2 py-1 whitespace-nowrap">शाळा</th>
                    <th className="border px-2 py-1 whitespace-nowrap">वर्ग</th>
                    <th className="border px-2 py-1 whitespace-nowrap">पट संख्या</th>
                    {mrGrainColumns.map(c => (
                      <th key={c.key} className="border px-2 py-1 whitespace-nowrap">{c.key}</th>
                    ))}
                    <th className="border px-2 py-1 whitespace-nowrap">एकुण वजन</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchCart.map((item, idx) => {
                    const sums = sumGrainsForGroup(item.items_data);
                    const total = Object.values(sums).reduce((a, b) => a + (Number(b) || 0), 0);
                    const udise = getUdiseBySchool(item.school_id);

                    // Split class ranges into 1-5 and 6-8
                    const classRanges = item.class_range.split(', ').filter(Boolean);
                    const class1to5 = classRanges.filter(cr => cr.includes('1-5') || cr.includes('1 to 5'));
                    const class6to8 = classRanges.filter(cr => cr.includes('6-8') || cr.includes('6 to 8'));

                    return (
                      <React.Fragment key={item.school_id}>
                        {/* Row for classes 1-5 */}
                        {class1to5.length > 0 && (
                          <tr>
                            <td className="border px-2 py-1 text-center">{idx + 1}</td>
                            <td className="border px-2 py-1">
                              <button
                                onClick={() => removeFromDispatchCart(item.school_id, item.class_range)}
                                className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                Remove
                              </button>
                            </td>
                            <td className="border px-2 py-1 whitespace-nowrap">{item.order_no}</td>
                            <td className="border px-2 py-1 whitespace-nowrap">{item.center_name || ''}</td>
                            <td className="border px-2 py-1 whitespace-nowrap">{udise}</td>
                            <td className="border px-2 py-1 whitespace-nowrap">{item.schoolname || ''}</td>
                            <td className="border px-2 py-1 whitespace-nowrap">{class1to5.join(', ')}</td>
                            <td className="border px-2 py-1 text-right">{item.patsankhya}</td>
                            {mrGrainColumns.map(c => (
                              <td key={c.key} className="border px-2 py-1 text-right">
                                {sums[c.key] ? Number(sums[c.key]).toFixed(2) : '0'}
                              </td>
                            ))}
                            <td className="border px-2 py-1 text-right">{total.toFixed(2)}</td>
                          </tr>
                        )}

                        {/* Row for classes 6-8 */}
                        {class6to8.length > 0 && (
                          <tr>
                            <td className="border px-2 py-1 text-center">{idx + 1}</td>
                            <td className="border px-2 py-1">
                              <button
                                onClick={() => removeFromDispatchCart(item.school_id, item.class_range)}
                                className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                Remove
                              </button>
                            </td>
                            <td className="border px-2 py-1 whitespace-nowrap">{item.order_no}</td>
                            <td className="border px-2 py-1 whitespace-nowrap">{item.center_name || ''}</td>
                            <td className="border px-2 py-1 whitespace-nowrap">{udise}</td>
                            <td className="border px-2 py-1 whitespace-nowrap">{item.schoolname || ''}</td>
                            <td className="border px-2 py-1 whitespace-nowrap">{class6to8.join(', ')}</td>
                            <td className="border px-2 py-1 text-right">{item.patsankhya}</td>
                            {mrGrainColumns.map(c => (
                              <td key={c.key} className="border px-2 py-1 text-right">
                                {sums[c.key] ? Number(sums[c.key]).toFixed(2) : '0'}
                              </td>
                            ))}
                            <td className="border px-2 py-1 text-right">{total.toFixed(2)}</td>
                          </tr>
                        )}

                        {/* If no specific class ranges, show all */}
                        {class1to5.length === 0 && class6to8.length === 0 && (
                          <tr>
                            <td className="border px-2 py-1 text-center">{idx + 1}</td>
                            <td className="border px-2 py-1">
                              <button
                                onClick={() => removeFromDispatchCart(item.school_id, item.class_range)}
                                className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                Remove
                              </button>
                            </td>
                            <td className="border px-2 py-1 whitespace-nowrap">{item.order_no}</td>
                            <td className="border px-2 py-1 whitespace-nowrap">{item.center_name || ''}</td>
                            <td className="border px-2 py-1 whitespace-nowrap">{udise}</td>
                            <td className="border px-2 py-1 whitespace-nowrap">{item.schoolname || ''}</td>
                            <td className="border px-2 py-1 whitespace-nowrap">{item.class_range || ''}</td>
                            <td className="border px-2 py-1 text-right">{item.patsankhya}</td>
                            {mrGrainColumns.map(c => (
                              <td key={c.key} className="border px-2 py-1 text-right">
                                {sums[c.key] ? Number(sums[c.key]).toFixed(2) : '0'}
                              </td>
                            ))}
                            <td className="border px-2 py-1 text-right">{total.toFixed(2)}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowCartModal(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowCartModal(false);
                  setShowTruckModal(true);
                }}
                disabled={loading || dispatchCart.length === 0}
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60 inline-flex items-center"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
                {loading ? 'Submitting...' : 'Final Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Truck Selection Modal */}
      {showTruckModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-99999">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Select Truck</h2>
              <button
                onClick={() => setShowTruckModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Truck Number
              </label>
              <select
                value={selectedTruckId}
                onChange={(e) => setSelectedTruckId(e.target.value)}
                className="w-full h-10 rounded-md border px-3 text-sm"
              >
                <option value="">Select Truck</option>
                {truckData.map(truck => (
                  <option key={truck.id} value={truck.id}>
                    {truck.truckNo}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowTruckModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowTruckModal(false);
                  setShowSubmitConfirm(true);
                }}
                disabled={!selectedTruckId}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-99999">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Confirm Final Submit</h2>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="mb-4 text-gray-600">
              Are you sure you want to submit the dispatch cart with {dispatchCart.length} items?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitDispatch}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 inline-flex items-center"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
                {loading ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingOrderDetails;
