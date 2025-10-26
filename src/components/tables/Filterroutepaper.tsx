"use client";

import React, { useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Column, FilterOption } from "./tabletype";

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  filterOptions?: FilterOption[];
  filterKey?: keyof T;
  searchKey?: string;
  classname?: string;
  toolbar?: React.ReactNode; // inline filters + actions
  groupByKey?: keyof T; // New prop for grouping
  colspanKeys?: (keyof T)[]; // Keys that should use colspan
  highlightGroups?: string[];
};

type GroupedData<T> = {
  groupKey: string;
  items: T[];
  count: number;
};

type ExtendedData<T> = T & {
  _isFirstInGroup?: boolean;
  _groupCount?: number;
  _groupKey?: string;
};

export function Filterroutepaper<T extends Record<string, unknown>>({
  data,
  columns,
  filterKey,
  toolbar,
  groupByKey,
  colspanKeys = [],
  // highlightGroups = [], // NEW
}: Props<T>) {
  const [filter] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const toStringVal = (v: unknown) => String(v ?? "");

  // Group data if groupByKey is provided
   // Group data if groupByKey is provided
   const groupedData = useMemo((): GroupedData<T>[] => {
    if (!groupByKey) return [];

    const grouped = data.reduce((acc, item) => {
      const key = String(item[groupByKey]);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);

    const groupedArray = Object.entries(grouped).map(([groupKey, items]) => ({
      groupKey,
      items,
      count: items.length
    }));
    
    // Sort groups by groupKey in descending order (for route numbers: 5, 4, 3, 2, 1)
    groupedArray.sort((a, b) => {
      const numA = parseInt(a.groupKey, 10);
      const numB = parseInt(b.groupKey, 10);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return numB - numA; // Descending order - बड़े से छोटे
      }
      
      // Fallback to string comparison if not numeric
      return b.groupKey.localeCompare(a.groupKey);
    });
    
    return groupedArray;
  }, [data, groupByKey]);

  // Apply search filter to grouped data
  // Apply search filter to grouped data
  const filteredGroupedData = useMemo((): GroupedData<T>[] => {
    if (!groupByKey) return [];

    let filtered = groupedData;

    if (search) {
      // When grouping, search ONLY by the group key (e.g., dispatch_code)
      filtered = groupedData
        .filter(group =>
          String(group.groupKey).toLowerCase().includes(search.toLowerCase())
        )
        .map(group => ({
          ...group,
          // keep all items in a matched group (don't filter by row fields)
          items: group.items,
        }));
    }

    if (filter && filterKey) {
      filtered = filtered.map(group => ({
        ...group,
        items: group.items.filter((row) =>
          String(row[filterKey]) === String(filter)
        )
      })).filter(group => group.items.length > 0);
    }

    return filtered;
  }, [groupedData, search, filter, filterKey]);
  // Flatten grouped data for display
  const displayData = useMemo((): ExtendedData<T>[] => {
    if (!groupByKey) return data as ExtendedData<T>[];

    return filteredGroupedData.flatMap((group: GroupedData<T>) =>
      group.items.map((item: T, index: number): ExtendedData<T> => ({
        ...item,
        _isFirstInGroup: index === 0,
        _groupCount: group.count,
        _groupKey: group.groupKey
      }))
    );
  }, [filteredGroupedData, groupByKey]);

  const reactColumns = useMemo(() => {
    const baseColumns = [
      {
        name: "SR No.",
        cell: (row: ExtendedData<T>, index: number) => {
          if (groupByKey && !row._isFirstInGroup) return null;
          return (perPage * (currentPage - 1)) + index + 1;
        },
        width: "80px",
        ignoreRowClick: true,
      },
    ];

    const mappedColumns = columns.map((col) => {
      const isColspanKey = colspanKeys.includes(col.key as keyof T);

      return {
        name: col.label,
        selector: (row: T) =>
          col.accessor ? toStringVal(row[col.accessor] ?? "") : "",
        cell: (row: ExtendedData<T>) => {
          // For colspan keys, only show on first row of group
          if (groupByKey && isColspanKey && !row._isFirstInGroup) {
            return null;
          }

          return col.render
            ? col.render?.(row)
            : (col.accessor ? toStringVal(row[col.accessor]) : "");
        },
        sortable: true,
        ignoreRowClick: isColspanKey,
      };
    });

    return [...baseColumns, ...mappedColumns];
  }, [columns, perPage, currentPage, groupByKey, colspanKeys]);

  // For non-grouped data, apply filters normally
  const filteredData = useMemo((): ExtendedData<T>[] => {
    if (groupByKey) return displayData; // Already filtered above

    let tempData = [...data] as ExtendedData<T>[];

    if (filter && filterKey) {
      tempData = tempData.filter(
        (row) => String(row[filterKey]) === String(filter)
      );
    }

    if (search) {
      tempData = tempData.filter((row) =>
        Object.values(row).some((value) =>
          toStringVal(value).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    return tempData;
  }, [data, filter, filterKey, search, groupByKey, displayData]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!groupByKey) {
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = startIndex + perPage;
      return filteredData.slice(startIndex, endIndex);
    }

    // For grouped data, paginate by groups
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;

    // Get the groups for current page
    const currentPageGroups = filteredGroupedData.slice(startIndex, endIndex);

    // Flatten the groups for display
    return currentPageGroups.flatMap((group: GroupedData<T>) =>
      group.items.map((item: T, index: number): ExtendedData<T> => ({
        ...item,
        _isFirstInGroup: index === 0,
        _groupCount: group.count,
        _groupKey: group.groupKey
      }))
    );
  }, [filteredData, currentPage, perPage, groupByKey, filteredGroupedData]);

  const totalPages = useMemo(() => {
    if (!groupByKey) {
      return Math.ceil(filteredData.length / perPage);
    }
    return Math.ceil(filteredGroupedData.length / perPage);
  }, [filteredData.length, perPage, groupByKey, filteredGroupedData.length]);

  const SubHeaderComponent = (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <input
        type="text"
        placeholder="Search by.. Route Number"
        className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm flex-1 min-w-[200px]"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-2">
        {toolbar}
      </div>
    </div>
  );

  // Custom pagination component
  const CustomPagination = () => {
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage: number) => {
      setPerPage(newPerPage);
      setCurrentPage(1);
    };

    const totalRecords = groupByKey ? filteredGroupedData.length : filteredData.length;
    const startRecord = (currentPage - 1) * perPage + 1;
    const endRecord = Math.min(currentPage * perPage, totalRecords);

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Rows per page:</span>
          <select
            value={perPage}
            onChange={(e) => handlePerPageChange(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-700">
            Showing {startRecord} to {endRecord} of {totalRecords} {groupByKey ? 'schools' : 'records'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };
  // const highlightSet = useMemo(() => new Set<string>(highlightGroups.map(String)), [highlightGroups]);
  // Custom table component for colspan support
  if (groupByKey) {
    return (
      <div className="bg-white rounded-2xl shadow-md border p-4">
        {SubHeaderComponent}

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                  Sr No
                </th>
                {columns.map((col) => (
                  <th key={String(col.key)} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((row: ExtendedData<T>, index: number) => {
                // Count how many groups have been displayed before this row
                let groupCounter = 0;
                for (let i = 0; i <= index; i++) {
                  if (paginatedData[i]._isFirstInGroup) {
                    groupCounter++;
                  }
                }
                
                return (
                  <tr key={`${row._groupKey}-${index}`} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    {/* Sr No */}
                    {row._isFirstInGroup ? (
                      <td 
                        rowSpan={row._groupCount} 
                        className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-center font-medium"
                        style={{ verticalAlign: 'top' }}
                      >
                        {(currentPage - 1) * perPage + groupCounter}
                      </td>
                    ) : null}
                    
                    {/* Other columns */}
                    {columns.map((col) => {
                      const isColspanKey = colspanKeys.includes(col.key as keyof T);
                      const cellValue = col.render ? col.render(row) : (col.accessor ? toStringVal(row[col.accessor]) : "");
                      
                      if (isColspanKey && !row._isFirstInGroup) {
                        return null;
                      }
                      
                      if (isColspanKey && row._isFirstInGroup) {
                        return (
                          <td 
                            key={String(col.key)}
                            rowSpan={row._groupCount} 
                            className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-center"
                            style={{ verticalAlign: 'top' }}
                          >
                            {cellValue}
                          </td>
                        );
                      }
                      
                      return (
                        <td key={String(col.key)} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                          {cellValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <CustomPagination />
      </div>
    );
  }

  // Original DataTable for non-grouped data
  return (
    <div className="bg-white rounded-2xl shadow-md border p-4">
      <DataTable
        columns={reactColumns}
        data={filteredData}
        pagination
        paginationPerPage={perPage}
        paginationDefaultPage={currentPage}
        onChangePage={(page) => setCurrentPage(page)}
        onChangeRowsPerPage={(newPerPage) => {
          setPerPage(newPerPage);
          setCurrentPage(1);
        }}
        highlightOnHover
        responsive
        striped
        persistTableHead
        subHeader
        subHeaderComponent={SubHeaderComponent}
        customStyles={{
          rows: {
            style: {
              minHeight: "28px",
            },
          },
          headCells: {
            style: {
              fontWeight: "600",
              border: "1px solid #ddd",
            },
          },
          cells: {
            style: {
              border: "1px solid #ddd",
            },
          },
        }}
      />
    </div>
  );
}