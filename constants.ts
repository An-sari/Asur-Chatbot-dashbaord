
import { ClientConfig } from './types';

export const MOCK_CLIENTS: Record<string, ClientConfig> = {
  'ansury-lux-123': {
    id: 'ansury-lux-123',
    user_id: 'user_123',
    name: 'Elite Estates AI',
    // Fix: Using snake_case property name as defined in ClientConfig
    primary_color: '#B8860B', // Dark Goldenrod
    greeting: 'Welcome to Elite Estates. How can I assist you in finding your dream luxury property today?',
    // Fix: Using snake_case property name as defined in ClientConfig
    system_instruction: 'You are an elite sales concierge for a luxury real estate firm. Be sophisticated, professional, and focus on high-ticket property details. Always try to qualify the lead by asking about their budget or preferred location.',
    // Added missing required thinking properties
    thinking_enabled: true,
    thinking_budget: 4000,
    // Fix: Using snake_case property name as defined in ClientConfig
    authorized_origins: ['*'],
  },
  'ansury-saas-456': {
    id: 'ansury-saas-456',
    user_id: 'user_123',
    name: 'TechFlow Assistant',
    // Fix: Using snake_case property name as defined in ClientConfig
    primary_color: '#4F46E5', // Indigo
    greeting: 'Hi there! Ready to supercharge your workflow with TechFlow?',
    // Fix: Using snake_case property name as defined in ClientConfig
    system_instruction: 'You are a helpful SaaS sales engineer. Focus on technical features, ROI, and ease of integration. Your goal is to get the user to book a demo.',
    // Added missing required thinking properties
    thinking_enabled: false,
    thinking_budget: 0,
    // Fix: Using snake_case property name as defined in ClientConfig
    authorized_origins: ['localhost', 'ansury.systems'],
  }
};

export const DEFAULT_CONFIG: ClientConfig = {
  id: 'default',
  user_id: 'system',
  name: 'Ansury AI',
  // Fix: Using snake_case property name as defined in ClientConfig
  primary_color: '#000000',
  greeting: 'Hello! How can we help you today?',
  // Fix: Using snake_case property name as defined in ClientConfig
  system_instruction: 'You are a helpful AI assistant.',
  // Added missing required thinking properties
  thinking_enabled: false,
  thinking_budget: 0,
  // Fix: Using snake_case property name as defined in ClientConfig
  authorized_origins: ['*'],
};
