export interface FarmdersType {
  farmer_id: number;
  name: string;
  adivasi: string;
  village_id: string;
  taluka_id: string;
  gat_no: string;
  vanksetra: string;
  nivas_seti: string;
  aadhaar_no: string;
  contact_no: string;
  email: string;
  kisan_id: string;
  documents: string;
  schemes: string;
  genger: string;
  dob: string;
  profile_photo: string;
  status: string;
  schedule_j: string;
  gis: string;
}

export interface FarmdersTypess {
  data: FarmdersType[];
}