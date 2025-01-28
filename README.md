# File Transfer System

This project consists of two components: a **Client** and a **Server**, designed to facilitate reliable file transfers with metadata preservation.

## Components

### 1. Server
- Hosts an HTTP endpoint to receive files.
- Stores uploaded files in a configurable directory.
- Preserves file metadata (creation and modification timestamps).
- Logs all activities and sends email notifications on errors.

Refer to the `server/README.md` for detailed information on setup and usage.

### 2. Client
- Sends files to the server based on a configurable schedule.
- Reads configurations such as source directory, server URL, and schedule from a `config.json` file.
- Supports dry-run mode to simulate transfers without modifying files.
- Logs all operations for traceability.

Refer to the `client/README.md` for detailed information on setup and usage.

## Features
- Metadata preservation during file transfers.
- Flexible configuration for both client and server.
- Detailed logging for debugging and monitoring.
- Email notifications for server-side errors.
- Cron-based scheduling for client operations.

## Prerequisites
- Node.js (v14 or later)
- npm (Node Package Manager)

## Installation
Clone the repository and navigate to the respective `client` and `server` directories to set up and run each component.

```bash
# Clone the repository
git clone <repository_url>
cd <repository_folder>

# Navigate to server
cd server
npm install or yarn install or pnpm install

# Navigate to client
cd ../client
npm install or yarn install or pnpm install
```

## Licensing
This project is licensed under the MIT License. See the LICENSE file for more details.

