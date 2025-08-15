export type User = {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  avatarUrl: string;
};

export type Class = {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  color: string;
};

export type Enrollment = {
  userId: string;
  classId: string;
};

export type Announcement = {
  id: string;
  classId: string;
  title: string;
  content: string;
  date: string;
};

export type Assignment = {
  id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  type: 'assignment' | 'homework';
};

export type Submission = {
  assignmentId: string;
  studentId: string;
  status: 'submitted' | 'pending' | 'late' | 'graded';
  grade?: string;
};

export type Attendance = {
  classId: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
};

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
};

export const users: User[] = [
  { id: 'user-1', name: 'Dr. Evelyn Reed', email: 'teacher@example.com', role: 'teacher', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user-2', name: 'Liam Carter', email: 'student@example.com', role: 'student', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user-3', name: 'Olivia Chen', email: 'olivia.chen@example.com', role: 'student', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user-4', name: 'Benjamin Grant', email: 'ben.grant@example.com', role: 'student', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user-5', name: 'Sophia Rodriguez', email: 'sophia.r@example.com', role: 'student', avatarUrl: 'https://placehold.co/100x100.png' },
];

export const classes: Class[] = [
  { id: 'class-1', name: 'Intro to React', description: 'Learn the fundamentals of React and modern web development.', teacherId: 'user-1', color: 'bg-blue-500' },
  { id: 'class-2', name: 'Advanced NodeJS', description: 'Deep dive into Node.js, Express, and backend concepts.', teacherId: 'user-1', color: 'bg-green-500' },
  { id: 'class-3', name: 'UI/UX Design Principles', description: 'Explore the principles of user-centric design and interfaces.', teacherId: 'user-1', color: 'bg-purple-500' },
];

export const enrollments: Enrollment[] = [
  { userId: 'user-2', classId: 'class-1' },
  { userId: 'user-2', classId: 'class-2' },
  { userId: 'user-3', classId: 'class-1' },
  { userId: 'user-3', classId: 'class-3' },
  { userId: 'user-4', classId: 'class-2' },
  { userId: 'user-5', classId: 'class-1' },
  { userId: 'user-5', classId: 'class-3' },
];

export const announcements: Announcement[] = [
  { id: 'ann-1', classId: 'class-1', title: 'Welcome to Intro to React!', content: 'I am excited to start this journey with all of you. Please review the syllabus in the files section.', date: '2024-05-10T09:00:00Z' },
  { id: 'ann-2', classId: 'class-2', title: 'Project 1 Update', content: 'The deadline for Project 1 has been extended by two days. The new due date is this Friday.', date: '2024-05-12T14:30:00Z' },
];

export const assignments: Assignment[] = [
  { id: 'assign-1', classId: 'class-1', title: 'Component Library', description: 'Build a small component library with a Button, Input, and Card.', dueDate: '2024-05-20T23:59:59Z', type: 'assignment' },
  { id: 'assign-2', classId: 'class-1', title: 'Hooks Practice', description: 'Complete the exercises on useState and useEffect.', dueDate: '2024-05-18T23:59:59Z', type: 'homework' },
  { id: 'assign-3', classId: 'class-2', title: 'API Development', description: 'Create a REST API with at least 5 endpoints.', dueDate: '2024-05-25T23:59:59Z', type: 'assignment' },
];

export const submissions: Submission[] = [
  { assignmentId: 'assign-1', studentId: 'user-2', status: 'pending' },
  { assignmentId: 'assign-2', studentId: 'user-2', status: 'submitted', grade: 'A' },
  { assignmentId: 'assign-1', studentId: 'user-3', status: 'submitted', grade: 'B+' },
  { assignmentId: 'assign-2', studentId: 'user-3', status: 'late' },
];

export const attendance: Attendance[] = [
    { classId: 'class-1', studentId: 'user-2', date: '2024-05-10', status: 'present' },
    { classId: 'class-1', studentId: 'user-3', date: '2024-05-10', status: 'present' },
    { classId: 'class-1', studentId: 'user-5', date: '2024-05-10', status: 'absent' },
    { classId: 'class-1', studentId: 'user-2', date: '2024-05-12', status: 'present' },
    { classId: 'class-1', studentId: 'user-3', date: '2024-05-12', status: 'late' },
    { classId: 'class-1', studentId: 'user-5', date: '2024-05-12', status: 'present' },
];


export const messages: Message[] = [
  { id: 'msg-1', senderId: 'user-2', receiverId: 'user-1', content: 'Hi Dr. Reed, I have a question about the homework.', timestamp: '2024-05-13T10:00:00Z', read: true },
  { id: 'msg-2', senderId: 'user-1', receiverId: 'user-2', content: 'Of course, Liam. What can I help you with?', timestamp: '2024-05-13T10:01:00Z', read: true },
  { id: 'msg-3', senderId: 'user-2', receiverId: 'user-1', content: 'I am having trouble with the third exercise. Could you clarify the requirements?', timestamp: '2024-05-13T10:02:00Z', read: false },
  { id: 'msg-4', senderId: 'user-3', receiverId: 'user-1', content: 'Hello, I will be absent from class tomorrow due to a doctor\'s appointment.', timestamp: '2024-05-14T11:00:00Z', read: true },
  { id: 'msg-5', senderId: 'user-1', receiverId: 'user-3', content: 'Thank you for letting me know, Olivia. Hope everything is okay.', timestamp: '2024-05-14T11:05:00Z', read: false },
];
