const dns = require('dns');

const hostname = 'db.zoclqafvwncqefbymhkl.supabase.co';

console.log(`🔍 Resolving: ${hostname}`);

dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err) {
        console.error('❌ Lookup Failed:', err);
    } else {
        console.log('✅ Addresses found:', addresses);
    }
});

// Also try resolving specifically A (IPv4) and AAAA (IPv6) records
dns.resolve4(hostname, (err, addresses) => {
    if (err) console.error('❌ IPv4 (A) Resolve Failed:', err.message);
    else console.log('✅ IPv4 (A) Records:', addresses);
});

dns.resolve6(hostname, (err, addresses) => {
    if (err) console.error('❌ IPv6 (AAAA) Resolve Failed:', err.message);
    else console.log('✅ IPv6 (AAAA) Records:', addresses);
});
