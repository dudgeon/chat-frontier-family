
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const url = new URL(req.url);
    const streamRequested = url.searchParams.get('stream') === 'true';

    const { messages, model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o', titleGeneration = false } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid or missing messages array');
    }

    const response = await fetch('https://api.openai.com/v1/chat/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages,
        temperature: titleGeneration ? 0.5 : 0.7, // Lower temperature for more predictable titles
        max_tokens: titleGeneration ? 20 : undefined, // Limit token count for titles
        stream: streamRequested,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error connecting to OpenAI');
    }

    if (streamRequested) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      });
    } else {
      const data = await response.json();
      const content = data.responses[0].message.content;

      return new Response(
        JSON.stringify({ content }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    console.error('Error in chat function:', error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
