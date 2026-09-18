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
    email: 'zeeshan.ali@comsats.edu.pk',
    designation: 'Associate Professor',
    department: 'Department of Computer Science',
    office: 'Room 204, Academic Block 2',
    phone: '+92',
    signature: null,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'sup-2',
    regNo: 'EMP-CS-214',
    name: 'Dr. Farhana Kausar',
    email: 'farhana.kausar@comsats.edu.pk',
    designation: 'Assistant Professor',
    department: 'Department of Software Engineering',
    office: 'Room 112, Academic Block 1',
    phone: '+92 51 90495280',
    signature: null,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'sup-3',
    regNo: 'EMP-CS-302',
    name: 'Engr. Tariq Mahmood',
    email: 'tariq.mahmood@comsats.edu.pk',
    designation: 'Senior Lecturer',
    department: 'Department of Computer Science',
    office: 'Room 318, Academic Block 3',
    phone: '+92 51 90495344',
    signature: null,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  }
];

export const INITIAL_INCHARGE = {
  id: 'inc-1',
  regNo: 'INC-CS-002',
  name: 'Dr. Usama Nadeem',
  email: 'internship.cs@comsats.edu.pk',
  designation: 'Convener & Internship Incharge',
  department: 'Department of Computer Science',
  office: 'Placement & Internship Cell, Student Service Centre',
  phone: '+92 51 90495999',
  signature: null,
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80',
};

export const INITIAL_HOD = {
  id: 'hod-1',
  regNo: 'HOD-CS-001',
  name: 'Prof. Dr. Majid Iqbal Khan',
  email: 'hod.cs@comsats.edu.pk',
  designation: 'Head of Department / Chairperson',
  department: 'Department of Computer Science',
  office: 'HoD Secretariat, 3rd Floor, Faculty Block',
  phone: '+92 51 90495001',
  signature: null,
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
};

// University pre-uploaded official templates (empty by default - populated by Incharge uploads)
export const OFFICIAL_TEMPLATES = [];

// Initial Students
export const INITIAL_STUDENTS = [
  {
    id: 'std-1',
    regNo: 'FA21-BCS-045',
    name: 'Muhammad Hamza Khan',
    email: 'fa21-bcs-045@isb.comsats.edu.pk',
    program: 'BS Computer Science',
    semester: '7th Semester',
    cgpa: '3.52',
    phone: '+92 334 1234567',
    assignedSupervisorId: 'sup-1', // Dr. Zeeshan Ali
    internshipCompany: 'Systems Limited, Islamabad',
    internshipRole: 'Full Stack Software Intern',
    internshipDuration: '8 Weeks (July 2026 - Sept 2026)',
    status: 'pending_submission',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    documents: []
  },
  {
    id: 'std-2',
    regNo: 'SP22-BCS-102',
    name: 'Ayesha Noor Malik',
    email: 'sp22-bcs-102@isb.comsats.edu.pk',
    program: 'BS Computer Science',
    semester: '6th Semester',
    cgpa: '3.78',
    phone: '+92 301 9876543',
    assignedSupervisorId: 'sup-2', // Dr. Farhana Kausar
    internshipCompany: 'Devsinc, Islamabad',
    internshipRole: 'React & UI/UX Design Intern',
    internshipDuration: '6 Weeks (Aug 2026 - Sept 2026)',
    status: 'pending_submission',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    documents: []
  },
  {
    id: 'std-3',
    regNo: 'FA21-BSE-019',
    name: 'Bilal Tariq',
    email: 'fa21-bse-019@isb.comsats.edu.pk',
    program: 'BS Software Engineering',
    semester: '7th Semester',
    cgpa: '3.41',
    phone: '+92 312 3456789',
    assignedSupervisorId: 'sup-1', // Dr. Zeeshan Ali
    internshipCompany: 'Afiniti, Islamabad',
    internshipRole: 'QA Automation Intern',
    internshipDuration: '8 Weeks',
    status: 'pending_submission',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80',
    documents: []
  },
  {
    id: 'std-4',
    regNo: 'FA21-BCS-088',
    name: 'Zainab Fatima',
    email: 'fa21-bcs-088@isb.comsats.edu.pk',
    program: 'BS Computer Science',
    semester: '7th Semester',
    cgpa: '3.65',
    phone: '+92 321 8765432',
    assignedSupervisorId: null, // Unassigned! (Demonstrates Incharge allocation feature)
    internshipCompany: 'Nayatel, Islamabad',
    internshipRole: 'Cloud & Network Intern',
    internshipDuration: '6 Weeks',
    status: 'pending_submission',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
    documents: []
  },
  {
    id: 'std-5',
    regNo: 'SP21-BCS-155',
    name: 'Daniyal Ahmed Sheikh',
    email: 'sp21-bcs-155@isb.comsats.edu.pk',
    program: 'BS Computer Science',
    semester: '8th Semester',
    cgpa: '3.89',
    phone: '+92 333 4567890',
    assignedSupervisorId: 'sup-3', // Engr. Tariq Mahmood
    internshipCompany: 'Teradata, Islamabad',
    internshipRole: 'Data Engineering Intern',
    internshipDuration: '8 Weeks',
    status: 'pending_submission',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80',
    documents: []
  },
  {
    id: 'std-6',
    regNo: 'FA21-BCS-112',
    name: 'Kashif Mehmood',
    email: 'fa21-bcs-112@isb.comsats.edu.pk',
    program: 'BS Computer Science',
    semester: '7th Semester',
    cgpa: '3.15',
    phone: '+92 345 5566778',
    assignedSupervisorId: 'sup-2', // Dr. Farhana Kausar
    internshipCompany: 'Confiz Solutions',
    internshipRole: 'Mobile App Developer Intern',
    internshipDuration: '8 Weeks',
    status: 'pending_submission',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    documents: []
  }
];

export const NOTICES = [
  '⚡ Internship Directive: Mandatory 6 to 8 weeks consecutive tenure required for official 3-credit academic award.',
  '⚡ Internship Directive: Students must physically draw handwritten digital signature on canvas for all document submissions.',
  '⚡ Internship Directive: Faculty supervisor validates weekly progress logs prior to incharge endorsement and HOD final clearance.',
  '⚡ Internship Directive: Review & adhere to HEC & Institutional guidelines before corporate reporting.',
  'Fall 2026 Internship Submission Deadline: All clearance dossiers must be signed before 30th September 2026.',
  'Career Opportunity: Industry placement and internship interviews for Fall 2026 currently scheduling at Student Service Centre.',
  'Campus Access Alert: Main academic entry permitted through Gate 1 & Gate 2 only. Gate 3 remains closed.',
];
