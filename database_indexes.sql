-- Database indexes to optimize routeview pagination query performance

-- Index for dispatch_details table - main filtering columns
CREATE INDEX idx_dispatch_details_created_status_company ON dispatch_details(created_at, status, company_id);
CREATE INDEX idx_dispatch_details_created_school ON dispatch_details(created_at, school_id);
CREATE INDEX idx_dispatch_details_dispatch_code ON dispatch_details(dispatch_code);
CREATE INDEX idx_dispatch_details_order_id ON dispatch_details(order_id);

-- Index for schooldata table - frequently joined columns
CREATE INDEX idx_schooldata_schoolid_taluka_company ON schooldata(schoolid, taluka_id, company_id);
CREATE INDEX idx_schooldata_taluka_id ON schooldata(taluka_id);

-- Index for route_paper table - route number lookups
CREATE INDEX idx_route_paper_dispatch_code_route ON route_paper(dispatch_code, route_number);
CREATE INDEX idx_route_paper_route_number ON route_paper(route_number);

-- Index for school_wise_order_details - financial year filtering
CREATE INDEX idx_school_wise_school_financial ON school_wise_order_details(school_id, financial_year);

-- Index for zp_order_details - order lookups
CREATE INDEX idx_zp_order_details_id_financial ON zp_order_details(id, financial_year);

-- Index for taluka table
CREATE INDEX idx_taluka_taluka_id ON taluka(taluka_id);

-- Index for centerdata table
CREATE INDEX idx_centerdata_center_id ON centerdata(center_id);

-- Index for truckdata table
CREATE INDEX idx_truckdata_id ON truckdata(id);

-- Composite index for the complex WHERE condition
CREATE INDEX idx_dispatch_details_composite ON dispatch_details(
    created_at,
    status,
    school_id,
    company_id,
    dispatch_code,
    order_id,
    center_id,
    truck_id
);
