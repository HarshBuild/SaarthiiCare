-- SAARTHII Supabase seed 0001
-- Synthetic facilities and patients used by the hackathon demo.
--
-- Safe to re-run. All values are synthetic; do not load real patient data
-- into a development project.

insert into public.facilities (id, code, name, type, address, district, state)
values
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'PHC-RMP-01',
        'Primary Health Centre Rampur',
        'phc',
        'Main Road, Rampur Block',
        'Bareilly',
        'Uttar Pradesh'
    ),
    (
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'DH-BLY-02',
        'District Hospital Bareilly',
        'district_hospital',
        'Civil Lines, Bareilly',
        'Bareilly',
        'Uttar Pradesh'
    ),
    (
        'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'SDH-AON-03',
        'Sub-District Hospital Aonla',
        'sub_district_hospital',
        'Station Road, Aonla',
        'Bareilly',
        'Uttar Pradesh'
    )
on conflict (id) do update set
    code = excluded.code,
    name = excluded.name,
    type = excluded.type,
    address = excluded.address,
    district = excluded.district,
    state = excluded.state,
    is_active = true;

insert into public.patients (
    id,
    patient_identifier,
    abha_id,
    registering_facility_id,
    full_name,
    dob,
    gender,
    phone,
    address
)
values
    (
        '11eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
        'PAT-2026-0001',
        '14-9928-1102-4412',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Rahul Kumar',
        '1985-06-12',
        'male',
        '9123456780',
        'Village Rampur, Post Rampur'
    ),
    (
        '22eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
        'PAT-2026-0002',
        '14-9928-1102-4413',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Sunita Devi',
        '1992-03-24',
        'female',
        '9123456781',
        'Village Piparia, Rampur'
    ),
    (
        '33eebc99-9c0b-4ef8-bb6d-6bb9bd380b33',
        'PAT-2026-0003',
        '14-9928-1102-4414',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Meera Patel',
        '1978-11-02',
        'female',
        '9123456782',
        'Village Aonla, Bareilly'
    )
on conflict (id) do update set
    patient_identifier = excluded.patient_identifier,
    abha_id = excluded.abha_id,
    registering_facility_id = excluded.registering_facility_id,
    full_name = excluded.full_name,
    dob = excluded.dob,
    gender = excluded.gender,
    phone = excluded.phone,
    address = excluded.address;
