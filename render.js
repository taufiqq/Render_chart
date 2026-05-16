const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log("Membuka Browser...");
    const browser = await puppeteer.launch({ 
    headless: true, // Diubah dari "new" menjadi true
    args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Tambahan agar tidak gampang crash di server
        '--disable-gpu'            // Server tidak butuh GPU untuk screenshot
        ] 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Buka file index.html
    const filePath = 'file://' + path.join(__dirname, 'index.html');
    await page.goto(filePath);

    const fps = 30;
    const durasiPerTransisi = 3; // detik
    const totalFrames = (3 - 1) * durasiPerTransisi * fps; // (3 tahun)
    const yearStart = 1960;
    const yearEnd = 1970;
    const yearStep = (yearEnd - yearStart) / totalFrames;

    if (!fs.existsSync('./frames')) fs.mkdirSync('./frames');

    console.log(`Memulai Rendering ${totalFrames} frame...`);

    for (let i = 0; i < totalFrames; i++) {
        const currentYear = yearStart + (i * yearStep);
        
        // Perintahkan browser menggambar tahun tersebut
        await page.evaluate((y) => {
            window.renderFrame(y);
        }, currentYear);

        // Ambil gambar
        await page.screenshot({
            path: `./frames/frame_${String(i).padStart(5, '0')}.png`,
            omitBackground: true
        });

        if (i % 15 === 0) console.log(`Progress: ${Math.round((i/totalFrames)*100)}%`);
    }

    await browser.close();

    console.log("Menjahit video dengan FFmpeg...");
    // Perintah untuk menggabung frame jadi MP4
    execSync(`ffmpeg -y -framerate ${fps} -i ./frames/frame_%05d.png -c:v libx264 -pix_fmt yuv420p video_output.mp4`);

    console.log("Selesai! File: video_output.mp4");
})();
