// import { signOut } from "../../auth";

// export async function logout() {
//     const res = await signOut();
//     return res;
//   }

export const formatDate = (dateString: string): string => {
    // Create a Date object from the input string
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
        // If the date is invalid, return a fallback string or handle as needed
        return "Invalid Date"; // or return an empty string, etc.
    }
    
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    };
  
    // Return the formatted date as a string
    return date.toLocaleDateString('en-IN', options);
};


export const formatDateToDDMMYYYY = (dateString: string | undefined | null): string =>{
    if (!dateString) return '';
    const date: Date = new Date(dateString);   // `Date` type here
    if (isNaN(date.getTime())) return '';      // Invalid date check
    const day: string = String(date.getDate()).padStart(2, '0');
    const month: string = String(date.getMonth() + 1).padStart(2, '0');
    const year: number = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  