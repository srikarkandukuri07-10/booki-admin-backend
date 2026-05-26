const fs = require('fs');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');

// Discover local network IPv4 address, prioritizing Wi-Fi
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const isWifi = name.toLowerCase().includes('wi-fi') || 
                   name.toLowerCase().includes('wlan') || 
                   name.toLowerCase().includes('wireless');
    if (isWifi) {
      for (const net of interfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }

  for (const name of Object.keys(interfaces)) {
    const isVirtual = name.toLowerCase().includes('vmware') || 
                      name.toLowerCase().includes('virtual') || 
                      name.toLowerCase().includes('vbox') || 
                      name.toLowerCase().includes('host-only') ||
                      name.toLowerCase().includes('wsl');
    if (isVirtual) continue;

    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

async function generateQRCodes() {
  const localIp = getLocalIpAddress();
  const port = 3000;
  
  // Create secure and non-secure URLs
  const httpUrl = `http://${localIp}:${port}`;
  const httpsUrl = `https://${localIp}:${port}`;

  console.log('--- 🚀 Smart Restaurant QR Code Generator ---');
  console.log(`Discovered LAN IP: ${localIp}`);
  console.log(`Generating HTTP QR for: ${httpUrl}`);
  console.log(`Generating HTTPS QR for: ${httpsUrl}`);

  const qrOptions = {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 2,
    color: {
      dark: '#0f0f0e',
      light: '#ffffff'
    }
  };

  try {
    const outputPathHttp = path.join(__dirname, 'qrcode-http.png');
    const outputPathHttps = path.join(__dirname, 'qrcode-https.png');

    await QRCode.toFile(outputPathHttp, httpUrl, qrOptions);
    await QRCode.toFile(outputPathHttps, httpsUrl, qrOptions);

    console.log(`\n✅ Generated General QR Codes:`);
    console.log(`  - HTTP (Standard): ${outputPathHttp}`);
    console.log(`  - HTTPS (Secure):  ${outputPathHttps}`);

    // Generate table-specific QR codes under public/qr-tables/ so they can be served as static assets!
    const tableQrDir = path.join(__dirname, 'public', 'qr-tables');
    if (!fs.existsSync(tableQrDir)) {
      fs.mkdirSync(tableQrDir, { recursive: true });
    }

    // Write 12 table QR codes for both HTTP and HTTPS!
    for (let i = 1; i <= 12; i++) {
      const tableUrlHttp = `${httpUrl}/?table=${i}`;
      const filePathHttp = path.join(tableQrDir, `table-${i}-http.png`);
      await QRCode.toFile(filePathHttp, tableUrlHttp, qrOptions);

      const tableUrlHttps = `${httpsUrl}/?table=${i}`;
      const filePathHttps = path.join(tableQrDir, `table-${i}-https.png`);
      await QRCode.toFile(filePathHttps, tableUrlHttps, qrOptions);
    }
    
    console.log(`✅ Completed generating 12 table-specific QR codes for both HTTP and HTTPS!`);

  } catch (err) {
    console.error('❌ Error generating QR codes:', err);
  }
}

generateQRCodes();
