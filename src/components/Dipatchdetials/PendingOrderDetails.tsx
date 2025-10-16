"use client";

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Loader from '@/common/Loader';
import React from 'react';

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
  is_dispatched?: boolean | 0;
  remaining_quantities?: Record<string, number>;
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
  remaining_quantities: Record<string, number>;
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

// type DispatchListRow = {
//   id: number;
//   dispatch_code: string;
//   order_id: number;
//   school_id: number;
//   center_id: number;
//   truck_id: number;
//   item_name: string;
//   unit: string;
//   total_qty: number;
//   qty_dispatch: number;
//   bal_qty: number;
//   status: string;
//   created_at: string;
//   order_no?: string;
//   schoolname?: string;
//   center_name?: string;
//   total_weight?: string;
//   truckNo?: string;
//   class_range?: string;
//   taluka_id?: string;
//   taluka_name?: string;
//   period?: string;
//   no_of_days?: number;
//   financial_year?: string;
//   udaisno?: string;
//   patsankhya?: string;
//   action?: string;
//   "grain_तांदुळ"?: string;
//   "grain_मुंगदाळ"?: string;
//   "grain_मसूरदाळ"?: string;
//   "grain_तूरदाळ"?: string;
//   "grain_हरभरा"?: string;
//   "grain_चवळी"?: string;
//   "grain_मटकी"?: string;
//   "grain_मुग"?: string;
//   "grain_वाटाणा"?: string;
//   "grain_सोया वडी"?: string;
//   "grain_मसाला"?: string;
//   "grain_सोया तेल"?: string;
//   "grain_हळद"?: string;
//   "grain_मीठ"?: string;
//   "grain_मोहरी"?: string;
//   "grain_चना"?: string;
//   "grain_जीरा"?: string;
// };

