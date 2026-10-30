// CropDiary AI — Weather API Proxy Supabase Edge Function
// Server-side authentication, strict configurable CORS, in-isolate rate limiting, and zero credential leakage

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Permitted local development and preview origins
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:4173',
];

/**
 * Resolves CORS headers with strict origin checking.
 * Supports comma-separated ALLOWED_ORIGIN or ALLOWED_ORIGINS.
 * In production, only explicitly configured domains are permitted.
 * In development, local dev origins are permitted only when ENVIRONMENT === 'development'.
 * Rejects unauthorized origins explicitly and fails closed when unconfigured in production.
 */
function getCorsHeaders(req: Request): { headers: Record<string, string>; isAllowed: boolean } {
  const origin = req.headers.get('Origin') || '';
  const configuredEnv = Deno.env.get('ALLOWED_ORIGIN') || Deno.env.get('ALLOWED_ORIGINS') || '';
  const environment = Deno.env.get('ENVIRONMENT') || 'production';

  const configuredList = configuredEnv
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  let isAllowed = false;
  let allowedOriginHeader = '';

  if (configuredList.includes('*')) {
    isAllowed = true;
    allowedOriginHeader = '*';
  } else if (origin && configuredList.includes(origin)) {
    isAllowed = true;
    allowedOriginHeader = origin;
  } else if (origin && environment === 'development' && DEV_ORIGINS.includes(origin)) {
    isAllowed = true;
    allowedOriginHeader = origin;
  } else if (!origin) {
    // Non-browser server-to-server or test requests
    isAllowed = true;
    allowedOriginHeader = configuredList[0] || (environment === 'development' ? DEV_ORIGINS[0] : 'null');
  } else {
    // Unauthorized browser origin: reject
    isAllowed = false;
    allowedOriginHeader = 'null';
  }

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowedOriginHeader,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  return { headers, isAllowed };
}

// In-isolate per-user rate limiter (Burst mitigation: 30 requests/minute per authenticated user)
// NOTE: Protects single active isolate against rapid burst flooding; does not synchronize across distributed isolates.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 30;
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const entry = rateLimitCache.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitCache.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - 1, resetInSeconds: 60 };
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    const resetInSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  entry.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - entry.count, resetInSeconds };
}

serve(async (req) => {
  const { headers: corsHeaders, isAllowed } = getCorsHeaders(req);

  // Handle CORS OPTIONS preflight
  if (req.method === 'OPTIONS') {
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'CORS origin not allowed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Reject unauthorized browser origins
  if (!isAllowed) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Origin not allowed by CORS policy' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Session Authentication & Authorization Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Missing Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Per-User Rate Limiting Check (Burst protection)
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please wait before making more requests.',
          retryAfterSeconds: rateLimit.resetInSeconds,
          fallbackRecommended: true,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.resetInSeconds),
          },
        }
      );
    }

    // 3. Validate Request Parameters
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { latitude, longitude, days = 7 } = body;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return new Response(
        JSON.stringify({ error: 'Invalid coordinates. Latitude [-90, 90], Longitude [-180, 180].' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validDays = Math.max(1, Math.min(Number(days) || 7, 7));

    // 4. Read Server-Side Secret (Never exposed to client bundles)
    const apiKey = Deno.env.get('WEATHER_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'WEATHER_API_KEY server secret not configured. Fallback to Open-Meteo.',
          fallbackRecommended: true,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Upstream Meteorological Request
    const upstreamUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${latitude.toFixed(4)},${longitude.toFixed(4)}&days=${validDays}&aqi=no&alerts=no`;

    const upstreamResponse = await fetch(upstreamUrl);
    const data = await upstreamResponse.json();

    if (!upstreamResponse.ok) {
      const isQuotaOrAuth = upstreamResponse.status === 401 || upstreamResponse.status === 403;
      return new Response(
        JSON.stringify({
          error: isQuotaOrAuth
            ? 'Weather provider authentication or quota unavailable. Fallback recommended.'
            : (data.error?.message || 'Upstream meteorological provider error.'),
          status: upstreamResponse.status,
          fallbackRecommended: true,
        }),
        {
          status: isQuotaOrAuth ? 503 : upstreamResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return sanitized forecast payload
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error in weather service.',
        fallbackRecommended: true,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
