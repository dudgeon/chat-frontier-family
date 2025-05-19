
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

    const {
      input,
      messages,
      model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o',
      titleGeneration = false,
    } = await req.json();

    const finalInput = input || messages;

    if (!finalInput || !Array.isArray(finalInput)) {
      throw new Error('Invalid or missing messages array');
    }

    const createResp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        input: finalInput,
        temperature: titleGeneration ? 0.5 : 0.7, // Lower temperature for more predictable titles
        // The responses API no longer accepts the max_tokens parameter
        // so we simply rely on the prompt to keep titles short.
        // We do not request streaming directly; retrieval is handled separately
      })
    });

    if (!createResp.ok) {
      const contentType = createResp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorData = await createResp.json();
        throw new Error(errorData.error?.message || 'Error connecting to OpenAI');
      } else {
        const errorText = await createResp.text();
        throw new Error(errorText || 'Error connecting to OpenAI');
      }
    }

    const creation = await createResp.json();
    const responseId = creation.id;

    if (!responseId) {
      throw new Error('Invalid response ID from OpenAI');
    }

    if (streamRequested) {
      const streamResp = await fetch(
        `https://api.openai.com/v1/responses/${responseId}/events`,
        {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        }
      );

      if (!streamResp.ok) {
        const errText = await streamResp.text();
        throw new Error(errText || 'Error streaming from OpenAI');
      }

      return new Response(streamResp.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      });
    } else {
      // Poll for completion
      let data;
      for (let i = 0; i < 30; i++) {
        const statusResp = await fetch(
          `https://api.openai.com/v1/responses/${responseId}`,
          {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          }
        );

        if (!statusResp.ok) {
          const errText = await statusResp.text();
          throw new Error(errText || 'Error retrieving OpenAI response');
        }

        data = await statusResp.json();

        if (data.status === 'completed') {
          break;
        }

        await new Promise((res) => setTimeout(res, 1000));
      }

      if (!data || data.status !== 'completed') {
        throw new Error('Timed out waiting for OpenAI response');
      }

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
