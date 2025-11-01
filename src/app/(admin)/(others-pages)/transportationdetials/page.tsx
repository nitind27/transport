import Transportationdetials from "@/components/Transportdetails/Transportationdetials";
import Breadcrumbs from "@/components/common/BreadcrumbItem";

export default function TransportationDetailsPage() {
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Transportation Details', href: '/transportationdetials' },
    ];
    return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
        <Breadcrumbs title="Transportation Details" breadcrumbs={breadcrumbItems} />
            <Transportationdetials />
        </div>
        </div>
    
    );
}