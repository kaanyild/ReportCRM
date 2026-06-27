import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const data = await request.json();
    const { meta, ga4, period, clientName } = data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY bulunamadı. Lütfen .env.local dosyasına ekleyin.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-3.5-flash for the latest 2026 generation capabilities
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `
Amacın, aşağıdaki dijital pazarlama verilerini okuyup müşteri için 2 paragraflık sade, objektif ve anlaşılır bir "Yönetici Özeti" (Executive Summary) çıkarmak.

Rapor Dönemi: ${period}
Müşteri Adı: ${clientName}

--- META REKLAM VERİLERİ ---
Harcama: ${meta?.toplamHarcama} TL
Gösterim: ${meta?.toplamGosteri}
Erişim: ${meta?.toplamErisim}
Tıklama: ${meta?.toplamTiklama}
Dönüşüm: ${meta?.toplamDonusum}
Ortalama BGBM (CPM): ${meta?.ortalamaCPM} TL
Tıklama Oranı (CTR): %${meta?.genelCTR}

--- GOOGLE ANALYTICS 4 VERİLERİ (WEB TRAFİĞİ) ---
Toplam Oturum: ${ga4?.toplamOturum}
Aktif Kullanıcı: ${ga4?.toplamKullanici}
Hemen Çıkma Oranı: %${ga4?.ortHemenGitme}
Web Dönüşümleri: ${ga4?.toplamDonusum}

Kurallar:
1. Abartılı övgülerden, kendini övmekten veya "mükemmel başarı elde ettik" gibi aşırı pazarlama ağzından kaçın. Sade bir dil kullan.
2. KESİNLİKLE olumsuz, karamsar veya başarısızlık hissi veren kelimeler kullanma (Örn: "Düşüş var, performans kötü" gibi şeyler söyleme). Verileri her zaman nötr, yapıcı ve kurumsal bir bakış açısıyla aktar.
3. Reklam harcamasının sonucunda elde edilenleri (erişim, tıklama ve web sitesi trafiği) anlaşılır bir dille yorumla.
4. Eğer dönüşüm verisi 0 (sıfır) ise, dönüşüm eksikliğinden veya başarısızlıktan hiç bahsetme; sadece gerçekleşen etkileşim verilerine odaklan.
5. Yazdığın metin doğrudan müşteriye hitap etmeli (Örn: "Değerli ${clientName} ekibi...").
6. Kesinlikle markdown formatı kullanma, sadece düz paragraflar yaz. HTML tagleri kullanma.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ summary: responseText });
  } catch (error) {
    console.error('AI Summary Error:', error);
    return NextResponse.json({ error: `Yapay zeka yorumu oluşturulurken bir hata oluştu: ${error.message}` }, { status: 500 });
  }
}
