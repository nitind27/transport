import BreadcrumbsBtn from '@/components/common/BreadcrumbsBtn';
// import AddSchoolswiseorder from '@/components/Zporderdetails/AddSchoolswiseorder'
import OrderRegister from '@/components/Zporderdetails/OrderRegister';
// import ZPorderdetails from '@/components/Zporderdetails/ZPorderdetails'
import React from 'react'

const page = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Order Register', href: '/orderregister' },

  ];
  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <BreadcrumbsBtn
          title="Order Register"
          breadcrumbs={breadcrumbItems}
        />
        <OrderRegister />
      </div>
    </div>
  )
}

export default page