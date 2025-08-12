


import Loader from '@/common/Loader';
import Breadcrumbs from '@/components/common/BreadcrumbItem'
import { Grampanchayattype } from '@/components/grampanchayat/gptype';
// import PinCodeAddress from '@/components/PinCodeAddress';
import { Schemesdatas } from '@/components/schemesdata/schemes';
import Bhautikadata from '@/components/schemeserve/Bhautikadata';
// import Bhautikadatafilter from '@/components/schemeserve/Bhautikadatafilter';
import { BhautikDataall } from '@/components/schemeserve/Bhautikdatatype';
import { Taluka } from '@/components/Taluka/Taluka';
import { Village } from '@/components/Village/village';
// import Documentsdata from '@/components/Documentsdata/Documentsdata'
import React, { Suspense } from 'react'

const getUsers = async (): Promise<BhautikDataall[]> => {
  const res = await fetch(`https://schemeserve.weclocks.online/api/bhautikapi`, { cache: 'no-store' });
  return res.json();
};
const getschemescrud = async (): Promise<Schemesdatas[]> => {

  const schemescrud = await fetch(`https://schemeserve.weclocks.online/api/schemescrud`, { cache: 'no-store' });
  // console.log("reess", res)
  return schemescrud.json();

};

const gettalukadata = async (): Promise<Taluka[]> => {

  const schemescrud = await fetch(`https://schemeserve.weclocks.online/api/taluka`, { cache: 'no-store' });
  // console.log("reess", res)
  return schemescrud.json();

};
const gettalukvillage = async (): Promise<Village[]> => {

  const schemescrud = await fetch(`https://schemeserve.weclocks.online/api/villages`, { cache: 'no-store' });
  // console.log("reess", res)
  return schemescrud.json();

};
const getgrampanchayat = async (): Promise<Grampanchayattype[]> => {

  const schemescrud = await fetch(`https://schemeserve.weclocks.online/api/grampanchayt`, { cache: 'no-store' });
  // console.log("reess", res)
  return schemescrud.json();

};

const page = async () => {

  const [users] = await Promise.all([
    getUsers(),

  ]);
  const [schemescrud] = await Promise.all([
    getschemescrud(),

  ]);
  const [talukadata] = await Promise.all([
    gettalukadata(),

  ]);
  const [villagedata] = await Promise.all([
    gettalukvillage(),

  ]);
  const [getgrampanchayatdata] = await Promise.all([
    getgrampanchayat(),

  ]);
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'धरती आबा ( भौतिक तक्ता)', href: '/bhautik' },

  ];
  // console.log("users", users)
  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <Suspense fallback={<Loader />}>
          <Breadcrumbs
            title="धरती आबा ( भौतिक तक्ता)"
            breadcrumbs={breadcrumbItems}
          />
          <Bhautikadata initialdata={users} schemescrud={schemescrud} talukadata={talukadata} villagedata={villagedata} getgrampanchayatdata={getgrampanchayatdata}/>
          {/* <Bhautikadatafilter initialdata={users} schemescrud={schemescrud} talukadata={talukadata} villagedata={villagedata} getgrampanchayatdata={getgrampanchayatdata}/> */}
          {/* <PinCodeAddress /> */}
        </Suspense>

      </div>
    </div>
  )
}

export default page