const PendingOrderDetails = () => {
  const [loading, setLoading] = useState(true);

  // Masters
  const [talukaList, setTalukaList] = useState<TalukaRow[]>([]);
  const [centerList, setCenterList] = useState<CenterRow[]>([]);
  const [schoolWiseOrders, setSchoolWiseOrders] = useState<SchoolWiseOrder[]>([]);
  const [schoolDataById, setSchoolDataById] = useState<Map<number, SchoolDataRow>>(new Map());
  const [truckData, setTruckData] = useState<TruckData[]>([]);

  // Add these state variables for typehead functionality
  const [showTruckSuggestions, setShowTruckSuggestions] = useState(false);
  const [truckInputValue, setTruckInputValue] = useState('');

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
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Add search filters state
  const [searchFilters, setSearchFilters] = useState({
    order_no: '',
    taluka_name: '',
    center_name: '',
    schoolname: '',
    udaisno: '',
    class_range: '',
    patsankhya: '',
    period: '',
    no_of_days: '',
    financial_year: '',
    total_weight: ''
  });

  // UPDATED: State management for quantities with remaining tracking
  const [editableQuantities, setEditableQuantities] = useState<Map<string, Record<string, number>>>(new Map());
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [originalQuantities, setOriginalQuantities] = useState<Map<string, Record<string, number>>>(new Map());
  const [remainingQuantities, setRemainingQuantities] = useState<Map<string, Record<string, number>>>(new Map());

  // Grain columns definition
  const mrGrainColumns = [
    { key: 'तांदुळ', aliases: ['तांदुळ', 'rice', 'चावल'] },
    { key: 'मुंगदाळ', aliases: ['मुंगदाळ', 'मुगडाळ', 'moong dal', 'मूगडाळ'] },
    { key: 'मसूरदाळ', aliases: ['मसूरदाळ', 'मसूर डाळ', 'masoor dal'] },
    { key: 'तूरदाळ', aliases: ['तूरदाळ', 'तूर डाळ', 'toor dal', 'अरहर'] },
    { key: 'हरभरा', aliases: ['हरभरा', 'चना', 'chana', 'gram'] },
    { key: 'चवळी', aliases: ['चवळी', 'chawli', 'लोबिया'] },
    { key: 'मटकी', aliases: ['मटकी', 'matki', 'मोठ'] },
    { key: 'मुग', aliases: ['मुग', 'moong'] },
    { key: 'वाटाणा', aliases: ['वाटाणा', 'vatana'] },
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
      const match = mrGrainColumns.find(c =>
        c.aliases.some(a => {
          const aliasLower = a.toLowerCase();
          if (nm === aliasLower) return true;
          return nm.includes(aliasLower);
        })
      );
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

  // Filter function for search
  const filterData = (data: PendingOrderRow[]) => {
    return data.filter(row => {
      return Object.entries(searchFilters).every(([key, value]) => {
        if (!value) return true;
        const rowValue = String(row[key as keyof PendingOrderRow] || '').toLowerCase();
        const searchValue = value.toLowerCase();
        return rowValue.includes(searchValue);
      });
    });
  };

  // Create truck options for typehead
  const truckOptions = useMemo(() => [
    ...truckData.map(t => ({ value: String(t.id), label: t.truckNo }))
  ], [truckData]);

  // Filter truck suggestions based on input
  const filteredTruckSuggestions = useMemo(() => {
    if (!truckInputValue.trim()) return [];
    return truckOptions.filter(option =>
      option.label.toLowerCase().includes(truckInputValue.toLowerCase())
    );
  }, [truckOptions, truckInputValue]);

  // Store original quantities for each class range separately
  const storeOriginalQuantities = (row: PendingOrderRow) => {
    const rowKey = `${row.school_id}_${row.class_range}`;

    // Check if we already have stored original quantities for this row
    if (originalQuantities.has(rowKey)) {
      return;
    }

    // Use the remaining quantities as original quantities since API already calculated them
    const quantities = { ...row.remaining_quantities };

    setOriginalQuantities(prev => {
      const newMap = new Map(prev);
      newMap.set(rowKey, quantities);
      return newMap;
    });

    // Initialize remaining quantities with the same values
    setRemainingQuantities(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(rowKey)) {
        newMap.set(rowKey, { ...quantities });
      }
      return newMap;
    });
  };

  // Handle quantity change with proper validation for specific class range
  const handleQuantityChange = (rowKey: string, grainKey: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const originalQty = originalQuantities.get(rowKey)?.[grainKey] || 0;
  
    // Validate against original quantity
    if (numericValue > originalQty) {
      toast.error(`Value cannot be greater than ${originalQty} for ${grainKey}`);
      return;
    }
  
    if (numericValue < 0) {
      toast.error(`Value cannot be negative for ${grainKey}`);
      return;
    }
  
    // Update editable quantities
    setEditableQuantities(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(rowKey)) {
        // Initialize with original quantities if not exists
        const original = originalQuantities.get(rowKey) || {};
        newMap.set(rowKey, { ...original });
      }
      const rowQuantities = newMap.get(rowKey)!;
      rowQuantities[grainKey] = numericValue;
      return newMap;
    });
  
    // Update remaining quantities in real-time
    setRemainingQuantities(prev => {
      const newMap = new Map(prev);
      const original = originalQuantities.get(rowKey) || {};
      
      if (!newMap.has(rowKey)) {
        newMap.set(rowKey, { ...original });
      }
      
      const currentRemaining = newMap.get(rowKey)!;
      const updatedRemaining = { ...currentRemaining };
      
      // Calculate remaining quantity for this specific grain
      updatedRemaining[grainKey] = Math.max(0, originalQty - numericValue);
      
      newMap.set(rowKey, updatedRemaining);
      return newMap;
    });
  };

  // Calculate total weight from quantities
  const calculateTotalWeight = (quantities: Record<string, number>) => {
    return Object.values(quantities).reduce((sum, qty) => sum + Number(qty), 0);
  };

  // Add to dispatch cart with proper quantity handling for specific class range
  const addToDispatchCartWithEdits = (row: PendingOrderRow) => {
    const rowKey = `${row.school_id}_${row.class_range}`;
    const editedQuantities = editableQuantities.get(rowKey);
    const original = originalQuantities.get(rowKey) || {};

    // Create final quantities: use edited values where available, otherwise use original
    const finalQuantities: Record<string, number> = {};

    mrGrainColumns.forEach(grain => {
      const originalQty = original[grain.key] || 0;
      const editedQty = editedQuantities?.[grain.key];

      // Use edited value if available and > 0, otherwise use original
      finalQuantities[grain.key] = (editedQty !== undefined && editedQty > 0) ? editedQty : originalQty;
    });

    // Validate all quantities
    let hasValidationError = false;
    Object.entries(finalQuantities).forEach(([grainKey, finalValue]) => {
      const originalQty = original[grainKey] || 0;
      if (finalValue > originalQty) {
        toast.error(`Value cannot be greater than ${originalQty} for ${grainKey}`);
        hasValidationError = true;
      }
      if (finalValue < 0) {
        toast.error(`Value cannot be negative for ${grainKey}`);
        hasValidationError = true;
      }
    });

    if (hasValidationError) {
      return;
    }

    // Create cart item with final quantities
    const cartItem: DispatchCartItem = {
      ...row,
      items_data: finalQuantities, // Use the final quantities directly
      total_weight: calculateTotalWeight(finalQuantities)
    };

    setDispatchCart(prev => [...prev, cartItem]);

    // REMOVE THIS SECTION - Don't update remaining quantities here
    // This was causing double subtraction
    // setRemainingQuantities(prev => {
    //   const newMap = new Map(prev);
    //   const currentRemaining = newMap.get(rowKey) || original;
    //   const updatedRemaining: Record<string, number> = {};

    //   mrGrainColumns.forEach(grain => {
    //     const currentRemainingQty = currentRemaining[grain.key] || 0;
    //     const dispatchedQty = finalQuantities[grain.key] || 0;
    //     updatedRemaining[grain.key] = Math.max(0, currentRemainingQty - dispatchedQty);
    //   });

    //   newMap.set(rowKey, updatedRemaining);
    //   return newMap;
    // });

    toast.success(`Added to dispatch cart for ${row.class_range} class`);

    // Clear edits for this row
    setEditableQuantities(prev => {
      const newMap = new Map(prev);
      newMap.delete(rowKey);
      return newMap;
    });
    setEditingRow(null);
  };

