export interface Taluka {
    taluka_id: number;
    village_id: number;
    center_id: number;
    schoolid : number;
    dist_id: number;
    district_id: number;
    name: string;
    name_en: string;
    districtname: string;
    villagename: string;
    centername: string;
    status: string;
    talukaname: string;
    marathi_name: string;
    district: string;
    center: string;
    schoolname: string;
    udaisno: string;
}

export interface ItemGraintype {
    id: number;
    name: string;
    Unit: string;
    status: string;
};

export interface Ownertype {
    id: number;
    name: string;
    status: string;
};