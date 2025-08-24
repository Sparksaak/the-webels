
export type AppUser = {
    id: string;
    name: string;
    email: string;
    role: 'teacher' | 'student';
    avatarUrl: string;
};

export type Message = {
    id: string;
    content: string;
    createdAt: string;
    conversationId: string;
    sender: AppUser;
};

export type Conversation = {
    id: string;
    name: string | null;
    type: 'direct' | 'group';
    participants: AppUser[];
    last_message: {
        content: string;
        timestamp: string;
    } | null;
    created_at: string;
};
