"""
Translation Service

Dedicated service for translating text content between languages.
Uses Gemini to translate batches of text while preserving context.
"""

import json
import re
from typing import List, Optional, Dict
from loguru import logger


# Language codes and names for reference
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'pt-br': 'Brazilian Portuguese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese (Simplified)',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'ar': 'Arabic',
}


def translate_texts(
    texts: List[str],
    source_lang: str,
    target_lang: str,
    client,
    model_id: str,
    context: Optional[str] = None,
    glossary: Optional[List[Dict]] = None
) -> Dict:
    """
    Translates a batch of texts from source to target language.
    
    Args:
        texts: List of text strings to translate
        source_lang: Source language code (e.g., 'pt-br')
        target_lang: Target language code (e.g., 'en')
        client: GenAI client instance
        model_id: Model ID to use for translation
        context: Optional context about the content (e.g., "comic book dialogue")
        glossary: Optional list of glossary terms [{"original": "X", "translation": "Y"}, ...]
        
    Returns:
        Dict with 'translations' list and 'success' boolean
    """
    if not client:
        logger.error("❌ Translation failed: No GenAI client")
        return {"translations": [], "success": False, "error": "No AI client available"}
    
    if not texts:
        logger.warning("⚠️ Translation skipped: No texts provided")
        return {"translations": [], "success": True}
    
    # Get language names
    source_name = SUPPORTED_LANGUAGES.get(source_lang, source_lang)
    target_name = SUPPORTED_LANGUAGES.get(target_lang, target_lang)
    
    # Build indexed text list for the prompt
    indexed_texts = "\n".join([f"{i}: {text}" for i, text in enumerate(texts)])
    
    context_hint = f"Context: {context}\n" if context else "Context: Comic book speech bubbles\n"
    
    # Build glossary section if provided
    glossary_section = ""
    if glossary and len(glossary) > 0:
        glossary_lines = [f"- \"{term['original']}\" → \"{term['translation']}\"" for term in glossary]
        glossary_section = f"""
IMPORTANT - Use the following glossary terms. These translations MUST be used exactly as specified:
{chr(10).join(glossary_lines)}

"""
        logger.info(f"📚 Using glossary with {len(glossary)} terms")
    
    prompt = f"""{context_hint}{glossary_section}Translate the following texts from {source_name} to {target_name}.
Maintain the original meaning, tone, and any emotional expressions.
Keep onomatopoeia and sound effects appropriate to the target language.

Input texts (numbered):
{indexed_texts}

Return ONLY a valid JSON array with translations in the same order.
Format: ["translation 0", "translation 1", "translation 2", ...]
Do not include the numbers, just the translated text in array format.
"""
    
    import time
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            from google.genai import types
            
            if attempt == 0:
                logger.info(f"🌐 Translating {len(texts)} texts: {source_lang} → {target_lang}")
            else:
                logger.info(f"🔄 Retry attempt {attempt + 1}/{max_retries}")
            
            response = client.models.generate_content(
                model=model_id,
                contents=[types.Part.from_text(text=prompt)],
                config=types.GenerateContentConfig(
                    temperature=0.3,  # Slightly creative for natural translations
                    max_output_tokens=4096,
                    response_mime_type="application/json"
                )
            )
            
            if not response or not response.text:
                logger.error("❌ Translation failed: Empty response from Gemini")
                return {"translations": [], "success": False, "error": "Empty AI response"}
            
            raw_text = response.text.strip()
            
            # Parse JSON response
            try:
                # Try to extract JSON array from response
                match = re.search(r'\[.*\]', raw_text, re.DOTALL)
                if match:
                    translations = json.loads(match.group())
                else:
                    translations = json.loads(raw_text)
                    
                # Validate we got the right number of translations
                if len(translations) != len(texts):
                    logger.warning(f"⚠️ Translation count mismatch: got {len(translations)}, expected {len(texts)}")
                    # Pad or truncate as needed
                    while len(translations) < len(texts):
                        translations.append(texts[len(translations)])  # Keep original
                    translations = translations[:len(texts)]
                
                logger.info(f"✅ Successfully translated {len(translations)} texts")
                return {"translations": translations, "success": True}
                
            except json.JSONDecodeError as e:
                logger.error(f"❌ Translation JSON parse error: {e}")
                logger.debug(f"Raw response: {raw_text[:200]}...")
                return {"translations": [], "success": False, "error": f"JSON parse error: {e}"}
                
        except Exception as e:
            error_str = str(e)
            # Check for rate limit error (429)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 2  # 2, 4, 8 seconds
                    logger.warning(f"⚠️ Rate limited (429). Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
                else:
                    logger.error(f"❌ Rate limit exceeded after {max_retries} retries")
                    return {"translations": [], "success": False, "error": "Rate limit exceeded. Please wait a moment and try again."}
            else:
                logger.error(f"❌ Translation error: {e}")
                return {"translations": [], "success": False, "error": str(e)}
    
    return {"translations": [], "success": False, "error": "Max retries exceeded"}


def translate_single(
    text: str,
    source_lang: str,
    target_lang: str,
    client,
    model_id: str
) -> Optional[str]:
    """
    Translates a single text string.
    
    Args:
        text: Text to translate
        source_lang: Source language code
        target_lang: Target language code
        client: GenAI client
        model_id: Model ID
        
    Returns:
        Translated text or None if failed
    """
    result = translate_texts([text], source_lang, target_lang, client, model_id)
    
    if result["success"] and result["translations"]:
        return result["translations"][0]
    return None
