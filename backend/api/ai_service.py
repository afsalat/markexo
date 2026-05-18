import requests
import logging
import json
import re
import time
from django.conf import settings

logger = logging.getLogger('api')

class GeminiBlogService:
    """Service to handle AI blog generation using OpenRouter API (DeepSeek/Mistral)."""
    
    def __init__(self):
        self.api_key = getattr(settings, 'OPENROUTER_API_KEY', None)
        self.model = "google/gemini-2.0-flash-001"
        self.backup_model = "deepseek/deepseek-chat"
        self.url = "https://openrouter.ai/api/v1/chat/completions"

    # Ordered list of free fallback models to try when paid models fail
    FREE_MODELS = [
        "meta-llama/llama-3.3-70b-instruct:free",
        "google/gemma-4-31b-it:free",
        "deepseek/deepseek-r1:free",
    ]

    def _call_openrouter(self, messages, model=None, _is_fallback=False):
        """Helper to make OpenRouter API calls with retry logic and smart fallback."""
        if not self.api_key:
            return None, "OpenRouter API Key not configured."

        target_model = model or self.model
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://vorionmart.com",
            "X-Title": "VorionMart",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }

        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.info(f"Calling OpenRouter (Attempt {attempt + 1}) with model {target_model}...")
                response = requests.post(
                    self.url,
                    headers=headers,
                    json={
                        "model": target_model,
                        "messages": messages,
                        "response_format": { "type": "json_object" }
                    },
                    timeout=120 # Increased timeout for long blog generation
                )
                
                if response.status_code != 200:
                    logger.warning(f"OpenRouter Attempt {attempt + 1} failed: {response.status_code} {response.reason}")
                    try:
                        error_body = response.json()
                        logger.warning(f"OpenRouter Error Detail: {error_body}")
                    except:
                        logger.warning(f"OpenRouter Raw Body: {response.text}")
                
                # --- 402 Payment Required: skip retries, go straight to free models ---
                if response.status_code == 402:
                    logger.warning("OpenRouter: Insufficient credits (402). Falling back to free models.")
                    return self._try_free_models(messages)
                
                # --- 404 Not Found: model doesn't exist, skip retries ---
                if response.status_code == 404:
                    logger.warning(f"OpenRouter: Model '{target_model}' not found (404). Skipping.")
                    break  # exit retry loop, fall through to fallback logic below

                if response.status_code == 429:
                    # If this is a free fallback model, don't waste time retrying —
                    # skip immediately to the next free model in the list
                    if _is_fallback:
                        logger.warning(f"OpenRouter: Free model '{target_model}' rate-limited (429). Skipping to next.")
                        break
                    wait_time = (attempt + 1) * 10
                    logger.warning(f"OpenRouter Rate Limited. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                
                if response.status_code >= 500:
                    logger.error(f"OpenRouter Server Error ({response.status_code}): {response.text}")
                    if attempt < max_retries - 1:
                        time.sleep(5)
                        continue
                
                response.raise_for_status()
                return response.json(), None

            except requests.exceptions.HTTPError as e:
                logger.warning(f"OpenRouter Attempt {attempt + 1} HTTP error: {str(e)}")
                # Don't retry on 402/404 — already handled above
                if attempt == max_retries - 1:
                    break
                time.sleep(5)

            except Exception as e:
                logger.warning(f"OpenRouter Attempt {attempt + 1} failed: {str(e)}")
                if attempt == max_retries - 1:
                    break
                time.sleep(5)
        
        # --- Fallback chain (only if this wasn't already a fallback call) ---
        if _is_fallback:
            return None, f"OpenRouter Error: Free model '{target_model}' also failed."

        if target_model == self.model:
            logger.info(f"Primary model failed. Switching to backup: {self.backup_model}")
            return self._call_openrouter(messages, model=self.backup_model)
        elif target_model == self.backup_model:
            logger.info("Backup model failed. Trying free models...")
            return self._try_free_models(messages)
        
        return None, "All models failed after max retries."

    def _try_free_models(self, messages):
        """Try each free model in order until one succeeds."""
        for free_model in self.FREE_MODELS:
            logger.info(f"Trying free model: {free_model}")
            result, error = self._call_openrouter(messages, model=free_model, _is_fallback=True)
            if result is not None:
                return result, None
            logger.warning(f"Free model {free_model} failed: {error}")
        return None, "All models (paid + free) exhausted. Please add OpenRouter credits or check model availability."

    def generate_keywords_and_outline(self, product_name, description, category):
        """Generates target topic and primary keyword from product info."""
        prompt = f"""
        Analyze this product and provide:
        1. A catchy blog topic (SEO friendly).
        2. A high-intent primary SEO keyword.

        Product: {product_name}
        Category: {category}
        Description: {description}

        Return strictly as JSON:
        {{
            "topic": "The blog topic",
            "keyword": "primary keyword"
        }}
        """
        
        result, error = self._call_openrouter([{"role": "user", "content": prompt}])
        if error:
            return None, None, error
            
        try:
            content = result['choices'][0]['message']['content']
            data = json.loads(content)
            return data.get('topic'), data.get('keyword'), None
        except Exception as e:
            return None, None, f"Parsing Error: {str(e)}"

    def generate_complete_blog(self, product):
        """Main method to generate a full blog using the Master Prompt."""
        try:
            # Gather product details for the prompt
            product_name = product.name
            product_slug = getattr(product, 'slug', '')
            product_price = getattr(product, 'selling_price', None) or getattr(product, 'price', '')
            product_description = product.description or ''
            product_category = product.category.name if product.category else "General"
            product_url = f"https://vorionmart.com/products/{product_slug}" if product_slug else ""

            # Step 1: Get Topic and Keyword
            topic, keyword, error = self.generate_keywords_and_outline(
                product_name, product_description, product_category
            )
            
            if error:
                return None, f"Keyword generation failed: {error}"

            # Step 2: Use Master Prompt with full product context
            master_prompt_template = """
            You are an expert SEO content writer for an eCommerce website called VorionMart (https://vorionmart.com).
            Write a high-quality, human-like, and VERY DETAILED blog article that prominently features a specific product.

            ========================
            📦 PRODUCT DETAILS (USE THESE THROUGHOUT THE BLOG):

            - Product Name: "{product_name}"
            - Category: {product_category}
            - Price: ₹{product_price}
            - Product Page URL: {product_url}
            - Description: {product_description}

            ========================

            🔹 Blog Topic: {topic}
            🔹 Target Audience: Indian online shoppers
            🔹 Language: English (simple, engaging)
            🔹 Tone: Professional + friendly
            🔹 Word Count: Aim for 1500–1800 words (be very descriptive)

            ========================

            📌 CRITICAL — PRODUCT MENTION RULES:

            ⚠️ The blog MUST prominently mention "{product_name}" by its EXACT name. This is NOT optional.
            - The blog TITLE must include the product name "{product_name}" or a close reference.
            - The INTRODUCTION must name-drop "{product_name}" within the first 2 paragraphs.
            - Include a dedicated PRODUCT SPOTLIGHT section (H2 heading) that:
              • Describes "{product_name}" in detail using the product description above.
              • Mentions the price (₹{product_price}).
              • Includes a clear call-to-action link: <a href="{product_url}">Buy {product_name} on VorionMart</a>
            - The CONCLUSION must mention "{product_name}" with a final CTA to buy it.
            - Throughout the article, naturally mention "{product_name}" by name at least 5 times.
            - DO NOT write a generic article. This blog is specifically about THIS product.

            ========================

            📌 CONTENT REQUIREMENTS:

            1. SEO Optimized Title (max 60 characters) — must include the product name.
            2. Meta Description (150–160 characters) — must mention "{product_name}" and VorionMart.
            3. URL Slug (SEO friendly, include product name).
            4. Excerpt: A 2-sentence catchy summary mentioning the product.
            5. Introduction: Engaging, hook-based, identifying the shopper's pain points, then introduce "{product_name}" as the solution.
            6. Content Body: 
               - Use proper H2 & H3 headings.
               - Include a "Product Spotlight" or "Why {product_name} Stands Out" section.
               - Deeply analyze the features and benefits specific to this product.
               - Include a "Buying Guide" or "Why This Product Matters" section.
               - Use bullet points and bold text for readability.
            7. Internal Linking: Include a link to the product page ({product_url}). Add 2-3 suggestions like "Explore more in {product_category}" or "Check our latest collection on VorionMart".
            8. FAQ Section (MANDATORY): Include exactly 5 questions and answers about "{product_name}" at the end of the content body. Use <h3> for questions and <p> for answers.
            9. Conclusion: Strong summary recommending "{product_name}" with a CTA linking to {product_url}.

            ========================

            📌 SEO RULES:

            - Primary keyword: {keyword}
            - Maintain keyword density naturally.
            - Add related keywords.
            - Write 100% unique content.

            ========================

            📌 OUTPUT FORMAT (STRICT JSON):

            {{
              "title": "SEO Title mentioning the product",
              "meta_description": "Meta description mentioning the product and VorionMart",
              "slug": "url-slug-with-product-name",
              "excerpt": "Short excerpt mentioning the product",
              "content": "Full HTML formatted blog content using <h2>, <h3>, <p>, <ul>, <li>, <a> tags. Include the product spotlight and FAQ sections inside this content string. DO NOT use markdown code blocks inside this string.",
              "faqs": [
                {{"question": "Q1 about the product", "answer": "A1"}},
                {{"question": "Q2 about the product", "answer": "A2"}}
              ]
            }}
            """
            
            final_prompt = master_prompt_template.format(
                topic=topic,
                keyword=keyword,
                product_name=product_name,
                product_category=product_category,
                product_price=product_price,
                product_url=product_url,
                product_description=product_description[:500]  # Truncate to avoid token overflow
            )

            result, error = self._call_openrouter([{"role": "user", "content": final_prompt}])
            if error:
                return None, f"Content generation failed: {error}"

            content = result['choices'][0]['message']['content']
            # Remove markdown code blocks if present
            content = re.sub(r'```json\n?|\n?```', '', content).strip()
            
            blog_data = json.loads(content)
            
            # Ensure keywords field is added (required by views.py)
            blog_data['keywords'] = [keyword]
            
            return blog_data, None

        except Exception as e:
            logger.error(f"Generate Blog Error: {str(e)}")
            return None, f"Unexpected error: {str(e)}"
