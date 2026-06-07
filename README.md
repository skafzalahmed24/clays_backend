# Mershai API

This is the backend API for the Mershai application.

## Prerequisites

- Node.js
- MongoDB
- MinIO

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

### External Services

- To run the required MinIO storage bucket server, execute this command in a separate terminal:
  ```bash
  .\minio.exe server C:\minio_data --console-address :9001
  ```
