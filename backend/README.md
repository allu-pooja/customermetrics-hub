# Customer Metrics Hub - Backend

Backend API server for the Customer Metrics Hub application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure MongoDB is running locally on port 27017

3. Start the backend server:
   ```bash
   npm run dev  # For development with auto-reload
   npm start    # For production
   ```

## API Endpoints

### POST /api/upload-customer-data
Upload and process customer data from Excel/CSV file.

**Request:** Multipart form data with file
**Response:** JSON with upload status

### POST /api/upload-customer-data-json
Upload processed customer data as JSON.

**Request:** JSON with `data` array
**Response:** JSON with upload status

### GET /api/customer-data
Retrieve all customer data from database.

**Response:** JSON with customer data array

### DELETE /api/customer-data
Clear all customer data from database.

**Response:** JSON confirmation

## Database

- **Database:** `sample`
- **Collection:** `customerData`
- **Connection:** `mongodb://localhost:27017`

## Development

To run both frontend and backend simultaneously:
```bash
npm run dev:full
```

This will start the Vite dev server and the backend server concurrently.