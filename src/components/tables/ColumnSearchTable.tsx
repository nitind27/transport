"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Column, FilterOption } from "./tabletype";
// import FormInModal from "../example/ModalExample/FormInModal";
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';

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
  groupByKey?: keyof T;
  groupByKeys?: (keyof T)[];
  colspanKeys?: (keyof T | string)[];
  searchableKeys?: (keyof T | string)[];
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

interface DatePickerRefs {
  [key: string]: flatpickr.Instance | null;
}

export function ColumnSearchTable<T extends object>({
  data,
  columns,
  filterOptions = [],
  filterKey,
  groupByKey,
  groupByKeys,
  colspanKeys = [],
  searchableKeys,
}: Props<T>) {
  const [filter, setFilter] = useState("");
  const [search] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [columnSearches, setColumnSearches] = useState<Record<string, string>>({});
  
  // Add date picker refs
  const datePickerRefs = useRef<DatePickerRefs>({});
  const searchInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isGrouped = useMemo(() => !!groupByKey || (groupByKeys && groupByKeys.length > 0), [groupByKey, groupByKeys]);

  const isSearchable = (key: string) =>
    !searchableKeys || searchableKeys.map(String).includes(String(key));

  // Debounce function for better performance
  // const useDebounce = (value: string, delay: number) => {
  //   const [debouncedValue, setDebouncedValue] = useState(value);

  //   useEffect(() => {
  //     const handler = setTimeout(() => {
  //       setDebouncedValue(value);
  //     }, delay);

  //     return () => {
  //       clearTimeout(handler);
  //     };
  //   }, [value, delay]);

  //   return debouncedValue;
  // };

  const groupedData = useMemo((): GroupedData<T>[] => {
    const hasMulti = Array.isArray(groupByKeys) && groupByKeys.length > 0;
    const hasSingle = !!groupByKey;
    if (!hasMulti && !hasSingle) return [];
    const grouped = data.reduce((acc, item) => {
      const key = hasMulti
        ? groupByKeys!.map(k => String((item)[k] ?? "")).join("|")
        : String((item)[groupByKey as keyof T] ?? "");
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);
    return Object.entries(grouped).map(([groupKey, items]) => ({
      groupKey,
      items,
      count: items.length,
    }));
  }, [data, groupByKey, groupByKeys]);

  // Use debounced column searches for better performance
  const debouncedColumnSearches = useMemo(() => {
    const debounced: Record<string, string> = {};
    Object.entries(columnSearches).forEach(([key, value]) => {
      debounced[key] = value;
    });
    return debounced;
  }, [columnSearches]);

  const groupedFiltered = useMemo(() => {
    let list = groupedData;
    if (filter && filterKey) {
      list = list.filter(g => g.items.some(it => String((it)[filterKey]) === String(filter)));
    }
    if (search) {
      const s = search;
      list = list.filter(g => g.items.some(it => Object.values(it).some(v => String(v).includes(s))));
    }
    
    Object.entries(debouncedColumnSearches).forEach(([columnKey, searchValue]) => {
      if (!isSearchable(columnKey)) return;
      if (searchValue) {
        const s = searchValue;
        list = list.filter(g =>
          g.items.some(it => {
            const column = columns.find(col => String(col.key) === columnKey);
            if (!column) return false;
            
            // Get the actual value from the row
            let cellValue = "";
            if (column.accessor) {
              cellValue = String((it)[column.accessor] ?? "");
            } else if (column.render) {
              // For columns with custom render, we need to get the raw data
              const rawValue = (it)[column.key as keyof T];
              cellValue = String(rawValue ?? "");
            } else {
              // Fallback to direct key access
              const rawValue = (it)[column.key as keyof T];
              cellValue = String(rawValue ?? "");
            }
            
            // Perform case-insensitive search with trimmed values
            return cellValue.includes(s);
          })
        );
      }
    });
    return list;
  }, [groupedData, filter, filterKey, search, debouncedColumnSearches, columns]);

  const totalGroups = groupedFiltered.length;

  const pagedGrouped = useMemo(() => {
    if (!isGrouped) return [];
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    return groupedFiltered.slice(start, end);
  }, [groupedFiltered, currentPage, perPage, isGrouped]);

  const displayData = useMemo((): ExtendedData<T>[] => {
    if (!isGrouped) return data as ExtendedData<T>[];
    return pagedGrouped.flatMap((group: GroupedData<T>) =>
      group.items.map((item: T, index: number): ExtendedData<T> => ({
        ...(item),
        _isFirstInGroup: index === 0,
        _groupCount: group.count,
        _groupKey: group.groupKey,
      }))
    );
  }, [pagedGrouped, isGrouped, data]);

  const groupSerialMap = useMemo(() => {
    const map = new Map<string, number>();
    const base = (currentPage - 1) * perPage;
    pagedGrouped.forEach((group, idx) => map.set(group.groupKey, base + idx + 1));
    return map;
  }, [pagedGrouped, currentPage, perPage]);

  const reactColumns = useMemo(() => {
    const baseColumns = [
      {
        name: "SR No.",
        cell: (row: ExtendedData<T>, index: number) => {
          if (!isGrouped) return perPage * (currentPage - 1) + index + 1;
          if (!row._isFirstInGroup) return null;
          return groupSerialMap.get(row._groupKey || "") ?? 0;
        },
        width: "80px",
        ignoreRowClick: true,
      },
    ];
    const mappedColumns = columns.map((col) => {
      const isColspanKey = colspanKeys.map(String).includes(String(col.key));
      return {
        name: col.label,
        selector: (row: T) => (col.accessor ? String((row)[col.accessor] ?? "") : ""),
        cell: (row: ExtendedData<T>) => {
          if (isGrouped && isColspanKey && !row._isFirstInGroup) return null;
          return col.render ? col.render?.(row) : col.accessor ? String((row)[col.accessor]) : "";
        },
        sortable: true,
        ignoreRowClick: isColspanKey,
      };
    });
    return [...baseColumns, ...mappedColumns];
  }, [columns, perPage, currentPage, isGrouped, colspanKeys, groupSerialMap]);

  const filteredData = useMemo((): ExtendedData<T>[] => {
    if (isGrouped) return displayData;
    let tempData = [...(data as ExtendedData<T>[])];
    if (filter && filterKey) {
      tempData = tempData.filter(row => String((row)[filterKey]) === String(filter));
    }
    if (search) {
      const s = search;
      tempData = tempData.filter(row => Object.values(row).some(value => String(value).includes(s)));
    }
    
    Object.entries(debouncedColumnSearches).forEach(([columnKey, searchValue]) => {
      if (!isSearchable(columnKey)) return;
      if (searchValue) {
        const s = searchValue;
        const column = columns.find(col => String(col.key) === columnKey);
        if (column) {
          tempData = tempData.filter(row => {
            // Get the actual value from the row
            let cellValue = "";
            if (column.accessor) {
              cellValue = String(row[column.accessor!] ?? "");
            } else if (column.render) {
              // For columns with custom render, we need to get the raw data
              const rawValue = row[column.key as keyof T];
              cellValue = String(rawValue ?? "");
            } else {
              // Fallback to direct key access
              const rawValue = row[column.key as keyof T];
              cellValue = String(rawValue ?? "");
            }
            
            // Perform case-insensitive search with trimmed values
            return cellValue.includes(s);
          });
        }
      }
    });
    return tempData;
  }, [displayData, data, filter, filterKey, search, isGrouped, debouncedColumnSearches, columns]);

  const handleColumnSearch = (columnKey: string, value: string) => {
    setColumnSearches(prev => {
      const newSearches = { ...prev };
      const trimmedValue = value;
      if (trimmedValue) {
        newSearches[columnKey] = trimmedValue;
      } else {
        delete newSearches[columnKey];
      }
      return newSearches;
    });
    setCurrentPage(1);
  };

  const clearColumnSearch = (columnKey: string) => {
    setColumnSearches(prev => {
      const next = { ...prev };
      delete next[columnKey];
      return next;
    });
    setCurrentPage(1);
  };

  const handleSearchChange = (columnKey: string, value: string) => {
    // Real-time filtering - update immediately with trimmed value
    handleColumnSearch(columnKey, value);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, columnKey: string) => {
    if (e.key === "Escape") {
      clearColumnSearch(columnKey);
    }
  };

  // Add function to check if column is a date column
  const isDateColumn = (columnKey: string) => {
    return columnKey.includes('date') || 
           columnKey.includes('created_at') || 
           columnKey.includes('updated_at');
  };

  // Add function to initialize date picker
  const initializeDatePicker = (columnKey: string, inputElement: HTMLInputElement) => {
    if (datePickerRefs.current[columnKey]) {
      datePickerRefs.current[columnKey]?.destroy();
    }

    const flatPickr = flatpickr(inputElement, {
      dateFormat: "Y-m-d",
      defaultDate: columnSearches[columnKey] ? new Date(columnSearches[columnKey]) : undefined,
      onChange: function (selectedDates, dateStr) {
        handleSearchChange(columnKey, dateStr);
      },
      static: false,  // Changed from true to false
      monthSelectorType: "dropdown",  // Changed from "static" to "dropdown"
      enableTime: false,
      allowInput: true,
      clickOpens: true,
      position: "auto",  // Add this for better positioning
      locale: {
        firstDayOfWeek: 1
      }
    });

    datePickerRefs.current[columnKey] = flatPickr;
  };

  const SubHeaderComponent = (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-2 flex-1">
        {filterOptions.length > 0 && filterKey && (
          <select
            className="border rounded px-3 py-2"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All</option>
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        {/* <input
          type="text"
          placeholder="Search..."
          className="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow md:w-auto flex-1"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        /> */}
      </div>

      {/* <div className="w-full md:w-auto">
        <FormInModal inputfiled={inputfiled} title={title} submitbutton={submitbutton} classname={classname} />
      </div> */}
    </div>
  );

  // Add cleanup effect at the end of the component
  useEffect(() => {
    return () => {
      // Cleanup all date picker instances
      Object.values(datePickerRefs.current).forEach(instance => {
        if (instance) {
          instance.destroy();
        }
      });
    };
  }, []);

  if (groupByKey || (groupByKeys && groupByKeys.length)) {
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
                {columns.map((col) => {
                  const columnKey = String(col.key);
                  const searchable = isSearchable(columnKey);
                  const hasSearchValue = searchable && columnSearches[columnKey];
                  
                  return (
                    <th
                      key={columnKey}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-200 dark:border-gray-700 relative"
                    >
                      <div className="flex flex-col gap-1">
                        {/* Column Label */}
                        <div className="flex items-center justify-between">
                          <span className="font-semibold whitespace-nowrap">{col.label}</span>
                          {searchable && hasSearchValue && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              Filtered
                            </span>
                          )}
                        </div>
                        
                        {/* Search Input - Always visible for searchable columns */}
                        {searchable && (
                          <div className="flex items-center gap-1">
                            {isDateColumn(columnKey) ? (
                              <div className="relative flex-1">
                                <input
                                  ref={(el) => {
                                    searchInputRefs.current[columnKey] = el;
                                    if (el && isDateColumn(columnKey)) {
                                      // Initialize date picker after ref is set
                                      setTimeout(() => initializeDatePicker(columnKey, el), 0);
                                    }
                                  }}
                                  type="text"
                                  placeholder="Select Date..."
                                  value={columnSearches[columnKey] || ""}
                                  onChange={(e) => handleSearchChange(columnKey, e.target.value)}
                                  onKeyDown={(e) => handleSearchKeyPress(e, columnKey)}
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full"
                                  readOnly
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (datePickerRefs.current[columnKey]) {
                                      datePickerRefs.current[columnKey]?.open();
                                    }
                                  }}
                                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                                  title="Open calendar"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <input
                                ref={(el) => {
                                  searchInputRefs.current[columnKey] = el;
                                }}
                                type="text"
                                placeholder={`Search...`}
                                value={columnSearches[columnKey] || ""}
                                onChange={(e) => handleSearchChange(columnKey, e.target.value)}
                                onKeyDown={(e) => handleSearchKeyPress(e, columnKey)}
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full"
                              />
                            )}
                            {hasSearchValue && (
                              <button
                                onClick={() => {
                                  clearColumnSearch(columnKey);
                                  // Clear date picker if it's a date column
                                  if (isDateColumn(columnKey) && datePickerRefs.current[columnKey]) {
                                    datePickerRefs.current[columnKey]?.clear();
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 text-xs p-1"
                                title="Clear search"
                                type="button"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 ">
              {filteredData.map((row: ExtendedData<T>, index: number) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}>
                  {row._isFirstInGroup ? (
                    <td
                      rowSpan={row._groupCount}
                      className="px-0 py-0 whitespace-nowrap text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-center font-medium"
                      // style={{ verticalAlign: "top" }}
                    >
                      {groupSerialMap.get(row._groupKey || "") ?? 0}
                    </td>
                  ) : null}
                  {columns.map((col) => {
                    const isColspanKey = colspanKeys.map(String).includes(String(col.key));
                    const cellValue = col.render ? col.render(row) : col.accessor ? String((row)[col.accessor]) : "";
                    if (isColspanKey && !row._isFirstInGroup) return null;
                    if (isColspanKey && row._isFirstInGroup) {
                      return (
                        <td
                          key={String(col.key)}
                          rowSpan={row._groupCount}
                          className="px-0 py-0 whitespace-nowrap text-[12px] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-center"
                          // style={{ verticalAlign: "top" }}
                        >
                          {cellValue}
                        </td>
                      );
                    }
                    return (
                      <td key={String(col.key)} className="px-0 py-0 whitespace-nowrap text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-center">
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600 dark:text-white/70">
            Showing groups {totalGroups === 0 ? 0 : (currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, totalGroups)} of {totalGroups}
          </div>
          <div className="flex items-center gap-3">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <span className="text-sm">
              {currentPage} / {Math.max(1, Math.ceil(totalGroups / perPage))}
            </span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={currentPage >= Math.max(1, Math.ceil(totalGroups / perPage))}
              onClick={() => setCurrentPage((p) => Math.min(Math.max(1, Math.ceil(totalGroups / perPage)), p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

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