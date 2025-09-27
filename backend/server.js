const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB configuration
const mongoUri = 'mongodb://localhost:27017';
const dbName = 'sample';
const collectionName = 'customerData';

let client;
let db;
let collection;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(dbName);
    collection = db.collection(collectionName);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API endpoint to upload and process customer data
app.post('/api/upload-customer-data', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse the uploaded file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Process the data (similar to frontend processing)
    const processedData = processCustomerData(jsonData);

    // Insert into MongoDB
    const result = await collection.insertMany(processedData);

    res.json({
      success: true,
      message: `Successfully uploaded ${result.insertedCount} customer records`,
      insertedCount: result.insertedCount
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({
      error: 'Failed to process and save customer data',
      details: error.message
    });
  }
});

// API endpoint to upload processed customer data as JSON
app.post('/api/upload-customer-data-json', async (req, res) => {
  try {
    console.log('Received upload request, body size:', JSON.stringify(req.body).length);
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      console.error('Invalid data format:', typeof data, Array.isArray(data));
      return res.status(400).json({ error: 'No data provided or invalid format' });
    }

    console.log('Processing', data.length, 'records');

    // Insert into MongoDB
    const result = await collection.insertMany(data);
    console.log('MongoDB insert result:', result);

    res.json({
      success: true,
      message: `Successfully uploaded ${result.insertedCount} customer records`,
      insertedCount: result.insertedCount
    });

  } catch (error) {
    console.error('Error processing JSON upload:', error);
    res.status(500).json({
      error: 'Failed to save customer data',
      details: error.message
    });
  }
});

// API endpoint to get customer data
app.get('/api/customer-data', async (req, res) => {
  try {
    const data = await collection.find({}).toArray();
    res.json({ data });
  } catch (error) {
    console.error('Error fetching customer data:', error);
    res.status(500).json({ error: 'Failed to fetch customer data' });
  }
});

// API endpoint to get data count
app.get('/api/customer-data-count', async (req, res) => {
  try {
    const count = await collection.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error getting count:', error);
    res.status(500).json({ error: 'Failed to get data count' });
  }
});

