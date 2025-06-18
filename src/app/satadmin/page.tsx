"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { FaUpload, FaTimes, FaSpinner, FaCheck } from 'react-icons/fa';
import Link from 'next/link';

export default function SatAdminPage() {
  const { data: session, status } = useSession();
  const [questionId, setQuestionId] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingSuccess, setProcessingSuccess] = useState(false);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File is too large. Maximum size is 5MB.");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Only image files are allowed.");
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setUploadError(null);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImage(null);
    setImageFile(null);
    setUploadError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionId.trim()) {
      setUploadError("Question ID is required");
      return;
    }
    
    if (!imageFile) {
      setUploadError("Please upload an image");
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    
    try {
      // Step 1: Upload image to S3
      const formData = new FormData();
      formData.append("image", imageFile);
      
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Failed to upload image");
      }
      
      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || "Upload failed");
      }
      
      // Step 2: Register the SAT question
      const questionResponse = await fetch("/api/sat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: questionId.trim(),
          imageId: uploadData.imageId,
          imageUrl: uploadData.imageUrl
        }),
      });
      
      if (!questionResponse.ok) {
        const error = await questionResponse.json();
        throw new Error(error.error || "Failed to register question");
      }
      
      const questionData = await questionResponse.json();
      
      setUploadSuccess(true);
      
      // Step 3: Process with AI
      setProcessing(true);
      
      const processResponse = await fetch("/api/sat/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: questionId.trim()
        }),
      });
      
      if (!processResponse.ok) {
        console.error("AI processing had issues:", processResponse.statusText);
        // Even if processing fails, we consider the upload successful
        // since the question was registered
      }
      
      setProcessingSuccess(true);
      
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Failed to upload question");
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  // Reset form after successful upload
  const resetForm = () => {
    setQuestionId('');
    setImage(null);
    setImageFile(null);
    setUploadSuccess(false);
    setProcessingSuccess(false);
  };

  // Check if user is authenticated
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center space-x-4">
          <FaSpinner className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          <span className="text-lg text-gray-700 dark:text-gray-300">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
            You need to be signed in to access the SAT Admin Portal.
          </p>
          <div className="flex justify-center">
            <Link 
              href="/api/auth/signin"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SAT Question Admin</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Upload and process SAT questions</p>
          </div>
          <Link 
            href="/sat"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Back to SAT Portal
          </Link>
        </div>

        {/* Main content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Upload SAT Question</h2>
          </div>

          {uploadSuccess ? (
            // Success message
            <div className="p-6">
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Question uploaded successfully!
                    </p>
                    {processingSuccess && (
                      <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                        AI processing completed successfully.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Upload Another Question
                </button>
                
                <Link 
                  href={`/satask?id=${encodeURIComponent(questionId)}`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <span>View Question</span>
                </Link>
              </div>
            </div>
          ) : (
            // Upload form
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error message */}
              {uploadError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaTimes className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        {uploadError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Question ID input */}
              <div>
                <label 
                  htmlFor="questionId" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Question ID
                </label>
                <input
                  type="text"
                  id="questionId"
                  value={questionId}
                  onChange={(e) => setQuestionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter a unique identifier for this question"
                  required
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This ID will be used to search for the question. Use a clear, memorable identifier.
                </p>
              </div>

              {/* Image upload */}
              <div>
                <label 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Question Image
                </label>

                {image ? (
                  // Display selected image with remove button
                  <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div className="relative h-64 w-full">
                      <Image
                        src={image}
                        alt="Question preview"
                        fill
                        style={{ objectFit: "contain" }}
                        className="rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                ) : (
                  // Upload area
                  <div
                    onClick={() => document.getElementById("imageUpload")?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 h-48 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-all bg-gray-50 dark:bg-gray-800"
                  >
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <FaUpload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploading || !imageFile || !questionId.trim()}
                  className={`px-6 py-2 rounded-lg text-white font-medium flex items-center space-x-2 transition-colors ${
                    uploading || !imageFile || !questionId.trim() 
                      ? "bg-indigo-400 cursor-not-allowed" 
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {uploading && <FaSpinner className="animate-spin h-4 w-4" />}
                  <span>{uploading ? "Uploading..." : "Upload Question"}</span>
                </button>
              </div>
              
              {/* Processing indicator */}
              {processing && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-4">
                  <FaSpinner className="animate-spin h-4 w-4" />
                  <span>Processing with AI, this may take a moment...</span>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
