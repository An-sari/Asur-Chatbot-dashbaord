
export const authOptions = {
  providers: [], // e.g., Google, GitHub, Email
  callbacks: {
    session: ({ session, user }: any) => {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
};

// Mock function to simulate "useSession" hook
export const useAuth = () => {
  return {
    data: {
      user: {
        id: 'user_123',
        email: 'founder@ansury.systems',
        name: 'Alex Rivera'
      }
    },
    status: 'authenticated'
  };
};
