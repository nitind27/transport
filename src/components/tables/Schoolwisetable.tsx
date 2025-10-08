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
  groupByKey?: keyof T;
  groupByKeys?: (keyof T)[]; // allow multiple keys
  colspanKeys?: (keyof T | string)[];
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
  groupByKeys, // <-- add this
  colspanKeys = [],
}: Props<T>) {
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const isGrouped = useMemo(() => !!groupByKey || (groupByKeys && groupByKeys.length > 0), [groupByKey, groupByKeys]);

  // Group data
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
      count: items.length
    }));
  }, [data, groupByKey, groupByKeys]);

  // Filter + search applied AFTER grouping (preserves group integrity)
  const groupedFiltered = useMemo(() => {
    let list = groupedData;
    if (filter && filterKey) {
      list = list.filter(g => g.items.some(it => String((it)[filterKey]) === String(filter)));
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(g =>
        g.items.some(it => Object.values(it).some(v => String(v).toLowerCase().includes(s)))
      );
    }
    return list;
  }, [groupedData, filter, filterKey, search]);

  const totalGroups = groupedFiltered.length;

  // Paginate by group
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
        ...item,
        _isFirstInGroup: index === 0,
        _groupCount: group.count,
        _groupKey: group.groupKey
      }))
    );
  }, [pagedGrouped, isGrouped, data]);

  // SR number per visible group with page offset
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
          if (!isGrouped) return (perPage * (currentPage - 1)) + index + 1;
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
        selector: (row: T) =>
          col.accessor ? String(row[col.accessor] ?? "") : "",
        cell: (row: ExtendedData<T>) => {
          if (isGrouped && isColspanKey && !row._isFirstInGroup) {
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

  }, [columns, perPage, currentPage, isGrouped, colspanKeys, groupSerialMap]);

  const filteredData = useMemo((): ExtendedData<T>[] => {
    if (isGrouped) return displayData;
    let tempData = [...(data as ExtendedData<T>[])];

    if (filter && filterKey) {
      tempData = tempData.filter(
        (row) => String((row)[filterKey]) === String(filter)
      );
    }

    if (search) {
      tempData = tempData.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    return tempData;
  }, [displayData, data, filter, filterKey, search, isGrouped]);

  const SubHeaderComponent = (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-2 flex-1">
        {filterOptions.length > 0 && filterKey && (
          <select
            className="border rounded px-3 py-2"
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
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
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
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


  if ((groupByKey) || (groupByKeys && groupByKeys.length)) {
    const totalPages = Math.max(1, Math.ceil(totalGroups / perPage));

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
                  {row._isFirstInGroup ? (
                    <td
                      rowSpan={row._groupCount}
                      className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-center font-medium"
                      style={{ verticalAlign: 'top' }}
                    >
                      {groupSerialMap.get(row._groupKey || "") ?? 0}
                    </td>
                  ) : null}

                  {columns.map((col) => {
                    const isColspanKey = colspanKeys.map(String).includes(String(col.key));
                    const cellValue = (col).render ? (col).render(row) : ((col).accessor ? String((row)[(col).accessor]) : "");

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

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600 dark:text-white/70">
            Showing groups {(totalGroups === 0) ? 0 : ((currentPage - 1) * perPage + 1)}-
            {Math.min(currentPage * perPage, totalGroups)} of {totalGroups}
          </div>
          <div className="flex items-center gap-3">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="text-sm">{currentPage} / {totalPages}</span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
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
              minHeight: "28px",
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