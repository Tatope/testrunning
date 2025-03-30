require('dotenv').config();
const express = require('express');
const TwitterBot = require('./bot');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;
const bot = new TwitterBot();
bot.start();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint untuk posting media dengan caption
app.get('/post-media', async (req, res) => {
    try {
        const mediaPath = bot.getRandomMedia();
        if (!mediaPath) return res.send("⚠️ Tidak ada media untuk diposting.");

        const caption = bot.getRandomCaption();
        await bot.tweetWithMedia(mediaPath, caption);
        res.send("✅ Media berhasil diposting!");
    } catch (error) {
        console.error("❌ ERROR posting media:", error);
        res.status(500).send("❌ Gagal memposting media!");
    }
});

// Menjalankan tugas posting otomatis setiap 5 menit
cron.schedule('0 */2 * * *', async () => {
    console.log("⏳ Menjalankan posting otomatis...");
    try {
        const mediaPath = bot.getRandomMedia();
        if (!mediaPath) {
            console.log("⚠️ Tidak ada media untuk diposting.");
            return;
        }

        const caption = bot.getRandomCaption();
        await bot.tweetWithMedia(mediaPath, caption);
        console.log("✅ Postingan otomatis berhasil!");
    } catch (error) {
        console.error("❌ ERROR posting otomatis:", error);
    }
});

app.listen(PORT, () => console.log(`🚀 Server berjalan di port ${PORT}`));
