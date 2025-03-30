const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class TwitterBot {
  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.CONSUMER_KEY,
      appSecret: process.env.CONSUMER_SECRET,
      accessToken: process.env.ACCESS_TOKEN,
      accessSecret: process.env.ACCESS_TOKEN_SECRET,
    });

    this.mediaFolder = path.join(__dirname, 'media');
    this.captionFile = path.join(__dirname, 'captions.txt');
  }

  getRandomMedia() {
    const files = fs.readdirSync(this.mediaFolder).filter(file =>
      file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.mp4')
    );
    if (files.length === 0) return null;
    return path.join(this.mediaFolder, files[Math.floor(Math.random() * files.length)]);
  }

  getRandomCaption() {
    if (!fs.existsSync(this.captionFile)) return '';
    const captions = fs.readFileSync(this.captionFile, 'utf8').split('\n').filter(Boolean);
    if (captions.length === 0) return '';
    return captions[Math.floor(Math.random() * captions.length)];
  }

  async canTweet() {
    try {
      const response = await this.client.v2.get('tweets'); // Coba request ke API
      return response.rateLimit.remaining > 0; // Cek apakah masih ada limit tersisa
    } catch (error) {
      console.error("Gagal mengecek limit:", error);
      return false; // Jika gagal mengecek, anggap limit sudah habis
    }
  }

  async tweetWithMedia(mediaPath, tweetText) {
    try {
      const mediaType = mediaPath.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';
      const mediaData = await this.client.v1.uploadMedia(mediaPath, { type: mediaType });

      await this.client.v2.tweet(tweetText, { media: { media_ids: [mediaData] } });

      console.log('Tweet berhasil diposting:', tweetText);
    } catch (error) {
      console.error('Gagal memposting tweet:', error);
    }
  }

  async postRandomTweet() {
    try {
      if (!(await this.canTweet())) {
        console.log("🚫 Sudah mencapai limit tweet harian. Coba lagi nanti.");
        return;
      }

      const mediaPath = this.getRandomMedia();
      const caption = this.getRandomCaption();

      if (!mediaPath) {
        console.log('Tidak ada media untuk diunggah.');
        return;
      }

      await this.tweetWithMedia(mediaPath, caption);
    } catch (error) {
      console.error('Gagal memposting tweet:', error);
    }
  }

  start() {
    console.log('Bot dimulai...');
    this.postRandomTweet();
    setInterval(() => this.postRandomTweet(), 2 * 60 * 60 * 1000); // Setiap 2 jam
  }
}

module.exports = TwitterBot;
