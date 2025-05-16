# Product Requirements Document: AI Chat Application

## Overview
This document describes the current state of the AI chat application. The app provides a conversational interface powered by OpenAI's GPT‑4o model and uses Supabase for authentication, data storage and serverless functions. Users can chat via text or, when enabled, voice.

## Product Description
The application is a web‑based chat platform with the following primary capabilities:

- Secure sign‑up and sign‑in using Supabase Auth
- Persistent chat sessions stored in a Supabase Postgres database
- Optional voice conversation mode that connects to OpenAI's Realtime API
- Customizable theme color and profile management

## Core Features

### 1. Chat Interface
- **Messaging System**: Users send text messages and receive AI responses in real time
- **Message Display**: Distinct styling for user and assistant messages with thinking indicator
- **Voice Mode**: When the voiceMode feature flag is enabled, users can speak to the assistant through a WebSocket connection
- **Message Deletion**: Adult accounts can delete messages from the conversation history
- **Chat Title Editing**: Chats are automatically named after a few exchanges and can be renamed

### 2. Authentication & Profile
- **Email/Password Auth**: Sign up requires a date of birth to verify users are over 18
- **User Roles**: Accounts are labelled as adult or child. Only adults may delete messages or manage child accounts
- **Profile Management**: Users can update display name, email and view subscription status

### 3. Chat Sessions & History
- **Persistent Storage**: Sessions and messages are saved in Supabase so history is available across devices
- **Chat History Panel**: Accessible from the settings sidebar to switch between conversations or start a new one
- **New Chat Creation**: Users can create new sessions at any time from the sidebar or profile page

### 4. API Integration
- **OpenAI via Edge Functions**: Supabase Edge Functions proxy requests to GPT‑4o for both text and voice
- **API Key Storage**: The user's OpenAI API key is securely stored in local storage for text chat
- **Error Handling**: Friendly notifications appear when API or connection issues occur

### 5. UI/UX Features
- **Customizable Theme**: A color picker lets users select a hero color which styles buttons and highlights
- **Responsive Layout**: Works on mobile and desktop with a collapsible side panel
- **Settings & Profile Links**: The sidebar provides quick access to profile settings and chat history

## Technical Architecture

### Frontend
- **Framework**: React with TypeScript and Shadcn UI components styled with Tailwind CSS
- **State Management**: React Context and custom hooks for chat sessions, authentication and voice
- **Routing**: React Router controls navigation between pages
- **Feature Flags**: Optional functionality like voice mode is toggled via a simple flag system

### Backend
- **Supabase Database**: Stores user profiles, chat sessions and messages
- **Supabase Edge Functions**: Implement text chat completions and realtime voice WebSocket proxy

## User Flow
1. User visits the login page and creates an account (age 18+ required) or signs in
2. After authentication a new chat session is created with a welcome message
3. User sends messages or activates voice mode to speak with the assistant
4. Chat titles are generated automatically and can be edited
5. Settings sidebar provides chat history, theme selection and a link to the profile page
6. Adults may delete messages from the chat
7. Users can sign out from the profile page

## Future Enhancements
- Child account management and parental controls
- Additional model options and paid subscription features
- Image or file attachments in chat
- Mobile application with push notifications
- Stabilize voice mode and enable by default

## Technical Limitations
- The OpenAI API key is stored client‑side
- Voice mode is experimental and disabled unless the feature flag is turned on
- Some functionality, such as child account management, is not yet implemented

## Conclusion
The application now includes authentication, persistent chat sessions and an experimental voice mode while retaining a simple text chat interface. Supabase integration provides a solid foundation for future enhancements and cross‑device access.
