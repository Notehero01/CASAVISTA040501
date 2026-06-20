import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Check, MapPin, Euro, Bed, Bath, Maximize, User, Phone, Mail, Navigation, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { annunciApi, uploadApi } from '@/utils/api';
import { AddressSearch } from '@/components/MapView';
import { WatermarkedImage } from '@/components/WatermarkedImage';
import { CATEGORIE, CARATTERISTICHE, CLASSI_ENERGETICHE, STATI_IMMOBILE, RISCALDAMENTO } from '@/types/annuncio';
import type { Annuncio } from '@/types/annuncio';

const MAX_IMAGES = 30;

function createEmptyFormData() {
  return {
    tipo: 'vendita' as 'vendita' | 'affitto',
    categoria: '',
    titolo: '',
    descrizione: '',
    prezzo: '',
    superficie: '',
    locali: '',
    camere: '',
    bagni: '',
    piano: '',
    anno_costruzione: '',
    classe_energetica: '',
    stato: '',
    riscaldamento: '',
    caratteristiche: [] as string[],
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    coordinate: null as { lat: number; lng: number } | null,
    immagini: [] as string[],
    nome_contatto: '',
    telefono_contatto: '',
    email_contatto: ''
  };
}

function getEditableFormData(annuncio: Annuncio) {
  return {
    tipo: annuncio.tipo,
    categoria: annuncio.categoria || '',
    titolo: annuncio.titolo || '',
    descrizione: annuncio.descrizione || '',
    prezzo: annuncio.prezzo !== undefined && annuncio.prezzo !== null ? String(annuncio.prezzo) : '',
    superficie: annuncio.superficie !== undefined && annuncio.superficie !== null ? String(annuncio.superficie) : '',
    locali: annuncio.locali !== undefined && annuncio.locali !== null ? String(annuncio.locali) : '',
    camere: annuncio.camere !== undefined && annuncio.camere !== null ? String(annuncio.camere) : '',
    bagni: annuncio.bagni !== undefined && annuncio.bagni !== null ? String(annuncio.bagni) : '',
    piano: annuncio.piano !== undefined && annuncio.piano !== null ? String(annuncio.piano) : '',
    anno_costruzione: annuncio.anno_costruzione !== undefined && annuncio.anno_costruzione !== null ? String(annuncio.anno_costruzione) : '',
    classe_energetica: annuncio.classe_energetica || '',
    stato: annuncio.stato || '',
    riscaldamento: annuncio.riscaldamento || '',
    caratteristiche: Array.isArray(annuncio.caratteristiche) ? annuncio.caratteristiche : [],
    indirizzo: annuncio.indirizzo || '',
    citta: annuncio.citta || '',
    cap: annuncio.cap || '',
    provincia: annuncio.provincia || '',
    coordinate: annuncio.coordinate || null,
    immagini: Array.isArray(annuncio.immagini) ? annuncio.immagini : [],
    nome_contatto: annuncio.nome_contatto || '',
    telefono_contatto: annuncio.telefono_contatto || '',
    email_contatto: annuncio.email_contatto || ''
  };
}

