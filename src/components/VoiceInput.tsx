import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Globe } from 'lucide-react';

interface Props {
  onResult: (itemName: string, amount: number) => void;
}

// Tamil number word mappings
const TAMIL_UNITS: Record<string, number> = {
  'ஒன்று': 1, 'ஒன்னு': 1, 'ஒரு': 1,
  'இரண்டு': 2, 'ரெண்டு': 2, 'இரு': 2,
  'மூன்று': 3, 'மூணு': 3,
  'நான்கு': 4, 'நாலு': 4,
  'ஐந்து': 5, 'அஞ்சு': 5,
  'ஆறு': 6,
  'ஏழு': 7, 'ஏழ்': 7,
  'எட்டு': 8,
  'ஒன்பது': 9, 'ஒம்போது': 9,
};

const TAMIL_TENS: Record<string, number> = {
  'பத்து': 10, 'பத்': 10,
  'இருபது': 20, 'இருவது': 20,
  'முப்பது': 30,
  'நாற்பது': 40, 'நாப்பது': 40,
  'ஐம்பது': 50, 'அம்பது': 50,
  'அறுபது': 60,
  'எழுபது': 70,
  'எண்பது': 80,
  'தொண்ணூறு': 90,
};

const TAMIL_COMPOUND_TENS: Record<string, number> = {
  'பதினொன்று': 11, 'பன்னிரண்டு': 12, 'பதிமூன்று': 13, 'பதினான்கு': 14,
  'பதினைந்து': 15, 'பதினாறு': 16, 'பதினேழு': 17, 'பதினெட்டு': 18, 'பத்தொன்பது': 19,
  'இருபத்தொன்று': 21, 'இருபத்திரண்டு': 22, 'இருபத்திமூன்று': 23, 'இருபத்தினான்கு': 24,
  'இருபத்தைந்து': 25, 'இருபத்தாறு': 26, 'இருபத்தேழு': 27, 'இருபத்தெட்டு': 28, 'இருபத்தொன்பது': 29,
};

const TAMIL_LARGE: Record<string, number> = {
  'நூறு': 100, 'ஆயிரம்': 1000,
};

// Romanized Tamil number words
const ROMANIZED_TAMIL: Record<string, number> = {
  'ondru': 1, 'onnu': 1, 'oru': 1,
  'irandu': 2, 'rendu': 2,
  'moondru': 3, 'moonu': 3,
  'naangu': 4, 'naalu': 4,
  'ainthu': 5, 'anju': 5,
  'aaru': 6,
  'ezhu': 7, 'yezhu': 7,
  'ettu': 8,
  'onbathu': 9, 'ombodhu': 9,
  'pathu': 10, 'pattu': 10,
  'irupathu': 20, 'iruvathu': 20,
  'muppathu': 30,
  'naarpathu': 40, 'naappathu': 40,
  'aimpathu': 50, 'ambathu': 50,
  'arupathu': 60,
  'ezhupathu': 70,
  'enbathu': 80,
  'thonnuru': 90, 'thonnooru': 90,
  'nooru': 100, 'nuru': 100,
  'aayiram': 1000, 'ayiram': 1000,
};

// Tamil Unicode digit to ASCII
function tamilDigitsToAscii(text: string): string {
  return text.replace(/[௦-௯]/g, ch => String(ch.charCodeAt(0) - 0x0BE6));
}

function parseTamilAmount(text: string): number | null {
  // First try Tamil Unicode digits
  const asciiText = tamilDigitsToAscii(text);
  const digitMatch = asciiText.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) return parseFloat(digitMatch[1]);

  const lower = text.toLowerCase().trim();

  // Check compound numbers first
  for (const [word, val] of Object.entries(TAMIL_COMPOUND_TENS)) {
    if (lower.includes(word)) return val;
  }

  // Check romanized Tamil compounds (e.g., "irupathu anju" = 25)
  let total = 0;
  let found = false;

  // Check large multipliers
  for (const [word, val] of Object.entries(TAMIL_LARGE)) {
    if (lower.includes(word)) { total += val; found = true; }
  }
  for (const [word, val] of Object.entries({ ...ROMANIZED_TAMIL })) {
    if (val >= 100 && lower.includes(word)) { total += val; found = true; }
  }

  // Check tens
  for (const [word, val] of Object.entries(TAMIL_TENS)) {
    if (lower.includes(word)) { total += val; found = true; break; }
  }
  if (!found) {
    for (const [word, val] of Object.entries(ROMANIZED_TAMIL)) {
      if (val >= 10 && val < 100 && lower.includes(word)) { total += val; found = true; break; }
    }
  }

  // Check units
  for (const [word, val] of Object.entries(TAMIL_UNITS)) {
    if (lower.includes(word)) { total += val; found = true; break; }
  }
  if (!found || total === 0) {
    for (const [word, val] of Object.entries(ROMANIZED_TAMIL)) {
      if (val < 10 && lower.includes(word)) { total += val; found = true; break; }
    }
  }

  return total > 0 ? total : null;
}

