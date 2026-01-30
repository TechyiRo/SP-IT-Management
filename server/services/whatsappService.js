const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;
let isReady = false;

const initialize = () => {
    console.log('Initializing WhatsApp Client...');

    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED. Scan this with your phone:');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('WhatsApp Client is ready!');
        isReady = true;
    });

    client.on('authenticated', () => {
        console.log('WhatsApp Client Authenticated');
    });

    client.on('auth_failure', (msg) => {
        console.error('WhatsApp Authentication Failure', msg);
    });

    client.on('disconnected', (reason) => {
        console.log('WhatsApp Client was disconnected', reason);
        isReady = false;
    });

    // Initialize Client
    console.log('Starting Client initialization...');
    client.initialize().catch(err => {
        console.error('CRITICAL: WhatsApp Client failed to initialize:', err.message);
        // Do not crash the server, just log it.
        isReady = false;
    });
};

const sendMessage = async (phoneNumber, message) => {
    if (!isReady || !client) {
        console.warn('WhatsApp Client is not ready. Message not sent.');
        return false;
    }

    try {
        // WhatsApp IDs are typically 'countrycode+number@c.us' (e.g., 919922...@c.us)
        // Ensure phoneNumber has no spaces or symbols
        const sanitizedNumber = phoneNumber.replace(/\D/g, '');
        if (!sanitizedNumber) return false;

        const chatId = sanitizedNumber + '@c.us';

        // Check if number is registered on WhatsApp (optional, can be slow)
        // const isRegistered = await client.isRegisteredUser(chatId);
        // if(!isRegistered) {
        //     console.warn('Number not registered on WhatsApp:', chatId);
        //     return false;
        // }

        await client.sendMessage(chatId, message);
        console.log(`WhatsApp message sent to ${chatId}`);
        return true;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        return false;
    }
};

module.exports = {
    initialize,
    sendMessage
};
