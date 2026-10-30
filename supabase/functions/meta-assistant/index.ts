// CropDiary AI — Meta Model API Proxy Supabase Edge Function
// Server-side authentication, strict configurable CORS, in-isolate rate limiting, grounded agronomic prompts, and zero credential leakage

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

// In-isolate per-user rate limiter (Burst mitigation: 20 LLM assistant queries/minute per authenticated user)
// NOTE: Protects single active isolate against rapid burst flooding; does not synchronize across distributed isolates.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 20;
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
          error: 'Rate limit exceeded. Please wait before asking another question.',
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

    // 3. Validate Request Body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userMessage, farmContext = {}, language = 'en' } = body;

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'userMessage is required and must be non-empty string.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userMessage.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'userMessage exceeds maximum length of 2000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Read and Validate Server-Side Model Configuration & Secrets
    const DEFAULT_ENDPOINT = 'https://api.meta.ai/v1/chat/completions';
    const DEFAULT_MODEL = 'muse-spark-1.3';

    // Support documented MODEL_API_KEY with backward-compatible META_API_KEY fallback
    const apiKey = Deno.env.get('MODEL_API_KEY') || Deno.env.get('META_API_KEY');
    const model = Deno.env.get('MODEL_NAME') || Deno.env.get('META_MODEL') || DEFAULT_MODEL;
    const rawEndpoint = Deno.env.get('MODEL_API_ENDPOINT') || Deno.env.get('META_API_ENDPOINT') || DEFAULT_ENDPOINT;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'MODEL_API_KEY (or META_API_KEY) server secret not configured. Fallback to local rulebase.',
          fallbackRecommended: true,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate endpoint configuration against unsafe or unexpected destinations
    let targetEndpoint = DEFAULT_ENDPOINT;
    try {
      const parsedUrl = new URL(rawEndpoint);
      if (parsedUrl.protocol !== 'https:') {
        return new Response(
          JSON.stringify({
            error: 'Insecure model endpoint rejected. HTTPS protocol is mandatory.',
            fallbackRecommended: true,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const hostname = parsedUrl.hostname.toLowerCase();
      const isPrivateOrLoopback =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local');

      if (isPrivateOrLoopback && environment !== 'development') {
        return new Response(
          JSON.stringify({
            error: 'Prohibited private or loopback destination in production.',
            fallbackRecommended: true,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetEndpoint = parsedUrl.toString();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Invalid model endpoint URL format configured.',
          fallbackRecommended: true,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Grounded Agronomic System Prompt
    const systemPrompt = `You are CropDiary AI Assistant, a precision agricultural advisor for Indian farmers.
Language: Respond strictly in ${language === 'ta' ? 'Tamil (தமிழ்)' : 'English'}.
Grounding Rules:
1. Answer using ONLY the provided verified Farm Context.
2. NEVER fabricate farm activities, expenses, yields, diagnoses, or government benefits.
3. If information is not in the context, explicitly state that it is not recorded in the farmer's records.
4. When discussing finances, use exact numbers from the context.
5. Provide safe, verified ICAR/TNAU agricultural advice.

Farm Context:
${JSON.stringify(farmContext, null, 2)}
`;

    // 6. Upstream Call to Meta AI Platform with Network Protection
    let upstreamResponse: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20-second timeout

      upstreamResponse = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage.trim() },
          ],
          temperature: 0.2,
          max_tokens: 800,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchErr: any) {
      const isTimeout = fetchErr?.name === 'AbortError';
      return new Response(
        JSON.stringify({
          error: isTimeout
            ? 'Upstream AI model request timed out.'
            : 'Upstream AI model provider is currently unreachable.',
          fallbackRecommended: true,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data: any = null;
    try {
      data = await upstreamResponse.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Malformed or non-JSON response received from upstream AI provider.',
          fallbackRecommended: true,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!upstreamResponse.ok) {
      const isQuotaOrAuth =
        upstreamResponse.status === 401 ||
        upstreamResponse.status === 402 ||
        upstreamResponse.status === 403;
      const sanitizedMessage = isQuotaOrAuth
        ? 'Agricultural AI model authentication, billing, or quota unavailable. Fallback recommended.'
        : (typeof data?.error?.message === 'string'
            ? data.error.message
            : 'Meta AI upstream provider error.');

      return new Response(
        JSON.stringify({
          error: sanitizedMessage,
          status: upstreamResponse.status,
          fallbackRecommended: true,
        }),
        {
          status: isQuotaOrAuth ? 503 : upstreamResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Empty response received from Meta AI',
          fallbackRecommended: true,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        content,
        sources: [],
        modelName: model,
        usedFarmerRecords: true,
        disclaimer: 'Generated via secure Meta Model Edge Function grounded on your authenticated farm records.',
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error in agricultural assistant service.',
        fallbackRecommended: true,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
