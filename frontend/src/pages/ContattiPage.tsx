import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function ContattiPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Messaggio inviato! Ti risponderemo presto.');
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
                <div className="bg-[#e74c3c]/10 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-[#e74c3c]" />
                </div>
                <div>
                  <h3 className="font-semibold">Telefono</h3>
                  <p className="text-gray-600">+39 055 1234567</p>
                </div>
              </div>
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
                  <h3 className="font-semibold">Indirizzo</h3>
                  <p className="text-gray-600">Via dell'Immobiliare 123<br />50100 Firenze (FI)</p>
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
                    <Input required />
                  </div>
                  <div>
                    <Label>Cognome *</Label>
                    <Input required />
                  </div>
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" required />
                </div>
                <div>
                  <Label>Messaggio *</Label>
                  <Textarea className="min-h-[150px]" required />
                </div>
                <Button type="submit" className="bg-[#e74c3c]">
                  <Send className="h-4 w-4 mr-2" />Invia messaggio
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