// Update the pendingOrdersData useMemo function (around line 413)
const pendingOrdersData = useMemo(() => {
  console.log('Processing schoolWiseOrders:', schoolWiseOrders.length);
  
  // The API now handles the filtering logic, so we just process the data
  // Group by school and process data
  const schoolGroups = new Map<number, SchoolWiseOrder[]>();
  schoolWiseOrders.forEach(order => {
    if (!schoolGroups.has(order.school_id)) {
      schoolGroups.set(order.school_id, []);
    }
    schoolGroups.get(order.school_id)!.push(order);
  });

  console.log('School groups:', schoolGroups.size);

  const processedData: PendingOrderRow[] = [];

  schoolGroups.forEach((orders, schoolId) => {
    // const firstOrder = orders[0];
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
      const uniqueKey = `${schoolId}_${classRange}`;

      // Skip if this specific school + class range is already in cart
      const isInCart = dispatchCart.some(item => `${item.school_id}_${item.class_range}` === uniqueKey);
      
      if (isInCart) {
        return;
      }

      // Find the specific order for this class range
      const classOrder = classOrders[0]; // Get the first order for this specific class range
      
      // Use remaining_quantities from the specific class range order, not firstOrder
      const remainingQuantities = typeof classOrder.remaining_quantities === 'string'
        ? JSON.parse(classOrder.remaining_quantities)
        : (classOrder.remaining_quantities || {});

      // Calculate total weight from remaining quantities
      const totalWeight = Number(Object.values(remainingQuantities).reduce((sum: number, qty) => sum + Number(qty), 0));

      // Only show if there are remaining quantities (not all zero)
      const hasRemainingQuantities = Object.values(remainingQuantities).some(qty => Number(qty) > 0);
      
      if (!hasRemainingQuantities) {
        return; // Skip this row if no remaining quantities
      }

      // Create the row data
      const rowData: PendingOrderRow = {
        id: classOrder.id, // Use classOrder.id instead of firstOrder.id
        order_id: classOrder.order_id, // Use classOrder.order_id instead of firstOrder.order_id
        school_id: schoolId,
        order_no: classOrder.order_no, // Use classOrder.order_no instead of firstOrder.order_no
        schoolname: classOrder.schoolname, // Use classOrder.schoolname instead of firstOrder.schoolname
        udaisno: classOrder.udaisno, // Use classOrder.udaisno instead of firstOrder.udaisno
        taluka_name: talukaName,
        center_name: centerName,
        class_range: classRange,
        patsankhya: Number(classOrder.patsankhya) || 0, // Use classOrder.patsankhya instead of firstOrder.patsankhya
        period: classOrder.period, // Use classOrder.period instead of firstOrder.period
        financial_year: classOrder.financial_year, // Use classOrder.financial_year instead of firstOrder.financial_year
        no_of_days: Number(classOrder.no_of_days) || 0, // Use classOrder.no_of_days instead of firstOrder.no_of_days
        total_weight: totalWeight,
        items_count: Object.keys(remainingQuantities).length,
        items_data: remainingQuantities,
        center_id: Number(sd?.center) || 0,
        taluka_id: Number(sd?.taluka_id) || 0,
        remaining_quantities: remainingQuantities
      };

      // Store original quantities for this specific class range
      storeOriginalQuantities(rowData);

      processedData.push(rowData);
    });
  });

  console.log('Final processed data:', processedData.length);
  
  return processedData.sort((a, b) => {
    const schoolCompare = a.schoolname.localeCompare(b.schoolname);
    if (schoolCompare !== 0) return schoolCompare;
    return a.class_range.localeCompare(b.class_range);
  });
}, [schoolWiseOrders, schoolDataById, talukaList, centerList, dispatchCart]);
  // Apply search filters to the data
  const filteredData = useMemo(() => {
    return filterData(pendingOrdersData);
  }, [pendingOrdersData, searchFilters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Handle search input changes
  const handleSearchChange = (column: string, value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setCurrentPage(1);
  };

  // Clear all search filters
  const clearAllFilters = () => {
    setSearchFilters({
      order_no: '',
      taluka_name: '',
      center_name: '',
      schoolname: '',
      udaisno: '',
      class_range: '',
      patsankhya: '',
      period: '',
      no_of_days: '',
      financial_year: '',
      total_weight: ''
    });
    setCurrentPage(1);
  };

  // Remove from dispatch cart - removes specific school + class range combination
  const removeFromDispatchCart = (schoolId: number, classRange: string) => {
    // const rowKey = `${schoolId}_${classRange}`;
    
    setDispatchCart(prev => prev.filter(item =>
      !(item.school_id === schoolId && item.class_range === classRange)
    ));

    // REMOVE THIS SECTION - Don't restore remaining quantities here
    // The remaining quantities should only be updated after actual API submission
    // const original = originalQuantities.get(rowKey) || {};
    // setRemainingQuantities(prev => {
    //   const newMap = new Map(prev);
    //   newMap.set(rowKey, { ...original });
    //   return newMap;
    // });
    
    toast.success('Removed from dispatch cart - Row will reappear in table');
  };

  // Update the submitDispatch function to handle batch route numbering
  const submitDispatch = async () => {
    if (dispatchCart.length === 0) {
      toast.error('No items in dispatch cart');
      return;
    }

    // Check if truck is selected either by ID or by input value
    if (!selectedTruckId && !truckInputValue.trim()) {
      toast.error('Please select a truck');
      return;
    }

    // If truckInputValue is provided but no selectedTruckId, try to find exact match
    let finalTruckId = selectedTruckId;
    if (!selectedTruckId && truckInputValue.trim()) {
      const exactMatch = truckOptions.find(truck =>
        truck.label.toLowerCase() === truckInputValue.toLowerCase()
      );
      if (exactMatch) {
        finalTruckId = exactMatch.value;
      } else {
        toast.error('Please select a valid truck from the list');
        return;
      }
    }

    try {
      setLoading(true);

      const allDispatchIds: number[] = [];
      let routeResult: { route_number?: number; class_ranges?: string[] } | null = null;

      // Process each item in dispatch cart separately
      for (const item of dispatchCart) {
        // Convert items_data to lines format for this specific item
        const lines = Object.entries(item.items_data).map(([grain, totalQty]) => ({
          grain,
          unit: 'kg',
          totalQty: Number(totalQty),
          qtyDispatch: Number(totalQty)
        }));

        const payload = {
          order_id: item.order_id,
          school_id: item.school_id,
          center_id: item.center_id,
          truck_id: Number(finalTruckId),
          class_range: item.class_range,
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
          throw new Error(`Failed to submit dispatch for ${item.schoolname} - ${item.class_range}`);
        }

        const result = await response.json();
        console.log(`Dispatch created for ${item.schoolname} - ${item.class_range}:`, result);
        
        // Collect all dispatch IDs for batch route paper
        if (result.dispatch_ids && Array.isArray(result.dispatch_ids)) {
          allDispatchIds.push(...result.dispatch_ids);
        }
      }

      // Now create route paper for all dispatch IDs in this batch
      if (allDispatchIds.length > 0) {
        const routeResponse = await fetch('/api/dispatchdetails/batchroute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dispatch_ids: allDispatchIds
          }),
        });

        if (!routeResponse.ok) {
          throw new Error('Failed to create route paper');
        }

        routeResult = await routeResponse.json();
        console.log('Route Paper created for batch:', routeResult);
      }

      toast.success(`Dispatch and Route Paper submitted successfully! Route Number: ${routeResult?.route_number || 'N/A'} - Class Ranges: ${routeResult?.class_ranges?.join(', ') || 'N/A'}`);
      setDispatchCart([]);
      setShowCartModal(false);
      setShowTruckModal(false);
      setShowSubmitConfirm(false);
      setSelectedTruckId('');
      setTruckInputValue('');
      setShowTruckSuggestions(false);

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

  const fetchSchoolWiseOrders = async () => {
    try {
      console.log('Fetching school-wise orders...');
      const response = await fetch('/api/schoolwiseorders/remainingquantities');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Data received:', data.length, 'records');
      console.log('Sample data:', data[0]);
      
      setSchoolWiseOrders(data);
    } catch (error) {
      console.error('Error fetching school-wise orders with remaining quantities:', error);
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

  const fetchPendingSchoolsCount = async () => {
    try {
      const response = await fetch('/api/talukadashboard?order_no=20');
      const data = await response.json();
      const totalRemaining = data.reduce((sum: number, taluka: { remaining_schools?: number }) =>
        sum + (taluka.remaining_schools || 0), 0
      );
      setPendingSchoolsCount(totalRemaining);
    } catch (error) {
      console.error('Error fetching pending schools count:', error);
      setPendingSchoolsCount(0);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTalukas(),
          fetchCenters(),
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

  // Cart statistics
  const cartStats = useMemo(() => {
    const uniqueSchools = new Set(dispatchCart.map(item => item.school_id));
    const totalWeight = dispatchCart.reduce((sum, item) => sum + item.total_weight, 0);

    return {
      schoolCount: uniqueSchools.size,
      totalWeight: totalWeight
    };
  }, [dispatchCart]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="">
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
            <div className="flex gap-2">
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowCartModal(true)}
                disabled={dispatchCart.length === 0}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                View Cart - Schools ({cartStats.schoolCount}) - Total Weight: {cartStats.totalWeight.toFixed(2)} kg
              </button>
            </div>
          </div>
        </div>

        {/* Custom table with proper pagination */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100 whitespace-nowrap">
                <th className="border px-3 py-2 text-left font-semibold">SR NO</th>
                <th className="border px-3 py-2 text-left font-semibold">ACTION</th>
                <th className="border px-3 py-2 text-left font-semibold">
                  <div>ORDER NO</div>
                </th>
                <th className="border px-3 py-2 text-left font-semibold">
                  <div>TALUKA</div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchFilters.taluka_name}
                    onChange={(e) => handleSearchChange('taluka_name', e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1 bg-white w-[150px]"
                  />
                </th>
                <th className="border px-3 py-2 text-left font-semibold">
                  <div>CENTER</div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchFilters.center_name}
                    onChange={(e) => handleSearchChange('center_name', e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1 bg-white"
                  />
                </th>
                <th className="border px-3 py-2 text-left font-semibold">
                  <div>SCHOOL</div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchFilters.schoolname}
                    onChange={(e) => handleSearchChange('schoolname', e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1 bg-white"
                  />
                </th>
                <th className="border px-3 py-2 text-left font-semibold">
                  <div>UDISE NO</div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchFilters.udaisno}
                    onChange={(e) => handleSearchChange('udaisno', e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1 bg-white"
                  />
                </th>
                <th className="border px-3 py-2 text-left font-semibold">
                  <div>CLASS RANGE</div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchFilters.class_range}
                    onChange={(e) => handleSearchChange('class_range', e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1 bg-white"
                  />
                </th>
                <th className="border px-3 py-2 text-left font-semibold">पट संख्या</th>
                <th className="border px-3 py-2 text-left font-semibold">PERIOD</th>
                <th className="border px-3 py-2 text-left font-semibold">NO OF DAYS</th>
                <th className="border px-3 py-2 text-left font-semibold">FINANCIAL YEAR</th>
                {/* Add grain columns */}
                {mrGrainColumns.map(grain => (
                  <th key={grain.key} className="border px-3 py-2 text-left font-semibold">
                    <div>{grain.key}</div>
                  </th>
                ))}
                <th className="border px-3 py-2 text-left font-semibold">TOTAL WEIGHT</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => {
                const rowKey = `${row.school_id}_${row.class_range}`;
                const isEditing = editingRow === rowKey;
                const rowEdits = editableQuantities.get(rowKey) || {};
                const original = originalQuantities.get(rowKey) || {};
                const remaining = remainingQuantities.get(rowKey) || original;

                // Get current quantities properly for display
                const currentQuantities = isEditing ? 
                  (rowEdits && Object.keys(rowEdits).length > 0 ? rowEdits : remaining) : 
                  remaining;
                const currentTotalWeight = calculateTotalWeight(currentQuantities);

                return (
                  <tr key={rowKey} className="hover:bg-gray-50 whitespace-nowrap">
                    <td className="border px-3 py-2 text-center">{startIndex + index + 1}</td>
                    <td className="border px-3 py-2">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => addToDispatchCartWithEdits(row)}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setEditingRow(null);
                              setEditableQuantities(prev => {
                                const newMap = new Map(prev);
                                newMap.delete(rowKey);
                                return newMap;
                              });
                            }}
                            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingRow(rowKey)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          Edit
                        </button>
                      )}
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

             {/* Grain data section */}
{mrGrainColumns.map(grain => {
  const originalQty = original[grain.key] || 0;
  const remainingQty = remaining[grain.key] || originalQty;
  const editedQty = rowEdits[grain.key];
  const currentValue = isEditing ? 
    (editedQty !== undefined ? editedQty : remainingQty) : 
    remainingQty;

  // Ensure currentValue is a number
  const numericValue = Number(currentValue) || 0;

  return (
    <td key={grain.key} className="border px-3 py-2 text-right">
      {isEditing ? (
        <div className="flex flex-col">
          <input
            type="number"
            min="0"
            max={remainingQty}
            step="0.01"
            value={numericValue}
            onChange={(e) => handleQuantityChange(rowKey, grain.key, e.target.value)}
            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
          />
          <div className="text-xs text-gray-500 mt-1">
            Remaining: {Number(remainingQty).toFixed(2)}
          </div>
          
        </div>
      ) : (
        <div>
          <div className="text-sm">
            {numericValue > 0 ? numericValue.toFixed(2) : '0'}
          </div>
          {remainingQty < originalQty && (
            <div className="text-xs text-orange-500">
              (Remaining)
            </div>
          )}
        </div>
      )}
    </td>
  );
})}

                    <td className="border px-3 py-2 text-right font-semibold text-green-600">
                      {currentTotalWeight.toFixed(2)} kg
                      {isEditing && (
                        <div className="text-xs text-blue-600">
                          (Live Update)
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
            {filteredData.length !== pendingOrdersData.length && (
              <span className="ml-2 text-blue-600">
                (filtered from {pendingOrdersData.length} total)
              </span>
            )}
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

      {/* Dispatch Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-99999">
          <div className="bg-white rounded-lg p-6 w-full max-w-[95vw] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Dispatch Cart - Schools ({cartStats.schoolCount}) - Total Weight: {cartStats.totalWeight.toFixed(2)} kg
              </h2>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

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

                    return (
                      <tr key={`${item.school_id}_${item.class_range}_${idx}`}>
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
                        <td className="border px-2 py-1 whitespace-nowrap">{item.class_range}</td>
                        <td className="border px-2 py-1 text-right">{item.patsankhya}</td>
                        {mrGrainColumns.map(c => (
                          <td key={c.key} className="border px-2 py-1 text-right">
                            {sums[c.key] ? Number(sums[c.key]).toFixed(2) : '0'}
                          </td>
                        ))}
                        <td className="border px-2 py-1 text-right">{total.toFixed(2)}</td>
                      </tr>
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
                onClick={() => {
                  setShowTruckModal(false);
                  setTruckInputValue('');
                  setShowTruckSuggestions(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Truck Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type truck number..."
                  className="w-full h-10 rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={truckInputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTruckInputValue(value);
                    setShowTruckSuggestions(value.length > 0);

                    // Find exact match and set selectedTruckId
                    const exactMatch = truckOptions.find(truck =>
                      truck.label.toLowerCase() === value.toLowerCase()
                    );
                    if (exactMatch) {
                      setSelectedTruckId(exactMatch.value);
                    } else {
                      setSelectedTruckId('');
                    }
                  }}
                  onFocus={() => {
                    if (truckInputValue.length > 0) {
                      setShowTruckSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow option selection
                    setTimeout(() => setShowTruckSuggestions(false), 200);
                  }}
                />

                {/* Custom Typeahead Suggestions */}
                {showTruckSuggestions && filteredTruckSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                      {filteredTruckSuggestions.map((option) => (
                        <div
                          key={option.value}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-gray-900"
                          onClick={() => {
                            setTruckInputValue(option.label);
                            setSelectedTruckId(option.value);
                            setShowTruckSuggestions(false);
                          }}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No results message */}
                {showTruckSuggestions && filteredTruckSuggestions.length === 0 && truckInputValue.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="px-3 py-2 text-sm text-gray-500">No trucks found</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTruckModal(false);
                  setTruckInputValue('');
                  setShowTruckSuggestions(false);
                }}
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
              Are you sure you want to submit the dispatch cart with {cartStats.schoolCount} schools and total weight of {cartStats.totalWeight.toFixed(2)} kg?
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