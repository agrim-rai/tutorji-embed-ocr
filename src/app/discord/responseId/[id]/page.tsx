'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DiscordResponse {
  response_id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  channel_id: string;
  channel_name: string;
  guild_id: string;
  guild_name: string;
  question_text: string;
  openai_response: string;
  model_used: string;
  tokens_used: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_type: string;
  tool_used: string;
  processing_time_seconds: number;
  image_urls?: string[];
  original_image_filenames?: string[];
  response_type: string;
  thread_id?: string;
  latex_rendered: boolean;
  success: boolean;
  error_message?: string;
}

interface ApiResponse {
  success: boolean;
  data?: DiscordResponse;
  responseId: string;
  error?: string;
}

export default function DiscordResponsePage() {
  const params = useParams();
  const responseId = params.id as string;
  const [data, setData] = useState<DiscordResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDiscordResponse() {
      try {
        setLoading(true);
        const response = await fetch(`/api/discord/responseId/${responseId}`);
        const result: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch response');
        }

        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError('No data found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (responseId) {
      fetchDiscordResponse();
    }
  }, [responseId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Discord response...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {error === 'Discord response not found' 
                ? `Discord response with ID "${responseId}" does not exist.`
                : error
              }
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Response ID: <code className="bg-gray-100 px-2 py-1 rounded">{responseId}</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent>
            <p className="text-gray-600">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const parseSteps = (response: string) => {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/```json\n(.*?)\n```/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.steps || null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const steps = parseSteps(data.openai_response);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Discord Response Details
              <Badge variant={data.success ? "default" : "destructive"}>
                {data.success ? "Success" : "Failed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Response ID</h3>
                <p className="font-mono text-sm">{data.response_id}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Timestamp</h3>
                <p className="text-sm">{formatDate(data.timestamp)}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">User</h3>
                <p className="text-sm">{data.user_name} ({data.user_id})</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Channel</h3>
                <p className="text-sm">{data.channel_name} ({data.channel_id})</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Guild</h3>
                <p className="text-sm">{data.guild_name} ({data.guild_id})</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Model Used</h3>
                <p className="text-sm">{data.model_used}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{data.question_text}</p>
          </CardContent>
        </Card>

        {data.image_urls && data.image_urls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.image_urls.map((url, index) => (
                  <div key={index} className="space-y-2">
                    <img
                      src={url}
                      alt={`Image ${index + 1}`}
                      className="w-full rounded-lg border"
                    />
                    {data.original_image_filenames && data.original_image_filenames[index] && (
                      <p className="text-xs text-gray-500">
                        Original: {data.original_image_filenames[index]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {steps && (
          <Card>
            <CardHeader>
              <CardTitle>Solution Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-lg">
                      Step {step.step_number}: {step.title}
                    </h4>
                    <div 
                      className="mt-2 p-4 bg-gray-50 rounded-lg font-mono text-sm overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: step.latex_content.replace(/\\\\/g, '\\') }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>AI Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
              {data.openai_response}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h3 className="font-semibold text-gray-500 uppercase tracking-wide">Tokens</h3>
                <p>Total: {data.total_tokens}</p>
                <p>Prompt: {data.prompt_tokens}</p>
                <p>Completion: {data.completion_tokens}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-500 uppercase tracking-wide">Processing</h3>
                <p>Time: {data.processing_time_seconds.toFixed(2)}s</p>
                <p>Tool: {data.tool_used}</p>
                <p>Type: {data.prompt_type}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-500 uppercase tracking-wide">Response</h3>
                <p>Type: {data.response_type}</p>
                <p>LaTeX: {data.latex_rendered ? 'Yes' : 'No'}</p>
                {data.thread_id && <p>Thread: {data.thread_id}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raw JSON Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}