
export type AppUser = {
  id: string;
  full_name: string;
  email: string;
  role: 'teacher' | 'student';
  avatarUrl: string;
  learning_preference: 'online' | 'in-person';
};

export type Participant = {
  user: AppUser;
};

export type Message = {
  id: number;
  content: string;
  created_at: string;
  sender_id: string;
  sender: AppUser;
};

export type Conversation = {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  participants: Participant[];
  last_message: Message | null;
};
