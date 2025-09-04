"use client";

import React, { useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Column, FilterOption } from "./tabletype";
import FormInModal from "../example/ModalExample/FormInModal";

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  filterOptions?: FilterOption[];
  filterKey?: keyof T;
  inputfiled?: React.ReactNode;
  submitbutton?: React.ReactNode;
  title?: string;
  searchKey?: string;
  classname?: string;
  groupByKey?: keyof T; // New prop for grouping
  colspanKeys?: (keyof T)[]; // Keys that should use colspan
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

export function Schoolwisetable<T extends object>({
  data,
  columns,
  filterOptions = [],
  filterKey,
  classname,
  title,
  submitbutton,
  inputfiled,
  groupByKey,
  colspanKeys = [],
}: Props<T>) {
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

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

    return Object.entries(grouped).map(([groupKey, items]) => ({
      groupKey,
      items,
      count: items.length
    }));
  }, [data, groupByKey]);

  // Flatten grouped data for display
  const displayData = useMemo((): ExtendedData<T>[] => {
    if (!groupByKey) return data as ExtendedData<T>[];
    
    return groupedData.flatMap((group: GroupedData<T>) => 
      group.items.map((item: T, index: number): ExtendedData<T> => ({
        ...item,
        _isFirstInGroup: index === 0,
        _groupCount: group.count,
        _groupKey: group.groupKey
      }))
    );
  }, [groupedData, groupByKey]);

  // Make sure to include perPage and currentPage in the dependency array!
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
          col.accessor ? String(row[col.accessor] ?? "") : "",
        cell: (row: ExtendedData<T>) => {
          // For colspan keys, only show on first row of group
          if (groupByKey && isColspanKey && !row._isFirstInGroup) {
            return null;
          }
          
          return col.render
            ? col.render?.(row)
            : (col.accessor ? String(row[col.accessor]) : "");
        },
        sortable: true,
        ignoreRowClick: isColspanKey,
      };
    });

    return [...baseColumns, ...mappedColumns];
  }, [columns, perPage, currentPage, groupByKey, colspanKeys]);

  const filteredData = useMemo((): ExtendedData<T>[] => {
    let tempData = [...displayData];

    // Filter by dropdown value
    if (filter && filterKey) {
      tempData = tempData.filter(
        (row) => String(row[filterKey]) === String(filter)
      );
    }

    // Global search across all keys
    if (search) {
      tempData = tempData.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    return tempData;
  }, [displayData, filter, filterKey, search]);

  const SubHeaderComponent = (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-2 flex-1">
        {filterOptions.length > 0 && filterKey && (
          <select
            className="border rounded px-3 py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All</option>
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        <input
          type="text"
          placeholder="Search..."
          className="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow md:w-auto flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="w-full md:w-auto">
        <FormInModal
          inputfiled={inputfiled}
          title={title}
          submitbutton={submitbutton}
          classname={classname}
        />
      </div>
    </div>
  );

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
              {filteredData.map((row: ExtendedData<T>, index: number) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                  {/* Sr No */}
                  {row._isFirstInGroup ? (
                    <td 
                      rowSpan={row._groupCount} 
                      className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-center font-medium"
                      style={{ verticalAlign: 'top' }}
                    >
                      {(perPage * (currentPage - 1)) + index + 1}
                    </td>
                  ) : null}
                  
                  {/* Other columns */}
                  {columns.map((col) => {
                    const isColspanKey = colspanKeys.includes(col.key as keyof T);
                    const cellValue = col.render ? col.render(row) : (col.accessor ? String(row[col.accessor]) : "");
                    
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Original DataTable for non-grouped data
  return (
    <div className="bg-white rounded-2xl shadow-md  border p-4">
      <DataTable
        columns={reactColumns}
        data={filteredData}
        pagination
        paginationPerPage={perPage}
        paginationDefaultPage={currentPage}
        onChangePage={page => setCurrentPage(page)}
        onChangeRowsPerPage={newPerPage => {
          setPerPage(newPerPage);
          setCurrentPage(1); // Reset to first page when page size changes
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
              minHeight: "48px",
            },
          },
         headCells: {
        style: {
          fontWeight: "600",
          // fontSize: "14px",
          border: "1px solid #ddd",
          // borderTop: "white",
          // borderLeft: "white",
          // borderRight: "white",
        },
      },
      cells: {
        style: {
          border: "1px solid #ddd",
          // borderTop: "white",
          // borderLeft: "white",
          // borderRight: "white",
        },
      },
    }}
      />
    </div>
  );
}