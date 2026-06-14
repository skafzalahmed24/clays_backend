async function test() {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'skshabbirgul@gmail.com', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.token || loginData.token;

    await fetch('http://localhost:5000/api/users/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            firstName: 'John', lastName: 'Doe', email: 'john@example.com',
            phone: '1234567890', address: '123 Main St', city: 'New York', postalCode: '10001'
        })
    });

    const getRes = await fetch('http://localhost:5000/api/users/addresses', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await getRes.json();
    console.log('Addresses in DB:', JSON.stringify(data, null, 2));
}
test();
