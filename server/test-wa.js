try {
    console.log('Requiring whatsapp-web.js...');
    const { Client } = require('whatsapp-web.js');
    console.log('Success!');
} catch (err) {
    console.error('Error requiring whatsapp-web.js:', err);
}
