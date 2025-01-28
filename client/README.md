# File Client

This Node.js application is a file transfer client that periodically uploads files from a source directory to a remote server. The behavior is fully configurable through a `config.json` file. Features include scheduled transfers, dry-run mode, logging with priority levels, and optional file deletion after successful uploads.

---

## Features

- **Scheduled Transfers:** Automatically uploads files based on a cron schedule.
- **Configurable Source Directory:** Specify the directory to scan for files.
- **Dry-Run Mode:** Simulate transfers without actually uploading or deleting files.
- **File Metadata Preservation:** Retains file creation and modification timestamps.
- **Selective Deletion:** Deletes files after successful upload if enabled.
- **Logging:** Detailed logs with timestamp and priority levels (INFO, WARN, ERROR).

---

## Installation

### Prerequisites

- Node.js (>= 14.x)
- npm (Node Package Manager)

### Steps

1. Clone the repository or download the client script.
2. Install dependencies:
   ```bash
   npm install axios form-data node-cron
   ```
3. Create a `config.json` file in the same directory as the script (see Configuration section).

---

## Configuration

Create a `config.json` file with the following structure:

```json
{
  "cronSchedule": "*/5 * * * *",  // Cron string for scheduling (every 5 minutes)
  "sourcePath": "./to-upload",    // Path to the source directory
  "serverUrl": "http://localhost:3000/upload",  // Server URL for uploads
  "deleteSourceFile": true,       // Delete files after successful upload
  "dryRun": false                 // Log actions without uploading or deleting files
}
```

### Configuration Fields

- **`cronSchedule`**: Defines when the file transfers should occur. Uses standard cron syntax (e.g., `*/5 * * * *` for every 5 minutes).
- **`sourcePath`**: Path to the directory containing files to upload.
- **`serverUrl`**: URL of the server endpoint to receive the files.
- **`deleteSourceFile`**: Set to `true` to delete files after successful upload.
- **`dryRun`**: If `true`, the client simulates actions (uploading, deleting) without making changes.

---

## Usage

1. Start the remote file server (ensure it is configured and running).
2. Start the client:
   ```bash
   node file-client.js
   ```
3. Monitor logs for actions and statuses. Logs are written to `client.log`.

---

## Logs

The client logs actions and errors to a `client.log` file with priority levels:

- **INFO**: General actions (e.g., file uploaded, file deleted).
- **WARN**: Warnings (e.g., transfer skipped due to ongoing process).
- **ERROR**: Errors (e.g., failed uploads).

Example log entry:
```plaintext
[2025-01-27T12:00:00.000Z] [INFO] Upload started.
[2025-01-27T12:00:05.000Z] [INFO] File uploaded: ./to-upload/example.txt
[2025-01-27T12:00:05.000Z] [INFO] File deleted: ./to-upload/example.txt
[2025-01-27T12:05:00.000Z] [WARN] Transfer skipped: already running.
```

---

## Dependencies

The following npm packages are required:

- `axios`: For sending HTTP requests to the server.
- `form-data`: To construct file uploads.
- `node-cron`: For scheduling tasks.

Install them with:
```bash
npm install axios form-data node-cron
```

---

## Development

### Testing Dry-Run Mode

Set `dryRun` to `true` in `config.json` to simulate uploads and deletions. The client will log actions without modifying files or sending data.

### Modifying Configuration

You can update the `config.json` file at any time. Changes will take effect on the next scheduled transfer.

---

## Troubleshooting

- **Cron Job Not Running:** Ensure the cron string in `config.json` is valid.
- **Permission Errors:** Ensure the script has read/write access to the source directory and `client.log`.
- **Server Unreachable:** Verify the `serverUrl` in `config.json` and check server availability.

---

## License

This project is licensed under the MIT License. Feel free to modify and distribute it as needed.

