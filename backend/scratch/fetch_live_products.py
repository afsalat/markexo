import os
import sys
import json
import time
import requests

def fetch_live_products():
    print("Initiating full catalog export from the live database of https://vorionmart.com...")
    list_url = 'https://vorionmart.com/api/products/'
    
    try:
        response = requests.get(list_url)
        if response.status_code != 200:
            print(f"Error: Failed to connect to live API listing. Status code: {response.status_code}")
            sys.exit(1)
            
        data = response.json()
        results = data.get('results', [])
        count = data.get('count', len(results))
        
        print(f"Discovered {count} products in the live database listing. Commencing detailed fetch...")
        
        detailed_products = []
        for index, item in enumerate(results, start=1):
            slug = item.get('slug')
            if not slug:
                continue
                
            detail_url = f"https://vorionmart.com/api/products/{slug}/"
            print(f"[{index}/{count}] Fetching details for: {slug} ...")
            
            try:
                detail_resp = requests.get(detail_url)
                if detail_resp.status_code == 200:
                    detailed_products.append(detail_resp.json())
                else:
                    # Fallback to listing data if detail view fails
                    print(f"  Warning: Detail view failed (status {detail_resp.status_code}). Using listing fallback.")
                    detailed_products.append(item)
            except Exception as e:
                print(f"  Warning: Exception fetching detail: {e}. Using listing fallback.")
                detailed_products.append(item)
                
            # Small rate-limiting delay to respect live host
            time.sleep(0.05)
            
        output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'products.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(detailed_products, f, indent=4, ensure_ascii=False)
            
        print(f"\nSUCCESS: Exported {len(detailed_products)} full product records to: {output_path}")
        
    except Exception as e:
        print(f"Critical error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    fetch_live_products()
