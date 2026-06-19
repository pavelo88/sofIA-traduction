export const langMap: Record<string, string> = {
  "Español": "es-ES",
  "Inglés": "en-US",
  "Francés": "fr-FR",
  "Alemán": "de-DE",
  "Portugués": "pt-BR",
  "Italiano": "it-IT",
  "Chino": "zh-CN",
  "Japonés": "ja-JP",
  "Árabe": "ar-SA",
  "Ruso": "ru-RU"
};

function getVoice(langCode: string, gender: 'masculino' | 'femenino'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const genderRegex = gender === 'femenino'
    ? /female|woman|zira|samantha|helena|laura|google/i
    : /male|man|david|mark|pablo|sergio/i;

  return voices.find(v => v.lang.startsWith(langCode.split('-')[0]) && genderRegex.test(v.name)) 
      || voices.find(v => v.lang.startsWith(langCode.split('-')[0])) 
      || null;
}

export function speakMixedText(
  text: string, 
  nativeLanguage: string, 
  targetLanguage: string, 
  nativeGender: 'masculino' | 'femenino' = 'femenino',
  targetGender: 'masculino' | 'femenino' = 'masculino',
  onEnd?: () => void
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }
  
  window.speechSynthesis.cancel();

  // Parse <lang> tags. Everything outside is nativeLanguage. Everything inside is targetLanguage.
  const regex = /<lang>(.*?)<\/lang>/gs;
  const parts: { text: string; isTarget: boolean }[] = [];
  
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.index), isTarget: false });
    }
    parts.push({ text: match[1], isTarget: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), isTarget: false });
  }

  // If no tags found, just speak everything in native language
  if (parts.length === 0) {
    parts.push({ text, isTarget: false });
  }

  const nativeLangCode = langMap[nativeLanguage] || 'es-ES';
  const targetLangCode = langMap[targetLanguage] || 'en-US';

  const nativeVoice = getVoice(nativeLangCode, nativeGender);
  const targetVoice = getVoice(targetLangCode, targetGender);

  let i = 0;
  const playNext = () => {
    if (i >= parts.length) {
      if (onEnd) onEnd();
      return;
    }

    const part = parts[i++];
    const cleanText = part.text.replace(/[*_]/g, '').trim(); // clean markdown
    if (!cleanText) {
      playNext();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = part.isTarget ? targetLangCode : nativeLangCode;
    utterance.voice = part.isTarget ? targetVoice : nativeVoice;
    utterance.rate = 0.95;

    utterance.onend = () => playNext();
    utterance.onerror = () => playNext(); // Skip on error and continue

    window.speechSynthesis.speak(utterance);
  };

  playNext();
}
