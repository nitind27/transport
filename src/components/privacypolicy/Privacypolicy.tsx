import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md my-10">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy for SE (Scheme Saturation Tracking System)</h1>
      <p className="text-sm text-gray-500 mb-6">Last Updated: May 01 2025</p>
      <p className="text-sm text-gray-500 mb-6">Developed by: WeClocks Technology Private Limited</p>
      <p className="text-sm text-gray-500 mb-6">Location: Nandurbar District, Maharashtra, India</p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Introduction</h2>
        <p className="text-gray-700">
          SE is a mobile application developed under the directive of the Government of Maharashtra to facilitate the monitoring and delivery of government schemes to Individual Forest Rights (IFR) beneficiaries in the Nandurbar district. This Privacy Policy outlines how we collect, use, and protect your information.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Personal Information: Name, Contact Number, Aadhaar Number, Caste Category, Gender, Address, and other details required for scheme eligibility and verification.</li>
          <li>Location Data: GPS location is used to map land plots and geo-tag visits.</li>
          <li>Photographs: Captured during field visits for verification purposes, tagged with location metadata.</li>
          <li>Survey Information: Data on challenges, needs, and services availed by beneficiaries.</li>
          <li>All data is collected only from authorized government staff during official field visits.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">How We Use Your Information</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Identifying and mapping IFR beneficiaries.</li>
          <li>Monitoring the implementation of various government schemes.</li>
          <li>Supporting inter-departmental coordination.</li>
          <li>Ensuring full saturation and inclusion in welfare programs.</li>
          <li>No data is sold, rented, or shared for commercial purposes.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Sharing and Access</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Accessed only by authorized personnel from relevant government departments.</li>
          <li>Not shared with third parties unless legally mandated or authorized by the Government of Maharashtra.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Security</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Role-based access control.</li>
          <li>Encrypted communication and data storage.</li>
          <li>Regular audits and monitoring of data usage.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">User Rights and Consent</h2>
        <p className="text-gray-700">
          By using this application, authorized users consent to data collection strictly for government program implementation. All users are trained and bound by confidentiality and data handling protocols.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Third-Party Services</h2>
        <p className="text-gray-700">
          This application does not use any third-party analytics, advertisements, or cloud services not approved by the government.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Children’s Privacy</h2>
        <p className="text-gray-700">
          This app is not intended for use by children or the general public. It is a restricted-use app for authorized government staff only.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Changes to This Policy</h2>
        <p className="text-gray-700">
          We may update this Privacy Policy from time to time. Users will be notified of any significant changes through official channels.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>District Collectorate, Nandurbar</li>
          <li>Government of Maharashtra</li>
          <li>Email: weclocks@gmail.com</li>
          <li>Phone: +91 8000272989/9913061946</li>
        </ul>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
