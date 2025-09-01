import ZPorderdetails from '@/components/Zporderdetails/ZPorderdetails'
import React from 'react'

const page = () => {
  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <ZPorderdetails users={[]} datavillage={[]} datataluka={[]} datausercategorycrud={[]} />
      </div>
    </div>
  )
}

export default page