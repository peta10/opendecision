/**
 * OpenDecision - Decision Support Tool
 *
 * Main barrel export for the OpenDecision application.
 * Import from features for component-level access.
 */

// Features
export * from './features/ai-chat';
export * from './features/comparison';
export * from './features/criteria';
export * from './features/profile';
export * from './features/ranking';
export * from './features/recommendations';
export * from './features/tools';

// Note: Admin feature is not exported by default for security
// Import directly from '@/opendecision/features/admin' when needed

// App-level components
export { EmbeddedPPMToolFlow } from './app/flows/DecisionFlow';

// Shared types
export * from './shared/types';
