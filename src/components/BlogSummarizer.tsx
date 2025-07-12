import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Globe, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { scrapeAndSummarize } from '../services/blogService';

interface Summary {
  url: string;
  title: string;
  summary: string;
  urduSummary: string;
  wordCount: number;
  readingTime: number;
}

export function BlogSummarizer() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Please enter a blog URL');
      return;
    }

    if (!isValidUrl(url)) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary(null);

    try {
      // Extract title from the webpage
      const title = await extractTitle(url);
      
      // Send to n8n webhook for processing
      const scrapedData = await scrapeAndSummarize(url);
      
      // Create summary object
      const summaryData: Summary = {
        url,
        title,
        summary: scrapedData.summary,
        urduSummary: scrapedData.urduSummary,
        wordCount: scrapedData.summary.split(' ').length,
        readingTime: Math.ceil(scrapedData.summary.split(' ').length / 200)
      };

      setSummary(summaryData);
      toast.success('Blog summarized successfully!');
      
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process blog');
      toast.error('Failed to process blog');
    } finally {
      setIsLoading(false);
    }
  };

  const extractTitle = async (url: string): Promise<string> => {
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      const title = doc.querySelector('title')?.textContent || 'Untitled';
      return title.trim();
    } catch (error) {
      console.error('Error extracting title:', error);
      return 'Blog Post';
    }
  };
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* URL Input Form */}
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Enter Blog URL
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4">
              <Input
                type="url"
                placeholder="https://example.com/blog-post"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 h-14 text-lg rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !url.trim()}
                className="min-w-[140px] h-14 text-lg rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Summarize
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading Progress */}
      {isLoading && (
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-xl font-semibold text-gray-700">
                  Processing your blog post...
                </span>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200/50 rounded-2xl p-6 max-w-lg">
                <div className="flex items-center gap-3 text-amber-800 mb-2">
                  <div className="p-2 bg-amber-200 rounded-xl">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-lg">Please wait</span>
                </div>
                <p className="text-amber-700 leading-relaxed">
                  This may take up to 20 seconds as we scrape, summarize, and translate your content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-2 border-red-200/50 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6">
          <div className="p-2 bg-red-200 rounded-xl inline-block mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <AlertDescription className="text-red-800 text-lg font-medium">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Results */}
      {summary && (
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Summary Complete
                </span>
              </CardTitle>
              <Badge className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full border-2 border-gray-300">
                {summary.wordCount} words • {summary.readingTime} min read
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <div className="space-y-6">
              <div>
                <div className="mb-4">
                  <h3 className="font-bold text-2xl mb-2 text-gray-800">{summary.title}</h3>
                  <p className="text-sm text-gray-500 break-all bg-gray-50 px-3 py-2 rounded-lg border">
                    {summary.url}
                  </p>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <Tabs defaultValue="english" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-2 h-14 bg-gray-100 rounded-2xl p-2">
                  <TabsTrigger value="english" className="rounded-xl text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300">
                    English Summary
                  </TabsTrigger>
                  <TabsTrigger value="urdu" className="rounded-xl text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300">
                    <Globe className="w-5 h-5 mr-2" />
                    Urdu Translation
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="english">
                  <ScrollArea className="h-[450px] w-full rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-inner">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg">{summary.summary}</p>
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="urdu">
                  <ScrollArea className="h-[450px] w-full rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-inner">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-800 leading-relaxed text-right urdu-text whitespace-pre-wrap text-xl">
                        {summary.urduSummary}
                      </p>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
              
              <div className="flex items-center justify-between pt-6 border-t-2 border-gray-100">
                <div className="flex items-center gap-6 text-gray-500">
                  <span className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5" />
                    {summary.wordCount} words
                  </span>
                  <span className="flex items-center gap-2 text-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {summary.readingTime} min read
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  className="h-12 px-6 text-lg rounded-2xl border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300"
                  onClick={() => {
                    navigator.clipboard.writeText(summary.summary);
                    toast.success('Summary copied to clipboard!');
                  }}
                >
                  <Copy className="w-5 h-5 mr-2" />
                  Copy Summary
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Recent Summaries Section */}
      {summary && (
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Quick Actions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button 
                variant="outline"
                className="h-auto p-6 flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 transform hover:scale-105"
                onClick={() => {
                  const text = `Blog Summary\n\n${summary.summary}`;
                  navigator.clipboard.writeText(text);
                  toast.success('Full summary copied!');
                }}
              >
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-semibold">Copy Full Summary</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-auto p-6 flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50 transition-all duration-300 transform hover:scale-105"
                onClick={() => {
                  navigator.clipboard.writeText(summary.urduSummary);
                  toast.success('Urdu translation copied!');
                }}
              >
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-semibold">Copy Urdu Translation</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}