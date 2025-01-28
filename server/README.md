# Server README

## Overview
This Node.js server application is designed to receive file uploads via HTTP POST requests and store them in a configurable directory. Additionally, it preserves file metadata such as creation and modification dates (excluding permissions). The server includes logging and email notification capabilities to monitor activities and handle errors.

---

## Features
- Accepts file uploads via the `/upload` endpoint.
- Supports custom relative paths for file storage.
- Preserves original file metadata (creation and modification dates).
- Logs all activities with timestamps to `server.log`.
- Sends email notifications for errors during file upload.
- Fully configurable through a `config.json` file.

---

## Prerequisites
- Node.js (v14 or later)
- npm (Node Package Manager)

---

## Installation
1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd <repository_folder>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the server:
   - Create a `config.json` file in the root directory.
   - Example configuration:
     ```json
     {
         "uploadDir": "upload",
         "port": 2999,
         "mail": {
             "host": "192.168.178.2",
             "port": 2525,
             "from": "disk-watcher@server.home",
             "to": "signal@mailrise.xyz",
             "security": false,
             "username": "",
             "password": ""
         }
     }
     ```

4. Start the server:
   ```bash
   node index.js
   ```

---

## API Endpoint

### POST `/upload`
- **Description**: Accepts file uploads and stores them in the configured directory.
- **Headers**:
  - `Content-Type: multipart/form-data`
- **Body Parameters**:
  - `relativePath`: The relative path within the upload directory (optional).
  - `createdAt`: The original creation time of the file in ISO format (optional).
  - `modifiedAt`: The original modification time of the file in ISO format (optional).
- **File Parameters**:
  - Attach files to the request as `form-data`.
- **Response**:
  - Success: `{ "success": true, "message": "Files uploaded" }`
  - Error: `{ "success": false, "message": "Error message" }`

---

## Logging
All server activities are logged in `server.log` with timestamps. Log entries include:
- File upload events.
- Errors during file handling or upload.
- Email notification attempts and their outcomes.

---

## Email Notifications
The server sends email alerts in case of errors during the file upload process. Configure the email settings in the `config.json` file under the `mail` section.

Example:
```json
"mail": {
    "host": "192.168.178.2",
    "port": 2525,
    "from": "disk-watcher@server.home",
    "to": "signal@mailrise.xyz",
    "security": false,
    "username": "",
    "password": ""
}
```

- **host**: The SMTP server address.
- **port**: The port for the SMTP server.
- **from**: The sender's email address.
- **to**: The recipient's email address.
- **security**: Enable or disable secure connection (true/false).
- **username**: SMTP username (if required).
- **password**: SMTP password (if required).

---

## Configuration
The `config.json` file allows customization of the following settings:
- `uploadDir`: Directory to store uploaded files.
- `port`: Server port.
- `mail`: Email configuration for notifications.

Ensure the `uploadDir` exists or will be created by the server with appropriate permissions.

---

## Error Handling
The server logs any errors encountered during:
- File storage.
- Metadata preservation.
- Email notifications.

In case of critical issues, an email notification is sent to the configured recipient.

---

## Example Usage
### cURL
```bash
curl -X POST http://localhost:2999/upload \
     -F "relativePath=subfolder" \
     -F "createdAt=2025-01-01T12:00:00.000Z" \
     -F "modifiedAt=2025-01-01T12:30:00.000Z" \
     -F "file=@example.txt"
```

---

## License
This project is licensed under the MIT License. See the LICENSE file for details.

