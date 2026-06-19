import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { contactApi } from '@/utils/api';

export function ContattiPage() {
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    messaggio: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyConsent) {
      toast.error('Accetta la Privacy Policy per inviare il messaggio.');
      return;
    }

    setLoading(true);
    try {
      const result = await contactApi.send({ ...formData, privacyConsent });
      toast.success(result.message || 'Messaggio inviato! Ti risponderemo presto.');
      setFormData({ nome: '', cognome: '', email: '', telefono: '', messaggio: '' });
      setPrivacyConsent(false);
    } catch (error: any) {
      toast.error(error.message || 'Non sono riuscito a inviare il messaggio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contattaci</h1>
          <p className="text-gray-600">Siamo qui per aiutarti</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-gray-600">info@casavista.it</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Zona di partenza</h3>
                  <p className="text-gray-600">Modena e provincia</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-6">Inviaci un messaggio</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Nome *</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Cognome *</Label>
                    <Input
                      value={formData.cognome}
                      onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Telefono</Label>
                  <Input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Messaggio *</Label>
                  <Textarea
                    className="min-h-[150px]"
                    value={formData.messaggio}
                    onChange={(e) => setFormData({ ...formData, messaggio: e.target.value })}
                    required
                  />
                </div>
                <label className="flex items-start gap-3 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                    required
                  />
                  <span>
                    Ho letto la <Link to="/privacy" className="text-[#e74c3c] font-medium">Privacy Policy</Link> e autorizzo il trattamento dei dati per ricevere risposta.
                  </span>
                </label>
                <Button type="submit" className="bg-[#e74c3c]" disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Invio...' : 'Invia messaggio'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
