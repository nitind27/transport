


import Loader from '@/common/Loader';
import Breadcrumbs from '@/components/common/BreadcrumbItem'
import { Grampanchayattype } from '@/components/grampanchayat/gptype';
import { Schemesdatas } from '@/components/schemesdata/schemes';

import {  vyaktikDataall } from '@/components/schemeserve/Bhautikdatatype';
import Vyaktigatdata from '@/components/schemeserve/Vyaktigatdata';
// import Vyaktigatdatafilter from '@/components/schemeserve/Vyaktigatdatafilter';
import { Taluka } from '@/components/Taluka/Taluka';
import { Village } from '@/components/Village/village';
// import Documentsdata from '@/components/Documentsdata/Documentsdata'
import React, { Suspense } from 'react'

const getUsers = async (): Promise<vyaktikDataall[]> => {
  const res = await fetch(`https://schemeserve.weclocks.online/api/vyaktikapi`, { cache: 'no-store' });
 
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
    { label: 'वैयक्तिक', href: '/bhautik' },

  ];
  // console.log("users", users)
  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <Suspense fallback={<Loader />}>
          <Breadcrumbs
            title="वैयक्तिक"
            breadcrumbs={breadcrumbItems}
          />
          <Vyaktigatdata initialdata={users} schemescrud={schemescrud} talukadata={talukadata} villagedata={villagedata} getgrampanchayatdata={getgrampanchayatdata}/>
          {/* <Vyaktigatdatafilter initialdata={users} schemescrud={schemescrud} talukadata={talukadata} villagedata={villagedata} getgrampanchayatdata={getgrampanchayatdata}/> */}
        </Suspense>

      </div>
    </div>
  )
}

export default page
