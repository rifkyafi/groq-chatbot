const pool = require('./src/lib/db').default;

async function main() {
  try {
    const [rows] = await pool.execute('SELECT * FROM users');
    console.log('Success:', rows);
  } catch(e) {
    console.error('Error:', e);
  } finally {
    pool.end();
  }
}
main();
