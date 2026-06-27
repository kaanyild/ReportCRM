'use client';
import { useState, useEffect } from 'react';
import { Plus, BarChart3, Trash2, X, Edit2 } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    ga4PropertyId: '',
    metaAccessToken: '',
    metaAdAccountId: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await fetch(`/api/clients/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
    } else {
      await fetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    }
    setFormData({ name: '', ga4PropertyId: '', metaAccessToken: '', metaAdAccountId: '' });
    setEditingId(null);
    setIsModalOpen(false);
    fetchClients();
  };

  const handleEditClick = (client) => {
    setFormData({
      name: client.name || '',
      ga4PropertyId: client.ga4PropertyId || '',
      metaAccessToken: client.metaAccessToken || '',
      metaAdAccountId: client.metaAdAccountId || ''
    });
    setEditingId(client.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if(confirm('Müşteriyi silmek istediğinize emin misiniz?')) {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      fetchClients();
    }
  };

  return (
    <div style={{ padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '36px', fontWeight: '800' }}>Müşteri Rapor Sistemi</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginTop: '8px' }}>Müşterilerinizi yönetin ve performans raporlarını görüntüleyin.</p>
        </div>
        <button className="btn-primary" onClick={() => {
          setFormData({ name: '', ga4PropertyId: '', metaAccessToken: '', metaAdAccountId: '' });
          setEditingId(null);
          setIsModalOpen(true);
        }}>
          <Plus size={18} /> Yeni Müşteri
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Yükleniyor...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {clients.map((client, i) => (
            <div key={client.id} className="glass-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600' }}>{client.name}</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEditClick(client)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }}>
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(client.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                <div>GA4: {client.ga4PropertyId ? 'Bağlı ✅' : 'Yok ❌'}</div>
                <div>Meta: {client.metaAdAccountId ? 'Bağlı ✅' : 'Yok ❌'}</div>
              </div>
              <Link href={`/report/${client.id}`} style={{ display: 'block' }}>
                <button className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={16} /> Raporu Görüntüle
                </button>
              </Link>
            </div>
          ))}
          {clients.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              Henüz hiç müşteri eklenmemiş.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px' }}>{editingId ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Müşteri Adı</label>
                <input required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">GA4 Property ID (opsiyonel)</label>
                <input className="input-field" placeholder="properties/1234567" value={formData.ga4PropertyId} onChange={e => setFormData({...formData, ga4PropertyId: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Meta Access Token (opsiyonel)</label>
                <input className="input-field" type="password" placeholder="EAA..." value={formData.metaAccessToken} onChange={e => setFormData({...formData, metaAccessToken: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Meta Ad Account ID (opsiyonel)</label>
                <input className="input-field" placeholder="act_1234567" value={formData.metaAdAccountId} onChange={e => setFormData({...formData, metaAdAccountId: e.target.value})} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Kaydet</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
