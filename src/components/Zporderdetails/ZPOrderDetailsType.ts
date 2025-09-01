export interface ZPOrderDetail {
  id: number;
  order_no: string;
  no_of_days: number;
  period: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ZPOrderDetailFormData {
  order_no: string;
  no_of_days: number | '';
  period: string;
}

export interface FormErrors {
  order_no?: string;
  no_of_days?: string;
  period?: string;
}