export function PubblicaPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = Boolean(editId);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [customCaratteristica, setCustomCaratteristica] = useState('');

  const [formData, setFormData] = useState(createEmptyFormData);

  useEffect(() => {
    if (!editId) {
      setFormData(createEmptyFormData());
      return;
    }

    setIsLoadingEdit(true);
    annunciApi.getById(editId)
      .then((annuncio) => {
        setFormData(getEditableFormData(annuncio));
      })
      .catch((error: any) => {
        toast.error(error.message || 'Non sono riuscito a caricare l\'annuncio.');
        navigate('/miei-annunci');
      })
      .finally(() => setIsLoadingEdit(false));
  }, [editId, navigate]);

  const toggleCaratteristica = (car: string) => {
    setFormData(prev => ({
      ...prev,
      caratteristiche: prev.caratteristiche.includes(car)
        ? prev.caratteristiche.filter(c => c !== car)
        : [...prev.caratteristiche, car]
    }));
  };

  const addCustomCaratteristica = () => {
    const value = customCaratteristica.trim();
    if (!value) return;
    if (formData.caratteristiche.some(item => item.toLowerCase() === value.toLowerCase())) {
      toast.info('Caratteristica gia inserita');
      return;
    }
    setFormData(prev => ({
      ...prev,
      caratteristiche: [...prev.caratteristiche, value]
    }));
    setCustomCaratteristica('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const availableSlots = MAX_IMAGES - formData.immagini.length;
    if (availableSlots <= 0) {
      toast.error(`Massimo ${MAX_IMAGES} immagini`);
      e.target.value = '';
      return;
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots);
    if (selectedFiles.length < files.length) {
      toast.info(`Ho selezionato le prime ${availableSlots} immagini disponibili`);
    }

    setIsUploadingImages(true);
    try {
      const result = selectedFiles.length === 1
        ? await uploadApi.uploadImage(selectedFiles[0]).then(upload => ({ urls: [upload.url] }))
        : await uploadApi.uploadImages(selectedFiles);
      setFormData(prev => ({ ...prev, immagini: [...prev.immagini, ...result.urls].slice(0, MAX_IMAGES) }));
      toast.success(`${result.urls.length} immagini caricate`);
    } catch (error: any) {
      toast.error(error.message || 'Errore durante il caricamento delle immagini');
    } finally {
      setIsUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        prezzo: parseFloat(formData.prezzo),
        superficie: parseFloat(formData.superficie),
        locali: parseInt(formData.locali) || 0,
        camere: parseInt(formData.camere) || 0,
        bagni: parseInt(formData.bagni) || 0,
        piano: formData.piano ? parseInt(formData.piano) : undefined,
        anno_costruzione: formData.anno_costruzione ? parseInt(formData.anno_costruzione) : undefined
      };
      const result = isEditMode && editId
        ? await annunciApi.update(editId, payload)
        : await annunciApi.create(payload);

      toast.success(isEditMode ? 'Annuncio aggiornato!' : 'Annuncio pubblicato!');
      // Naviga usando lo slug per SEO
      navigate(`/annuncio/${result.annuncio.slug || result.annuncio.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{isEditMode ? 'Modifica annuncio' : 'Pubblica il tuo annuncio'}</h1>
          <p className="text-gray-600">
            {isEditMode ? 'Aggiorna i dettagli del tuo immobile gia pubblicato' : 'Inserisci i dettagli del tuo immobile'}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center mx-1 ${step >= s ? 'bg-[#e74c3c] text-white' : 'bg-gray-200'}`}>
              {s}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {isLoadingEdit ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e74c3c] border-t-transparent" />
            </div>
          ) : (
          <>
          {step === 1 && (
            <div className="space-y-6">
              <Tabs value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v as 'vendita' | 'affitto' })}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="vendita">In vendita</TabsTrigger>
                  <TabsTrigger value="affitto">In affitto</TabsTrigger>
                </TabsList>
              </Tabs>
              <div>
                <Label>Categoria</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {CATEGORIE.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setFormData({ ...formData, categoria: cat.value })}
                      className={`p-3 rounded-lg border text-sm ${formData.categoria === cat.value ? 'border-[#e74c3c] bg-[#e74c3c]/5 text-[#e74c3c]' : 'border-gray-200'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Titolo *</Label>
                <Input value={formData.titolo} onChange={(e) => setFormData({ ...formData, titolo: e.target.value })} placeholder="Es: Appartamento luminoso" />
              </div>
              <div>
                <Label>Descrizione *</Label>
                <Textarea value={formData.descrizione} onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })} className="min-h-[150px]" />
              </div>
              <div>
                <Label>Prezzo *</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input type="number" value={formData.prezzo} onChange={(e) => setFormData({ ...formData, prezzo: e.target.value })} className="pl-10" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Superficie (m²) *</Label>
                  <Input type="number" value={formData.superficie} onChange={(e) => setFormData({ ...formData, superficie: e.target.value })} />
                </div>
                <div>
                  <Label>Locali *</Label>
                  <Input type="number" value={formData.locali} onChange={(e) => setFormData({ ...formData, locali: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Camere</Label>
                  <Input type="number" value={formData.camere} onChange={(e) => setFormData({ ...formData, camere: e.target.value })} />
                </div>
                <div>
                  <Label>Bagni</Label>
                  <Input type="number" value={formData.bagni} onChange={(e) => setFormData({ ...formData, bagni: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Caratteristiche</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CARATTERISTICHE.map((car) => (
                    <button
                      type="button"
                      key={car}
                      onClick={() => toggleCaratteristica(car)}
                      className={`px-3 py-1.5 rounded-full text-sm border ${formData.caratteristiche.includes(car) ? 'bg-[#e74c3c] text-white border-[#e74c3c]' : 'border-gray-300'}`}
                    >
                      {formData.caratteristiche.includes(car) && <Check className="inline h-3 w-3 mr-1" />}
                      {car}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    value={customCaratteristica}
                    onChange={(e) => setCustomCaratteristica(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomCaratteristica();
                      }
                    }}
                    placeholder="Aggiungi caratteristica personalizzata"
                  />
                  <Button type="button" variant="outline" onClick={addCustomCaratteristica}>
                    <Plus className="h-4 w-4 mr-2" />Aggiungi
                  </Button>
                </div>
                {formData.caratteristiche.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.caratteristiche.map((car) => (
                      <button
                        key={car}
                        type="button"
                        onClick={() => toggleCaratteristica(car)}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                      >
                        {car}<X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label>Classe energetica</Label>
                  <select
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                    value={formData.classe_energetica}
                    onChange={(e) => setFormData({ ...formData, classe_energetica: e.target.value })}
                  >
                    <option value="">Non indicata</option>
                    {CLASSI_ENERGETICHE.map((classe) => (
                      <option key={classe} value={classe}>{classe}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Stato immobile</Label>
                  <select
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                    value={formData.stato}
                    onChange={(e) => setFormData({ ...formData, stato: e.target.value })}
                  >
                    <option value="">Non indicato</option>
                    {STATI_IMMOBILE.map((stato) => (
                      <option key={stato.value} value={stato.value}>{stato.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Riscaldamento</Label>
                  <select
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                    value={formData.riscaldamento}
                    onChange={(e) => setFormData({ ...formData, riscaldamento: e.target.value })}
                  >
                    <option value="">Non indicato</option>
                    {RISCALDAMENTO.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Piano</Label>
                  <Input type="number" value={formData.piano} onChange={(e) => setFormData({ ...formData, piano: e.target.value })} />
                </div>
                <div>
                  <Label>Anno costruzione</Label>
                  <Input type="number" value={formData.anno_costruzione} onChange={(e) => setFormData({ ...formData, anno_costruzione: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label>Indirizzo completo *</Label>
                <div className="mt-2">
                  <AddressSearch 
                    onSelect={(address, coords, details) => {
                      setFormData({ 
                        ...formData, 
                        indirizzo: address,
                        coordinate: coords,
                        citta: details?.citta || formData.citta,
                        cap: details?.cap || formData.cap,
                        provincia: details?.provincia || formData.provincia
                      });
                    }}
                    placeholder="Cerca indirizzo..."
                  />
                </div>
                {formData.coordinate && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    Posizione confermata sulla mappa
                  </p>
                )}
              </div>
              <div>
                <Label>Indirizzo (modifica se necessario)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input value={formData.indirizzo} onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })} className="pl-10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Città *</Label>
                  <Input value={formData.citta} onChange={(e) => setFormData({ ...formData, citta: e.target.value })} />
                </div>
                <div>
                  <Label>CAP *</Label>
                  <Input value={formData.cap} onChange={(e) => setFormData({ ...formData, cap: e.target.value })} maxLength={5} />
                </div>
              </div>
              <div>
                <Label>Immagini ({formData.immagini.length}/{MAX_IMAGES})</Label>
                <div className="grid grid-cols-3 gap-2 mt-2 sm:grid-cols-5">
                  {formData.immagini.map((img, i) => (
                    <div key={i} className="relative aspect-square">
                      <WatermarkedImage src={img} alt={`Foto caricata ${i + 1}`} className="rounded-lg" fit="contain" />
                      <button onClick={() => setFormData({ ...formData, immagini: formData.immagini.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {formData.immagini.length < MAX_IMAGES && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#e74c3c]">
                      {isUploadingImages ? (
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#e74c3c] border-t-transparent" />
                      ) : (
                        <Upload className="h-6 w-6 text-gray-400" />
                      )}
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={isUploadingImages} />
                    </label>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Puoi caricare fino a {MAX_IMAGES} foto. Selezionandole insieme il caricamento e piu veloce.
                </p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <Label>Nome contatto *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input value={formData.nome_contatto} onChange={(e) => setFormData({ ...formData, nome_contatto: e.target.value })} className="pl-10" />
                </div>
              </div>
              <div>
                <Label>Telefono *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input type="tel" value={formData.telefono_contatto} onChange={(e) => setFormData({ ...formData, telefono_contatto: e.target.value })} className="pl-10" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input type="email" value={formData.email_contatto} onChange={(e) => setFormData({ ...formData, email_contatto: e.target.value })} className="pl-10" />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>Indietro</Button>
            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)} className="bg-[#e74c3c]">Avanti</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#e74c3c]">
                {isSubmitting ? (isEditMode ? 'Salvataggio...' : 'Pubblicazione...') : (isEditMode ? 'Salva modifiche' : 'Pubblica annuncio')}
              </Button>
            )}
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
