# MeetNow Web App Deployment Guide

This document outlines the steps to deploy the MeetNow web application to various hosting environments.

## Prerequisites

- Node.js 18+ and npm 8+
- A hosting service (Netlify, Vercel, shared hosting, etc.)
- Required environment variables (see below)

## Required Environment Variables

The application requires the following environment variables to be set:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `VITE_API_URL` - Backend API endpoint URL

## Optional Environment Variables

These variables are optional but may be required for full functionality:

- `VITE_WASABI_REGION` - Wasabi region for storage
- `VITE_WASABI_ENDPOINT` - Wasabi endpoint URL
- `VITE_WASABI_BUCKET_NAME` - Wasabi storage bucket name
- `VITE_WASABI_ACCESS_KEY_ID` - Wasabi access key ID (public) 
- `VITE_WASABI_SECRET_ACCESS_KEY` - Wasabi secret key (private)
- `VITE_OPENROUTE_API_KEY` - OpenRouteService API key for directions

## Security Notes

1. Always keep your `VITE_WASABI_SECRET_ACCESS_KEY` private.
2. Use environment-specific configuration for different environments.
3. Configure proper CORS settings on your backend services.
4. Set up proper authentication and authorization for your application.

## Deployment Options

### Netlify Deployment

1. Create a new site from Git in your Netlify account
2. Link your repository
3. Set build command to: `npm run build`
4. Set publish directory to: `dist`
5. Set required environment variables in the Netlify UI
6. Deploy!

The included `_redirects` file will handle SPA routing on Netlify.

### Vercel Deployment

1. Import your Git repository into Vercel
2. Set build command to: `npm run build`  
3. Set output directory to: `dist`
4. Configure environment variables
5. Deploy!

### Apache Server Deployment

1. Copy the contents of the `dist` directory to your web server's document root
2. Ensure the included `.htaccess` file is present to handle SPA routing
3. Configure your virtual host to allow overrides or include the rewrite rules directly
4. Set environment variables using `.env` files or server configuration

### NGINX Deployment

1. Copy the contents of the `dist` directory to your web server's document root
2. Add the following to your NGINX site configuration:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

3. Configure environment variables in your NGINX configuration or using an `.env` file

## Troubleshooting

- Check browser console for JavaScript errors
- Verify environment variables are correctly set
- Ensure API endpoints are accessible from the deployment environment
- Test CORS configuration if experiencing API connection issues

## Support

For deployment assistance, please contact the MeetNow development team. 