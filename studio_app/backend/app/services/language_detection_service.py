"""
Language Detection Service

Dedicated service for detecting the original language of text content.
Uses Gemini to identify the predominant language from text samples.
"""

import re
from typing import List, Optional
from loguru import logger


def detect_language_from_texts(
    text_samples: List[str], 
    client, 
    model_id: str
) -> Optional[str]:
    """
    Detects the predominant language from a list of text samples.
    Uses local character analysis instead of Gemini API for reliability.
    
    Args:
        text_samples: List of text strings to analyze
        client: GenAI client instance (unused, kept for API compatibility)
        model_id: Model ID (unused, kept for API compatibility)
        
    Returns:
        ISO language code (e.g., 'ja', 'en', 'pt-br') or None if detection fails
    """
    # Filter out empty texts
    valid_texts = [t.strip() for t in text_samples if t and t.strip()]
    
    if not valid_texts:
        logger.warning("⚠️ Language detection skipped: No valid text samples")
        return None
    
    # Combine all text for analysis
    combined_text = " ".join(valid_texts)
    
    # Character-based language detection (fast and reliable)
    detected = detect_language_by_characters(combined_text)
    
    if detected:
        logger.info(f"🌐 Detected language: {detected}")
    else:
        logger.warning("⚠️ Language could not be determined")
    
    return detected


def detect_language_by_characters(text: str) -> Optional[str]:
    """
    Detects language based on Unicode character ranges.
    Fast local detection without API calls.
    """
    if not text:
        return None
    
    # Count character types
    japanese_count = 0
    korean_count = 0
    chinese_count = 0
    arabic_count = 0
    latin_count = 0
    
    for char in text:
        code = ord(char)
        
        # Japanese (Hiragana, Katakana)
        if 0x3040 <= code <= 0x309F or 0x30A0 <= code <= 0x30FF:
            japanese_count += 1
        # Korean (Hangul)
        elif 0xAC00 <= code <= 0xD7AF or 0x1100 <= code <= 0x11FF:
            korean_count += 1
        # Chinese (CJK Unified Ideographs - also used in Japanese)
        elif 0x4E00 <= code <= 0x9FFF:
            chinese_count += 1
        # Arabic
        elif 0x0600 <= code <= 0x06FF or 0x0750 <= code <= 0x077F:
            arabic_count += 1
        # Latin letters
        elif 0x0041 <= code <= 0x007A or 0x00C0 <= code <= 0x00FF:
            latin_count += 1
    
    total = len(text)
    if total == 0:
        return None
    
    # Determine language based on character distribution
    if japanese_count > total * 0.1:
        return 'ja'
    elif korean_count > total * 0.1:
        return 'ko'
    elif chinese_count > total * 0.2 and japanese_count == 0:
        return 'zh'
    elif arabic_count > total * 0.1:
        return 'ar'
    elif latin_count > total * 0.3:
        # For Latin-based languages, check for specific patterns
        text_lower = text.lower()
        
        # Portuguese indicators
        if any(w in text_lower for w in ['você', 'não', 'está', 'são', 'ção', 'ões']):
            return 'pt-br'
        # Spanish indicators
        elif any(w in text_lower for w in ['está', 'ñ', '¿', '¡', 'usted']):
            return 'es'
        # French indicators
        elif any(w in text_lower for w in ['vous', 'c\'est', 'qu\'', 'est-ce']):
            return 'fr'
        # German indicators
        elif any(w in text_lower for w in ['ist', 'nicht', 'für', 'über', 'ß']):
            return 'de'
        # Italian indicators
        elif any(w in text_lower for w in ['è', 'perché', 'così', 'quello']):
            return 'it'
        # Default to English for Latin text
        else:
            return 'en'
    
    return None


# Language metadata for display
LANGUAGE_DISPLAY_INFO = {
    'ja': {'name': 'Japonês', 'flag': '🇯🇵'},
    'en': {'name': 'Inglês', 'flag': '🇺🇸'},
    'pt': {'name': 'Português', 'flag': '🇵🇹'},
    'pt-br': {'name': 'Português (BR)', 'flag': '🇧🇷'},
    'es': {'name': 'Espanhol', 'flag': '🇪🇸'},
    'de': {'name': 'Alemão', 'flag': '🇩🇪'},
    'fr': {'name': 'Francês', 'flag': '🇫🇷'},
    'it': {'name': 'Italiano', 'flag': '🇮🇹'},
    'ko': {'name': 'Coreano', 'flag': '🇰🇷'},
    'zh': {'name': 'Chinês', 'flag': '🇨🇳'},
    'ar': {'name': 'Árabe', 'flag': '🇸🇦'},
    'ar-ae': {'name': 'Árabe (EAU)', 'flag': '🇦🇪'},
}


def get_language_display_name(code: str) -> str:
    """Returns the display name for a language code."""
    info = LANGUAGE_DISPLAY_INFO.get(code)
    return info['name'] if info else code.upper()


def get_language_flag(code: str) -> str:
    """Returns the flag emoji for a language code."""
    info = LANGUAGE_DISPLAY_INFO.get(code)
    return info['flag'] if info else '🌐'
