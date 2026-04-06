
const apiKey = '81ad73157134a49e6ec27cc8daaed65d';
const affiliateId = '744826';
const merchantId = '1446';

async function testConnection() {
    const url = `https://api.offer18.com/api/af/offers?key=${apiKey}&aid=${affiliateId}&mid=${merchantId}`;

    console.log('Testing connection to Offer18 API...');
    console.log('URL:', url);

    try {
        const response = await fetch(url);
        const text = await response.text();
        console.log('Status:', response.status);

        try {
            const data = JSON.parse(text);
            if (data.response === '200') {
                console.log('✅ Connection successful!');
                const count = Object.keys(data.data || {}).length;
                console.log(`Found ${count} offers.`);
            } else {
                console.log('❌ Connection failed:', data.message || data.error || text);
                console.log('Full Response:', text);
            }
        } catch (e) {
            console.log('❌ Failed to parse JSON response');
            console.log('Raw Response:', text);
        }
    } catch (error) {
        console.error('❌ Error testing connection:', error.message);
    }
}

testConnection();
