// types.ts
export interface Column<T> {
    key: keyof T | string;       // Unique identifier
    label: string;               // Display header
    render?: (data: T) => React.ReactNode; // Custom renderer
    accessor?: keyof T; 
    // width:string         // Data property accessor
  }
  
  export interface FilterOption {
    value: string;
    label: string;
  }
  
