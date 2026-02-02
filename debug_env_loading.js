const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading .env from:', envPath);

if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.error('Error loading .env:', result.error);
    } else {
        console.log('.env loaded successfully.');
    }
} else {
    console.error('.env.local file NOT FOUND at:', envPath);
}

const url = process.env.POSTGRES_URL;
console.log('POSTGRES_URL type:', typeof url);
console.log('POSTGRES_URL length:', url ? url.length : 0);
if (url) {
    console.log('POSTGRES_URL starts with:', url.substring(0, 15) + '...');
} else {
    console.log('POSTGRES_URL is undefined or empty.');
}
