require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create connection using the same config as your app
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
  }
);

async function addQrCodeColumn() {
  try {
    // Check if the connection is established
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Execute raw SQL to add the column
    await sequelize.query('ALTER TABLE Users ADD COLUMN qrCode TEXT NULL;');
    
    console.log('qrCode column added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding qrCode column:', error);
    process.exit(1);
  }
}

addQrCodeColumn();