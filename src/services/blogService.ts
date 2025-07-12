export interface ScrapedData {
  summary: string;
  urduSummary: string;
}

export async function scrapeAndSummarize(url: string): Promise<ScrapedData> {
  try {
    const webhookUrl = 'https://n8n-51ds.onrender.com/webhook/a4a5a902-3ce9-4421-a9c2-0682a272d7a7';
    
    // Make POST request to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate the response structure
    if (!data.summary || !data.urduSummary) {
      throw new Error('Invalid response format from webhook. Missing required fields.');
    }

    return {
      summary: data.summary,
      urduSummary: data.urduSummary 
    };
  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to processing service. Please check your internet connection.');
    }
    
    if (error instanceof Error) {
      throw new Error(`Processing failed: ${error.message}`); 
    }
    
    throw new Error('Failed to process blog content. Please try again.');
  }
}