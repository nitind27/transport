export interface ZPOrderDetail {
  id: number;
  order_no: string;
  no_of_days: number;
  period: string;
  status: string;
  created_at: string;
  updated_at: string;
  financial_year: string;
}

export interface ZPOrderDetailFormData {
  order_no: string;
  no_of_days: number | '';
  period: string;
  financial_year: string;
}

export interface FormErrors {
  order_no?: string;
  no_of_days?: string;
  period?: string;
  financial_year?: string;
}
