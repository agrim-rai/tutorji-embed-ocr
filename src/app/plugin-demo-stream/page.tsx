"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload, Image as ImageIcon, Loader2, Send } from "lucide-react";
import { SimpleMathRenderer } from "@/components/ui/simple-math-renderer-plugin";
import { RingLoader } from "react-spinners";

export default function PluginDemoStreamPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [streamingResponse, setStreamingResponse] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [testStreamResponse, setTestStreamResponse] = useState<string>("");
  const [isTestStreaming, setIsTestStreaming] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
      setUploadResponse(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select an image first");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadResponse(null);

    try {
      // First upload the image
      const formData = new FormData();
      formData.append("image", selectedFile);

      const uploadRes = await fetch("/api/plugin/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      setUploadResponse(uploadData);

      // Convert image to base64 for streaming
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1]; // Remove data:image/jpeg;base64, prefix

        // Start streaming the response
        await startStreaming(
          base64Data,
          uploadData.imageUrl,
          uploadData.answerId
        );
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const startStreaming = async (
    imageBase64: string,
    imageUrl: string,
    answerId: string
  ) => {
    setIsStreaming(true);
    setStreamingResponse("");
    setStreamError(null);

    try {
      const response = await fetch("/api/plugin/answer/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          imageUrl,
          answerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Streaming failed");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Split by lines to process each data chunk
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          // Handle different AI SDK data formats
          if (trimmedLine.startsWith("0:")) {
            // AI SDK format: 0:"text content"
            try {
              const jsonPart = trimmedLine.slice(2); // Remove "0:"
              const parsed = JSON.parse(jsonPart);
              if (typeof parsed === "string") {
                setStreamingResponse((prev) => prev + parsed);
              }
            } catch (e) {
              console.log("Parse error for line:", trimmedLine);
            }
          } else if (trimmedLine.startsWith("data: ")) {
            // Standard SSE format
            const data = trimmedLine.slice(6);
            if (data === "[DONE]") {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (
                parsed.choices &&
                parsed.choices[0] &&
                parsed.choices[0].delta &&
                parsed.choices[0].delta.content
              ) {
                setStreamingResponse(
                  (prev) => prev + parsed.choices[0].delta.content
                );
              }
            } catch (e) {
              console.log("Parse error for SSE:", data);
            }
          } else {
            // Try to parse as direct JSON
            try {
              const parsed = JSON.parse(trimmedLine);
              if (typeof parsed === "string") {
                setStreamingResponse((prev) => prev + parsed);
              }
            } catch (e) {
              // Ignore non-JSON lines
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setStreamError(
        error instanceof Error ? error.message : "Streaming failed"
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const testStreaming = async () => {
    setIsTestStreaming(true);
    setTestStreamResponse("");

    try {
      const response = await fetch("/api/test-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            "Count from 1 to 5, and for each number show a simple math equation using LaTeX notation. For example: \\( 1 + 1 = 2 \\) or \\[ x^2 + y^2 = z^2 \\]. Make it educational and include both inline and display math.",
        }),
      });

      if (!response.ok) {
        throw new Error("Test stream failed");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          console.log("Received line:", trimmedLine);

          if (trimmedLine.startsWith("0:")) {
            try {
              const jsonPart = trimmedLine.slice(2);
              const parsed = JSON.parse(jsonPart);
              if (typeof parsed === "string") {
                setTestStreamResponse((prev) => prev + parsed);
              }
            } catch (e) {
              console.log("Parse error:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Test streaming error:", error);
    } finally {
      setIsTestStreaming(false);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setUploadError(null);
    setUploadResponse(null);
    setStreamingResponse("");
    setStreamError(null);
    setTestStreamResponse("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Streaming Demo
          </h1>
          <p className="text-lg text-gray-300">
            Upload an image and watch AI analyze it in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Upload className="h-5 w-5" />
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center bg-gray-750">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={clearImage} size="sm">
                        Clear
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={uploading || isStreaming}
                        className="flex items-center gap-2"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {uploading ? "Uploading..." : "Analyze Image"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Select Image
                    </label>
                    <p className="text-sm text-gray-400 mt-2">
                      Supports JPEG, PNG, GIF, WebP
                    </p>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <p className="text-sm text-red-400">{uploadError}</p>
                </div>
              )}

              {uploadResponse && (
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <p className="text-sm text-green-400 font-medium">
                    ✓ Upload successful!
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    Answer ID: {uploadResponse.answerId?.slice(-8)}...
                  </p>
                  <p className="text-xs text-green-400">
                    Credits remaining: {uploadResponse.creditsRemaining}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Loader2
                  className={`h-5 w-5 ${isStreaming ? "animate-spin" : ""}`}
                />
                AI Response {isStreaming && "(Streaming...)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!streamingResponse && !isStreaming && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Upload an image to see the AI analysis here</p>
                  </div>
                )}

                {streamError && (
                  <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                    <p className="text-sm text-red-400">Error: {streamError}</p>
                  </div>
                )}

                {(streamingResponse || isStreaming) && (
                  <div className="prose prose-sm max-w-none">
                    <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                      <div className="text-sm text-gray-100">
                        <SimpleMathRenderer
                          content={streamingResponse}
                          className="whitespace-pre-wrap"
                        />
                        {isStreaming && (
                          <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isStreaming && !streamingResponse && (
                  <div className="space-y-3">
                    <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-blue-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing image...
                        <RingLoader
                          color="#155cfd"
                          size={30}
                          speedMultiplier={1.5}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Test Streaming Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              🧪 Test Streaming (Debug)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={testStreaming}
                disabled={isTestStreaming}
                variant="outline"
                className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                {isTestStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isTestStreaming ? "Testing..." : "Test Stream"}
              </Button>
              <Button
                onClick={() => setTestStreamResponse("")}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                Clear
              </Button>
            </div>

            {(testStreamResponse || isTestStreaming) && (
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <div className="text-sm text-gray-100">
                  <SimpleMathRenderer
                    content={testStreamResponse}
                    className="font-mono whitespace-pre-wrap"
                  />
                  {isTestStreaming && (
                    <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse" />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                1. <strong className="text-white">Upload:</strong> Select and
                upload an image containing a math problem or academic question
              </p>
              <p>
                2. <strong className="text-white">Process:</strong> The image is
                sent to our AI service for analysis
              </p>
              <p>
                3. <strong className="text-white">Stream:</strong> Watch the AI
                response stream in real-time as it analyzes your image
              </p>
              <p>
                4. <strong className="text-white">Render:</strong> Mathematical
                expressions are rendered live using LaTeX (\\(...\\) for inline,
                \\[...\\] for display)
              </p>
              <p>
                5. <strong className="text-white">Result:</strong> Get detailed
                step-by-step solutions with beautifully formatted mathematical
                notation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
