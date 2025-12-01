# Deployment Instructions for Windows Server (IIS)

1.  **Build the Application:**
    Run `npm run build` to generate the `dist` folder. (Already done)

2.  **Copy Files:**
    Copy the contents of the `dist` folder to your IIS website's physical path (e.g., `C:\inetpub\wwwroot\go2market`).

3.  **IIS Configuration:**
    Ensure `web.config` is present in the root of the website directory. This file handles client-side routing (rewriting all requests to `index.html`).
    
    *Note: The `web.config` is already included in the `dist` folder.*

4.  **MIME Types:**
    Ensure `.json`, `.woff`, `.woff2` MIME types are enabled in IIS if not already.

5.  **Environment Variables:**
    The application uses `import.meta.env`. These are baked into the build. If you need to change API keys or Firebase config, you must update `.env` and rebuild (`npm run build`).

6.  **HTTPS:**
    Ensure your IIS site has a valid SSL certificate binding, as Firebase Auth and Geolocation features require HTTPS.
