const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'password123';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Bcrypt Hash:', hash);
console.log('\nYou can manually insert this hash into your app_config Supabase row if needed.');