function parseVoice(text: string, lang: string): { item?: string; amount?: number } | null {
  const cleaned = tamilDigitsToAscii(text);

  // Try English-style parsing first (works for both languages when digits are present)
  const amountMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?|₹|ரூபாய்|ரூபா)?/i);
  if (amountMatch) {
    const amount = parseFloat(amountMatch[1]);
    const item = cleaned
      .replace(/(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?|₹|ரூபாய்|ரூபா)?/gi, '')
      .replace(/^\s+|\s+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return { item: item || undefined, amount };
  }

  // Try Tamil word-based number parsing
  if (lang === 'ta-IN' || !amountMatch) {
    const tamilAmount = parseTamilAmount(text);
    if (tamilAmount) {
      // Remove currency and number words to extract item name
      let item = text;
      const removeWords = [
        ...Object.keys(TAMIL_UNITS), ...Object.keys(TAMIL_TENS),
        ...Object.keys(TAMIL_COMPOUND_TENS), ...Object.keys(TAMIL_LARGE),
        'ரூபாய்', 'ரூபா', 'ரூ', 'rupees', 'rupee', 'rs',
      ];
      for (const w of removeWords) {
        item = item.replace(new RegExp(w, 'gi'), '');
      }
      // Also try romanized
      for (const w of Object.keys(ROMANIZED_TAMIL)) {
        item = item.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
      }
      item = item.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
      return { item: item || undefined, amount: tamilAmount };
    }
  }

  return null;
}

type Lang = 'en-IN' | 'ta-IN';

const VoiceInput = ({ onResult }: Props) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('duely_voice_lang') as Lang) || 'en-IN');

  const toggleLang = () => {
    const next: Lang = lang === 'en-IN' ? 'ta-IN' : 'en-IN';
    setLang(next);
    localStorage.setItem('duely_voice_lang', next);
  };

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice input not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setError('');
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      // Try all alternatives
      for (let i = 0; i < event.results[0].length; i++) {
        const text = event.results[0][i].transcript;
        const parsed = parseVoice(text, lang);
        if (parsed?.amount) {
          setTranscript(text);
          onResult(parsed.item || '', parsed.amount);
          setTimeout(() => { setListening(false); setTranscript(''); }, 800);
          return;
        }
      }
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setError(lang === 'ta-IN' ? 'புரியவில்லை. "டீ இருபது ரூபாய்" என்று முயற்சிக்கவும்' : 'Could not understand. Try "Tea 20 rupees"');
      setListening(false);
    };

    recognition.onerror = () => {
      setError(lang === 'ta-IN' ? 'கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்' : 'Could not hear you. Try again.');
      setListening(false);
    };

    recognition.onend = () => setListening(false);
    recognition.start();
  }, [onResult, lang]);

  return (
    <div className="relative flex items-center gap-1.5">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleLang}
        className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        title={`Switch to ${lang === 'en-IN' ? 'Tamil' : 'English'}`}
      >
        <span className="text-[10px] font-bold leading-none">{lang === 'en-IN' ? 'EN' : 'தமி'}</span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={startListening}
        disabled={listening}
        className={`p-3 rounded-xl transition-colors ${listening ? 'bg-credit text-credit-foreground' : 'bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground'}`}
      >
        {listening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
      </motion.button>

      <AnimatePresence>
        {(transcript || error) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-full mb-2 right-0 bg-card border border-border rounded-xl p-3 shadow-lg min-w-[200px] z-50"
          >
            {transcript && <p className="text-xs text-foreground">🎤 "{transcript}"</p>}
            {error && <p className="text-xs text-credit">{error}</p>}
            <button onClick={() => { setTranscript(''); setError(''); }} className="absolute top-1 right-1 p-1">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInput;
