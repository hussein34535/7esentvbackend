const https = require('https');
const data = JSON.stringify({
  payment_method_id: 2, // Card
  cartTotal: "100.00",
  currency: "EGP",
  customer: {
    first_name: "Hussein", last_name: "Hossam", email: "hussona4635@gmail.com", phone: "01016270395", address: "Cairo, Egypt"
  },
  redirectionUrls: {
    successUrl: "https://google.com", failUrl: "https://google.com", pendingUrl: "https://google.com"
  },
  cartItems: [{ name: "Test", price: "100.00", quantity: "1" }],
  payLoad: { uid: "123", packageId: 1 }
});

const req = https.request({
  hostname: 'app.fawaterk.com', port: 443, path: '/api/v2/invoiceInitPay', method: 'POST',
  headers: {
    'Authorization': `Bearer 30f901fc00b27c34a6569b47aa9874ae1b6e8ded1b03ab42f8`,
    'Content-Type': 'application/json'
  }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log(body));
});
req.write(data); req.end();
