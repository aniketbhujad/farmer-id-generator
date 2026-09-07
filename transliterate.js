/**
 * Marathi Transliteration Engine
 * Converts English phonetic typing into Marathi (Devanagari) script.
 * Features:
 * - Real-time word-by-word transliteration on Space / Enter / Blur / Input
 * - Offline phonetic rule engine covering consonants, matras, halant, and conjuncts
 * - Built-in Marathi dictionary for common names, relations, and official terms
 * - Online Google Input Tools API support when network is available (with instant fallback)
 */

(function (root) {
    'use strict';

    // Common vocabulary mapping for instant high-accuracy translation/transliteration
    const DICTIONARY = {
        // Relations
        'swatah': 'स्वतः',
        'self': 'स्वतः',
        'head': 'स्वतः',
        'patni': 'पत्नी',
        'wife': 'पत्नी',
        'pati': 'पती',
        'husband': 'पती',
        'mulga': 'मुलगा',
        'son': 'मुलगा',
        'mulgi': 'मुलगी',
        'daughter': 'मुलगी',
        'aai': 'आई',
        'mother': 'आई',
        'vadil': 'वडील',
        'father': 'वडील',
        'bhau': 'भाऊ',
        'bhao': 'भाऊ',
        'brother': 'भाऊ',
        'bahin': 'बहीण',
        'sister': 'बहीण',
        'sun': 'सून',
        'aaji': 'आजी',
        'ajoba': 'आजोबा',
        'kaka': 'काका',
        'kaku': 'काकू',
        'natu': 'नातू',
        'naat': 'नात',
        'sasra': 'सासरे',
        'sasu': 'सासू',
        'navra': 'नवरा',
        'bayko': 'बायको',

        // Card Types
        'yellow': 'पिवळे (BPL/AAY)',
        'pivale': 'पिवळे',
        'pivle': 'पिवळे',
        'orange': 'केशरी (APL/PHH)',
        'keshari': 'केशरी',
        'white': 'पांढरे/राखाडी (NPHH)',
        'pandhre': 'पांढरे',
        'gray': 'राखाडी',

        // Gender
        'male': 'पु (M)',
        'female': 'स्त्री (F)',
        'other': 'इतर (O)',
        'purush': 'पुरुष',
        'stree': 'स्त्री',

        // Common Locations & Words
        'maharashtra': 'महाराष्ट्र',
        'pune': 'पुणे',
        'mumbai': 'मुंबई',
        'nagpur': 'नागपूर',
        'nashik': 'नाशिक',
        'aurangabad': 'छत्रपती संभाजीनगर',
        'ahilyanagar': 'अहिल्यानगर',
        'nagar': 'अहिल्यानगर',
        'ahmednagar': 'अहिल्यानगर',
        'solapur': 'सोलापूर',
        'kolhapur': 'कोल्हापूर',
        'satara': 'सातारा',
        'sangli': 'सांगली',
        'amravati': 'अमरावती',
        'nanded': 'नांदेड',
        'jalgaon': 'जळगाव',
        'akola': 'अकोला',
        'latur': 'लातूर',
        'dhule': 'धुळे',
        'parbhani': 'परभणी',
        'beed': 'बीड',
        'ratnagiri': 'रत्नागिरी',
        'sindhudurg': 'सिंधुदुर्ग',
        'raigad': 'रायगड',
        'thane': 'ठाणे',
        'palghar': 'पालघर',
        'buldhana': 'बुलढाणा',
        'washim': 'वाशीम',
        'yavatmal': 'यवतमाळ',
        'wardha': 'वर्धा',
        'bhandara': 'भंडारा',
        'gondia': 'गोंदिया',
        'chandrapur': 'चंद्रपूर',
        'gadchiroli': 'गडचिरोली',
        'taluka': 'तालुका',
        'jilha': 'जिल्हा',
        'zilla': 'जिल्हा',
        'district': 'जिल्हा',
        'village': 'गाव',
        'gaon': 'गाव',
        'gram': 'ग्राम',
        'post': 'पोस्ट',
        'pin': 'पिन',
        'kedgaon': 'केडगाव',
        'patil': 'पाटील',
        'shinde': 'शिंदे',
        'deshmukh': 'देशमुख',
        'pawar': 'पवार',
        'kadam': 'कदम',
        'chavan': 'चव्हाण',
        'jadhav': 'जाधव',
        'gaikwad': 'गायकवाड',
        'more': 'मोरे',
        'kale': 'काळे',
        'bhosale': 'भोसले',
        'kulkarni': 'कुलकर्णी',
        'joshi': 'जोशी',
        'ramesh': 'रमेश',
        'suresh': 'सुरेश',
        'santosh': 'संतोष',
        'ganesh': 'गणेश',
        'kisan': 'किसन',
        'sunita': 'सुनिता',
        'anita': 'अनिता',
        'laxman': 'लक्ष्मण',
        'maruti': 'मारुती',
        'vishnu': 'विष्णू',
        'pandurang': 'पांडुरंग',
        'dattatray': 'दत्तात्रय',
        'shankar': 'शंकर',
        'sachin': 'सचिन',
        'vikas': 'विकास',
        'rahul': 'राहुल',
        'amol': 'अमोल',
        'pravin': 'प्रवीण',
        'prashant': 'प्रशांत',
        'vijay': 'विजय',
        'ajay': 'अजय',
        'nitin': 'नितीन',
        'sunil': 'सुनील',
        'anil': 'अनिल',
        'rajesh': 'राजेश',
        'mahesh': 'महेश',
        'pramod': 'प्रमोद',
        'sanjay': 'संजय'
    };

    // Phonetic Rules Mapping
    const CONSONANTS = [
        { en: 'dny', mr: 'ज्ञ' },
        { en: 'jny', mr: 'ज्ञ' },
        { en: 'gy', mr: 'ज्ञ' },
        { en: 'ksh', mr: 'क्ष' },
        { en: 'x', mr: 'क्ष' },
        { en: 'shr', mr: 'श्र' },
        { en: 'kh', mr: 'ख' },
        { en: 'gh', mr: 'घ' },
        { en: 'ng', mr: 'ङ' },
        { en: 'chh', mr: 'छ' },
        { en: 'ch', mr: 'च' },
        { en: 'jh', mr: 'झ' },
        { en: 'th', mr: 'थ' },
        { en: 'dh', mr: 'ध' },
        { en: 'ph', mr: 'फ' },
        { en: 'bh', mr: 'भ' },
        { en: 'shh', mr: 'ष' },
        { en: 'sh', mr: 'श' },
        { en: 'zh', mr: 'झ' },
        { en: 'k', mr: 'क' },
        { en: 'g', mr: 'ग' },
        { en: 'c', mr: 'क' },
        { en: 'j', mr: 'ज' },
        { en: 'z', mr: 'झ' },
        { en: 'T', mr: 'ट' },
        { en: 'Th', mr: 'ठ' },
        { en: 'D', mr: 'ड' },
        { en: 'Dh', mr: 'ढ' },
        { en: 'N', mr: 'ण' },
        { en: 't', mr: 'त' },
        { en: 'd', mr: 'द' },
        { en: 'n', mr: 'न' },
        { en: 'p', mr: 'प' },
        { en: 'f', mr: 'फ' },
        { en: 'b', mr: 'ब' },
        { en: 'm', mr: 'म' },
        { en: 'y', mr: 'य' },
        { en: 'r', mr: 'र' },
        { en: 'l', mr: 'ल' },
        { en: 'L', mr: 'ळ' },
        { en: 'v', mr: 'व' },
        { en: 'w', mr: 'व' },
        { en: 's', mr: 'स' },
        { en: 'h', mr: 'ह' }
    ];

    const VOWELS_INDEPENDENT = [
        { en: 'aum', mr: 'ॐ' },
        { en: 'om', mr: 'ॐ' },
        { en: 'aa', mr: 'आ' },
        { en: 'a', mr: 'अ' },
        { en: 'ee', mr: 'ई' },
        { en: 'ii', mr: 'ई' },
        { en: 'i', mr: 'इ' },
        { en: 'oo', mr: 'ऊ' },
        { en: 'uu', mr: 'ऊ' },
        { en: 'u', mr: 'उ' },
        { en: 'ai', mr: 'ऐ' },
        { en: 'ei', mr: 'ऐ' },
        { en: 'e', mr: 'ए' },
        { en: 'au', mr: 'औ' },
        { en: 'ou', mr: 'औ' },
        { en: 'o', mr: 'ओ' },
        { en: 'ru', mr: 'ऋ' },
        { en: 'am', mr: 'अं' },
        { en: 'an', mr: 'अं' },
        { en: 'ah', mr: 'अः' }
    ];

    const MATRAS = [
        { en: 'aa', mr: 'ा' },
        { en: 'A', mr: 'ा' },
        { en: 'ee', mr: 'ी' },
        { en: 'ii', mr: 'ी' },
        { en: 'I', mr: 'ी' },
        { en: 'i', mr: 'ि' },
        { en: 'oo', mr: 'ू' },
        { en: 'uu', mr: 'ू' },
        { en: 'U', mr: 'ू' },
        { en: 'u', mr: 'ु' },
        { en: 'ai', mr: 'ै' },
        { en: 'ei', mr: 'ै' },
        { en: 'e', mr: 'े' },
        { en: 'au', mr: 'ौ' },
        { en: 'ou', mr: 'ौ' },
        { en: 'o', mr: 'ो' },
        { en: 'am', mr: 'ं' },
        { en: 'an', mr: 'ं' },
        { en: 'ah', mr: 'ः' },
        { en: 'ru', mr: 'ृ' },
        { en: 'a', mr: '' } // default inherent vowel
    ];

    /**
     * Local rule-based phonetic engine for a single word
     */
    function phoneticTransliterateWord(word) {
        if (!word) return '';

        const lower = word.toLowerCase().trim();
        if (DICTIONARY[lower]) {
            return DICTIONARY[lower];
        }

        let result = '';
        let i = 0;
        const len = word.length;

        while (i < len) {
            let matched = false;

            // Check if start of word or after a vowel -> Independent Vowel
            if (i === 0 || 'aeiou'.includes(word[i - 1].toLowerCase())) {
                for (const v of VOWELS_INDEPENDENT) {
                    if (word.substr(i, v.en.length).toLowerCase() === v.en) {
                        result += v.mr;
                        i += v.en.length;
                        matched = true;
                        break;
                    }
                }
                if (matched) continue;
            }

            // Check Consonants
            for (const c of CONSONANTS) {
                const sub = word.substr(i, c.en.length);
                if (sub.toLowerCase() === c.en.toLowerCase()) {
                    let cons = c.mr;
                    i += c.en.length;

                    // Now check if followed by a vowel/matra
                    let matraMatched = false;
                    for (const m of MATRAS) {
                        if (word.substr(i, m.en.length).toLowerCase() === m.en.toLowerCase()) {
                            cons += m.mr;
                            i += m.en.length;
                            matraMatched = true;
                            break;
                        }
                    }

                    // If not followed by vowel, and not at the end of word -> add halant for conjunct
                    if (!matraMatched && i < len && !'aeiou '.includes(word[i].toLowerCase())) {
                        cons += '्';
                    }

                    result += cons;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                // Unknown char or punctuation or digit
                result += word[i];
                i++;
            }
        }

        return result;
    }

    /**
     * Transliterate a full sentence/string
     */
    function transliterateText(text) {
        if (!text) return '';
        // Split by whitespace and punctuation while keeping delimiters
        const tokens = text.split(/(\s+|[.,\/\-#@!?]+)/);
        return tokens.map(token => {
            if (/^\s+$/.test(token) || /^[0-9.,\/\-#@!?]+$/.test(token)) {
                return token;
            }
            return phoneticTransliterateWord(token);
        }).join('');
    }

    /**
     * Query Google Input Tools API for online high-precision transliteration
     */
    async function fetchGoogleTransliteration(word) {
        if (!word || word.trim() === '') return word;
        const lower = word.toLowerCase().trim();
        if (DICTIONARY[lower]) return DICTIONARY[lower];

        const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=mr-t-i0-und&num=1`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
                    return data[1][0][1][0];
                }
            }
        } catch (e) {
            // Offline fallback
        }
        return phoneticTransliterateWord(word);
    }

    // State management
    let isTransliterationEnabled = true;

    /**
     * Attaches transliteration handlers to an input element
     */
    function attachTransliteration(inputEl) {
        if (!inputEl || inputEl._transliterationAttached) return;
        inputEl._transliterationAttached = true;

        // On keydown: when user hits Space or Enter, convert previous word
        inputEl.addEventListener('keydown', async (e) => {
            if (!isTransliterationEnabled) return;

            if (e.key === ' ' || e.key === 'Enter') {
                const cursorPos = inputEl.selectionStart;
                const fullText = inputEl.value;
                const textBefore = fullText.substring(0, cursorPos);
                const textAfter = fullText.substring(cursorPos);

                // Find the current last English word before cursor
                const match = textBefore.match(/([A-Za-z]+)$/);
                if (match) {
                    const engWord = match[1];
                    const startIdx = match.index;

                    // Try online first with instant offline fallback
                    let mrWord = DICTIONARY[engWord.toLowerCase()];
                    if (!mrWord) {
                        mrWord = phoneticTransliterateWord(engWord);
                    }

                    const newBefore = textBefore.substring(0, startIdx) + mrWord;
                    inputEl.value = newBefore + (e.key === ' ' ? ' ' : '') + textAfter;
                    inputEl.selectionStart = inputEl.selectionEnd = newBefore.length + (e.key === ' ' ? 1 : 0);

                    // Trigger input event to update canvas previews
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));

                    // Background refine with Google API if available
                    fetchGoogleTransliteration(engWord).then(refined => {
                        if (refined && refined !== mrWord) {
                            if (inputEl.value.includes(mrWord)) {
                                inputEl.value = inputEl.value.replace(mrWord, refined);
                                inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }
                    });

                    if (e.key === ' ') {
                        e.preventDefault();
                    }
                }
            }
        });

        // On blur: convert any remaining English text
        inputEl.addEventListener('blur', () => {
            if (!isTransliterationEnabled) return;
            const val = inputEl.value;
            if (/[A-Za-z]/.test(val)) {
                // If it contains English letters, transliterate them
                const converted = transliterateText(val);
                if (converted !== val) {
                    inputEl.value = converted;
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        });
    }

    /**
     * Initialize transliteration on all designated elements
     */
    function initTransliteration(selector = '.transliterate-mr') {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => attachTransliteration(el));
    }

    function setTransliterationEnabled(enabled) {
        isTransliterationEnabled = Boolean(enabled);
    }

    function getTransliterationEnabled() {
        return isTransliterationEnabled;
    }

    // Export to global object
    root.MarathiTransliterate = {
        transliterateWord: phoneticTransliterateWord,
        transliterateText: transliterateText,
        fetchGoogleTransliteration: fetchGoogleTransliteration,
        attach: attachTransliteration,
        init: initTransliteration,
        setEnabled: setTransliterationEnabled,
        isEnabled: getTransliterationEnabled,
        dictionary: DICTIONARY
    };

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