// API endpoint to clear all data
app.delete('/api/customer-data', async (req, res) => {
  try {
    await collection.deleteMany({});
    res.json({ message: 'All customer data cleared' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear customer data' });
  }
});

// Data processing function (adapted from frontend DataService)
function processCustomerData(jsonData) {
  return jsonData.map((row, index) => {
    const processedRow = {};

    // Process each field that exists in the row
    Object.keys(row).forEach(key => {
      const value = row[key];
      if (value !== null && value !== undefined && value !== '') {
        // Convert field names to lowercase and handle common variations
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '_');

        switch (cleanKey) {
          case 'order_id':
          case 'orderid':
            processedRow.order_id = String(value || `ORD_${Date.now()}_${index}`);
            break;
          case 'customer_id':
          case 'customerid':
            processedRow.customer_id = String(value || `CUST_${Date.now()}_${index}`);
            break;
          case 'age':
            processedRow.age = Number(value) || 0;
            break;
          case 'gender':
            processedRow.gender = String(value || "Other");
            break;
          case 'product_id':
          case 'productid':
            processedRow.product_id = String(value || "");
            break;
          case 'country':
            processedRow.country = String(value || "");
            break;
          case 'signup_date':
          case 'signupdate':
            processedRow.signup_date = String(value || "");
            break;
          case 'last_purchase_date':
          case 'lastpurchasedate':
            processedRow.last_purchase_date = String(value || "");
            break;
          case 'cancellations_count':
          case 'cancellationscount':
            processedRow.cancellations_count = Number(value) || 0;
            break;
          case 'subscription_status':
          case 'subscriptionstatus':
            processedRow.subscription_status = String(value || "Active");
            break;
          case 'unit_price':
          case 'unitprice':
            processedRow.unit_price = Number(value) || 0;
            break;
          case 'quantity':
            processedRow.quantity = Number(value) || 0;
            break;
          case 'purchase_frequency':
          case 'purchasefrequency':
            processedRow.purchase_frequency = Number(value) || 0;
            break;
          case 'product_name':
          case 'productname':
            processedRow.product_name = String(value || "");
            break;
          case 'category':
            processedRow.category = String(value || "");
            break;
          case 'ratings':
          case 'rating':
            processedRow.ratings = Number(value) || 0;
            break;
          default:
            // Keep additional fields as they are
            processedRow[key] = value;
        }
      }
    });

    // Set defaults for required fields if not present
    if (!processedRow.order_id) processedRow.order_id = `ORD_${Date.now()}_${index}`;
    if (!processedRow.customer_id) processedRow.customer_id = `CUST_${Date.now()}_${index}`;
    if (processedRow.age === undefined) processedRow.age = 0;
    if (!processedRow.gender) processedRow.gender = "Other";
    if (!processedRow.product_name) processedRow.product_name = "";
    if (!processedRow.category) processedRow.category = "";

    // Add calculated fields only if we have the necessary data
    if (processedRow.age !== undefined) {
      processedRow.age_group = getAgeGroup(processedRow.age);
    }
    if (processedRow.last_purchase_date) {
      processedRow.months_since_last_purchase = getMonthsSinceLastPurchase(processedRow.last_purchase_date);
    }
    if (processedRow.unit_price !== undefined && processedRow.quantity !== undefined && processedRow.purchase_frequency !== undefined) {
      processedRow.lifetime_value = processedRow.unit_price * processedRow.quantity * processedRow.purchase_frequency;
    }
    if (processedRow.lifetime_value !== undefined && processedRow.ratings !== undefined && processedRow.subscription_status) {
      processedRow.promotion_eligible = processedRow.lifetime_value > 1000 && processedRow.ratings >= 4 && processedRow.subscription_status === "Active";
    }

    // Calculate churn score if we have enough data
    if (processedRow.age !== undefined && processedRow.cancellations_count !== undefined &&
        processedRow.purchase_frequency !== undefined && processedRow.ratings !== undefined &&
        processedRow.subscription_status) {
      processedRow.churn_probability = calculateChurnScore(processedRow);
      processedRow.churn_risk = processedRow.churn_probability > 0.7 ? "High" : (processedRow.churn_probability > 0.4 ? "Medium" : "Low");
      processedRow.retention_strategy = generateRetentionStrategy(processedRow);
    }

    return processedRow;
  });
}

function getAgeGroup(age) {
  if (age < 25) return "Under 25";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 60) return "45-59";
  return "60+";
}

function getMonthsSinceLastPurchase(lastPurchase) {
  if (!lastPurchase) return 999;
  const lastDate = new Date(lastPurchase);
  const now = new Date();
  return Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

function calculateChurnScore(customer) {
  let score = 0;

  if (customer.age < 25) score += 0.1;
  else if (customer.age > 60) score += 0.2;

  score += customer.cancellations_count * 0.15;

  const monthsSince = customer.months_since_last_purchase || 0;
  if (monthsSince > 6) score += 0.3;
  else if (monthsSince > 3) score += 0.15;

  if (customer.purchase_frequency < 2) score += 0.2;

  if (customer.subscription_status === "Inactive") score += 0.25;
  else if (customer.subscription_status === "Cancelled") score += 0.5;

  if (customer.ratings < 3) score += 0.2;
  else if (customer.ratings < 4) score += 0.1;

  return Math.min(Math.max(score, 0), 1);
}

function generateRetentionStrategy(customer) {
  if (customer.churn_risk === "Low") {
    return customer.promotion_eligible
      ? "Offer premium products or loyalty rewards"
      : "Continue engagement with regular offers";
  }

  if (customer.churn_risk === "Medium") {
    const strategies = [];
    if (customer.months_since_last_purchase > 3) {
      strategies.push("Send re-engagement campaign");
    }
    if (customer.ratings < 4) {
      strategies.push("Improve customer experience");
    }
    if (customer.purchase_frequency < 2) {
      strategies.push(`Offer discounts on ${customer.category} products`);
    }
    return strategies.join("; ") || "Personalized retention offer";
  }

  return `Urgent: Personal outreach, 20% discount on ${customer.category}, loyalty program enrollment`;
}

// Start server
async function startServer() {
  try {
    await connectToMongoDB();
    app.listen(port, () => {
      console.log(`Backend server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  if (client) {
    await client.close();
  }
  process.exit(0);
});