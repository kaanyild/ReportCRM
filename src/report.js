const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const dayjs = require('dayjs');
require('dotenv').config();

/**
 * GA4 ve Meta verilerinden PDF rapor oluşturur.
 * @param {Object} ga4Veri - GA4 modülünden gelen veri
 * @param {Object} metaVeri - Meta modülünden gelen veri
 * @param {string} donemBaslangic - Rapor dönem başlangıcı
 * @param {string} donemBitis - Rapor dönem bitişi
 * @returns {string} Oluşturulan PDF dosya yolu
 */
async function pdfRaporOlustur(ga4Veri, metaVeri, donemBaslangic, donemBitis) {
  // HTML şablonunu yükle
  const sablonMetni = fs.readFileSync(
    path.join(__dirname, 'template.html'), 'utf8'
  );

  // Handlebars yardımcı fonksiyonları
  Handlebars.registerHelper('formatNumber', function (val) {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString('tr-TR');
  });

  const sablon = Handlebars.compile(sablonMetni);

  const html = sablon({
    musteriAdi: process.env.CLIENT_NAME || 'Müşteri',
    olusturulmaTarihi: dayjs().format('DD.MM.YYYY'),
    donemBaslangic: dayjs(donemBaslangic).format('DD.MM.YYYY'),
    donemBitis: dayjs(donemBitis).format('DD.MM.YYYY'),
    ga4: ga4Veri,
    meta: metaVeri,
  });

  // PDF üret
  const launchOptions = {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };

  // IDX ortamında Chromium yolunu kullan
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const outputDir = process.env.OUTPUT_DIR || './raporlar';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const dosyaAdi = path.join(outputDir, `rapor_${dayjs().format('YYYY-MM-DD')}.pdf`);

  await page.pdf({
    path: dosyaAdi,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '0mm', right: '0mm' },
  });

  await browser.close();
  console.log(`✅ Rapor oluşturuldu: ${dosyaAdi}`);
  return dosyaAdi;
}

module.exports = { pdfRaporOlustur };
