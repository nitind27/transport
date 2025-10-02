"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Column, FilterOption } from "./tabletype";
// import FormInModal from "../example/ModalExample/FormInModal";

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
  const [activeSearchColumn, setActiveSearchColumn] = useState<string | null>(null);
  const [tempSearchValue, setTempSearchValue] = useState<string>("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isGrouped = useMemo(() => !!groupByKey || (groupByKeys && groupByKeys.length > 0), [groupByKey, groupByKeys]);

  const isSearchable = (key: string) =>
    !searchableKeys || searchableKeys.map(String).includes(String(key));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeSearchColumn) {
        const target = event.target as HTMLElement;
        const isClickInsideSearch = searchInputRef.current?.contains(target);
        const isClickInsideHeader = headerRefs.current[activeSearchColumn]?.contains(target);
        if (!isClickInsideSearch && !isClickInsideHeader) {
          if (tempSearchValue.trim()) {
            handleColumnSearch(activeSearchColumn, tempSearchValue);
          } else {
            clearColumnSearch(activeSearchColumn);
          }
          setActiveSearchColumn(null);
          setTempSearchValue("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeSearchColumn, tempSearchValue]);

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

  const groupedFiltered = useMemo(() => {
    let list = groupedData;
    if (filter && filterKey) {
      list = list.filter(g => g.items.some(it => String((it)[filterKey]) === String(filter)));
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(g => g.items.some(it => Object.values(it).some(v => String(v).toLowerCase().includes(s))));
    }
    const allSearches: Record<string, string> = { ...columnSearches };
    if (activeSearchColumn && tempSearchValue.trim() && isSearchable(activeSearchColumn)) {
      allSearches[activeSearchColumn] = tempSearchValue;
    }
    Object.entries(allSearches).forEach(([columnKey, searchValue]) => {
      if (!isSearchable(columnKey)) return;
      if (searchValue.trim()) {
        const s = searchValue.toLowerCase();
        list = list.filter(g =>
          g.items.some(it => {
            const column = columns.find(col => String(col.key) === columnKey);
            if (!column) return false;
            if (column.accessor) {
              return String((it)[column.accessor] ?? "").toLowerCase().includes(s);
            }
            return false;
          })
        );
      }
    });
    return list;
  }, [groupedData, filter, filterKey, search, columnSearches, columns, activeSearchColumn, tempSearchValue]);

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
      const s = search.toLowerCase();
      tempData = tempData.filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(s)));
    }
    const allSearches: Record<string, string> = { ...columnSearches };
    if (activeSearchColumn && tempSearchValue.trim() && isSearchable(activeSearchColumn)) {
      allSearches[activeSearchColumn] = tempSearchValue;
    }
    Object.entries(allSearches).forEach(([columnKey, searchValue]) => {
      if (!isSearchable(columnKey)) return;
      if (searchValue.trim()) {
        const s = searchValue.toLowerCase();
        const column = columns.find(col => String(col.key) === columnKey);
        if (column && column.accessor) {
          tempData = tempData.filter(row => String(row[column.accessor!] ?? "").toLowerCase().includes(s));
        }
      }
    });
    return tempData;
  }, [displayData, data, filter, filterKey, search, isGrouped, columnSearches, columns, activeSearchColumn, tempSearchValue]);

  const handleColumnSearch = (columnKey: string, value: string) => {
    setColumnSearches(prev => ({ ...prev, [columnKey]: value }));
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

  const handleHeaderClick = (columnKey: string) => {
    if (!isSearchable(columnKey)) return;
    if (activeSearchColumn === columnKey) {
      setActiveSearchColumn(null);
      setTempSearchValue("");
    } else {
      setActiveSearchColumn(columnKey);
      setTempSearchValue(columnSearches[columnKey] || "");
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, columnKey: string) => {
    if (e.key === "Enter") {
      handleColumnSearch(columnKey, tempSearchValue);
      setActiveSearchColumn(null);
      setTempSearchValue("");
    } else if (e.key === "Escape") {
      setActiveSearchColumn(null);
      setTempSearchValue("");
    }
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

  if (groupByKey || (groupByKeys && groupByKeys.length)) {
    // const totalPages = Math.max(1, Math.ceil(totalGroups / perPage));
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
                  const isSearchActive = searchable && activeSearchColumn === columnKey;
                  const hasSearchValue = searchable && columnSearches[columnKey];
                  const isFiltering = isSearchActive && tempSearchValue.trim();
                  return (
                    <th
                      key={columnKey}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border border-gray-200 dark:border-gray-700 relative"
                    >
                      <div
                        ref={(el) => {
                          headerRefs.current[columnKey] = el;
                        }}
                        className={`flex items-center justify-between ${searchable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" : ""
                          } rounded px-2 py-1 -mx-2 -my-1`}
                        onClick={() => searchable && handleHeaderClick(columnKey)}
                      >
                        {isSearchActive ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              ref={searchInputRef}
                              type="text"
                              placeholder={`Search in ${col.label}...`}
                              value={tempSearchValue}
                              onChange={(e) => setTempSearchValue(e.target.value)}
                              onKeyDown={(e) => handleSearchKeyPress(e, columnKey)}
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              autoFocus
                            />
                            {(hasSearchValue || isFiltering) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearColumnSearch(columnKey);
                                  setActiveSearchColumn(null);
                                  setTempSearchValue("");
                                }}
                                className="text-red-500 hover:text-red-700 text-xs"
                                title="Clear search"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-1">
                            <span className="flex-1">{col.label}</span>
                            {searchable && (hasSearchValue || isFiltering) && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                {isFiltering ? "Filtering..." : "Filtered"}
                              </span>
                            )}
                            {searchable && <span className="text-gray-400 text-xs">🔍</span>}
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((row: ExtendedData<T>, index: number) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}>
                  {row._isFirstInGroup ? (
                    <td
                      rowSpan={row._groupCount}
                      className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-center font-medium"
                      style={{ verticalAlign: "top" }}
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
                          className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-center"
                          style={{ verticalAlign: "top" }}
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
              minHeight: "48px",
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