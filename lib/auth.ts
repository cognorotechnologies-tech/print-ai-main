import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/server/db/prisma';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        if (user.deletedAt) {
          throw new Error('Account has been deleted');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (existingUser) {
          // Update Google ID if not set
          if (!existingUser.googleId && profile?.sub) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { googleId: profile.sub },
            });
          }
        } else {
          // Create new user for Google OAuth
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              googleId: profile?.sub,
              emailVerified: new Date(),
              role: Role.CUSTOMER,
            },
          });
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }

      return session;
    },
  },

  events: {
    async signIn({ user, isNewUser }) {
      // Log sign-in event
      console.log(`User signed in: ${user.email}, isNewUser: ${isNewUser}`);
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
