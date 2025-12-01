# Google Maps API Setup Guide

## 📍 **Setting up Google Places Autocomplete**

Follow these steps to enable the Google Places Autocomplete feature in the Create Lead form.

---

## **Step 1: Enable Google Maps APIs**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Library**
4. Enable the following APIs:
   - **Places API** (for autocomplete)
   - **Geocoding API** (for address details)
   - **Maps JavaScript API** (for the autocomplete widget)

---

## **Step 2: Create API Key**

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API Key**
3. Copy the generated API key

---

## **Step 3: Restrict API Key (Important for Security)**

1. Click on your newly created API key to edit it
2. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add your domains:
     - `http://localhost:5173/*` (for development)
     - `https://yourdomain.com/*` (for production)
3. Under **API restrictions**:
   - Select **Restrict key**
   - Choose:
     - Places API
     - Geocoding API
     - Maps JavaScript API
4. Click **Save**

---

## **Step 4: Add API Key to Your Project**

1. Open your `.env` file (or create one if it doesn't exist)
2. Add the following line:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual API key
4. **IMPORTANT:** Add `.env` to your `.gitignore` to keep your API key secret

---

## **Step 5: Restart Development Server**

```bash
npm run dev
```

---

## **Testing the Feature**

1. Navigate to **Create Lead** page
2. You should see "School Address (Google Autocomplete)" field
3. Start typing an address
4. Select from the dropdown suggestions
5. Address, ZIP Code, and Landmark fields should auto-fill

---

## **Fallback Behavior**

If the API key is not configured or fails to load:
- The form will show a warning message
- Users can still enter addresses manually
- All functionality remains intact

---

## **Cost Information**

### **Free Tier:**
- 25,000 autocomplete requests per month (FREE)
- 40,000 geocoding requests per month (FREE)

### **After Free Tier:**
- Autocomplete: $2.83 per 1,000 requests
- Geocoding: $5.00 per 1,000 requests

**For typical usage (creating 100-500 leads/month), you'll stay within the free tier.**

---

## **Troubleshooting**

### **"Google Maps failed to load" error:**
- Check if API key is correct in `.env`
- Verify APIs are enabled in Google Cloud Console
- Check browser console for specific error messages

### **Autocomplete not working:**
- Ensure you've enabled **Places API** and **Maps JavaScript API**
- Check API key restrictions (make sure your domain is allowed)
- Clear browser cache and restart dev server

### **No suggestions appearing:**
- Check internet connection
- Verify API key has not exceeded quota
- Check browser console for errors

---

## **Optional: Customize Country Restrictions**

In `src/components/forms/AddressAutocomplete.tsx`, you can modify the country restrictions:

```tsx
componentRestrictions: { country: ['in', 'us'] }, // Current: India and US
```

Change to your preferred countries:
```tsx
componentRestrictions: { country: ['in'] }, // India only
componentRestrictions: { country: ['us'] }, // US only
componentRestrictions: { country: ['in', 'us', 'gb'] }, // India, US, UK
```

---

## **Support**

If you encounter any issues:
1. Check the [Google Maps Platform Documentation](https://developers.google.com/maps/documentation/javascript/places-autocomplete)
2. Review the browser console for error messages
3. Verify your API key permissions and quotas in Google Cloud Console
