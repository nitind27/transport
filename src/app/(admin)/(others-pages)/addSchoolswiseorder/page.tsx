import Breadcrumbs from '@/components/common/BreadcrumbItem'
import AddSchoolswiseorder from '@/components/Zporderdetails/AddSchoolswiseorder'
// import ZPorderdetails from '@/components/Zporderdetails/ZPorderdetails'
import React from 'react'

const page = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Add Schools Wise Order Detials', href: '/addSchoolswiseorder' },

  ];
  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <Breadcrumbs
          title="Add Schools Wise Order Detials"
          breadcrumbs={breadcrumbItems}
        />
        <AddSchoolswiseorder />
      </div>
    </div>
  )
}

export default page