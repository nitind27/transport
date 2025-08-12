import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
     `SELECT 
         bhautikdb.*,
         taluka.name AS taluka_name,
         village.marathi_name AS village_name,
         grampanchayat.marathi_name AS grampanchayat_name
       FROM bhautikdb
       LEFT JOIN taluka ON bhautikdb.taluka_id = taluka.taluka_id
       LEFT JOIN village ON bhautikdb.village_id = village.village_id
       LEFT JOIN grampanchayat ON bhautikdb.gp_id = grampanchayat.id
       WHERE bhautikdb.status = "Active"`
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
      `INSERT INTO bhautikdb (
        totalpopulation, tribalpopulation, tribalpopulationtkkwari,
        totalfamilynumbers, tribalwholefamilynumbers, forestshareholderno,
        collectiveforestry, cfrmplan, aadhaarcard, voteridcard, breedstandards,
        rationcard, jobcard, pmfarmercard, ayushmancard, adivasis,
        tribalbenefitnumber, stepfacilities, everygharnaalyojana,
        electrificationforfamilies, healthfacilityis, generalhealthcheckup,
        sickleanemia, elementaryschool, middleschool, kindergarten,
        mobilefacilities, mobilemedicalunit, gramPanchayatBuilding, gotulsocietybuilding, riverlake, scheme_name,
        allroadvillages, village_distance, taluka_id, village_id, gp_id, alltribalegaav, userId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.totalpopulation,
        body.tribalpopulation,
        body.tribalpopulationtkkwari,
        body.totalfamilynumbers,
        body.tribalwholefamilynumbers,
        body.forestshareholderno,
        body.collectiveforestry,
        body.cfrmplan,
        body.aadhaarcard,
        body.voteridcard,
        body.breedstandards,
        body.rationcard,
        body.jobcard,
        body.pmfarmercard,
        body.ayushmancard,
        body.adivasis,
        body.tribalbenefitnumber,
        body.stepfacilities,
        body.everygharnaalyojana,
        body.electrificationforfamilies,
        body.healthfacilityis,
        body.generalhealthcheckup,
        body.gramPanchayatBuilding,
        body.sickleanemia,
        body.elementaryschool,
        body.middleschool,
        body.kindergarten,
        body.mobilefacilities,
        body.mobilemedicalunit,
        body.gotulsocietybuilding,
        body.riverlake,
        body.scheme_name,
        body.allroadvillages,
        body.village_distance,
        body.taluka_id,
        body.village_id,
        body.gp_id,
        body.alltribalegaav,
        body.userId,
      ]
    );

    return NextResponse.json({ message: 'Document inserted successfully', id: result.insertId });
  } catch (error) {
    console.error('Creation error:', error);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}


export async function PATCH(request: Request) {
  const { id, status } = await request.json();

  if (!id || !status) {
    return NextResponse.json({ error: 'documents ID and status are required' }, { status: 400 });
  }

  try {
    await pool.query(
      'UPDATE bhautikdb SET status = ? WHERE id = ?',
      [status, id]
    );
    return NextResponse.json({ message: `documents ${status === 'active' ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

// PUT handler - update data
export async function PUT(request: Request) {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE bhautikdb SET
        totalpopulation = ?, tribalpopulation = ?, tribalpopulationtkkwari = ?,
        totalfamilynumbers = ?, tribalwholefamilynumbers = ?, forestshareholderno = ?,
        collectiveforestry = ?, cfrmplan = ?, aadhaarcard = ?, voteridcard = ?, breedstandards = ?,
        rationcard = ?, jobcard = ?, pmfarmercard = ?, ayushmancard = ?, adivasis = ?,
        tribalbenefitnumber = ?, stepfacilities = ?, everygharnaalyojana = ?,
        electrificationforfamilies = ?, healthfacilityis = ?, generalhealthcheckup = ?,
        sickleanemia = ?, elementaryschool = ?, middleschool = ?, kindergarten = ?,
        mobilefacilities = ?, mobilemedicalunit = ?, gramPanchayatBuilding = ?, gotulsocietybuilding = ?, riverlake = ?, scheme_name = ?,
        allroadvillages = ?, village_distance = ?, taluka_id = ?, village_id = ?, gp_id = ?, alltribalegaav = ?
      WHERE id = ?`,
      [
        body.totalpopulation,
        body.tribalpopulation,
        body.tribalpopulationtkkwari,
        body.totalfamilynumbers,
        body.tribalwholefamilynumbers,
        body.forestshareholderno,
        body.collectiveforestry,
        body.cfrmplan,
        body.aadhaarcard,
        body.voteridcard,
        body.breedstandards,
        body.rationcard,
        body.jobcard,
        body.pmfarmercard,
        body.ayushmancard,
        body.adivasis,
        body.tribalbenefitnumber,
        body.stepfacilities,
        body.everygharnaalyojana,
        body.electrificationforfamilies,
        body.healthfacilityis,
        body.generalhealthcheckup,
        body.sickleanemia,
        body.elementaryschool,
        body.middleschool,
        body.kindergarten,
        body.mobilefacilities,
        body.mobilemedicalunit,
        body.gramPanchayatBuilding,
        body.gotulsocietybuilding,
        body.riverlake,
        body.scheme_name,
        body.allroadvillages,
        body.village_distance,
        body.taluka_id,
        body.village_id,
        body.gp_id,
        body.alltribalegaav,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'No record found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}
