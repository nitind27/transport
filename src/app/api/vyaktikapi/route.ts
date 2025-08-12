import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      // 'SELECT * FROM vaykatigatdb where status = "Active"'

      `SELECT 
         vaykatigatdb.*,
         taluka.name AS taluka_name,
         village.marathi_name AS village_name,
         grampanchayat.marathi_name AS grampanchayat_name
       FROM vaykatigatdb
       LEFT JOIN taluka ON vaykatigatdb.taluka_id = taluka.taluka_id
       LEFT JOIN village ON vaykatigatdb.village_id = village.village_id
       LEFT JOIN grampanchayat ON vaykatigatdb.gp_id = grampanchayat.id
       WHERE vaykatigatdb.status = "Active"`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO vaykatigatdb (
        castdata, totalmembersname, familymembercount, agedata, castcertificate, 
        aadharcard, voteridcard, rationcard, jobcard, pmfarmercard, farmercreditcard,
        aayushmancard, headofmember, housetype,
        benefiteofpmhouse, waterdrink, hargharnal, electricity, hospitalphc,
        sanjaygandhi, studybenefite, scheme_name, farmeavilebleornot, studyvanpatta,
        sikklacelloffamily, whichschoolchlid, anyhaveaashramschool, lpggas,
        bankaccount, studtatcoop, pmvimayojna, praklpkaryalaly, itarvibhagudan,
        niymitaarogya, rationcard_no, rationcardtype, contact_no, taluka_id, village_id, gp_id, userId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.castdata,
        body.totalmembersname,
        body.familymembercount,
        body.agedata,
        body.castcertificate,
        body.aadharcard,
        body.voteridcard,
        body.rationcard,
        body.jobcard,
        body.pmfarmercard,
        body.farmercreditcard,
        body.aayushmancard,
        body.headofmember,
        body.housetype,
        body.benefiteofpmhouse,
        body.waterdrink,
        body.hargharnal,
        body.electricity,
        body.hospitalphc,
        body.sanjaygandhi,
        body.studybenefite,
        body.scheme_name,
        body.farmeavilebleornot,
        body.studyvanpatta,
        body.sikklacelloffamily,
        body.whichschoolchlid,
        body.anyhaveaashramschool,
        body.lpggas,
        body.bankaccount,
        body.studtatcoop,
        body.pmvimayojna,
        body.praklpkaryalaly,
        body.itarvibhagudan,
        body.niymitaarogya,
        body.rationcard_no,
        body.rationcardtype,
        body.contact_no,
        body.taluka_id,
        body.village_id,
        body.gp_id,
        body.userId,
      ]
    );

    return NextResponse.json({ message: 'Document category created', id: result.insertId });
  } catch (error) {
    console.error('Creation error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { id, status } = await request.json();

  if (!id || !status) {
    return NextResponse.json({ error: 'vaykati ID and status are required' }, { status: 400 });
  }

  try {
    await pool.query(
      'UPDATE vaykatigatdb SET status = ? WHERE id = ?',
      [status, id]
    );
    return NextResponse.json({ message: `vaykati ${status === 'active' ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}


export async function PUT(request: Request) {
  const body = await request.json();

  // Sabhi fields destructure karo
  const {
    id,
    castdata,
    totalmembersname,
    familymembercount,
    agedata,
    castcertificate,
    aadharcard,
    voteridcard,
    rationcard,
    jobcard,
    pmfarmercard,
    farmercreditcard,
    aayushmancard,
    headofmember,
    housetype,
    benefiteofpmhouse,
    waterdrink,
    hargharnal,
    electricity,
    hospitalphc,
    sanjaygandhi,
    studybenefite,
    scheme_name,
    farmeavilebleornot,
    studyvanpatta,
    sikklacelloffamily,
    whichschoolchlid,
    anyhaveaashramschool,
    lpggas,
    bankaccount,
    studtatcoop,
    pmvimayojna,
    praklpkaryalaly,
    itarvibhagudan,
    niymitaarogya,
    rationcard_no,
    rationcardtype,
    contact_no,
    taluka_id,
    village_id,
    gp_id,
    status
  } = body;
  console.log("idid", id)
  // Basic validation
  if (
    !id ||
    castdata === undefined ||
    totalmembersname === undefined ||
    familymembercount === undefined ||
    castcertificate === undefined ||
    aadharcard === undefined ||
    voteridcard === undefined ||
    rationcard === undefined ||
    jobcard === undefined ||
    pmfarmercard === undefined ||
    farmercreditcard === undefined ||
    aayushmancard === undefined ||
    headofmember === undefined ||
    housetype === undefined ||
    benefiteofpmhouse === undefined ||
    waterdrink === undefined ||
    hargharnal === undefined ||
    electricity === undefined ||
    hospitalphc === undefined ||
    sanjaygandhi === undefined ||
    studybenefite === undefined ||
    farmeavilebleornot === undefined ||
    studyvanpatta === undefined ||
    sikklacelloffamily === undefined ||
    whichschoolchlid === undefined ||
    anyhaveaashramschool === undefined ||
    lpggas === undefined ||
    bankaccount === undefined ||
    studtatcoop === undefined ||
    pmvimayojna === undefined ||
    praklpkaryalaly === undefined ||
    itarvibhagudan === undefined ||
    niymitaarogya === undefined ||
    rationcard_no === undefined ||
    rationcardtype === undefined ||
    contact_no === undefined ||
    status === undefined
  ) {
    return NextResponse.json({ error: "All fields and ID are required" }, { status: 400 });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE vaykatigatdb SET
        castdata = ?, totalmembersname = ?, familymembercount = ?, agedata = ?, castcertificate = ?,
        aadharcard = ?, voteridcard = ?, rationcard = ?, jobcard = ?, pmfarmercard = ?, farmercreditcard = ?,
        aayushmancard = ?, headofmember = ?, housetype = ?, benefiteofpmhouse = ?, waterdrink = ?, hargharnal = ?,
        electricity = ?, hospitalphc = ?, sanjaygandhi = ?, studybenefite = ?, scheme_name = ?, farmeavilebleornot = ?, studyvanpatta = ?,
        sikklacelloffamily = ?, whichschoolchlid = ?, anyhaveaashramschool = ?, lpggas = ?, bankaccount = ?,
        studtatcoop = ?, pmvimayojna = ?, praklpkaryalaly = ?, itarvibhagudan = ?, niymitaarogya = ?,
        rationcard_no = ?, rationcardtype = ?, contact_no = ?, status = ?, taluka_id = ?, village_id = ?, gp_id = ?, status = 'Active'
      WHERE id = ?`,
      [
        castdata,
        totalmembersname,
        familymembercount,
        agedata,
        castcertificate,
        aadharcard,
        voteridcard,
        rationcard,
        jobcard,
        pmfarmercard,
        farmercreditcard,
        aayushmancard,
        headofmember,
        housetype,
        benefiteofpmhouse,
        waterdrink,
        hargharnal,
        electricity,
        hospitalphc,
        sanjaygandhi,
        studybenefite,
        scheme_name,
        farmeavilebleornot,
        studyvanpatta,
        sikklacelloffamily,
        whichschoolchlid,
        anyhaveaashramschool,
        lpggas,
        bankaccount,
        studtatcoop,
        pmvimayojna,
        praklpkaryalaly,
        itarvibhagudan,
        niymitaarogya,
        rationcard_no,
        rationcardtype,
        contact_no,
        taluka_id,
        village_id,
        gp_id,
        status,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "No record found to update" }, { status: 404 });
    }

    return NextResponse.json({ message: "Record updated successfully" });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}