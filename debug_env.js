
const dotenv = require('dotenv');
const result = dotenv.config({ path: '.env.local' });

if (result.error) {
    console.error('Error loading .env.local:', result.error);
} else {
    console.log('.env.local parsed successfully.');
    console.log('Keys found:', Object.keys(result.parsed));
}

console.log('DATABASE_URL in process.env:', process.env.DATABASE_URL);
console.log('POSTGRES_URL in process.env:', process.env.POSTGRES_URL);
