# RevFlow AI Architecture Rules

## Mobile Application Architecture
- **Thin Client Strategy**: The mobile app must remain a thin client. Do NOT recreate backend business logic on the device.
- **Responsibilities**:
  - UI and user interaction
  - Local caching
  - Offline support
  - Push notifications
  - Secure authentication
- **Backend Delegation**: All scheduling rules, AI orchestration, RAG, permissions, and business workflows MUST stay on the backend to ensure consistency across the web app, mobile app, and future integrations.
