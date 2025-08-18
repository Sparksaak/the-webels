
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  avatarUrl: string;
  learningPreference?: 'online' | 'in-person';
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
  { id: 'user-2', name: 'Liam Carter', email: 'student@example.com', role: 'student', avatarUrl: 'https://placehold.co/100x100.png', learningPreference: 'online' },
  { id: 'user-3', name: 'Olivia Chen', email: 'olivia.chen@example.com', role: 'student', avatarUrl: 'https://placehold.co/100x100.png', learningPreference: 'in-person' },
];

export const messages: Message[] = [
  { id: 'msg-1', senderId: 'user-2', receiverId: 'user-1', content: 'Hi Dr. Reed, I have a question about the homework.', timestamp: '2024-05-13T10:00:00Z', read: true },
  { id: 'msg-2', senderId: 'user-1', receiverId: 'user-2', content: 'Of course, Liam. What can I help you with?', timestamp: '2024-05-13T10:01:00Z', read: true },
  { id: 'msg-3', senderId: 'user-2', receiverId: 'user-1', content: 'I am having trouble with the third exercise. Could you clarify the requirements?', timestamp: '2024-05-13T10:02:00Z', read: false },
  { id: 'msg-4', senderId: 'user-3', receiverId: 'user-1', content: 'Hello, I will be absent from class tomorrow due to a doctor\'s appointment.', timestamp: '2024-05-14T11:00:00Z', read: true },
  { id: 'msg-5', senderId: 'user-1', receiverId: 'user-3', content: 'Thank you for letting me know, Olivia. Hope everything is okay.', timestamp: '2024-05-14T11:05:00Z', read: false },
];
