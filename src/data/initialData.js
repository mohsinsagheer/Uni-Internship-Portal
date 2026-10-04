// Initial Seed Data for COMSATS University Internship Management Portal

export const CAMPUSES = [
  { id: 'isb', name: 'Islamabad Campus (Main)' },
  { id: 'lhr', name: 'Lahore Campus' },
  { id: 'abt', name: 'Abbottabad Campus' },
  { id: 'wah', name: 'Wah Campus' },
  { id: 'atk', name: 'Attock Campus' },
  { id: 'swl', name: 'Sahiwal Campus' },
  { id: 'vhr', name: 'Vehari Campus' },
];

export const DEPARTMENTS = [
  'Department of Computer Science',
  'Department of Software Engineering',
  'Department of Electrical & Computer Engineering',
  'Department of Management Sciences',
  'Department of Mathematics'
];

export const INITIAL_SUPERVISORS = [
  {
    id: 'sup-1',
    regNo: 'EMP-CS-108',
    name: 'Dr. Zeeshan Ali',
    email: 'zeeshan.ali@isbfaculty.comsats.edu.pk',
    designation: 'Associate Professor',
    department: 'Department of Computer Science',
    office: 'Room 204, Academic Block 2',
    phone: '+92',
    campusId: 'isb',
    signature: null,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'sup-2',
    regNo: 'EMP-CS-214',
    name: 'Dr. Farhana Kausar',
    email: 'farhana.kausar@isbfaculty.comsats.edu.pk',
    designation: 'Assistant Professor',
    department: 'Department of Software Engineering',
    office: 'Room 112, Academic Block 1',
    phone: '+92 51 90495280',
    campusId: 'isb',
    signature: null,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'sup-3',
    regNo: 'EMP-CS-302',
    name: 'Engr. Tariq Mahmood',
    email: 'tariq.mahmood@isbfaculty.comsats.edu.pk',
    designation: 'Senior Lecturer',
    department: 'Department of Computer Science',
    office: 'Room 318, Academic Block 3',
    phone: '+92 51 90495344',
    campusId: 'isb',
    signature: null,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  }
];

export const INITIAL_INCHARGE = {
  id: 'inc-1',
  regNo: 'INC-CS-002',
  name: 'Dr. Usama Nadeem',
  email: 'internship.cs@isbfaculty.comsats.edu.pk',
  designation: 'Convener & Internship Incharge',
  department: 'Department of Computer Science',
  office: 'Placement & Internship Cell, Student Service Centre',
  phone: '+92 51 90495999',
  signature: null,
  campusId: 'isb',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80',
};

export const INITIAL_INCHARGES = [INITIAL_INCHARGE];

export const INITIAL_HOD = {
  id: 'hod-1',
  regNo: 'HOD-CS-001',
  name: 'Prof. Dr. Majid Iqbal Khan',
  email: 'hod.cs@isbfaculty.comsats.edu.pk',
  designation: 'Head of Department / Chairperson',
  department: 'Department of Computer Science',
  office: 'HoD Secretariat, 3rd Floor, Faculty Block',
  phone: '+92 51 90495001',
  signature: null,
  campusId: 'isb',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
};

export const INITIAL_HODS = [INITIAL_HOD];

// University pre-uploaded official templates (empty by default - populated by Incharge uploads)
export const OFFICIAL_TEMPLATES = [];

// Initial Students (Empty by default - registered dynamically via Firebase Auth)
export const INITIAL_STUDENTS = [];

export const NOTICES = [
  '⚡ Internship Directive: Mandatory 6 to 8 weeks consecutive tenure required for official 3-credit academic award.',
  '⚡ Internship Directive: Students must physically draw handwritten digital signature on canvas for all document submissions.',
  '⚡ Internship Directive: Faculty supervisor validates weekly progress logs prior to incharge endorsement and HOD final clearance.',
  '⚡ Internship Directive: Review & adhere to HEC & Institutional guidelines before corporate reporting.',
  'Fall 2026 Internship Submission Deadline: All clearance dossiers must be signed before 30th September 2026.',
  'Career Opportunity: Industry placement and internship interviews for Fall 2026 currently scheduling at Student Service Centre.',
  'Campus Access Alert: Main academic entry permitted through Gate 1 & Gate 2 only. Gate 3 remains closed.',
];
