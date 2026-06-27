'use client';
import { useState, useEffect, use } from 'react';
import { ArrowLeft, Calendar, Activity, MousePointerClick, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

// Simple Number Ticker Component
const AnimatedNumber = ({ value, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (end === 0) return;
    
    const duration = 1000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  const formatted = display % 1 !== 0 ? display.toFixed(2) : Math.floor(display);
  return <span>{prefix}{Number(formatted).toLocaleString('tr-TR')}{suffix}</span>;
};

// Typewriter Effect Component
const TypewriterEffect = ({ text, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

export default function ReportPage({ params }) {
  const unwrappedParams = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [days]);

  const fetchReport = async () => {
    setLoading(true);
    setAiSummary(null);
    try {
      const res = await fetch(`/api/report?clientId=${unwrappedParams.id}&days=${days}`);
      const json = await res.json();
      setData(json);

      if (!json.error) {
        fetchAiSummary(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSummary = async (reportData) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta: reportData.meta,
          ga4: reportData.ga4,
          period: reportData.period,
          clientName: reportData.clientName
        })
      });
      const result = await res.json();
      if (result.summary) {
        setAiSummary(result.summary);
      } else {
        setAiSummary(result.error || "Yapay zeka özeti oluşturulamadı.");
      }
    } catch (e) {
      setAiSummary("Yapay zeka sunucusuna bağlanılamadı.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="gradient-text" style={{ fontSize: '24px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>Veriler Analiz Ediliyor...</div>
      </div>
    );
  }

  if (data?.error) {
    return <div style={{ padding: '40px', color: 'var(--accent-red)' }}>Hata: {data.error}</div>;
  }



  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }} className="animate-fade-in">
        <div>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Dashboard'a Dön
          </Link>
          <h1 className="gradient-text" style={{ fontSize: '42px', fontWeight: '800', lineHeight: 1 }}>{data.clientName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Calendar size={16} /> <span>{data.period}</span>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <Activity size={14} /> Performans Çok İyi
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {[7, 14, 30, 90].map(d => (
            <button 
              key={d} 
              onClick={() => setDays(d)}
              className={days === d ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Son {d} Gün
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '40px', borderLeft: '4px solid var(--accent-blue)', position: 'relative' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <Activity size={20} color="var(--accent-blue)" /> Yapay Zeka Yönetici Özeti (Google Gemini)
        </h3>
        
        {aiLoading && !aiSummary ? (
          <div style={{ padding: '10px 0' }}>
            <div style={{ height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '100%', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}></div>
            <div style={{ height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '90%', marginBottom: '8px', animation: 'pulse 1.5s infinite', animationDelay: '0.2s' }}></div>
            <div style={{ height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '70%', animation: 'pulse 1.5s infinite', animationDelay: '0.4s' }}></div>
            <p style={{ fontSize: '12px', color: 'var(--accent-blue)', marginTop: '12px', animation: 'pulse 1.5s infinite' }}>Google Gemini Verileri Analiz Ediyor...</p>
          </div>
        ) : (
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {aiSummary ? <TypewriterEffect text={aiSummary} speed={15} /> : 'Özet bulunamadı.'}
          </p>
        )}
      </div>

      {/* Meta Ads Section */}
      {data.meta && (
        <div className="section animate-fade-in" style={{ animationDelay: '0.1s', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--accent-purple)' }}><TrendingUp /></span> Meta Reklam Performansı
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.meta.toplamDonusum > 0 ? 6 : 5}, 1fr)`, gap: '20px', marginBottom: '30px' }}>
            <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Harcama</div>
              <div style={{ fontSize: '30px', fontWeight: '800' }}><AnimatedNumber value={data.meta.toplamHarcama} prefix="₺" /></div>
            </div>
            <div className="glass-card">
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Gösterim</div>
              <div style={{ fontSize: '30px', fontWeight: '800' }}><AnimatedNumber value={data.meta.toplamGosteri} /></div>
            </div>
            <div className="glass-card">
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Erişim</div>
              <div style={{ fontSize: '30px', fontWeight: '800' }}><AnimatedNumber value={data.meta.toplamErisim} /></div>
            </div>
            <div className="glass-card">
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tıklama</div>
              <div style={{ fontSize: '30px', fontWeight: '800' }}><AnimatedNumber value={data.meta.toplamTiklama} /></div>
            </div>
            <div className="glass-card">
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>BGBM (CPM)</div>
              <div style={{ fontSize: '30px', fontWeight: '800' }}><AnimatedNumber value={data.meta.ortalamaCPM} prefix="₺" /></div>
            </div>
            {data.meta.toplamDonusum > 0 && (
              <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Dönüşüm</div>
                <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--accent-green)' }}><AnimatedNumber value={data.meta.toplamDonusum} /></div>
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px', height: '400px', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--text-secondary)' }}>Günlük Harcama Trendi</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.meta.chartData}>
                <defs>
                  <linearGradient id="colorHarcama" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₺${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="harcama" name="Harcama (₺)" stroke="var(--accent-purple)" strokeWidth={3} fillOpacity={1} fill="url(#colorHarcama)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {data.meta.demographics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div className="glass-panel" style={{ padding: '24px', height: '350px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--text-secondary)' }}>Hedef Kitle Cinsiyet Dağılımı</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.meta.demographics.gender} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value" stroke="none">
                      {data.meta.demographics.gender.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#ec4899', '#f59e0b'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-panel" style={{ padding: '24px', height: '350px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--text-secondary)' }}>Hedef Kitle Yaş Dağılımı</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.meta.demographics.age} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="age" type="category" stroke="rgba(255,255,255,0.6)" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="impressions" name="Gösterim" fill="var(--accent-purple)" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kampanya Adı</th>
                  <th style={{textAlign:'right'}}>Harcama</th>
                  <th style={{textAlign:'right'}}>Gösterim</th>
                  <th style={{textAlign:'right'}}>Erişim</th>
                  <th style={{textAlign:'right'}}>Tıklama</th>
                  <th style={{textAlign:'right'}}>CTR</th>
                  <th style={{textAlign:'right'}}>CPM</th>
                  {data.meta.toplamDonusum > 0 && <th style={{textAlign:'right'}}>Dönüşüm</th>}
                  {data.meta.toplamDonusum > 0 && <th style={{textAlign:'right'}}>Maliyet / D.</th>}
                </tr>
              </thead>
              <tbody>
                {data.meta.kampanyalar.map((k, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: '500', color: 'white' }}>{k.ad}</td>
                    <td style={{textAlign:'right'}}>₺{k.harcama}</td>
                    <td style={{textAlign:'right'}}>{Number(k.gosterim).toLocaleString('tr-TR')}</td>
                    <td style={{textAlign:'right'}}>{Number(k.erisim).toLocaleString('tr-TR')}</td>
                    <td style={{textAlign:'right'}}>{Number(k.tiklama).toLocaleString('tr-TR')}</td>
                    <td style={{textAlign:'right'}}>%{k.ctr}</td>
                    <td style={{textAlign:'right'}}>₺{k.cpm}</td>
                    {data.meta.toplamDonusum > 0 && <td style={{textAlign:'right', color:'var(--accent-green)', fontWeight:'600'}}>{k.donusum}</td>}
                    {data.meta.toplamDonusum > 0 && <td style={{textAlign:'right'}}>₺{k.donusumMaliyeti}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GA4 Section */}
      {data.ga4 && (
        <div className="section animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--accent-orange)' }}><Activity /></span> Google Analytics 4 (Web Trafiği)
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.ga4.toplamDonusum > 0 ? 4 : 3}, 1fr)`, gap: '20px', marginBottom: '30px' }}>
            <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Toplam Oturum</div>
              <div style={{ fontSize: '36px', fontWeight: '800' }}><AnimatedNumber value={data.ga4.toplamOturum} /></div>
            </div>
            <div className="glass-card">
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Aktif Kullanıcı</div>
              <div style={{ fontSize: '36px', fontWeight: '800' }}><AnimatedNumber value={data.ga4.toplamKullanici} /></div>
            </div>
            <div className="glass-card">
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Hemen Çıkma Oranı</div>
              <div style={{ fontSize: '36px', fontWeight: '800' }}><AnimatedNumber value={data.ga4.ortHemenGitme} suffix="%" /></div>
            </div>
            {data.ga4.toplamDonusum > 0 && (
              <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Dönüşüm</div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent-blue)' }}><AnimatedNumber value={data.ga4.toplamDonusum} /></div>
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px', height: '400px', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--text-secondary)' }}>Günlük Trafik Trendi</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.ga4.chartData}>
                <defs>
                  <linearGradient id="colorOturum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-orange)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--accent-orange)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="oturum" name="Oturum" stroke="var(--accent-orange)" strokeWidth={3} fillOpacity={1} fill="url(#colorOturum)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {data.ga4.devices && data.ga4.devices.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', height: '350px', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--text-secondary)' }}>Ziyaretçilerin Cihaz Tercihleri</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.ga4.devices} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value" stroke="none">
                    {data.ga4.devices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#f59e0b', '#3b82f6', '#10b981'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trafik Kanalı</th>
                  <th>Ülke</th>
                  <th style={{textAlign:'right'}}>Oturum</th>
                  <th style={{textAlign:'right'}}>Kullanıcı</th>
                  <th style={{textAlign:'right'}}>Ort. Süre</th>
                  {data.ga4.toplamDonusum > 0 && <th style={{textAlign:'right'}}>Dönüşüm</th>}
                </tr>
              </thead>
              <tbody>
                {data.ga4.kanallar.map((k, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: '500', color: 'white' }}>{k.kanal}</td>
                    <td>{k.ulke}</td>
                    <td style={{textAlign:'right'}}>{Number(k.oturum).toLocaleString('tr-TR')}</td>
                    <td style={{textAlign:'right'}}>{Number(k.kullanici).toLocaleString('tr-TR')}</td>
                    <td style={{textAlign:'right'}}>{k.ortSure}</td>
                    {data.ga4.toplamDonusum > 0 && <td style={{textAlign:'right', color:'var(--accent-blue)', fontWeight:'600'}}>{k.donusum}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
